import { createAzure } from "@ai-sdk/azure";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { DocDocument } from "../../db/cosmosClient";
import { createDoc } from "../../db/documentation";
import { searchDocs } from "./searchDocs";

const azure = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_FULL_ENDPOINT,
});

export const extractDocs = async (messages: string[]) => {
  console.log("Got message", messages);
  const { object } = await generateObject({
    model: azure("gpt-4o"),
    prompt: `### Purpose
    You are an autonomous QnA agent that reads and processes messages in a community channel.
    
    ### Instructions
    You will be given a list of messages. Try to extract as many niched documentation pieces as possible. Only use context based on the messages and only if they show successful interactions with the guidance provided by the community messages, do fill up documentation using any of your own knowledge, because we need it to be provided by the community. Do not create generic documentation pieces, but focus on specific niched interactions and questions.

    <Start of Messages>
    ${messages.join("\n")}
    <End of Messages>
    `,
    schema: z.object({
      docs: z.array(
        z.object({
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
        })
      ),
    }),
  });

  const { docs } = object;
  
  // Save the docs to the database
  const results = [];
  docs.forEach(async (doc) => {
    try {
      // check if doc already is in the database
      await createDocIfSimilarDocNotExists(doc);
      results.push(doc.title);
    } catch (error) {
      console.error(error);
    }
  });

  return;
};

const createDocIfSimilarDocNotExists = async (doc: DocDocument) => {
  const { text, responseMessages } = await generateText({
    model: azure("gpt-4o"),
    prompt: `### Purpose
    You are an autonomous QnA agent that processes documentation in a community, handling the creation of documentation pieces. 
    
    ### Instructions
    You will be given a new documentation piece. Check if it is similar to any existing documentation pieces, using the \'searchDocs\' tool. Ask yourself what query would you use to search for this documentation piece, include the title and the question in the query. 

    Based on the result of the search, decide if the documentation piece is similar to any existing documentation pieces. If there is new information that was not previously known, the documentation piece should be created using the \'createDocs\' tool. If there is no new information, or the information is already known, the documentation piece should not be created.

    ### New Documentation Piece
    ${JSON.stringify(doc, null, 2)}
    `,
    maxSteps: 3,
    tools: {
      searchDocs: {
        description: "Search for existing documentation",
        parameters: z.object({
          query: z.string().describe("The query to search for"),
        }),
        execute: async ({ query }) => {
          const docs = await searchDocs(query);
          return docs;
        },
      },
      createDocs: {
        description: "Create a new documentation piece",
        parameters: z.object({
          doc: z.object({
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
        }),
        execute: async ({ doc }) => {
          try {
            await createDoc(doc);
            return `Successfully created doc with title: ${doc.title}`;
          } catch (error) {
            console.error(error);
            return "Failed to create doc";
          }
        },
      },
    },
    toolChoice: "auto",
  });

  console.log(responseMessages);
  console.log(text);

  return text;
};
