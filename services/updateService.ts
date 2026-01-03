import { AppVersionInfo } from "../types";
import { GoogleGenAI } from "@google/genai";

// Số phiên bản này phải khớp với file version.json cục bộ
const CURRENT_VERSION = "2.1.0";

// Lưu ý: Thay đổi URL này thành URL raw trên GitHub của bạn sau khi push code
const REMOTE_VERSION_URL = "https://raw.githubusercontent.com/danghoangsqtt-sys/esafe-electro-v3/main/version.json";

export const checkAppUpdate = async (): Promise<AppVersionInfo> => {
  console.debug("[DHSYSTEM-UPDATE] Checking for updates...");
  
  try {
    // Trong thực tế, bạn sẽ fetch từ REMOTE_VERSION_URL
    // Ở đây giả lập việc gọi API để bạn có thể test giao diện ngay
    const response = await fetch(REMOTE_VERSION_URL).catch(() => null);
    
    let serverData;
    if (response && response.ok) {
        serverData = await response.json();
    } else {
        // Dữ liệu giả lập nếu chưa có server thật để bạn thấy được logic
        serverData = {
            version: "2.2.0", 
            releaseDate: "2026-06-01",
            changelog: "1. Nâng cấp engine Gemini 3 Pro.\n2. Tối ưu hóa tốc độ tải PDF.\n3. Thêm tính năng xuất báo cáo học tập.",
            updateUrl: "https://github.com/danghoangsqtt-sys/esafe-electro-v3/releases/latest"
        };
    }

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
      contents: `Hãy tóm tắt các điểm mới sau đây một cách ngắn gọn và chuyên nghiệp: \n\n${changelog}`,
      config: { temperature: 0.5 }
    });
    return response.text || changelog;
  } catch (e) {
    return changelog;
  }
};