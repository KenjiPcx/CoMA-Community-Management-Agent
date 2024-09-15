import { AzureKeyCredential, SearchClient } from "@azure/search-documents";

const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT!,
  process.env.AZURE_SEARCH_DOCS_INDEX_NAME!,
  new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY!)
);

export const searchDocs = async (query: string) => {
  try {
    const results = await searchClient.search(query, { top: 5 });
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
