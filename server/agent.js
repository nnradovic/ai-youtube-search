import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import data from "./data.js";
import { tool } from "@langchain/core/tools";
import { MemorySaver } from "@langchain/langgraph";
import z from "zod";
import { addVideoToVectorStore, vectorStore } from "./embeddings.js";

const llm = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-sonnet-4-20250514",
});

const video = data[0];
const video_id = data[0].video_id;

await addVideoToVectorStore(video);

const retriveTool = tool(
  async ({ query }, { configurable: { video_id } }) => {
    const retriveDocs = await vectorStore.similaritySearch(
      query,
      3,
      (doc) => doc.metadata.video_id === video_id,
    );
    const serilizedDocs = retriveDocs.map((doc) => doc.pageContent).join("\n");
    return serilizedDocs;
  },
  {
    name: "retriveTool",
    description: "A tool to retrive relevant chunks from the video transcript",
    schema: z.object({
      query: z.string(),
    }),
  },
);

const checkpointer = new MemorySaver();

// console.log(retriveDocs);
const agent = createReactAgent({
  llm,
  tools: [retriveTool],
  checkpointer,
});

const result = await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content: "Where firework occured first?",
      },
    ],
  },
  { configurable: { thread_id: 1, video_id: video_id } },
);

console.log(result.messages.at(-1).content);
