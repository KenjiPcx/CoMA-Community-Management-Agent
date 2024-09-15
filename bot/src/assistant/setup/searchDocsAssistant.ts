require("dotenv/config");
const { AzureOpenAI } = require("openai");

// Get environment variables
const azureOpenAIKey = process.env.AZURE_OPENAI_API_KEY;
const azureOpenAIEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const azureOpenAIVersion = "2024-05-01-preview";

// Check env variables
if (!azureOpenAIKey || !azureOpenAIEndpoint) {
  throw new Error(
    "Please set AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT in your environment variables."
  );
}

// Get Azure SDK client
const getClient = () => {
  const assistantsClient = new AzureOpenAI({
    endpoint: azureOpenAIEndpoint,
    apiVersion: azureOpenAIVersion,
    apiKey: azureOpenAIKey,
  });
  return assistantsClient;
};
const assistantsClient = getClient();

const options = {
  model: "gpt-4o", // replace with model deployment name
  name: "Search Docs Assistant",
  instructions: `### Purpose
You are a search agent designed to help users find existing documentation within the community.

### Capabilities
You have a 'search_docs' tool that takes in natural language which can be anything such as a technical question, guidance question, documentation title etc.

Flow
1. Ask the user for their search query: Ask the user to describe what they are looking for
2. Use the search tool: Call the search tool with the user's natural language input.
3. Process and summarize results: Present the most relevant results back to the user, including the most relevant information from the docs and very similar queries. Make sure to relate how the result is similar to the user. If there are no results, then just let the user know to try again when more people sign up.
4. Follow-up: Ask if the user would like to refine the search or look for more details on any of the results.
5. If the user is done, call the 'end_session' tool


### Persona
You embody the energy of Andrew Tate, Grant Cardone, and Tai Lopez. You are a no-nonsense, realistic, and practical life coach.
    
### Additional Instructions
- For each step in the flow, display the current stage and also brief the next step when asking if the user is ready to proceed, wait for confirmation.
- Make the output suitable for speech, so they should be short and concise.`,
  tools: [
    {
      type: "function",
      function: {
        name: "search_docs",
        description: "Search for private documentation within the server",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The natural language search query from the user",
            },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "end_session",
        description: "Ends the current session",
        parameters: {
          type: "object",
          properties: { userId: { type: "string", description: "user's id" } },
          required: ["userId"],
        },
      },
    },
  ],
  tool_resources: {},
  temperature: 1,
  top_p: 1,
};

const setupAssistant = async () => {
  try {
    const assistantResponse = await assistantsClient.beta.assistants.create(
      options
    );
    console.log(`Assistant created: ${JSON.stringify(assistantResponse)}`);
    console.log(
      "Save the assistant ID to your .env file",
      assistantResponse.id
    );
  } catch (error) {
    console.error(`Error creating assistant: ${error}`);
  }
};

setupAssistant();
