import { containers, ThreadDocument } from "./cosmosClient";

export async function createThread(thread: ThreadDocument): Promise<void> {
  await containers.threads.items.create(thread);
}

export async function updateThread(thread: ThreadDocument): Promise<void> {
  await containers.threads.item(thread.id, thread.threadId).replace(thread);
}

export async function getThread(
  threadId: string
): Promise<ThreadDocument | undefined> {
  const { resource: thread } = await containers.threads
    .item(threadId, threadId)
    .read();
  return thread;
}
