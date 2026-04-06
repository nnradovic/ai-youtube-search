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

await addVideoToVectorStore(video);

const retriveTool = tool(
  async ({ query }, { configurable: { video_id } }) => {
    const retriveDocs = await vectorStore.similaritySearch(query, 3, {
      video_id: video_id,
    });
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
export const agent = createReactAgent({
  llm,
  tools: [retriveTool],
  checkpointer,
});
