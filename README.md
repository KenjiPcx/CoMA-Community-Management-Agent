# Discord Community Management Agent (CoMA)

Discord is home to vibrant technical communities, including Microsoft's AI community, but managing large-scale discussions can be challenging.

## Demo and Pitch:
Short pitch: https://www.loom.com/share/1bc330d993434cab8ae9fe9b73f61211?sid=e6e0e94b-1de4-4a27-9906-f414b2600867

More details: https://www.loom.com/share/414412397eb3498eb665f4758bc3605e?sid=a3d0dc7f-74c1-4190-8a2a-44a57051784b

## The Problems:

### Team Matchmaking:

Hackathon and project channels are often flooded with messages, making it hard to find the right people to collaborate with, test your product, or provide mentorship. There’s too much noise and not enough targeted matchmaking.

### Getting Help

While many interesting solutions are shared in help channels for new technology where there are breaking changes everyday, searching through them is keyword-specific and lacks context. It's difficult to identify the niched solution to your niched problems.

## The Solution:

Introducing CoMA, a Discord bot designed to streamline community management by processing messages in specific channels.

### Enhanced Team Matchmaking:

When users introduce themselves in the matchmaking channel, CoMA reaches out to interviews users through direct messages to gather detailed information, builds rich profiles, and uses these to power advanced search capabilities. This allows users to find teammates, network with others, or connect with potential testers and mentors more effectively.

### How it works

![image](https://github.com/user-attachments/assets/e6a6c929-0976-4ccb-aaf0-1bb0374d5e4c)

We have document processors to periodically process the messages in the channels and extract the information we need to build the users' profiles and docs.

These then get stored in Cosmos DB and indexed by Azure AI Search periodically (manually for me).

#### Instructions to use the bot

Onboarding

- Introduce yourself in the `team-matchmaking` channel
- CoMA will DM you to get your name, pronouns, and a bit about you

In the server,

- use `/searchUsers` to start a search session for users.
- use `/searchDocs` to start a search session for docs.

Then a dedicated chat session will be created for you in your DMs.

- say `end session` to end the chat session.
- don't spam CoMA with messages, it won't work, wait for your turn.

### The Result:

No more lost context or frustrating searches through channels. Just ask CoMA, and you’ll be recommended the people you need to solve your problem. Communities become more efficient, engaged, and thriving.

# Developers Guide

Here's how you can get started by adding the bot to your server

## Stack

### Dev

- Typescript
- Discord.js
- OpenAI
- Azure OpenAI + Vercel AI SDK

### Cloud

Besides the code, you need to manually setup the following resources, sorry I don't have time to automate it:

- DB: Azure Cosmos DB (collections: users, docs)
- GPT4o from Azure AI Studio + Azure Assistants
- Search: Azure AI Search + Cosmos DB Indexer

## Setup the env file

Copy .env.example to .env and fill in the values from the resources you created

## Setup the assistants in the assistants setup folder

I just use `bun src/assistant/setup/{assistantName}.ts` to setup the assistant and then copy the ID and save to .env

## Run the bot locally

`bun run src/bot.ts`

## Deploy the bot on a server

Use an app like Railway to deploy the bot
