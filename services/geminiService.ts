
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

/**
 * Khởi tạo AI Engine sử dụng duy nhất API_KEY từ biến môi trường theo quy định bảo mật của hệ thống.
 * Chú ý: Việc quản lý API Key được thực hiện ở cấp độ cấu hình môi trường thực thi (process.env.API_KEY).
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("LỖI HỆ THỐNG: API_KEY không được tìm thấy trong biến môi trường. Vui lòng cấu hình API_KEY để kích hoạt tính năng AI.");
  }
  return new GoogleGenAI({ apiKey });
};

const getSystemInstruction = (settings: AppSettings, contextText: string) => {
  let instruction = `Bạn là Trợ lý Giáo sư chuyên ngành Nguồn điện An toàn và Môi trường (Hệ thống E-SafePower - DHsystem).
NHIỆM VỤ: Giải đáp thắc mắc về kỹ thuật điện, tiêu chuẩn an toàn (IEC, TCVN), ắc quy, nguồn năng lượng tái tạo và xử lý chất thải điện tử.
PHONG CÁCH: Hàn lâm, chính xác, sử dụng thuật ngữ chuyên môn.
ĐỊNH DẠNG: Sử dụng Markdown cho danh sách và LaTeX ($...$) cho các công thức điện học (Vd: $P = U.I.cos\\phi$).
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
    
    // Nâng cấp logic truy xuất tri thức RAG
    if (knowledgeBase.length > 0 && message.length > 3) {
      try {
        const topK = config?.maxOutputTokens ? Math.min(settings.ragTopK, 8) : settings.ragTopK;
        const relevantChunks = await findRelevantChunks(message, knowledgeBase, topK);
        if (relevantChunks.length > 0) {
          contextText = relevantChunks.map(c => c.text).join("\n\n");
          ragSources = [{ uri: '#', title: 'Tri thức từ Giáo trình Hệ thống' }];
        }
      } catch (e) {
        console.warn("[RAG-ERROR] Bỏ qua truy xuất tri thức do lỗi kỹ thuật.");
      }
    }

    const modelName = config?.model || settings.modelName; 
    const systemInstruction = getSystemInstruction(settings, contextText);

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
        temperature: config?.temperature || settings.temperature,
        // Không ép buộc maxOutputTokens trừ khi thực sự cần để tránh lỗi thinkingBudget
        maxOutputTokens: config?.maxOutputTokens,
      },
    });

    return {
      text: response.text || "AI không thể tạo phản hồi vào lúc này.",
      sources: ragSources
    };
  } catch (error: any) {
    console.error("AI Core Error:", error);
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
        temperature: 0.8,
      },
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Generation Error:", error);
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
          contents: `Đánh giá câu trả lời của sinh viên.\nCâu hỏi: ${question}\nĐáp án chuẩn/Ngữ cảnh: ${correctAnswerOrContext}\nCâu trả lời của sinh viên: ${userAnswer}\n\nHãy cho điểm từ 0-10 và nhận xét ngắn gọn về mặt chuyên môn điện học.`,
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
