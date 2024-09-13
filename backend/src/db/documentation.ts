import { DocDocument, containers } from "./cosmosClient";

export async function createDoc(doc: DocDocument): Promise<void> {
  await containers.docs.items.create(doc);
}

export async function getDoc(docId: string): Promise<DocDocument | undefined> {
  const { resource: doc } = await containers.docs.item(docId, docId).read();
  return doc;
}

export async function updateDoc(doc: DocDocument): Promise<void> {
  await containers.docs.item(doc.id, doc.id).replace(doc);
}
