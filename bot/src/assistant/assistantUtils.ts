import { getClient } from "./llmConfig";
import { Run, TextContentBlock } from "openai/resources/beta/threads/index.mjs";
import { createOrUpdateUser } from "../db/users";
import { UserDocument, UserProfileDocument } from "../db/cosmosClient";
import { userThreads } from "../index";
import { searchUsers } from "./tools/searchUsers";
import { searchDocs } from "./tools/searchDocs";

const openai = getClient();

export const startAssistantSession = async (
  assistantType: "onboarding" | "search_user" | "search_docs",
  context: string | undefined,
  userId: string
) => {
  const thread = await openai.beta.threads.create();
  const assistantId =
    assistantType === "onboarding"
      ? process.env.ASSISTANT_ID_ONBOARDING!
      : assistantType === "search_user"
      ? process.env.ASSISTANT_ID_SEARCH_USER!
      : process.env.ASSISTANT_ID_SEARCH_DOCS!;

  if (context) {
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Here are some details about the user: ${context}`,
    });

    await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistantId,
    });
  }

  userThreads.set(userId, {
    threadId: thread.id,
    assistantType: assistantType,
  });

  return thread.id;
};

export async function processMessageWithAssistant(
  assistantType: "onboarding" | "search_user" | "search_docs",
  threadId: string,
  message: string
) {
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: message,
  });

  const run = await openai.beta.threads.runs.createAndPoll(threadId, {
    assistant_id:
      assistantType === "onboarding"
        ? process.env.ASSISTANT_ID_ONBOARDING!
        : assistantType === "search_user"
        ? process.env.ASSISTANT_ID_SEARCH_USER!
        : process.env.ASSISTANT_ID_SEARCH_DOCS!,
  });

  return handleRunStatus(run, threadId);
}

const handleRequiresAction: any = async (run: Run, threadId: string) => {
  // Check if there are tools that require outputs
  if (
    run.required_action &&
    run.required_action.submit_tool_outputs &&
    run.required_action.submit_tool_outputs.tool_calls
  ) {
    // Loop through each tool in the required action section
    console.log(
      "run.required_action.submit_tool_outputs.tool_calls",
      run.required_action.submit_tool_outputs.tool_calls
    );
    const toolOutputsPromises =
      run.required_action.submit_tool_outputs.tool_calls.map(async (tool) => {
        if (tool.function.name === "save_profile") {
          const args = JSON.parse(
            tool.function.arguments
          ) as UserProfileDocument;
          console.log(args);
          const newUser: UserDocument = {
            userId: args.userId,
            username: args.username,
            isRegistered: true,
            lastInteraction: new Date(),
            profile: args,
          };
          try {
            await createOrUpdateUser(newUser);
            return {
              tool_call_id: tool.id,
              output: "Saved profile successfully",
            };
          } catch (error) {
            console.error("Error creating or updating user:", error);
            return {
              tool_call_id: tool.id,
              output: "Error creating or updating user",
            };
          }
        }
        if (tool.function.name === "end_session") {
          const args = JSON.parse(tool.function.arguments) as {
            userId: string;
          };

          userThreads.delete(args.userId);

          return {
            tool_call_id: tool.id,
            output: "Successfully closed thread",
          };
        }
        if (tool.function.name === "search_users") {
          const args = JSON.parse(tool.function.arguments) as {
            query: string;
          };
          console.log(args);
          const searchResults = await searchUsers(args.query);
          console.log("searchResults", searchResults);
          return {
            tool_call_id: tool.id,
            output: searchResults,
          };
        }
        if (tool.function.name === "search_docs") {
          const args = JSON.parse(tool.function.arguments) as {
            query: string;
          };
          console.log(args);
          const searchResults = await searchDocs(args.query);
          console.log("searchResults", searchResults);
          return {
            tool_call_id: tool.id,
            output: searchResults,
          };
        }
      });

    const toolOutputs = await Promise.all(toolOutputsPromises);
    console.log(toolOutputs);

    // Submit all tool outputs at once after collecting them in a list
    if (toolOutputs.length > 0) {
      run = await openai.beta.threads.runs.submitToolOutputsAndPoll(
        threadId,
        run.id,
        { tool_outputs: toolOutputs as any }
      );
    }

    // Check status after submitting tool outputs
    return handleRunStatus(run, threadId);
  }

  return;
};

const handleRunStatus = async (run: Run, threadId: string) => {
  if (run.status === "completed") {
    let messages = await openai.beta.threads.messages.list(threadId);
    const response = (messages.data[0].content[0] as TextContentBlock).text
      .value;
    return response;
  } else if (run.status === "requires_action") {
    return await handleRequiresAction(run, threadId);
  } else {
    console.error("Run did not complete:", run);
  }
};
