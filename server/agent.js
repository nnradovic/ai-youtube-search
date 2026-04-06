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

const trigerBrightData = tool(
  async ({ url }) => {
    const snapshot_id = await trigerBrightData(url);
    console.log(`Triggered BrightData with snapshot ID: ${snapshot_id}`);
    return snapshot_id;
  },
  {
    name: "trigerBrightData",
    description: "A tool to triger brightdata to scrape the video transcript",
    schema: z.object({
      url: z.string(),
    }),
  },
);

// const video = data[0];

// await addVideoToVectorStore(video);

const retriveTool = tool(
  async ({ query, video_id }) => {
    const retriveDocs = await vectorStore.similaritySearch(query, 3, {
      video_id,
    });
    const serilizedDocs = retriveDocs.map((doc) => doc.pageContent).join("\n");
    return serilizedDocs;
  },
  {
    name: "retriveTool",
    description: "A tool to retrive relevant chunks from the video transcript",
    schema: z.object({
      query: z.string(),
      video_id: z
        .string()
        .describe("The ID of the video to retrive the transcript chunks from"),
    }),
  },
);

const checkpointer = new MemorySaver();

// console.log(retriveDocs);
export const agent = createReactAgent({
  llm,
  tools: [retriveTool, trigerBrightData],
  checkpointer,
});
