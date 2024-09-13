import { CosmosClient } from "@azure/cosmos";

const endpoint = process.env.COSMOS_ENDPOINT || "";
const key = process.env.COSMOS_KEY || "";
const databaseId = process.env.COSMOS_DATABASE_ID || "";

export const client = new CosmosClient({ endpoint, key });
export const database = client.database(databaseId);

export const containers = {
  users: database.container("users"),
  threads: database.container("threads"),
  docs: database.container("docs"),
};

// Interfaces for our documents
export interface UserDocument {
  userId: string;
  username: string;
  isRegistered: boolean;
  lastInteraction: Date;
}

export interface ThreadDocument {
  id: string;
  threadId: string;
  problem: string;
  status: "open" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

export interface DocDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}
