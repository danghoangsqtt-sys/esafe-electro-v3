
import React, { useState, useEffect } from 'react';
import { AppSettings, AppVersionInfo } from '../types';
import { checkAppUpdate, summarizeUpdateWithAI } from '../services/updateService';

interface SettingsProps {
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  modelName: 'gemini-3-flash-preview',
  aiVoice: 'Zephyr',
  temperature: 0.7,
  maxOutputTokens: 2048,
  autoSave: true,
  ragTopK: 4,
  thinkingBudget: 0,
  systemExpertise: 'ACADEMIC'
};

const Settings: React.FC<SettingsProps> = ({ onNotify }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [manualKey, setManualKey] = useState(() => localStorage.getItem('manual_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  
  // Update state
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const saveSettings = () => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    localStorage.setItem('manual_api_key', manualKey);
    onNotify("Đã cập nhật cấu hình hệ thống DHsystem.", "success");
  };

  const resetToDefault = () => {
    if (window.confirm("Khôi phục toàn bộ thiết lập về mặc định?")) {
      setSettings(DEFAULT_SETTINGS);
      setManualKey('');
      localStorage.removeItem('manual_api_key');
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
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => {
          onNotify("Tải về hoàn tất! Ứng dụng sẽ khởi động lại.", "success");
          // Giả lập relaunch trong Electron
          window.location.reload();
        }, 1000);
      }
      setDownloadProgress(Math.floor(p));
    }, 400);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in space-y-6 pb-24 text-slate-600 font-inter">
      {/* Brand Header */}
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
          <button 
            onClick={resetToDefault} 
            className="flex-1 md:flex-none px-4 py-2 bg-slate-50 text-slate-500 rounded-xl font-bold text-[10px] uppercase hover:bg-slate-100 transition border border-slate-200"
          >
            Mặc định
          </button>
          <button 
            onClick={saveSettings} 
            className="flex-1 md:flex-none px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition active:scale-95"
          >
            Lưu thay đổi
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: API & Models */}
        <div className="lg:col-span-7 space-y-6">
          {/* API Section */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg">
                <i className="fas fa-fingerprint"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Bảo mật API Gemini</h3>
                <p className="text-[10px] text-slate-400 font-medium italic">Khóa định danh cá nhân dành cho DHsystem AI</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input 
                  type={showKey ? "text" : "password"}
                  value={manualKey}
                  onChange={e => setManualKey(e.target.value)}
                  placeholder="Nhập khóa định danh (Vd: AIzaSy...)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all pr-12"
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition p-1"
                >
                  <i className={`fas ${showKey ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                </button>
              </div>
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${manualKey ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-amber-400'}`}></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {manualKey ? 'DHSYSTEM AUTHENTICATED' : 'SỬ DỤNG KHÓA HỆ THỐNG'}
                  </span>
                </div>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 text-[10px] font-black hover:underline uppercase tracking-tighter">Lấy khóa mới <i className="fas fa-external-link-alt ml-1"></i></a>
              </div>
            </div>
          </section>

          {/* Remote Update Section (New) */}
          <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/5 shadow-2xl p-6 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white/10 text-blue-400 rounded-xl flex items-center justify-center text-lg">
                      <i className="fas fa-cloud-arrow-down"></i>
                   </div>
                   <div>
                      <h3 className="text-sm font-bold">Cập nhật Hệ thống</h3>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Git-based Update Engine</p>
                   </div>
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400">
                    v2.1.0
                </div>
             </div>

             {!updateInfo ? (
               <div className="flex flex-col items-center py-4">
                  <button 
                    disabled={isChecking}
                    onClick={handleCheckUpdate}
                    className="group relative px-8 py-3 bg-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all disabled:opacity-50"
                  >
                     {isChecking ? <i className="fas fa-sync fa-spin mr-2"></i> : <i className="fas fa-search mr-2"></i>}
                     {isChecking ? "Đang kiểm tra..." : "Kiểm tra cập nhật"}
                  </button>
                  <p className="mt-3 text-[9px] text-slate-500 italic">Kiểm tra phiên bản mới từ kho lưu trữ Git của DHsystem</p>
               </div>
             ) : (
               <div className="space-y-4 animate-fade-in">
                  {updateInfo.isUpdateAvailable ? (
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                       <div className="flex justify-between items-center mb-4">
                          <div>
                             <span className="text-[10px] font-black text-blue-400 uppercase">Phiên bản mới khả dụng</span>
                             <h4 className="text-xl font-black">v{updateInfo.latestVersion}</h4>
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold">{updateInfo.releaseDate}</span>
                       </div>
                       
                       <div className="text-[11px] text-slate-300 leading-relaxed mb-6 whitespace-pre-line p-3 bg-black/20 rounded-xl border border-white/5">
                          {updateInfo.changelog}
                       </div>

                       {isDownloading ? (
                         <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase">
                               <span>Đang tải gói cập nhật...</span>
                               <span>{downloadProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                               <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                            </div>
                         </div>
                       ) : (
                         <button 
                            onClick={startUpdate}
                            className="w-full py-3 bg-green-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-500 transition-all shadow-lg"
                         >
                            Nâng cấp ngay
                         </button>
                       )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 py-4 text-green-400">
                       <i className="fas fa-check-circle text-xl"></i>
                       <span className="text-xs font-bold">Bạn đang sử dụng phiên bản mới nhất.</span>
                       <button onClick={() => setUpdateInfo(null)} className="text-[9px] text-slate-500 uppercase font-black ml-4 hover:text-white">Kiểm tra lại</button>
                    </div>
                  )}
               </div>
             )}
          </section>
        </div>

        {/* Right Column: AI Sliders */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-lg">
                <i className="fas fa-sliders-h"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Phản hồi AI</h3>
                <p className="text-[10px] text-slate-400 font-medium italic">Kiểm soát hành vi chatbot</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Độ sáng tạo</label>
                  <span className="text-xs font-black text-purple-600">{settings.temperature}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={settings.temperature}
                  onChange={e => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                  className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Độ dài câu trả lời</label>
                  <span className="text-xs font-black text-purple-600">{settings.maxOutputTokens}</span>
                </div>
                <input 
                  type="range" min="512" max="8192" step="512" 
                  value={settings.maxOutputTokens}
                  onChange={e => setSettings({...settings, maxOutputTokens: parseInt(e.target.value)})}
                  className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tham chiếu tri thức</label>
                  <span className="text-xs font-black text-purple-600">{settings.ragTopK} đoạn</span>
                </div>
                <input 
                  type="range" min="1" max="10" step="1" 
                  value={settings.ragTopK}
                  onChange={e => setSettings({...settings, ragTopK: parseInt(e.target.value)})}
                  className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50">
               <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-2">
                     <i className="fas fa-cloud-upload-alt text-slate-400 text-xs"></i>
                     <span className="text-[10px] font-bold text-slate-600 uppercase">Tự động sao lưu</span>
                  </div>
                  <button 
                    onClick={() => setSettings({...settings, autoSave: !settings.autoSave})}
                    className={`w-8 h-4 rounded-full transition-all relative ${settings.autoSave ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                     <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.autoSave ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
               </div>
            </div>
          </section>
        </div>

        {/* Footer Disclaimer */}
        <footer className="col-span-full p-5 bg-blue-50/50 rounded-3xl border border-dashed border-blue-200 flex items-start gap-4">
           <div className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center text-lg shadow-sm shrink-0 border border-blue-100">
              <i className="fas fa-lock"></i>
           </div>
           <div>
              <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Quyền riêng tư & Bảo mật DHSYSTEM</h4>
              <p className="text-[10px] text-blue-800/70 leading-relaxed font-medium">
                 E-SafePower cam kết dữ liệu của bạn là của bạn. Toàn bộ API Key và tài liệu PDF được mã hóa và lưu trữ cục bộ tại trình duyệt. Chúng tôi không thu thập thông tin cá nhân hay lưu trữ tri thức của bạn trên máy chủ bên ngoài.
              </p>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default Settings;
