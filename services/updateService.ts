
import { AppVersionInfo } from "../types";
import { GoogleGenAI } from "@google/genai";

const CURRENT_VERSION = "2.1.0";
// URL giả định trỏ tới file version.json trên một Git repository (VD: GitHub raw)
const REMOTE_VERSION_URL = "https://raw.githubusercontent.com/dhsystem/esafepower-updates/main/version.json";

export const checkAppUpdate = async (): Promise<AppVersionInfo> => {
  console.debug("[DHSYSTEM-UPDATE] Checking for updates...");
  
  try {
    // Trong môi trường thực tế, fetch dữ liệu từ Git URL
    // Ở đây ta giả lập một phản hồi từ server
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Giả định server trả về phiên bản 2.2.0
    const serverData = {
      version: "2.2.0",
      releaseDate: "2026-06-01",
      changelog: "1. Nâng cấp engine Gemini 2.5 cho tốc độ phản hồi nhanh gấp 2 lần. \n2. Bổ sung tính năng kéo thả tài liệu trực tiếp. \n3. Sửa lỗi hiển thị công thức LaTeX trong Millionaire Game. \n4. Tối ưu hóa bộ nhớ khi xử lý file PDF lớn.",
      updateUrl: "https://github.com/dhsystem/esafepower-updates/releases/latest"
    };

    const isAvailable = compareVersions(CURRENT_VERSION, serverData.version) < 0;

    return {
      currentVersion: CURRENT_VERSION,
      latestVersion: serverData.version,
      releaseDate: serverData.releaseDate,
      changelog: serverData.changelog,
      updateUrl: serverData.updateUrl,
      isUpdateAvailable: isAvailable
    };
  } catch (error) {
    console.error("[DHSYSTEM-UPDATE] Failed to fetch version info:", error);
    throw new Error("Không thể kết nối đến máy chủ cập nhật.");
  }
};

const compareVersions = (v1: string, v2: string) => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
};

export const summarizeUpdateWithAI = async (changelog: string): Promise<string> => {
  const apiKey = localStorage.getItem('manual_api_key') || process.env.API_KEY;
  if (!apiKey) return changelog;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hãy tóm tắt các điểm mới sau đây một cách ngắn gọn, thu hút và chuyên nghiệp cho người dùng ứng dụng E-SafePower: \n\n${changelog}`,
      config: { temperature: 0.5 }
    });
    return response.text || changelog;
  } catch (e) {
    return changelog;
  }
};
