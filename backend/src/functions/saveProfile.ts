import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { createOrUpdateUser } from "../db/users";
import { UserDocument } from "../db/cosmosClient";

type UserProfile = {
  userId: string; // User's ID
  username: string; // User's username
  intro: string; // A brief introduction about the user, including their background and top skills
  achievements: string[]; // A list of the user's top 3-5 achievements or career highlights
  skills: string[]; // A list of the user's top 3 skills
  idea: string; // A one-liner and short description of the user's idea (if applicable)
  supportNeeded: string[]; // The types of support the user is looking for (e.g., roles like engineers, marketers, funding, mentors)
  mentorHelp: string; // What kind of help the user is hoping to get from a mentor
  fundingStage: string; // The stage of funding the user is looking for (if applicable)
  searchIndexes: string[]; // Key phrases that will lead to this user when searched
};

export async function saveProfile(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const body = (await request.json()) as UserProfile;

  const { userId, username } = body;

  const updatedUser: UserDocument = {
    userId: userId,
    username: username,
    isRegistered: true,
    lastInteraction: new Date(),
    profile: body,
  };
  try {
    await createOrUpdateUser(updatedUser);
    return { status: 200, body: "Profile saved successfully" };
  } catch (error) {
    context.error(error);
    return { status: 500, body: "Failed to save profile" };
  }
}

app.http("saveProfile", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: saveProfile,
});
