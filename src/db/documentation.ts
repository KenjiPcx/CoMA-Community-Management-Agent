import { DocDocument, containers } from "./cosmosClient";

export async function createDoc(doc: DocDocument): Promise<void> {
  await containers.docs.items.create(doc);
}