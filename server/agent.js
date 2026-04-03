import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import data from "./data.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { FakeVectorStore as MemoryVectorStore } from "@langchain/core/utils/testing";
import { tool } from "@langchain/core/tools";
import z from "zod";

const llm = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-sonnet-4-20250514",
});

const video = data[0];
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

// Create documents from the video transcript and split them into chunks
const docs = [
  new Document({
    pageContent: video.transcript,
    metadata: { video_id: video.videoId },
  }),
];
const chunks = await textSplitter.splitDocuments(docs);
// console.log(`Created ${chunks.length} transcript chunks.`);

const embeddingModel = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-3-large",
});
const vectorStore = new MemoryVectorStore(embeddingModel);
await vectorStore.addDocuments(chunks);

const retriveTool = tool(
  async ({ query }) => {
    const retriveDocs = await vectorStore.similaritySearch(query, 3);
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

// console.log(retriveDocs);
const agent = createReactAgent({ llm, tools: [retriveTool] });

const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Where firework occured first?",
    },
  ],
});

console.log(result.messages.at(-1).content);
