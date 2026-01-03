
import React, { useState, useEffect } from 'react';

interface VersionData {
  version: string;
  releaseDate: string;
  changelog: string;
}

const ChangelogModal: React.FC = () => {
  const [data, setData] = useState<VersionData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Lấy file version.json từ thư mục gốc
        const response = await fetch('./version.json');
        if (!response.ok) return;
        
        const json: VersionData = await response.json();
        
        // Kiểm tra xem người dùng đã xem phiên bản này chưa
        const lastSeenVersion = localStorage.getItem('last_seen_version');
        
        if (lastSeenVersion !== json.version) {
          setData(json);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Không thể tải thông tin phiên bản:", error);
      }
    };

    checkVersion();
  }, []);

  const handleClose = () => {
    if (data) {
      // Lưu lại phiên bản đã xem để không hiện lại lần sau
      localStorage.setItem('last_seen_version', data.version);
    }
    setIsOpen(false);
  };

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <i className="fas fa-rocket text-2xl"></i>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Cập nhật hệ thống</span>
            </div>
            <h2 className="text-3xl font-black tracking-tighter">Có gì mới ở v{data.version}?</h2>
            <p className="text-blue-100 text-xs font-bold mt-1 opacity-70">Phát hành ngày: {data.releaseDate}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi tiết thay đổi</h4>
            <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium bg-slate-50 p-6 rounded-3xl border border-slate-100">
              {data.changelog}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-0 flex justify-center">
          <button 
            onClick={handleClose}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-all active:scale-95"
          >
            Tuyệt vời, tôi đã rõ!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;
