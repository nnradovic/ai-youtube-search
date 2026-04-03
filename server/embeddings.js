import { OpenAIEmbeddings } from "@langchain/openai";
import { FakeVectorStore as MemoryVectorStore } from "@langchain/core/utils/testing";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const embeddingModel = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-3-large",
});
export const vectorStore = new MemoryVectorStore(embeddingModel);

export const addVideoToVectorStore = async (videoData) => {
  // Create documents from the video transcript and split them into chunks
  const docs = [
    new Document({
      pageContent: videoData.transcript,
      metadata: { video_id: videoData.video_id },
    }),
  ];

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await textSplitter.splitDocuments(docs);
  // console.log(`Created ${chunks.length} transcript chunks.`);

  await vectorStore.addDocuments(chunks);
};
