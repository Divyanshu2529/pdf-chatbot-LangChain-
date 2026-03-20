import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";
import { getStoredChunks } from "../services/vector.service.js";

const cosineSimilarity = (a, b) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const askQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Question is required" });
    }

    const storedChunks = getStoredChunks();

    if (!storedChunks || storedChunks.length === 0) {
      return res.status(400).json({ error: "No PDF has been uploaded yet" });
    }

    const embeddingsModel = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "text-embedding-004",
    });

    const questionEmbedding = await embeddingsModel.embedQuery(question);

    const rankedChunks = storedChunks
      .map((chunk) => ({
        ...chunk,
        score: cosineSimilarity(questionEmbedding, chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const context = rankedChunks.map((chunk) => chunk.content).join("\n\n");

    const llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-1.5-flash",
      temperature: 0,
    });

    const prompt = `
You are a helpful assistant that answers questions only from the provided PDF context.

Context:
${context}

Question:
${question}

Instructions:
- Answer only using the context above.
- If the answer is not in the context, say: "I couldn't find that in the uploaded PDF."
- Keep the answer clear and direct.
`;

    const response = await llm.invoke(prompt);

    return res.status(200).json({
      answer: response.content,
      sources: rankedChunks.map((chunk) => chunk.metadata),
    });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({ error: "Failed to answer question" });
  }
};