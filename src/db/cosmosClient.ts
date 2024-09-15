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
  profile?: UserProfileDocument;
}

export interface UserProfileDocument {
  userId: string;
  username: string;
  intro: string;
  achievements: string[];
  skills: string[];
  idea: string;
  supportNeeded: string[];
  mentorHelp: string;
}

export interface DocDocument {
  title: string;
  question: string;
  answer: string;
  content: string;
  tags: string[];
  usefulLinks: string[];
}
