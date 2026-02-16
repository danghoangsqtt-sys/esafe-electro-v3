
import React, { useState, useEffect } from 'react';
import { Question, QuestionType } from '../types';
import { formatContent } from '../utils/textFormatter';

interface ExamCreatorProps {
  questions: Question[];
  onBack: () => void;
}

interface ExamConfig {
  school: string;
  department: string;
  subject: string;
  examName: string;
  examCode: string;
  time: string;
  semester: string;
  year: string;
  organizer: string;
}

const ExamCreator: React.FC<ExamCreatorProps> = ({ questions, onBack }) => {
  const [examConfig, setExamConfig] = useState<ExamConfig>({
    school: 'ĐẠI HỌC BÁCH KHOA',
    department: 'KHOA ĐIỆN - ĐIỆN TỬ',
    subject: 'NGUỒN ĐIỆN AN TOÀN VÀ MÔI TRƯỜNG',
    examName: 'KIỂM TRA GIỮA KỲ',
    examCode: '101',
    time: '60',
    semester: 'Học kỳ II',
    year: '2025 - 2026',
    organizer: 'BỘ GIÁO DỤC VÀ ĐÀO TẠO'
  });

  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([...questions]);

  // Fisher-Yates Shuffle Algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const handleShuffle = () => {
    let qList = shuffleArray(questions);
    qList = qList.map(q => {
      if (q.type === QuestionType.MULTIPLE_CHOICE && q.options) {
        return { ...q, options: shuffleArray(q.options) };
      }
      return q;
    });
    setShuffledQuestions(qList);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto print:bg-white print:overflow-visible custom-scrollbar font-inter">
      {/* Configuration Panel - Hidden during print */}
      <div className="max-w-6xl mx-auto p-8 print:hidden">
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 mb-12 animate-fade-in-up">
           <header className="flex justify-between items-center mb-10 border-b border-slate-100 pb-8">
              <div>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tight">Cấu hình Đề thi chuẩn</h2>
                 <p className="text-slate-500 font-medium italic mt-1">Xuất bản đề thi theo định dạng A4 chuẩn Bộ Giáo dục & Đào tạo</p>
              </div>
              <button onClick={onBack} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2">
                 <i className="fas fa-arrow-left"></i> Quay lại ngân hàng
              </button>
           </header>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <div className="space-y-5">
                 <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Thông tin cơ quan</h4>
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cơ quan chủ quản</label>
                       <input type="text" value={examConfig.organizer} onChange={e => setExamConfig({...examConfig, organizer: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tên Trường</label>
                       <input type="text" value={examConfig.school} onChange={e => setExamConfig({...examConfig, school: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Khoa / Tổ bộ môn</label>
                       <input type="text" value={examConfig.department} onChange={e => setExamConfig({...examConfig, department: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                 </div>
              </div>

              <div className="space-y-5">
                 <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest border-l-4 border-purple-600 pl-3">Thông tin học thuật</h4>
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Môn học / Học phần</label>
                       <input type="text" value={examConfig.subject} onChange={e => setExamConfig({...examConfig, subject: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Học kỳ</label>
                          <input type="text" value={examConfig.semester} onChange={e => setExamConfig({...examConfig, semester: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Năm học</label>
                          <input type="text" value={examConfig.year} onChange={e => setExamConfig({...examConfig, year: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tên bài thi</label>
                       <input type="text" value={examConfig.examName} onChange={e => setExamConfig({...examConfig, examName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                 </div>
              </div>

              <div className="space-y-5">
                 <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest border-l-4 border-orange-600 pl-3">Mã định danh</h4>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mã đề thi</label>
                          <input type="text" value={examConfig.examCode} onChange={e => setExamConfig({...examConfig, examCode: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TG Làm bài (P)</label>
                          <input type="number" value={examConfig.time} onChange={e => setExamConfig({...examConfig, time: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                       </div>
                    </div>
                    <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 flex flex-col gap-2">
                       <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Tóm tắt dữ liệu</div>
                       <p className="text-xs font-bold text-orange-800 leading-none">Tổng số câu hỏi: <span className="text-lg">{questions.length}</span></p>
                       <p className="text-[10px] text-orange-700 italic">Mẹo: Nhấn 'Trộn đề' để thay đổi thứ tự câu và đáp án liên tục.</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex flex-col md:flex-row gap-4">
              <button 
                onClick={handleShuffle} 
                className="flex-1 bg-white border-2 border-slate-200 text-slate-600 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-sm hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                 <i className="fas fa-random text-lg"></i> Trộn ngẫu nhiên câu hỏi & Đáp án
              </button>
              <button 
                onClick={handlePrint} 
                className="flex-1 bg-slate-900 text-white py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                 <i className="fas fa-print text-lg"></i> XUẤT BẢN ĐỀ THI (PDF/IN)
              </button>
           </div>
        </div>
      </div>

      {/* PRINT LAYOUT - A4 FORMAT */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white p-[20mm] text-black font-serif shadow-2xl print:shadow-none print:m-0 print:p-[15mm] mb-20 animate-fade-in-up">
         
         {/* EXAM HEADER SECTION */}
         <div className="flex justify-between items-start mb-10 w-full">
            <div className="text-center w-[45%] flex flex-col items-center">
               <h4 className="text-[11px] font-bold uppercase leading-tight">{examConfig.organizer}</h4>
               <h4 className="text-[13px] font-bold uppercase leading-tight">{examConfig.school}</h4>
               <div className="w-24 h-[1px] bg-black my-1"></div>
               <h4 className="text-[11px] font-bold uppercase leading-tight mb-2">{examConfig.department}</h4>
               <p className="text-[11px] italic mt-2">Họ và tên: ......................................................</p>
               <p className="text-[11px] italic">Số báo danh: ...................................................</p>
            </div>
            <div className="text-center w-[50%] flex flex-col items-center">
               <h4 className="text-[11px] font-bold uppercase leading-tight">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
               <h4 className="text-[11px] font-bold uppercase leading-tight">Độc lập - Tự do - Hạnh phúc</h4>
               <div className="w-32 h-[1px] bg-black my-1"></div>
               <p className="text-[11px] font-bold mt-2 uppercase">{examConfig.semester} - NĂM HỌC {examConfig.year}</p>
            </div>
         </div>

         {/* EXAM TITLE SECTION */}
         <div className="text-center mb-10">
            <h2 className="text-[18px] font-bold uppercase leading-tight mb-1">{examConfig.examName}</h2>
            <h3 className="text-[14px] font-bold uppercase leading-tight">Môn học: {examConfig.subject}</h3>
            <p className="text-[12px] font-medium mt-2">Thời gian làm bài: <span className="font-bold">{examConfig.time} phút</span> (Không kể thời gian giao đề)</p>
            <div className="inline-block border-2 border-black px-8 py-2 mt-4 font-bold text-[14px] tracking-widest">
               MÃ ĐỀ THI: {examConfig.examCode}
            </div>
         </div>

         {/* EXAM CONTENT SECTION */}
         <div className="space-y-8">
            <p className="text-[12px] italic border-b border-black/10 pb-2 mb-4">(Học sinh/Sinh viên không được sử dụng tài liệu trừ các phụ lục được cấp kèm theo đề thi)</p>
            
            {shuffledQuestions.map((q, idx) => (
               <div key={q.id} className="text-[14px] leading-relaxed break-inside-avoid">
                  <div className="flex gap-2 font-bold mb-3 items-start">
                     <span className="shrink-0">Câu {idx + 1}:</span>
                     <div className="flex-1">{formatContent(q.content)}</div>
                  </div>
                  
                  {q.image && (
                    <div className="my-6 flex justify-center">
                        <img src={q.image} className="max-h-[70mm] max-w-full object-contain border border-black/5 rounded-sm" alt="Hình minh họa" />
                    </div>
                  )}
                  
                  {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                     <div className="grid grid-cols-2 gap-x-12 gap-y-3 mt-3 ml-8">
                        {q.options.map((opt, i) => (
                           <div key={i} className="flex gap-2 items-start">
                              <span className="font-bold">{String.fromCharCode(65 + i)}.</span>
                              <div className="flex-1">{formatContent(opt)}</div>
                           </div>
                        ))}
                     </div>
                  )}

                  {q.type === QuestionType.ESSAY && (
                     <div className="mt-4 border-b border-dashed border-gray-100 h-2"></div>
                  )}
               </div>
            ))}
         </div>

         <div className="text-center mt-16 mb-16 italic text-[14px] font-bold tracking-[0.5em]">--- HẾT ---</div>

         {/* FOOTER PAGE INDICATOR */}
         <div className="text-right text-[10px] font-serif italic text-gray-400">Trang 1/2</div>

         {/* ANSWERS & GUIDELINE PAGE - FORCED BREAK IN PRINT */}
         <div className="print:break-before-page pt-20 border-t-8 border-double border-slate-100 print:border-none">
            <h2 className="text-center text-[18px] font-bold uppercase mb-4">ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT</h2>
            <p className="text-center text-[12px] font-bold mb-10 uppercase">(MÃ ĐỀ THI: {examConfig.examCode} - MÔN: {examConfig.subject})</p>
            
            <div className="mb-12">
               <h4 className="font-bold text-[14px] mb-4 border-l-4 border-black pl-3 uppercase">1. Bảng tra đáp án nhanh (Dành cho trắc nghiệm):</h4>
               <div className="grid grid-cols-5 md:grid-cols-10 border border-black">
                  {shuffledQuestions.map((q, i) => {
                     const ansIdx = q.type === QuestionType.MULTIPLE_CHOICE && q.options 
                        ? q.options.indexOf(q.correctAnswer)
                        : -1;
                     return (
                        <div key={i} className="border border-black p-2 text-center text-[12px]">
                           <div className="font-bold border-b border-gray-300 mb-1">{i+1}</div>
                           <div className="font-black text-blue-800">
                             {ansIdx >= 0 ? String.fromCharCode(65 + ansIdx) : 'TL'}
                           </div>
                        </div>
                     )
                  })}
               </div>
               <p className="text-[10px] italic mt-2 text-gray-500">(*) TL: Câu hỏi Tự luận</p>
            </div>

            <div>
               <h4 className="font-bold text-[14px] mb-6 border-l-4 border-black pl-3 uppercase">2. Barem chi tiết & Hướng dẫn giải thích:</h4>
               <div className="space-y-8">
                  {shuffledQuestions.map((q, i) => (
                     <div key={i} className="text-[13px] bg-slate-50 p-4 rounded-lg border border-slate-100 print:bg-white print:border-black/10">
                        <div className="flex gap-2 font-bold mb-2">
                           <span>Câu {i+1}:</span>
                           <span className="text-blue-800 font-black">
                             [ĐÁP ÁN: {q.type === QuestionType.MULTIPLE_CHOICE ? q.correctAnswer : 'Chi tiết bên dưới'}]
                           </span>
                        </div>
                        <div className="mt-2 text-gray-700 leading-relaxed italic">
                           <span className="font-bold not-italic underline">Căn cứ chấm điểm/Giải thích:</span><br/>
                           {formatContent(q.type === QuestionType.ESSAY ? q.correctAnswer : q.explanation)}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ExamCreator;
