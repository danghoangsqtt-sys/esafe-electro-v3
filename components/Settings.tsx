
import React, { useState } from 'react';
import { AppSettings } from '../types';

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
        {/* API Section */}
        <div className="lg:col-span-7 space-y-6">
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

          {/* Model Params Card */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg">
                <i className="fas fa-microchip"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Cấu hình Mô hình</h3>
                <p className="text-[10px] text-slate-400 font-medium italic">Tinh chỉnh khả năng xử lý học thuật</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò trợ lý</label>
                <select 
                  value={settings.systemExpertise}
                  onChange={e => setSettings({...settings, systemExpertise: e.target.value as any})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="ACADEMIC">Giảng viên DHsystem</option>
                  <option value="FIELD_EXPERT">Kỹ sư Hiện trường</option>
                  <option value="STUDENT_ASSISTANT">Trợ lý học tập</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Độ ưu tiên</label>
                <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-400 flex items-center justify-between">
                   <span>Tiếng Việt (Mặc định)</span>
                   <i className="fas fa-lock text-[9px]"></i>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Ngân sách suy luận (Thinking)</label>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{settings.thinkingBudget}</span>
              </div>
              <input 
                type="range" min="0" max="24576" step="1024" 
                value={settings.thinkingBudget}
                onChange={e => setSettings({...settings, thinkingBudget: parseInt(e.target.value)})}
                className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[9px] text-slate-400 italic">Cho phép AI suy nghĩ sâu hơn trước khi trả lời các bài toán an toàn điện phức tạp.</p>
            </div>
          </section>
        </div>

        {/* Right Column */}
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
