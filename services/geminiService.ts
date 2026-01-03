
import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType, VectorChunk, AppSettings } from "../types";
import { findRelevantChunks } from "./documentProcessor";

const DEFAULT_SETTINGS: AppSettings = {
  modelName: "gemini-3-flash-preview", 
  aiVoice: "Zephyr",
  temperature: 0.7,
  maxOutputTokens: 1024,
  autoSave: true,
  ragTopK: 3, 
  thinkingBudget: 0, 
  systemExpertise: 'ACADEMIC'
};

const getSettings = (): AppSettings => {
  const saved = localStorage.getItem('app_settings');
  return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
};

const getAI = () => {
  const manualKey = localStorage.getItem('manual_api_key');
  const apiKey = manualKey || process.env.API_KEY;
  if (!apiKey) throw new Error("Chưa cấu hình API Key trong phần Cài đặt.");
  return new GoogleGenAI({ apiKey });
};

/**
 * Rút gọn System Instruction: 
 * Loại bỏ các từ ngữ thừa, tập trung vào từ khóa để giảm Input Tokens.
 */
const getSystemInstruction = (settings: AppSettings, contextText: string) => {
  let instruction = `Trợ lý E-SafePower (DHSYSTEM). Chuyên môn: Nguồn điện an toàn & môi trường. Trả lời ngắn gọn, dùng Markdown & LaTeX.`;
  if (contextText) {
    instruction += `\n\nNgữ cảnh tài liệu: ${contextText}`;
  }
  return instruction;
};

/**
 * Kiểm tra xem tin nhắn có phải là tin nhắn rác/chào hỏi không 
 * để tránh lãng phí Token gọi Embedding & RAG.
 */
const isTrivialMessage = (msg: string): boolean => {
  const trivialPatterns = /^(xin chào|chào|hi|hello|hey|bye|tạm biệt|cảm ơn|thanks|ok|vâng|dạ)$/i;
  return trivialPatterns.test(msg.trim()) || msg.trim().length < 4;
};

export const generateChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  config?: { temperature?: number; maxOutputTokens?: number; model?: string },
  knowledgeBase: VectorChunk[] = []
) => {
  try {
    const ai = getAI();
    const settings = getSettings();
    let contextText = "";
    let ragSources: { uri: string; title: string }[] = [];
    
    if (knowledgeBase.length > 0 && !isTrivialMessage(message)) {
      try {
        const relevantChunks = await findRelevantChunks(message, knowledgeBase, settings.ragTopK);
        if (relevantChunks.length > 0) {
          contextText = relevantChunks.map(c => c.text).join("\n\n");
          ragSources = [{ uri: '#', title: 'Giáo trình E-SafePower' }];
        }
      } catch (e) {
        console.warn("[DHSYSTEM] RAG bypassed due to error.");
      }
    }

    const modelName = config?.model || settings.modelName; 
    const systemInstruction = getSystemInstruction(settings, contextText);

    const generationConfig: any = {
      systemInstruction,
      temperature: config?.temperature || settings.temperature,
      maxOutputTokens: config?.maxOutputTokens || settings.maxOutputTokens,
      tools: [], 
    };

    const response = await ai.models.generateContent({
      model: modelName,
      contents: message,
      config: generationConfig,
    });

    return {
      text: response.text,
      sources: ragSources
    };
  } catch (error: any) {
    console.error("[DHSYSTEM-DEBUG] Error:", error);
    throw error;
  }
};

export const generateQuestionsByAI = async (
  promptText: string,
  count: number,
  difficulty: string
): Promise<Partial<Question>[]> => {
  try {
    const ai = getAI();
    const settings = getSettings();
    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          type: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING },
          category: { type: Type.STRING },
          bloomLevel: { type: Type.STRING }
        },
        required: ["content", "type", "correctAnswer", "explanation", "category", "bloomLevel"],
      },
    };

    const response = await ai.models.generateContent({
      model: settings.modelName,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    throw error;
  }
};

export const evaluateOralAnswer = async (
    question: string,
    correctAnswerOrContext: string,
    userAnswer: string
): Promise<{ score: number; feedback: string }> => {
    try {
      const ai = getAI();
      const settings = getSettings();
      const response = await ai.models.generateContent({
          model: settings.modelName,
          contents: `Chấm điểm: Q: "${question}", Key: "${correctAnswerOrContext}", User: "${userAnswer}". Trả về JSON: {"score": number, "feedback": string}`,
          config: { responseMimeType: "application/json", temperature: 0.2 }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      throw error;
    }
};
