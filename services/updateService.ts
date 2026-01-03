
import { AppVersionInfo } from "../types";
import { GoogleGenAI } from "@google/genai";

// Phiên bản hiện tại của ứng dụng
const CURRENT_VERSION = "2.1.0";

// URL chứa thông tin phiên bản từ xa (GitHub Raw)
const REMOTE_VERSION_URL = "https://raw.githubusercontent.com/danghoangsqtt-sys/esafe-electro-v3/main/version.json";

export const checkAppUpdate = async (): Promise<AppVersionInfo> => {
  console.debug("[DHSYSTEM-UPDATE] Checking for updates...");
  
  try {
    const response = await fetch(REMOTE_VERSION_URL + "?t=" + Date.now()).catch(() => null);
    
    let serverData;
    if (response && response.ok) {
        serverData = await response.json();
    } else {
        // Dữ liệu giả lập phục vụ UI nếu không kết nối được server
        serverData = {
            version: "2.1.0", // Mặc định bằng hiện tại để không hiện thông báo
            releaseDate: "2026-03-01",
            changelog: "Không có thông tin mới.",
            updateUrl: "#"
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
