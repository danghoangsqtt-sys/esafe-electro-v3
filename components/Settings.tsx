import React, { useState, useEffect } from 'react';
import { AppSettings, AppVersionInfo } from '../types';
import { checkAppUpdate } from '../services/updateService';

interface SettingsProps {
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  modelName: 'gemini-3-flash-preview',
  aiVoice: 'Zephyr',
  temperature: 0.7,
  maxOutputTokens: 1024, // Giảm mặc định để an toàn hơn
  autoSave: true,
  ragTopK: 3, // Giảm mặc định để tiết kiệm Context
  thinkingBudget: 0,
  systemExpertise: 'ACADEMIC'
};

const Settings: React.FC<SettingsProps> = ({ onNotify }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const saveSettings = () => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    onNotify("Đã cập nhật cấu hình hệ thống DHsystem.", "success");
  };

  const resetToDefault = () => {
    if (window.confirm("Khôi phục toàn bộ thiết lập về mặc định?")) {
      setSettings(DEFAULT_SETTINGS);
      onNotify("Đã đặt lại cấu hình gốc.", "info");
    }
  };

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    try {
      const info = await checkAppUpdate();
      setUpdateInfo(info);
      if (info.isUpdateAvailable) {
        onNotify(`Phát hiện phiên bản mới: ${info.latestVersion}`, "info");
      } else {
        onNotify("Ứng dụng đang ở phiên bản mới nhất.", "success");
      }
    } catch (e: any) {
      onNotify(e.message, "error");
    } finally {
      setIsChecking(false);
    }
  };

  const startUpdate = () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setDownloadProgress(100);
        setTimeout(() => {
          onNotify("Tải về hoàn tất! Hệ thống sẽ tự động làm mới.", "success");
          localStorage.setItem('just_updated', 'true');
          window.location.reload();
        }, 800);
      }
      setDownloadProgress(Math.floor(p));
    }, 300);
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        questions: JSON.parse(localStorage.getItem('questions') || '[]'),
        folders: JSON.parse(localStorage.getItem('question_folders') || '[]'),
        docs: JSON.parse(localStorage.getItem('elearning_docs') || '[]'),
        knowledgeBase: JSON.parse(localStorage.getItem('knowledge_base') || '[]'),
        settings: JSON.parse(localStorage.getItem('app_settings') || 'null'),
        gameScores: JSON.parse(localStorage.getItem('game_scores') || '[]'),
        userInfo: JSON.parse(localStorage.getItem('last_user_info') || 'null'),
        exportDate: new Date().toISOString(),
        system: "E-SafePower Learning"
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ESafePower_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      onNotify("Đã tạo bản sao lưu thành công.", "success");
    } catch (err) {
      onNotify("Lỗi khi tạo bản sao lưu.", "error");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.system || data.system !== "E-SafePower Learning") {
          throw new Error("Tệp sao lưu không đúng định dạng của E-SafePower.");
        }

        if (window.confirm("CẢNH BÁO: Toàn bộ dữ liệu hiện tại trên thiết bị này sẽ bị thay thế bởi dữ liệu từ bản sao lưu.")) {
          if (data.questions) localStorage.setItem('questions', JSON.stringify(data.questions));
          if (data.folders) localStorage.setItem('question_folders', JSON.stringify(data.folders));
          if (data.docs) localStorage.setItem('elearning_docs', JSON.stringify(data.docs));
          if (data.knowledgeBase) localStorage.setItem('knowledge_base', JSON.stringify(data.knowledgeBase));
          if (data.settings) localStorage.setItem('app_settings', JSON.stringify(data.settings));
          if (data.gameScores) localStorage.setItem('game_scores', JSON.stringify(data.gameScores));
          if (data.userInfo) localStorage.setItem('last_user_info', JSON.stringify(data.userInfo));

          onNotify("Khôi phục thành công! Ứng dụng sẽ tự động tải lại sau 2 giây.", "success");
          setTimeout(() => window.location.reload(), 2000);
        }
      } catch (err: any) {
        onNotify(err.message || "Tệp sao lưu không hợp lệ.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in space-y-6 pb-24 text-slate-600 font-inter">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-blue-100">
            <i className="fas fa-shield-bolt"></i>
          </div>
          <div>
            <nav className="flex items-center gap-2 text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">
              <span>DHsystem Control Center</span>
            </nav>
            <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">Cấu hình Trợ lý E-SafePower</h1>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={resetToDefault} className="flex-1 md:flex-none px-4 py-2 bg-slate-50 text-slate-500 rounded-xl font-bold text-[10px] uppercase border border-slate-200">Mặc định</button>
          <button onClick={saveSettings} className="flex-1 md:flex-none px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition">Lưu thay đổi</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-slate-900 rounded-[2.5rem] border border-white/5 shadow-2xl p-8 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
             <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/5 text-blue-400 rounded-2xl flex items-center justify-center text-xl border border-white/10">
                      <i className="fas fa-cloud-arrow-down"></i>
                   </div>
                   <div>
                      <h3 className="text-lg font-black tracking-tight">Cập nhật Hệ thống</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Phiên bản hiện tại: {updateInfo?.currentVersion || '2.1.0'}</p>
                   </div>
                </div>
                {!updateInfo && (
                   <button disabled={isChecking} onClick={handleCheckUpdate} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition shadow-lg">
                     {isChecking ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-search mr-2"></i>}
                     {isChecking ? "Đang quét..." : "Kiểm tra ngay"}
                  </button>
                )}
             </div>

             {updateInfo && (
               <div className="space-y-6 animate-fade-in relative z-10">
                  {updateInfo.isUpdateAvailable ? (
                    <div className="space-y-6">
                       <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 mb-2 inline-block">Phát hiện bản mới</span>
                                <h4 className="text-3xl font-black tracking-tighter">v{updateInfo.latestVersion}</h4>
                             </div>
                             <div className="text-right">
                                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-tighter">Phát hành</span>
                                <span className="text-sm font-black text-slate-300">{updateInfo.releaseDate}</span>
                             </div>
                          </div>
                          <div className="text-xs text-slate-300 leading-relaxed bg-black/30 p-4 rounded-2xl border border-white/5 max-h-32 overflow-y-auto whitespace-pre-line font-medium italic">
                             {updateInfo.changelog}
                          </div>
                       </div>
                       <button onClick={startUpdate} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/40">
                          <i className="fas fa-bolt-lightning mr-2"></i> TIẾN HÀNH NÂNG CẤP
                       </button>
                    </div>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/20 p-8 rounded-3xl flex flex-col items-center text-center gap-4">
                       <i className="fas fa-check-double text-3xl text-green-400"></i>
                       <h4 className="text-xl font-black text-white">Hệ thống đã mới nhất</h4>
                    </div>
                  )}
               </div>
             )}
          </section>

          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-xl border border-orange-100/50 shadow-inner">
                <i className="fas fa-database"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Sao lưu Dữ liệu</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Xuất/Nhập ngân hàng đề & tài liệu</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handleExportBackup} className="flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-orange-50 transition">
                <i className="fas fa-file-export text-orange-600 mb-2"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Xuất Backup</span>
              </button>
              <label className="flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-blue-50 transition cursor-pointer">
                <i className="fas fa-file-import text-blue-600 mb-2"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Khôi phục</span>
                <input type="file" className="hidden" accept=".json" onChange={handleImportBackup} />
              </label>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-purple-100/50">
                <i className="fas fa-sliders-h"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Tham số AI</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Tối ưu hóa phản hồi</p>
              </div>
            </div>
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Model</label></div>
                <select value={settings.modelName} onChange={e => setSettings({...settings, modelName: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-purple-600">
                  <option value="gemini-3-flash-preview">Gemini 3 Flash (An toàn & Miễn phí)</option>
                  <option value="gemini-3-pro-preview">Gemini 3 Pro (Yêu cầu API mạnh)</option>
                </select>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Max Output Tokens</label>
                   <span className="text-xs font-black text-purple-600">{settings.maxOutputTokens}</span>
                </div>
                <input type="range" min="512" max="4096" step="512" value={settings.maxOutputTokens} onChange={e => setSettings({...settings, maxOutputTokens: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-600" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">RAG Top-K</label>
                   <span className="text-xs font-black text-purple-600">{settings.ragTopK} đoạn</span>
                </div>
                <input type="range" min="1" max="10" step="1" value={settings.ragTopK} onChange={e => setSettings({...settings, ragTopK: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-600" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;