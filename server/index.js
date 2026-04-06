import express from "express";
import cors from "cors";
import { agent } from "./agent.js";

const app = express();

const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  res.send("Hello World!");
});

app.post("/generate", async (req, res) => {
  const { query, video_id, thread_id } = req.body;
  const result = await agent.invoke(
    {
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
    },
    { configurable: { thread_id: thread_id, video_id: video_id } },
  );

  console.log(result.messages.at(-1).content);

  res.send(result.messages.at(-1).content);
});

app.post("/webhook", async (req, res) => {
  console.log(req.body);
  res.send("ok");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
