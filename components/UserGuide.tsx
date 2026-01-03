
import React, { useState } from 'react';

const UserGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'CHAT' | 'DOCS' | 'BANK' | 'GAME' | 'API'>('OVERVIEW');

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
           Trung tâm Hỗ trợ Người dùng
        </div>
        <h1 className="text-5xl font-black text-gray-900 tracking-tight">Làm chủ hệ thống E-SafePower</h1>
        <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto leading-relaxed">Khám phá cách thức vận hành của nền tảng học tập thông minh tích hợp trí tuệ nhân tạo thế hệ mới.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap justify-center gap-3 relative">
        <SectionButton id="OVERVIEW" label="Tổng quan" icon="fa-th-large" color="blue" />
        <SectionButton id="CHAT" label="Trợ lý AI" icon="fa-robot" color="purple" />
        <SectionButton id="DOCS" label="Tài liệu" icon="fa-book" color="indigo" />
        <SectionButton id="BANK" label="Ngân hàng đề" icon="fa-database" color="teal" />
        <SectionButton id="GAME" label="Trò chơi" icon="fa-gamepad" color="orange" />
        <SectionButton id="API" label="Cấu hình API" icon="fa-key" color="slate" />
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-gray-50 overflow-hidden min-h-[600px] flex flex-col">
        {activeSection === 'OVERVIEW' && (
          <div className="p-12 md:p-20 space-y-12 animate-fade-in flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-4xl font-black text-blue-900 leading-tight">Chào mừng bạn đến với kỷ nguyên học tập 4.0</h2>
                    <p className="text-gray-600 text-lg leading-relaxed font-medium">
                      E-SafePower không chỉ là một kho lưu trữ, mà là một thực thể thông minh chuyên sâu cho môn học <strong>Nguồn điện an toàn và môi trường</strong>. 
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
                    <p className="text-xs text-purple-700/70 font-bold leading-relaxed">Trò chuyện trực tiếp bằng giọng nói với giảng viên AI kịch bản hóa.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-[3rem] p-12 border border-gray-100 relative shadow-inner">
                <div className="absolute top-0 right-0 p-8 text-gray-200 text-6xl font-black rotate-12 opacity-20"><i className="fas fa-rocket"></i></div>
                <h3 className="font-black text-gray-800 mb-8 text-xl uppercase tracking-widest flex items-center gap-3">
                   <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span> Lộ trình bắt đầu
                </h3>
                <ol className="space-y-6">
                  {[
                    "Cấu hình khóa API tại mục 'Cài đặt' để kích hoạt AI.",
                    "Tải giáo trình PDF vào mục 'Tài liệu giáo trình'.",
                    "Nhấn 'Huấn luyện' để AI nạp dữ liệu từ tệp PDF.",
                    "Sử dụng AI Biên soạn đề để tạo câu hỏi từ PDF.",
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

        {activeSection === 'CHAT' && (
          <div className="p-12 md:p-20 space-y-12 animate-fade-in flex-1">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-black text-purple-900 mb-4">Trợ lý AI Đa phương thức</h2>
              <p className="text-gray-500 text-lg font-medium">Hệ thống hỗ trợ RAG (Retrieval-Augmented Generation) tiên tiến nhất 2026.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="group bg-white p-10 rounded-[3rem] border border-gray-100 shadow-lg hover:border-purple-300 transition-all flex flex-col h-full">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-[1.5rem] flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">
                   <i className="fas fa-comment-dots"></i>
                </div>
                <h3 className="font-black text-purple-900 text-xl mb-4">Hỏi đáp Văn bản</h3>
                <ul className="space-y-4 text-sm text-gray-600 font-bold flex-1">
                  <li className="flex gap-3 items-start"><i className="fas fa-check-circle text-purple-500 mt-1"></i> Trả lời chính xác dựa trên tài liệu bạn đã tải lên.</li>
                  <li className="flex gap-3 items-start"><i className="fas fa-check-circle text-purple-500 mt-1"></i> Tự động hiển thị công thức vật lý/điện bằng LaTeX đẹp mắt.</li>
                  <li className="flex gap-3 items-start"><i className="fas fa-check-circle text-purple-500 mt-1"></i> Tích hợp Google Search khi cần thông tin thời sự mới nhất.</li>
                </ul>
              </div>

              <div className="group bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl hover:bg-slate-800 transition-all flex flex-col h-full">
                <div className="w-16 h-16 bg-white/10 text-white rounded-[1.5rem] flex items-center justify-center text-3xl mb-8 group-hover:animate-pulse">
                   <i className="fas fa-headset"></i>
                </div>
                <h3 className="font-black text-white text-xl mb-4">Giảng viên AI (Live Chat)</h3>
                <ul className="space-y-4 text-sm text-slate-300 font-bold flex-1">
                  <li className="flex gap-3 items-start"><i className="fas fa-bolt text-yellow-400 mt-1"></i> Đàm thoại thời gian thực với độ trễ cực thấp.</li>
                  <li className="flex gap-3 items-start"><i className="fas fa-bolt text-yellow-400 mt-1"></i> Hỗ trợ nhận diện giọng nói tiếng Việt chuẩn xác.</li>
                  <li className="flex gap-3 items-start"><i className="fas fa-bolt text-yellow-400 mt-1"></i> Cá nhân hóa giọng nói giảng viên trong phần Cài đặt.</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-8 rounded-[2.5rem] border border-yellow-100 flex items-start gap-6">
                <div className="w-12 h-12 bg-yellow-400 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-yellow-200"><i className="fas fa-lightbulb"></i></div>
                <div>
                   <h4 className="font-black text-yellow-900 mb-1">Mẹo nhỏ cho kết quả tốt nhất:</h4>
                   <p className="text-sm text-yellow-700 font-medium">Hãy thử câu lệnh: "Dựa trên Chương 2 của giáo trình, hãy liệt kê các biện pháp an toàn khi vận hành máy biến áp." AI sẽ trích dẫn chính xác nội dung từ file PDF của bạn.</p>
                </div>
            </div>
          </div>
        )}

        {activeSection === 'DOCS' && (
          <div className="p-12 md:p-20 space-y-16 animate-fade-in flex-1">
            <h2 className="text-4xl font-black text-indigo-900">Thư viện Tri thức Số hóa</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               <div className="space-y-4">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-sm">1</div>
                  <h4 className="font-black text-gray-800 uppercase tracking-widest text-sm">Tải lên tài liệu</h4>
                  <p className="text-gray-500 text-xs font-bold leading-relaxed">Chấp nhận định dạng <strong>.PDF</strong> (văn bản hoặc hình ảnh đều được AI nhận diện OCR).</p>
               </div>
               <div className="space-y-4">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-sm">2</div>
                  <h4 className="font-black text-gray-800 uppercase tracking-widest text-sm">Huấn luyện AI</h4>
                  <p className="text-gray-500 text-xs font-bold leading-relaxed">Nhấn nút <strong>Học</strong> trên từng file để AI bóc tách kiến thức vào bộ nhớ vector của nó.</p>
               </div>
               <div className="space-y-4">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-sm">3</div>
                  <h4 className="font-black text-gray-800 uppercase tracking-widest text-sm">Tra cứu trực quan</h4>
                  <p className="text-gray-500 text-xs font-bold leading-relaxed">Trình xem PDF tích hợp hỗ trợ phóng to, xoay và đánh dấu trang chuyên nghiệp.</p>
               </div>
            </div>

            <div className="bg-indigo-900 p-12 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl">
               <div className="flex-1 space-y-4">
                  <h3 className="text-2xl font-black">Tại sao cần huấn luyện?</h3>
                  <p className="text-indigo-100 text-sm font-medium leading-relaxed">Khi bạn tải một file lên, AI mới chỉ thấy nó là một đối tượng. Việc "Huấn luyện" (Embedding) giúp AI hiểu từng dòng văn bản, từ đó có thể trả lời câu hỏi của bạn với độ chính xác tuyệt đối theo đúng giáo trình môn học.</p>
               </div>
               <div className="w-32 h-32 bg-white/10 rounded-[2.5rem] flex items-center justify-center text-5xl backdrop-blur-md border border-white/10"><i className="fas fa-microchip"></i></div>
            </div>
          </div>
        )}

        {activeSection === 'BANK' && (
          <div className="p-12 md:p-20 space-y-12 animate-fade-in flex-1">
            <h2 className="text-4xl font-black text-teal-900">Quản lý Ngân hàng Đề thi</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><i className="fas fa-magic"></i></div>
                    <h4 className="font-black text-teal-900 uppercase text-sm">Biên soạn bằng AI</h4>
                  </div>
                  <p className="text-xs text-gray-500 font-bold leading-relaxed">Sử dụng sức mạnh của Gemini 3 Pro để tự động quét nội dung PDF và tạo ra các câu hỏi trắc nghiệm hoặc tự luận theo đúng chuẩn ma trận Bloom (6 mức độ nhận thức).</p>
               </div>
               
               <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><i className="fas fa-file-import"></i></div>
                    <h4 className="font-black text-blue-900 uppercase text-sm">Nhập tệp Thông minh</h4>
                  </div>
                  <p className="text-xs text-gray-500 font-bold leading-relaxed">Hệ thống hỗ trợ nhập hàng loạt câu hỏi từ tệp văn bản <strong>.TXT</strong> với định dạng tối giản, giúp bạn tiết kiệm thời gian nhập liệu thủ công.</p>
               </div>
            </div>

            <div className="bg-teal-50 p-10 rounded-[3rem] border border-teal-100">
               <h3 className="font-black mb-6 text-teal-900 flex items-center gap-3">
                 <i className="fas fa-sigma"></i> Quy tắc soạn thảo công thức
               </h3>
               <p className="text-sm text-teal-800 font-medium mb-6">Để công thức hiển thị chuẩn LaTeX, hãy luôn bao quanh công thức bằng ký tự <code>$</code>. Ví dụ:</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-teal-200">
                      <p className="text-[10px] text-gray-400 font-black uppercase mb-2">Cách nhập</p>
                      <code className="text-teal-600 font-bold">Tính điện áp $U = I \times R$</code>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-teal-200">
                      <p className="text-[10px] text-gray-400 font-black uppercase mb-2">Kết quả hiển thị</p>
                      <p className="text-gray-800 font-bold italic">Tính điện áp $U = I \times R$</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeSection === 'GAME' && (
          <div className="p-12 md:p-20 space-y-16 animate-fade-in flex-1">
            <h2 className="text-4xl font-black text-orange-900 text-center">Ôn tập qua Gamification</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="group bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl hover:-translate-y-2 transition-all flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-[2rem] flex items-center justify-center text-4xl mb-8 shadow-2xl group-hover:rotate-6 transition-transform">
                      <i className="fas fa-trophy"></i>
                  </div>
                  <h3 className="text-2xl font-black text-blue-900 mb-4 uppercase tracking-tight">Ai Là Triệu Phú</h3>
                  <p className="text-sm text-gray-500 font-bold leading-relaxed mb-6">Mô phỏng 15 câu hỏi kịch tính với âm thanh và các quyền trợ giúp: 50/50, Gọi người thân AI, Hỏi khán giả.</p>
                  <div className="mt-auto flex gap-2">
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black">15 CÂU HỎI</span>
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black">TRẮC NGHIỆM</span>
                  </div>
               </div>

               <div className="group bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl hover:-translate-y-2 transition-all flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-[2rem] flex items-center justify-center text-4xl mb-8 shadow-2xl group-hover:-rotate-6 transition-transform">
                      <i className="fas fa-headset"></i>
                  </div>
                  <h3 className="text-2xl font-black text-purple-900 mb-4 uppercase tracking-tight">Vấn Đáp Thông Minh</h3>
                  <p className="text-sm text-gray-500 font-bold leading-relaxed mb-6">Giám khảo AI trực tiếp đọc đề bài tự luận. Bạn trả lời bằng giọng nói và nhận điểm số cùng nhận xét chi tiết ngay lập tức.</p>
                  <div className="mt-auto flex gap-2">
                    <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[10px] font-black">CHẤM AI</span>
                    <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[10px] font-black">GIỌNG NÓI</span>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeSection === 'API' && (
          <div className="p-12 md:p-20 space-y-12 animate-fade-in flex-1">
            <h2 className="text-4xl font-black text-slate-800">Cấu hình Khóa API Gemini</h2>
            
            <div className="bg-slate-50 border-l-8 border-slate-500 p-10 rounded-r-[3rem] mb-8 shadow-sm">
              <h3 className="font-black text-slate-900 mb-4 text-xl">API Key là linh hồn của hệ thống</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                Để ứng dụng có thể kết nối với trí tuệ nhân tạo của Google, bạn cần cung cấp một "chìa khóa" định danh. 
                Hãy làm theo các bước bảo mật bên dưới để bắt đầu.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <div className="flex gap-6">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg">1</div>
                    <div>
                      <h4 className="font-black text-gray-800 mb-2">Truy cập AI Studio</h4>
                      <p className="text-sm text-gray-500 font-bold mb-4">Mở trang quản lý khóa chính thức của Google:</p>
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                        Mở Google AI Studio <i className="fas fa-external-link-alt"></i>
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg">2</div>
                    <div>
                      <h4 className="font-black text-gray-800 mb-2">Tạo khóa trong dự án mới</h4>
                      <p className="text-sm text-gray-500 font-bold">Nhấn nút <strong>Create API Key in new project</strong> và sao chép (copy) dãy mã hiển thị.</p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg">3</div>
                    <div>
                      <h4 className="font-black text-gray-800 mb-2">Dán vào Cài đặt</h4>
                      <p className="text-sm text-gray-500 font-bold">Quay lại mục <strong>Cài đặt</strong> trên thanh menu bên trái, nhấn <strong>Thay đổi khóa API</strong> và dán mã vào bảng hiện ra.</p>
                    </div>
                  </div>
               </div>

               <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                  <h4 className="font-black text-xl flex items-center gap-3"><i className="fas fa-shield-alt text-blue-400"></i> Chính sách bảo mật</h4>
                  <p className="text-slate-400 text-xs font-bold leading-relaxed italic">
                    Khóa API của bạn được lưu trữ hoàn toàn trên trình duyệt của bạn (Local Storage). Chúng tôi tuyệt đối không gửi mã này về bất kỳ máy chủ trung gian nào ngoài Google Gemini API.
                  </p>
                  <div className="pt-4 space-y-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                      <i className="fas fa-check text-green-500"></i> Không lưu trên Server
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                      <i className="fas fa-check text-green-500"></i> Mã hóa cục bộ
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                      <i className="fas fa-check text-green-500"></i> Xóa bất cứ lúc nào
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center p-10 bg-gray-100/50 rounded-[3rem] border border-dashed border-gray-200">
        <p className="text-xs text-gray-400 font-black uppercase tracking-widest">Hỗ trợ kỹ thuật 24/7</p>
        <p className="text-sm text-gray-600 font-bold mt-2">Mọi thắc mắc vui lòng liên hệ: thedreamneverend@gmail.com</p>
      </div>
    </div>
  );
};

export default UserGuide;
