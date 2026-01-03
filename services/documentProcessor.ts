
import { GoogleGenAI } from "@google/genai";
import { VectorChunk, PdfMetadata } from "../types";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/build/pdf";

// Sửa lỗi: Đổi 'any' thành 'ajax' trong URL cdnjs
GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs";

const parsePdfDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  const raw = dateStr.replace(/^D:/, '');
  if (raw.length >= 8) {
    return `${raw.substring(6, 8)}/${raw.substring(4, 6)}/${raw.substring(0, 4)}`;
  }
  return dateStr;
};

export const extractDataFromPDF = async (file: File): Promise<{ text: string; metadata: PdfMetadata }> => {
  console.debug("[DHSYSTEM-DEBUG] Starting PDF extraction for:", file.name);
  const arrayBuffer = await file.arrayBuffer();
  let pdf = await getDocument(arrayBuffer).promise;
  console.debug(`[DHSYSTEM-DEBUG] PDF loaded. Pages: ${pdf.numPages}`);
  
  let metadata: PdfMetadata = {};
  try {
    const data = await pdf.getMetadata();
    if (data?.info) {
      const info = data.info as any;
      metadata = {
        title: info.Title || '',
        author: info.Author || '',
        creationDate: parsePdfDate(info.CreationDate),
        producer: info.Producer || ''
      };
      console.debug("[DHSYSTEM-DEBUG] Metadata extracted:", metadata);
    }
  } catch (e) {
    console.warn("[DHSYSTEM-DEBUG] Metadata extraction failed:", e);
  }
  
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
  }
  
  console.debug(`[DHSYSTEM-DEBUG] Extraction complete. Total characters: ${fullText.length}`);
  return { text: fullText, metadata };
};

export const extractTextFromPDF = async (file: File): Promise<string> => {
    const { text } = await extractDataFromPDF(file);
    return text;
}

export const chunkText = (text: string, targetChunkSize: number = 800, overlap: number = 150): string[] => {
  console.debug(`[DHSYSTEM-DEBUG] Chunking text. Target size: ${targetChunkSize}, Overlap: ${overlap}`);
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const sentence of sentences) {
    if ((currentChunk.length + sentence.length) > targetChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = currentChunk.slice(-overlap) + sentence; 
    } else {
      currentChunk += " " + sentence;
    }
  }
  if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
  console.debug(`[DHSYSTEM-DEBUG] Chunking complete. Generated ${chunks.length} chunks.`);
  return chunks;
};

export const embedChunks = async (
  docId: string, 
  textChunks: string[],
  onProgress?: (percent: number) => void
): Promise<VectorChunk[]> => {
  const manualKey = localStorage.getItem('manual_api_key');
  const apiKey = manualKey || process.env.API_KEY;
  
  if (!apiKey) {
    console.error("[DHSYSTEM-DEBUG] Embedding failed: API Key not found.");
    throw new Error("Missing API Key for embedding.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const vectorChunks: VectorChunk[] = [];

  console.debug(`[DHSYSTEM-DEBUG] Embedding ${textChunks.length} chunks for docId: ${docId}`);

  for (let i = 0; i < textChunks.length; i++) {
    try {
      const response = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: [{ parts: [{ text: textChunks[i] }] }]
      });
      const embedding = response.embeddings?.[0];
      if (embedding?.values) {
        vectorChunks.push({
          id: Math.random().toString(36).substring(7),
          docId: docId,
          text: textChunks[i],
          embedding: embedding.values
        });
      }
    } catch (e) {
      console.error(`[DHSYSTEM-DEBUG] Embedding failed at chunk ${i}:`, e);
    }
    if (onProgress) onProgress(Math.round(((i + 1) / textChunks.length) * 100));
    await new Promise(r => setTimeout(r, 20)); 
  }
  console.debug(`[DHSYSTEM-DEBUG] Successfully embedded ${vectorChunks.length} chunks.`);
  return vectorChunks;
};

const dotProduct = (a: number[], b: number[]) => a.reduce((sum, val, i) => sum + val * b[i], 0);
const magnitude = (a: number[]) => Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
export const cosineSimilarity = (a: number[], b: number[]) => {
    const magA = magnitude(a);
    const magB = magnitude(b);
    if (magA === 0 || magB === 0) return 0;
    return dotProduct(a, b) / (magA * magB);
};

export const findRelevantChunks = async (
  query: string,
  knowledgeBase: VectorChunk[],
  topK: number = 5
): Promise<VectorChunk[]> => {
  if (knowledgeBase.length === 0) return [];
  
  const manualKey = localStorage.getItem('manual_api_key');
  const apiKey = manualKey || process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });

  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: [{ parts: [{ text: query }] }]
    });
    const queryVector = response.embeddings?.[0]?.values;
    if (!queryVector) return [];

    console.debug("[DHSYSTEM-DEBUG] Semantic Search query embedded. Computing similarities...");

    return knowledgeBase
      .map(chunk => ({ chunk, score: cosineSimilarity(queryVector, chunk.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.chunk);
  } catch (e) {
    console.error("[DHSYSTEM-DEBUG] Query embedding failed", e);
    return [];
  }
};
