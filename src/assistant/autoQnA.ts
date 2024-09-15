import { createAzure } from "@ai-sdk/azure";
import { generateText, tool } from "ai";
import { Message } from "discord.js";
import { z } from "zod";
import { DocDocument } from "../db/cosmosClient";
import { createDoc } from "../db/documentation";
import { searchDocs } from "./tools/searchDocs";

const azure = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_FULL_ENDPOINT,
});

export const autoQnA = async (message: Message) => {
  console.log("Got message", message.content);
  const { text, responseMessages } = await generateText({
    model: azure("gpt-4o"),
    prompt: `### Purpose
    You are an autonomous QnA agent that reads messages in a community channel.
    
    ### Instructions
    For the following message, first categorize it into one of the following categories: Question, Answer, Spam
    - If it is spam, ignore it and end the process, reply with an empty string "".
    - If it is a question, you must use the \`searchDocumentation\` tool to search for any type of private server information using natural language based on the user's question, and from the results and your knowledge, answer the question. 
        - If you don't have an answer even after searching, reply with an empty string "".
        - Beware, there could be questions that are targeted towards another user, if so, ignore it.
    - If it is an answer, check if it is a reply to an earlier question asked by a user using the \`getThreadMessages\` tool. 
        - If it is, determine if it is a valid answer to the question.
        - If it is, turn it into a documentation using the \`extractDocumentation\` tool to save it as a reference for future users.
    - Output in a speech friendly and casual format.

    ### Message
    ${message.content}
    `,
    maxSteps: 3,
    tools: {
      searchDocumentation: tool({
        description:
          "Search in the private server documentation. Always use this before answering a question",
        parameters: z.object({
          question: z
            .string()
            .describe(
              "The question to search for in natural language based on the user's question. For example, 'how can I setup x with y?'"
            ),
        }),
        execute: async ({ question }) => {
          const docs = await searchDocs(question);
          return { docs };
        },
      }),
      getThreadMessages: tool({
        description:
          "Get the parent messages of a message in the form of a full thread",
        parameters: z.object({}),
        execute: async () => {
          if (!message.reference || !message.reference.messageId) {
            return {
              threadMessages: "No thread messages",
            };
          }

          // while the parent message is a reply, keep fetching the parent message but limit to 5 times
          const threadMessages: string[] = [];
          let parentMessage = message;
          for (let i = 0; i < 5; i++) {
            if (parentMessage.reference && parentMessage.reference.messageId) {
              parentMessage = await message.channel.messages.fetch(
                parentMessage.reference.messageId
              );
              threadMessages.push(parentMessage.content);
            } else {
              break;
            }
          }
          return {
            threadMessages: threadMessages.join("\n"),
          };
        },
      }),
      extractDocumentation: tool({
        description: "Extract the documentation from a thread of messages",
        parameters: z.object({
          title: z.string().describe("The title of the documentation"),
          question: z
            .string()
            .describe("The question that was originally asked"),
          answer: z
            .string()
            .describe("The answer to the question, a short summary"),
          content: z
            .string()
            .describe("The content of the documentation in more detail"),
          tags: z.array(z.string()).describe("The tags of the documentation"),
          usefulLinks: z
            .array(z.string())
            .describe(
              "The links to resources that are useful for this documentation"
            ),
        }),
        execute: async ({
          title,
          question,
          answer,
          content,
          tags,
          usefulLinks,
        }) => {
          const doc: DocDocument = {
            title,
            question,
            answer,
            content,
            tags,
            usefulLinks,
          };
          try {
            await createDoc(doc);
            return {
              result: "Documentation created",
            };
          } catch (error) {
            console.error(error);
            return {
              result: "Documentation creation failed",
            };
          }
        },
      }),
    },
  });

  console.log("Got response", text);
  console.log(responseMessages);
  return text;
};
