
import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType, VectorChunk, AppSettings } from "../types";
import { findRelevantChunks } from "./documentProcessor";

const DEFAULT_SETTINGS: AppSettings = {
  modelName: "gemini-3-pro-preview",
  aiVoice: "Zephyr",
  temperature: 0.6,
  maxOutputTokens: 2500,
  autoSave: true,
  ragTopK: 5,
  thinkingBudget: 32768,
  systemExpertise: 'ACADEMIC'
};

const getSettings = (): AppSettings => {
  const saved = localStorage.getItem('app_settings');
  return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
};

const getAI = () => {
  const manualKey = localStorage.getItem('manual_api_key');
  const apiKey = manualKey || process.env.API_KEY;
  
  if (!apiKey) {
    console.error("[DHSYSTEM-DEBUG] API Key missing!");
    throw new Error("Chưa cấu hình API Key. Vui lòng vào Cài đặt.");
  }
  
  console.debug("[DHSYSTEM-DEBUG] Initializing GoogleGenAI with key:", apiKey.substring(0, 8) + "...");
  return new GoogleGenAI({ apiKey });
};

const getSystemInstruction = (settings: AppSettings, contextText: string) => {
  let instruction = `BẠN LÀ TRỢ LÝ AI CAO CẤP CỦA HỆ THỐNG E-SAFEPOWER, ĐƯỢC HUẤN LUYỆN CHUYÊN SÂU BỞI **DHSYSTEM**.
  
NHIỆM VỤ CỦA BẠN:
1. Giải đáp các thắc mắc về môn học "Nguồn điện an toàn và môi trường".
2. Hỗ trợ sinh viên và giảng viên tra cứu tiêu chuẩn an toàn (TCVN, IEC), quy trình vận hành và tác động môi trường của năng lượng.

QUY TẮC PHẢN HỒI:
- Luôn giữ thái độ chuyên nghiệp, chính xác và khoa học.
- Sử dụng ngôn ngữ Tiếng Việt chuẩn mực.
- **Định dạng văn bản:** Sử dụng Markdown để in đậm các từ khóa quan trọng (VD: **DHSYSTEM**, **An toàn điện**). Sử dụng danh sách (bullet points) để liệt kê quy trình.
- **Công thức:** Luôn sử dụng LaTeX đặt trong dấu $ cho công thức dòng (inline) và $$ cho công thức khối (display). VD: $P = U \cdot I \cdot \cos\phi$.
- **Danh tính:** Khi được hỏi về nguồn gốc, hãy khẳng định bạn là sản phẩm trí tuệ của **DHsystem**.

PHONG CÁCH CHUYÊN MÔN: `;

  switch(settings.systemExpertise) {
    case 'ACADEMIC':
      instruction += "Giảng viên Đại học - Tập trung vào lý thuyết hệ thống, chứng minh công thức và dẫn chứng tiêu chuẩn kỹ thuật.";
      break;
    case 'FIELD_EXPERT':
      instruction += "Kỹ sư Trưởng - Tập trung vào kinh nghiệm thực tế, xử lý sự cố tại hiện trường và quy tắc an toàn bảo hộ.";
      break;
    case 'STUDENT_ASSISTANT':
      instruction += "Trợ giảng - Giải thích đơn giản, ví dụ minh họa trực quan, hỗ trợ ôn thi hiệu quả.";
      break;
  }

  if (contextText) {
    instruction += `\n\nDƯỚI ĐÂY LÀ DỮ LIỆU TỪ GIÁO TRÌNH NỘI BỘ (Hãy ưu tiên sử dụng thông tin này): \n"""\n${contextText}\n"""`;
  }

  return instruction;
};

export const generateChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  config?: { temperature?: number; maxOutputTokens?: number; model?: string },
  knowledgeBase: VectorChunk[] = []
) => {
  console.debug("[DHSYSTEM-DEBUG] generateChatResponse invoked. Message:", message);
  try {
    const ai = getAI();
    const settings = getSettings();
    let contextText = "";
    let ragSources: { uri: string; title: string }[] = [];
    
    if (knowledgeBase.length > 0) {
      console.debug("[DHSYSTEM-DEBUG] KnowledgeBase active. Searching for relevant chunks...");
      try {
        const relevantChunks = await findRelevantChunks(message, knowledgeBase, settings.ragTopK);
        console.debug(`[DHSYSTEM-DEBUG] RAG: Found ${relevantChunks.length} relevant chunks.`);
        if (relevantChunks.length > 0) {
          contextText = relevantChunks.map(c => c.text).join("\n\n---\n\n");
          ragSources = [{ uri: '#', title: 'Giáo trình E-SafePower' }];
        }
      } catch (e) {
        console.error("[DHSYSTEM-DEBUG] RAG Retrieval failed", e);
      }
    }

    const modelName = settings.modelName; 
    const systemInstruction = getSystemInstruction(settings, contextText);

    const generationConfig: any = {
      systemInstruction,
      temperature: config?.temperature ?? settings.temperature,
      maxOutputTokens: (config?.maxOutputTokens ?? settings.maxOutputTokens),
      tools: [{ googleSearch: {} }],
    };

    if (settings.thinkingBudget > 0 && (modelName.includes('pro') || modelName.includes('gemini-3'))) {
      generationConfig.thinkingConfig = { thinkingBudget: settings.thinkingBudget };
      console.debug(`[DHSYSTEM-DEBUG] Model supports thinking. Budget: ${settings.thinkingBudget}`);
    }

    console.debug("[DHSYSTEM-DEBUG] API Parameters:", { model: modelName, config: generationConfig });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: message,
      config: generationConfig,
    });

    console.debug("[DHSYSTEM-DEBUG] API Response received successfully.");

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));

    return {
      text: response.text,
      sources: [...ragSources, ...webSources]
    };
  } catch (error: any) {
    console.error("[DHSYSTEM-DEBUG] generateChatResponse Error:", error);
    throw error;
  }
};

export const generateQuestionsByAI = async (
  topicOrContext: string,
  count: number,
  difficulty: string
): Promise<Partial<Question>[]> => {
  console.debug("[DHSYSTEM-DEBUG] generateQuestionsByAI topic:", topicOrContext, "count:", count);
  try {
    const ai = getAI();
    const settings = getSettings();
    const modelName = settings.modelName;

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
      model: modelName,
      contents: `Hãy đóng vai chuyên gia giáo dục của DHsystem. Dựa vào yêu cầu: ${topicOrContext}. Tạo ${count} câu hỏi độ khó ${difficulty}. Trả về JSON theo schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
      },
    });

    console.debug("[DHSYSTEM-DEBUG] Raw JSON Questions:", response.text);
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("[DHSYSTEM-DEBUG] Question Generation failed:", error);
    throw error;
  }
};

export const evaluateOralAnswer = async (
    question: string,
    correctAnswerOrContext: string,
    userAnswer: string
): Promise<{ score: number; feedback: string }> => {
    console.debug("[DHSYSTEM-DEBUG] Evaluating Answer for Q:", question);
    try {
      const ai = getAI();
      const settings = getSettings();
      const modelName = settings.modelName;

      const prompt = `DHsystem AI Assessor. 
      Q: "${question}"
      Key: "${correctAnswerOrContext}"
      Student Answer: "${userAnswer}"
      Chấm điểm từ 0-10 và nhận xét chi tiết. Chú trọng tính chính xác về thuật ngữ an toàn điện.
      Trả về JSON: {"score": number, "feedback": string}`;

      const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { 
            responseMimeType: "application/json",
            temperature: 0.3,
          }
      });

      console.debug("[DHSYSTEM-DEBUG] Evaluation result:", response.text);
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("[DHSYSTEM-DEBUG] Evaluation Error:", error);
      throw error;
    }
};
