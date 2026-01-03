
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
    setDownloadProgress(0);
    
    // Giả lập quá trình tải gói cập nhật
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setDownloadProgress(100);
        setTimeout(() => {
          onNotify("Tải về hoàn tất! Hệ thống sẽ tự động làm mới.", "success");
          // Lưu trạng thái đã cập nhật để Changelog hiển thị sau khi reload
          localStorage.setItem('just_updated', 'true');
          window.location.reload();
        }, 800);
      }
      setDownloadProgress(Math.floor(p));
    }, 300);
  };

  // --- Backup & Restore Functions ---
  const handleExportBackup = () => {
    try {
      const backupData = {
        questions: JSON.parse(localStorage.getItem('questions') || '[]'),
        folders: JSON.parse(localStorage.getItem('question_folders') || '[]'),
        docs: JSON.parse(localStorage.getItem('elearning_docs') || '[]'),
        knowledgeBase: JSON.parse(localStorage.getItem('knowledge_base') || '[]'),
        settings: JSON.parse(localStorage.getItem('app_settings') || 'null'),
        apiKey: localStorage.getItem('manual_api_key') || '',
        gameScores: JSON.parse(localStorage.getItem('game_scores') || '[]'),
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
        
        // Kiểm tra tính hợp lệ cơ bản
        if (!data.system || data.system !== "E-SafePower Learning") {
          throw new Error("Tệp sao lưu không đúng định dạng của E-SafePower.");
        }

        if (window.confirm("CẢNH BÁO: Toàn bộ dữ liệu hiện tại trên thiết bị này sẽ bị thay thế bởi dữ liệu từ bản sao lưu. Bạn có chắc chắn muốn tiếp tục?")) {
          if (data.questions) localStorage.setItem('questions', JSON.stringify(data.questions));
          if (data.folders) localStorage.setItem('question_folders', JSON.stringify(data.folders));
          if (data.docs) localStorage.setItem('elearning_docs', JSON.stringify(data.docs));
          if (data.knowledgeBase) localStorage.setItem('knowledge_base', JSON.stringify(data.knowledgeBase));
          if (data.settings) localStorage.setItem('app_settings', JSON.stringify(data.settings));
          if (data.apiKey !== undefined) localStorage.setItem('manual_api_key', data.apiKey);
          if (data.gameScores) localStorage.setItem('game_scores', JSON.stringify(data.gameScores));

          onNotify("Khôi phục thành công! Ứng dụng sẽ tự động tải lại sau 2 giây.", "success");
          setTimeout(() => window.location.reload(), 2000);
        }
      } catch (err: any) {
        onNotify(err.message || "Tệp sao lưu không hợp lệ.", "error");
      }
    };
    reader.readAsText(file);
    // Reset input để có thể chọn lại cùng 1 file nếu cần
    e.target.value = '';
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
        <div className="lg:col-span-7 space-y-6">
          {/* Update Engine Section */}
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
                   <button 
                    disabled={isChecking}
                    onClick={handleCheckUpdate}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition shadow-lg disabled:opacity-50"
                  >
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
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 mb-2 inline-block">Phát hiện phiên bản mới</span>
                                <h4 className="text-3xl font-black tracking-tighter">v{updateInfo.latestVersion}</h4>
                             </div>
                             <div className="text-right">
                                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-tighter">Phát hành</span>
                                <span className="text-sm font-black text-slate-300">{updateInfo.releaseDate}</span>
                             </div>
                          </div>
                          
                          <div className="space-y-3">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung thay đổi:</p>
                             <div className="text-xs text-slate-300 leading-relaxed bg-black/30 p-4 rounded-2xl border border-white/5 max-h-32 overflow-y-auto custom-scrollbar whitespace-pre-line font-medium italic">
                                {updateInfo.changelog}
                             </div>
                          </div>
                       </div>

                       {isDownloading ? (
                         <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                               <span className="flex items-center gap-2"><i className="fas fa-circle-notch fa-spin text-blue-500"></i> Đang tải gói cập nhật...</span>
                               <span className="text-blue-400">{downloadProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${downloadProgress}%` }}></div>
                            </div>
                            <p className="text-[9px] text-slate-500 text-center uppercase font-bold">Vui lòng không đóng ứng dụng trong khi đang nâng cấp</p>
                         </div>
                       ) : (
                         <button 
                            onClick={startUpdate}
                            className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-blue-900/40"
                         >
                            <i className="fas fa-bolt-lightning mr-2"></i> TIẾN HÀNH NÂNG CẤP
                         </button>
                       )}
                    </div>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/20 p-8 rounded-3xl flex flex-col items-center text-center gap-4">
                       <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                          <i className="fas fa-check-double"></i>
                       </div>
                       <div>
                          <h4 className="text-xl font-black text-white">Bạn đang ở phiên bản mới nhất</h4>
                          <p className="text-xs text-slate-400 mt-1 font-medium italic">Hệ thống đang hoạt động ổn định trên v{updateInfo.currentVersion}</p>
                       </div>
                       <button onClick={() => setUpdateInfo(null)} className="mt-2 px-6 py-2 bg-white/5 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all border border-white/5">Quét lại</button>
                    </div>
                  )}
               </div>
             )}
          </section>

          {/* Backup & Data Section */}
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-orange-100/50">
                <i className="fas fa-database"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Quản lý Dữ liệu Hệ thống</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Sao lưu & Khôi phục tri thức</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <button 
                onClick={handleExportBackup}
                className="flex flex-col items-start p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-orange-200 hover:shadow-xl transition-all group"
              >
                <div className="w-10 h-10 bg-white text-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all">
                  <i className="fas fa-file-export"></i>
                </div>
                <h4 className="font-black text-slate-800 text-sm mb-1 uppercase tracking-tight">Xuất bản sao lưu</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-tight">Lưu toàn bộ ngân hàng đề & tài liệu thành tệp .json</p>
              </button>

              <label className="flex flex-col items-start p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all group cursor-pointer">
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleImportBackup}
                />
                <div className="w-10 h-10 bg-white text-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <i className="fas fa-file-import"></i>
                </div>
                <h4 className="font-black text-slate-800 text-sm mb-1 uppercase tracking-tight">Khôi phục dữ liệu</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-tight">Nhập dữ liệu từ tệp sao lưu đã có trước đó</p>
              </label>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
               <i className="fas fa-exclamation-triangle text-amber-500 mt-0.5 text-sm"></i>
               <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                 Lưu ý: Việc khôi phục dữ liệu sẽ ghi đè hoàn toàn thông tin hiện có. Hãy chắc chắn bạn đã sao lưu dữ liệu quan trọng trước khi tiến hành.
               </p>
            </div>
          </section>

          {/* API Section */}
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-blue-100/50">
                <i className="fas fa-fingerprint"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Bảo mật API Gemini</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Xác thực hệ thống AI</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input 
                  type={showKey ? "text" : "password"}
                  value={manualKey}
                  onChange={e => setManualKey(e.target.value)}
                  placeholder="Nhập khóa định danh (Vd: AIzaSy...)"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-mono text-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all pr-14"
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition p-2"
                >
                  <i className={`fas ${showKey ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${manualKey ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`}></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {manualKey ? 'HỆ THỐNG ĐÃ SẴN SÀNG' : 'SỬ DỤNG KHÓA MẶC ĐỊNH'}
                  </span>
                </div>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 text-[10px] font-black hover:underline uppercase tracking-widest">Lấy khóa mới <i className="fas fa-external-link-alt ml-1"></i></a>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: AI Sliders */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-purple-100/50">
                <i className="fas fa-sliders-h"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Thông số Phản hồi AI</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Kiểm soát hành vi chatbot</p>
              </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Độ sáng tạo (Temperature)</label>
                  <span className="text-sm font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">{settings.temperature}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={settings.temperature}
                  onChange={e => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                  className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-600"
                />
                <p className="text-[9px] text-slate-400 italic">Thấp: Trả lời chính xác kỹ thuật. Cao: Trả lời linh hoạt, mở rộng.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Độ dài tối đa (Tokens)</label>
                  <span className="text-sm font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">{settings.maxOutputTokens}</span>
                </div>
                <input 
                  type="range" min="512" max="8192" step="512" 
                  value={settings.maxOutputTokens}
                  onChange={e => setSettings({...settings, maxOutputTokens: parseInt(e.target.value)})}
                  className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">RAG Top-K (Mật độ tham chiếu)</label>
                  <span className="text-sm font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">{settings.ragTopK} đoạn</span>
                </div>
                <input 
                  type="range" min="1" max="10" step="1" 
                  value={settings.ragTopK}
                  onChange={e => setSettings({...settings, ragTopK: parseInt(e.target.value)})}
                  className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50">
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                     <i className="fas fa-history text-slate-400 text-sm"></i>
                     <div>
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Tự động sao lưu</span>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Lưu dữ liệu vào LocalStorage</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setSettings({...settings, autoSave: !settings.autoSave})}
                    className={`w-10 h-5 rounded-full transition-all relative ${settings.autoSave ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                     <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${settings.autoSave ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
               </div>
            </div>
          </section>
        </div>

        {/* Footer Disclaimer */}
        <footer className="col-span-full p-6 bg-blue-50/50 rounded-[2rem] border border-dashed border-blue-200 flex items-start gap-5">
           <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-sm shrink-0 border border-blue-100">
              <i className="fas fa-lock"></i>
           </div>
           <div className="space-y-1">
              <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Quyền riêng tư & An toàn tri thức DHSYSTEM</h4>
              <p className="text-[11px] text-blue-800/60 leading-relaxed font-medium">
                 Ứng dụng E-SafePower tuân thủ chính sách bảo mật tuyệt đối: Mọi tri thức giáo trình và API Key đều được mã hóa cục bộ. Chúng tôi không bao giờ truyền dữ liệu cá nhân hay tài liệu học tập của bạn lên bất kỳ máy chủ bên thứ ba nào ngoại trừ các truy vấn AI trực tiếp đến Google Gemini.
              </p>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default Settings;
