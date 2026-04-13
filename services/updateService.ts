
import { AppVersionInfo } from "../types";
import packageJson from "../package.json";

/**
 * GITHUB REPOSITORY CONFIGURATION
 * Chỉnh sửa repo tại đây để trỏ đến đúng nguồn dữ liệu
 */
const GITHUB_REPO = "danghoangsqtt-sys/esafe-electro-v3";
const REMOTE_PACKAGE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/package.json`;
const REMOTE_VERSION_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/version.json`;
const RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;

/**
 * So sánh phiên bản theo chuẩn Semantic Versioning (Major.Minor.Patch)
 * @returns 1 nếu remote > local, -1 nếu remote < local, 0 nếu bằng nhau
 */
const compareVersions = (remote: string, local: string): number => {
  const r = remote.split('.').map(Number);
  const l = local.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    const rPart = r[i] || 0;
    const lPart = l[i] || 0;
    if (rPart > lPart) return 1;
    if (rPart < lPart) return -1;
  }
  return 0;
};

/**
 * Fetch JSON với timeout và cache-busting
 */
const fetchJSON = async (url: string, timeoutMs = 10000): Promise<any> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const timestamp = Date.now();
    const response = await fetch(`${url}?t=${timestamp}`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Thực hiện kiểm tra cập nhật từ máy chủ GitHub
 * Ưu tiên: version.json (có changelog) -> package.json (chỉ có version)
 */
export const checkAppUpdate = async (): Promise<AppVersionInfo> => {
  const localVersion = packageJson.version;
  console.log(`[UPDATE] Kiểm tra cập nhật... (Local: v${localVersion})`);
  
  try {
    let remoteVersion = localVersion;
    let changelog = "";
    let releaseDate = "";

    // 1. Thử lấy version.json trước (có đầy đủ thông tin)
    try {
      const versionData = await fetchJSON(REMOTE_VERSION_URL);
      remoteVersion = versionData.version || localVersion;
      changelog = versionData.changelog || "";
      releaseDate = versionData.releaseDate || "";
      console.log(`[UPDATE] version.json -> v${remoteVersion}`);
    } catch (e) {
      console.warn("[UPDATE] Không thể lấy version.json, thử package.json...");
      
      // 2. Fallback: lấy từ package.json
      try {
        const pkgData = await fetchJSON(REMOTE_PACKAGE_URL);
        remoteVersion = pkgData.version || localVersion;
        console.log(`[UPDATE] package.json -> v${remoteVersion}`);
      } catch (e2) {
        console.error("[UPDATE] Không thể kết nối server cập nhật:", e2);
        throw new Error("Không thể kết nối máy chủ cập nhật. Vui lòng kiểm tra kết nối internet.");
      }
    }

    const hasUpdate = compareVersions(remoteVersion, localVersion) === 1;

    return {
      currentVersion: localVersion,
      latestVersion: remoteVersion,
      releaseDate: releaseDate || new Date().toLocaleDateString('vi-VN'),
      changelog: changelog || (hasUpdate ? `Phiên bản ${remoteVersion} đã sẵn sàng. Vui lòng tải về để cập nhật.` : ""),
      updateUrl: RELEASES_URL,
      isUpdateAvailable: hasUpdate
    };
  } catch (error: any) {
    console.error("[UPDATE] Lỗi:", error);
    throw error; // Re-throw để Settings.tsx hiện thông báo lỗi
  }
};
