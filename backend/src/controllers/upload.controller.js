import fs from "fs";
import { createRequire } from "module";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { setStoredChunks } from "../services/vector.service.js";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF uploaded" });
    }

    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);

    const fullText = pdfData.text;

    if (!fullText || fullText.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract text from PDF" });
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitText(fullText);

    const embeddingsModel = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "text-embedding-004",
    });

    const embeddings = await embeddingsModel.embedDocuments(chunks);

    const chunkObjects = chunks.map((chunk, index) => ({
      content: chunk,
      embedding: embeddings[index],
      metadata: {
        source: req.file.originalname,
        chunkIndex: index,
      },
    }));

    setStoredChunks(chunkObjects);

    return res.status(200).json({
      message: "PDF uploaded, chunked, and embedded successfully",
      fileName: req.file.originalname,
      totalChars: fullText.length,
      totalChunks: chunks.length,
      preview: chunks[0],
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Failed to process PDF" });
  }
};