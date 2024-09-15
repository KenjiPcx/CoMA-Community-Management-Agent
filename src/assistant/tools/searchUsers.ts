import { SearchClient, AzureKeyCredential } from "@azure/search-documents";

const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT!,
  process.env.AZURE_SEARCH_USERS_INDEX_NAME!,
  new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY!)
);

export const searchUsers = async (query: string) => {
  try {
    const results = await searchClient.search(query);
    const resultsArray = [];
    for await (const result of results.results) {
      resultsArray.push(result.document);
    }
    return JSON.stringify(resultsArray);
  } catch (error) {
    console.error("Error searching users:", error);
    return "No users found";
  }
};
