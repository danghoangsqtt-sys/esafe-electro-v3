
import { GoogleGenAI } from "@google/genai";
import { VectorChunk, PdfMetadata } from "../types";
import * as pdfjsLib from "pdfjs-dist";

import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const parsePdfDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  const raw = dateStr.replace(/^D:/, '');
  if (raw.length >= 8) {
    return `${raw.substring(6, 8)}/${raw.substring(4, 6)}/${raw.substring(0, 4)}`;
  }
  return dateStr;
};

export const extractDataFromPDF = async (fileOrUrl: File | string): Promise<{ text: string; metadata: PdfMetadata }> => {
  try {
    let data;
    if (typeof fileOrUrl === 'string') {
        const response = await fetch(fileOrUrl);
        const blob = await response.blob();
        data = await blob.arrayBuffer();
    } else {
        data = await fileOrUrl.arrayBuffer();
    }

    const loadingTask = pdfjsLib.getDocument({
      data: data,
      useWorkerFetch: true,
      isEvalSupported: false,
    });
    
    let pdf = await loadingTask.promise;
    let metadata: PdfMetadata = {};
    try {
      const meta = await pdf.getMetadata();
      if (meta?.info) {
        const info = meta.info as any;
        metadata = {
          title: info.Title || '',
          author: info.Author || '',
          creationDate: parsePdfDate(info.CreationDate),
          producer: info.Producer || ''
        };
      }
    } catch (e) {}
    
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return { text: fullText, metadata };
  } catch (error) {
    throw error;
  }
};

export const extractTextFromPDF = async (file: File): Promise<string> => {
    const { text } = await extractDataFromPDF(file);
    return text;
}

/**
 * Cải thiện việc tách đoạn (chunking) để giữ ngữ cảnh tốt hơn
 */
export const chunkText = (text: string, targetChunkSize: number = 800, overlap: number = 150): string[] => {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const sentence of sentences) {
    if ((currentChunk.length + sentence.length) > targetChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Giữ lại phần overlap từ cuối chunk trước
      currentChunk = currentChunk.slice(-overlap) + sentence; 
    } else {
      currentChunk += " " + sentence;
    }
  }
  if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
  return chunks;
};

export const embedChunks = async (
  docId: string, 
  textChunks: string[],
  onProgress?: (percent: number) => void
): Promise<VectorChunk[]> => {
  /* Enforce exclusively using process.env.API_KEY per guidelines */
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Missing API Key.");

  const ai = new GoogleGenAI({ apiKey });
  const vectorChunks: VectorChunk[] = [];

  // Xử lý song song từng cụm nhỏ để tránh quá tải API
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
    } catch (e: any) {
      console.error(`Embedding failed at chunk ${i}:`, e);
      if (e.toString().includes('429')) {
        await new Promise(r => setTimeout(r, 5000));
        i--;
        continue;
      }
    }
    if (onProgress) onProgress(Math.round(((i + 1) / textChunks.length) * 100));
  }
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
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });

  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: [{ parts: [{ text: query }] }]
    });
    const queryVector = response.embeddings?.[0]?.values;
    if (!queryVector) return [];

    return knowledgeBase
      .map(chunk => ({ chunk, score: cosineSimilarity(queryVector, chunk.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.chunk);
  } catch (e) {
    console.error("[RAG] Search Error:", e);
    // Dự phòng: Tìm kiếm theo từ khóa cơ bản nếu embedding lỗi
    const lowerQuery = query.toLowerCase();
    return knowledgeBase
      .filter(chunk => chunk.text.toLowerCase().includes(lowerQuery))
      .slice(0, topK);
  }
};
