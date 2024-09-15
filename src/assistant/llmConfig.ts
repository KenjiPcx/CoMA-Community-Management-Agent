import dotenv from "dotenv";
import { AzureOpenAI } from "openai";

dotenv.config();

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
export const getClient = () => {
  const assistantsClient = new AzureOpenAI({
    endpoint: azureOpenAIEndpoint,
    apiVersion: azureOpenAIVersion,
    apiKey: azureOpenAIKey,
  });
  return assistantsClient;
};
