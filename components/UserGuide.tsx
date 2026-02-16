
import React, { useState } from 'react';

const UserGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'CHAT' | 'DOCS' | 'BANK' | 'GAME' | 'UPDATE'>('OVERVIEW');

  const SectionButton = ({ id, label, icon, color }: { id: any, label: string, icon: string, color: string }) => (
    <button
      onClick={() => setActiveSection(id)}
      className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
        activeSection === id 
          ? `bg-${color}-600 text-white shadow-xl scale-105 z-10` 
          : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
      }`}
    >
      <i className={`fas ${icon} text-lg`}></i>
      {label}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-24 px-6 pt-10">
      <div className="text-center space-y-4">
        <div className="inline-block bg-blue-50 text-blue-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-2 border border-blue-100">
           Trung tâm Hỗ trợ & Vận hành
        </div>
        <h1 className="text-5xl font-black text-gray-900 tracking-tight">Làm chủ Hệ thống LMS Core</h1>
        <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto leading-relaxed">Hướng dẫn chi tiết dành cho cả người dùng cuối và quản trị viên hệ thống.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 relative">
        <SectionButton id="OVERVIEW" label="Tổng quan" icon="fa-th-large" color="blue" />
        <SectionButton id="CHAT" label="Trợ lý AI" icon="fa-robot" color="purple" />
        <SectionButton id="DOCS" label="Tài liệu" icon="fa-book" color="indigo" />
        <SectionButton id="BANK" label="Ngân hàng đề" icon="fa-database" color="teal" />
        <SectionButton id="GAME" label="Trò chơi" icon="fa-gamepad" color="orange" />
        <SectionButton id="UPDATE" label="Quản trị & Cập nhật" icon="fa-code-branch" color="red" />
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-gray-50 overflow-hidden min-h-[600px] flex flex-col">
        {activeSection === 'OVERVIEW' && (
          <div className="p-12 md:p-20 space-y-12 animate-fade-in flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-4xl font-black text-blue-900 leading-tight">Chào mừng bạn đến với kỷ nguyên học tập 4.0</h2>
                    <p className="text-gray-600 text-lg leading-relaxed font-medium">
                      Hệ thống LMS không chỉ là một kho lưu trữ, mà là một thực thể thông minh hỗ trợ đa nhiệm cho việc quản lý học liệu và khảo thí.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex flex-col gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><i className="fas fa-brain"></i></div>
                    <h4 className="font-black text-blue-900 text-sm uppercase">Trí tuệ nhân tạo</h4>
                    <p className="text-xs text-blue-700/70 font-bold leading-relaxed">AI tự học từ giáo trình PDF của bạn để giải đáp mọi thắc mắc chuyên môn.</p>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 flex flex-col gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm"><i className="fas fa-bolt"></i></div>
                    <h4 className="font-black text-purple-900 text-sm uppercase">Tương tác thực</h4>
                    <p className="text-xs text-purple-700/70 font-bold leading-relaxed">Trò chuyện trực tiếp bằng giọng nói với giảng viên AI thông minh.</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-[3rem] p-12 border border-gray-100 relative shadow-inner">
                <h3 className="font-black text-gray-800 mb-8 text-xl uppercase tracking-widest flex items-center gap-3">
                   <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span> Lộ trình bắt đầu
                </h3>
                <ol className="space-y-6">
                  {[
                    "Cấu hình khóa API tại mục 'Cài đặt' để kích hoạt AI.",
                    "Tải giáo trình PDF vào mục 'Tài liệu giáo trình'.",
                    "Nhấn 'Huấn luyện' để AI nạp dữ liệu từ tệp PDF.",
                    "Sử dụng AI Biên soạn đề để tạo câu hỏi tự động.",
                    "Vào mục 'Ôn tập giải trí' để kiểm tra trình độ qua Game."
                  ].map((step, i) => (
                    <li key={i} className="flex gap-6 group">
                      <span className="w-10 h-10 bg-white text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">{i+1}</span>
                      <span className="text-gray-600 text-sm font-bold pt-2">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'UPDATE' && (
          <div className="p-12 md:p-20 space-y-12 animate-fade-in flex-1">
             <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 mb-10">
                <h2 className="text-3xl font-black text-red-900 mb-4 flex items-center gap-4">
                  <i className="fas fa-tools"></i> Trung tâm Quản trị viên
                </h2>
                <p className="text-red-700 font-medium leading-relaxed">Phần này dành cho người phát triển ứng dụng để đóng gói và triển khai các bản cập nhật mới.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
                      <i className="fas fa-box-open text-blue-600"></i> Hướng dẫn đóng gói (.exe)
                   </h3>
                   <div className="space-y-4">
                      {[
                        { t: "Cài đặt môi trường", c: "Cài đặt Node.js và chạy lệnh 'npm install' trong thư mục dự án." },
                        { t: "Cấu hình phiên bản", c: "Sửa số 'version' trong package.json và version.json trước khi build." },
                        { t: "Lệnh Build", c: "Chạy 'npm run build'. File cài đặt sẽ nằm trong thư mục /dist." }
                      ].map((step, i) => (
                        <div key={i} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                           <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Bước {i+1}: {step.t}</p>
                           <p className="text-xs text-gray-500 font-bold">{step.c}</p>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
                      <i className="fas fa-cloud-upload-alt text-green-600"></i> Quy trình cập nhật từ xa
                   </h3>
                   <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-xl">
                      <p className="text-sm text-slate-300 leading-relaxed italic">Hệ thống sử dụng cơ chế so sánh phiên bản qua file <strong>version.json</strong> trên GitHub.</p>
                      <div className="space-y-4">
                         <div className="flex gap-4">
                            <i className="fas fa-check-circle text-green-400 mt-1"></i>
                            <p className="text-xs font-bold">Người dùng sẽ nhận thông báo "Có bản cập nhật mới" ngay khi file version.json trên máy chủ thay đổi.</p>
                         </div>
                         <div className="flex gap-4">
                            <i className="fas fa-check-circle text-green-400 mt-1"></i>
                            <p className="text-xs font-bold">Lịch sử thay đổi (Changelog) sẽ được hiển thị ngay khi ứng dụng khởi động lại.</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeSection === 'CHAT' && <div className="p-12 md:p-20 flex-1 space-y-6 animate-fade-in">
            <h2 className="text-3xl font-black text-slate-900">Sử dụng Trợ lý AI</h2>
            <p className="text-slate-600 leading-relaxed">Trợ lý AI được tích hợp công nghệ Gemini tiên tiến, có khả năng trả lời các câu hỏi chuyên sâu dựa trên tri thức từ giáo trình được tải lên. Bạn có thể sử dụng chế độ chat văn bản hoặc vấn đáp bằng giọng nói.</p>
            <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
                <p className="text-sm text-blue-800 font-bold">Ví dụ câu hỏi: "Tóm tắt chương 1 của giáo trình này?" hoặc "Giải thích khái niệm X có trong bài học."</p>
            </div>
        </div>}
        {activeSection === 'DOCS' && <div className="p-12 md:p-20 flex-1 space-y-6 animate-fade-in">
            <h2 className="text-3xl font-black text-slate-900">Quản lý Tài liệu RAG</h2>
            <p className="text-slate-600 leading-relaxed">Tính năng RAG (Retrieval-Augmented Generation) cho phép AI "đọc" và "nhớ" nội dung từ các tệp PDF. Khi bạn tải một giáo trình lên, AI sẽ băm nhỏ nội dung và lưu trữ dưới dạng vector tri thức để phục vụ việc giải đáp thắc mắc chính xác theo tài liệu gốc.</p>
        </div>}
        {activeSection === 'BANK' && <div className="p-12 md:p-20 flex-1 space-y-6 animate-fade-in">
            <h2 className="text-3xl font-black text-slate-900">Quản lý Ngân hàng đề</h2>
            <p className="text-slate-600 leading-relaxed">Hệ thống cho phép bạn phân loại câu hỏi theo các chủ đề (Folder). Bạn có thể biên soạn câu hỏi thủ công hoặc sử dụng AI để tự động tạo câu hỏi từ giáo trình PDF hiện có.</p>
        </div>}
        {activeSection === 'GAME' && <div className="p-12 md:p-20 flex-1 space-y-6 animate-fade-in">
            <h2 className="text-3xl font-black text-slate-900">Hệ thống Trò chơi học tập</h2>
            <p className="text-slate-600 leading-relaxed">Kiểm tra kiến thức một cách thú vị thông qua các chế độ: Thử thách 60 giây, Ai là triệu phú, hoặc Flashcard ghi nhớ. Điểm số sẽ được ghi nhận như một phần của quá trình thành tích cá nhân.</p>
        </div>}
      </div>
    </div>
  );
};

export default UserGuide;
