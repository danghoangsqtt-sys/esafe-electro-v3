

import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType, VectorChunk, AppSettings } from "../types";
import { findRelevantChunks } from "./documentProcessor";

const DEFAULT_SETTINGS: AppSettings = {
  modelName: "gemini-3-flash-preview", 
  aiVoice: "Zephyr",
  temperature: 0.7,
  maxOutputTokens: 2048,
  autoSave: true,
  ragTopK: 5, 
  thinkingBudget: 0, 
  systemExpertise: 'ACADEMIC'
};

const getSettings = (): AppSettings => {
  const saved = localStorage.getItem('app_settings');
  return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
};

const getAI = () => {
  /* Enforce exclusively using process.env.API_KEY per guidelines */
  return new GoogleGenAI({ apiKey: process.env.API_KEY! });
};

const getSystemInstruction = (settings: AppSettings, contextText: string) => {
  let instruction = `Bạn là Trợ lý Giáo sư chuyên ngành Nguồn điện An toàn và Môi trường (Hệ thống E-SafePower - DHsystem).
NHIỆM VỤ: Giải đáp thắc mắc về kỹ thuật điện, tiêu chuẩn an toàn (IEC, TCVN), ắc quy, nguồn năng lượng tái tạo và xử lý chất thải điện tử.
PHONG CÁCH: Hàn lâm, chính xác, sử dụng thuật ngữ chuyên môn.
ĐỊNH DẠNG: Sử dụng Markdown cho danh sách và LaTeX ($...$) cho các công thức điện học (Vd: $P = U.I.cos\phi$).
TRÁNH: Trả lời lan man hoặc thiếu căn cứ kỹ thuật.`;

  if (contextText) {
    instruction += `\n\nDựa vào kiến thức từ giáo trình sau để trả lời:\n${contextText}`;
  }
  return instruction;
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
    
    // Tìm kiếm tri thức liên quan từ RAG
    if (knowledgeBase.length > 0 && message.length > 5) {
      try {
        const relevantChunks = await findRelevantChunks(message, knowledgeBase, settings.ragTopK);
        if (relevantChunks.length > 0) {
          contextText = relevantChunks.map(c => c.text).join("\n\n");
          ragSources = [{ uri: '#', title: 'Giáo trình lưu trữ nội bộ' }];
        }
      } catch (e) {
        console.warn("[RAG] Bypassed");
      }
    }

    const modelName = config?.model || settings.modelName; 
    const systemInstruction = getSystemInstruction(settings, contextText);

    /* Incorporate thinkingConfig when maxOutputTokens is set to satisfy API guidelines */
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
        temperature: config?.temperature || settings.temperature,
        maxOutputTokens: config?.maxOutputTokens || settings.maxOutputTokens,
        thinkingConfig: { thinkingBudget: settings.thinkingBudget }
      },
    });

    return {
      text: response.text,
      sources: ragSources
    };
  } catch (error: any) {
    console.error("AI Error:", error);
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
          category: { type: Type.STRING, description: 'Chủ đề: An toàn điện, Môi trường, Pin, v.v.' },
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
        temperature: 0.8,
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
          contents: `Đánh giá câu trả lời của sinh viên.
Câu hỏi: ${question}
Đáp án chuẩn: ${correctAnswerOrContext}
Câu trả lời của sinh viên: ${userAnswer}

Hãy cho điểm từ 0-10 và nhận xét ngắn gọn.`,
          config: { 
              responseMimeType: "application/json", 
              temperature: 0.3,
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      score: { type: Type.NUMBER },
                      feedback: { type: Type.STRING }
                  },
                  required: ["score", "feedback"]
              }
          }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      throw error;
    }
};