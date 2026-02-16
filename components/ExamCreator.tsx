
import React, { useState, useMemo } from 'react';
import { Question, QuestionType } from '../types';

interface ExamCreatorProps {
  questions: Question[];
  onBack: () => void;
}

const ExamCreator: React.FC<ExamCreatorProps> = ({ questions, onBack }) => {
  const [examConfig, setExamConfig] = useState({
    school: 'ĐẠI HỌC BÁCH KHOA',
    department: 'KHOA ĐIỆN - ĐIỆN TỬ',
    subject: 'NGUỒN ĐIỆN AN TOÀN VÀ MÔI TRƯỜNG',
    examName: 'KIỂM TRA GIỮA KỲ',
    examCode: '001',
    time: '60',
    semester: 'HỌC KỲ II - NĂM HỌC 2025-2026'
  });

  const [shuffledQuestions, setShuffledQuestions] = useState([...questions]);

  const shuffleArray = (array: any[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const handleShuffle = () => {
    // Trộn câu hỏi
    let qList = shuffleArray(questions);
    // Trộn đáp án cho từng câu trắc nghiệm
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

  const formatText = (text: string) => {
    if (!text) return null;
    let html = text.replace(/\$\$(.*?)\$\$/gs, (_, math) => {
      try { return (window as any).katex.renderToString(math, { displayMode: true, throwOnError: false }); } catch (e) { return math; }
    });
    html = html.replace(/\$(.*?)\$/g, (_, math) => {
      try { return (window as any).katex.renderToString(math, { displayMode: false, throwOnError: false }); } catch (e) { return math; }
    });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto print:bg-white print:overflow-visible custom-scrollbar">
      {/* Configuration Panel - Hidden when printing */}
      <div className="p-8 max-w-5xl mx-auto print:hidden">
         <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 mb-10 animate-fade-in-up">
            <header className="flex justify-between items-center mb-8 border-b pb-6">
               <div>
                  <h2 className="text-2xl font-black text-slate-800">Cấu hình Đề thi</h2>
                  <p className="text-sm text-gray-500">Thông tin Header & Logic trộn đề</p>
               </div>
               <button onClick={onBack} className="text-gray-400 hover:text-slate-800 font-bold flex items-center gap-2"><i className="fas fa-arrow-left"></i> Quay lại</button>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div>
                     <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Tên Trường/Sở</label>
                     <input type="text" value={examConfig.school} onChange={e => setExamConfig({...examConfig, school: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Khoa/Đơn vị</label>
                     <input type="text" value={examConfig.department} onChange={e => setExamConfig({...examConfig, department: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Học kỳ / Năm học</label>
                     <input type="text" value={examConfig.semester} onChange={e => setExamConfig({...examConfig, semester: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                  </div>
               </div>
               <div className="space-y-4">
                  <div>
                     <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Tên bài thi / Kỳ thi</label>
                     <input type="text" value={examConfig.examName} onChange={e => setExamConfig({...examConfig, examName: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-blue-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Mã đề</label>
                        <input type="text" value={examConfig.examCode} onChange={e => setExamConfig({...examConfig, examCode: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Thời gian (Phút)</label>
                        <input type="number" value={examConfig.time} onChange={e => setExamConfig({...examConfig, time: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                     </div>
                  </div>
               </div>
            </div>

            <div className="mt-8 pt-8 border-t flex gap-4">
               <button onClick={handleShuffle} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3">
                  <i className="fas fa-random"></i> Trộn ngẫu nhiên
               </button>
               <button onClick={handlePrint} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                  <i className="fas fa-print"></i> Xuất bản (Print)
               </button>
            </div>
         </div>
      </div>

      {/* Main Print Layout */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white p-[20mm] text-black font-serif shadow-2xl print:shadow-none print:m-0 print:p-[15mm] mb-20 animate-fade-in-up">
         
         {/* HEADER SECTION */}
         <div className="flex justify-between items-start mb-10">
            <div className="text-center w-[45%]">
               <h4 className="text-[12px] font-bold uppercase">{examConfig.school}</h4>
               <h4 className="text-[12px] font-bold uppercase border-b-2 border-black pb-1 mb-1">{examConfig.department}</h4>
               <p className="text-[10px] italic">Số báo danh: ........................</p>
            </div>
            <div className="text-center w-[50%]">
               <h4 className="text-[12px] font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
               <h4 className="text-[11px] font-bold uppercase border-b border-black pb-1 mb-2">Độc lập - Tự do - Hạnh phúc</h4>
               <p className="text-[10px] font-bold">{examConfig.semester}</p>
            </div>
         </div>

         <div className="text-center mb-10">
            <h2 className="text-lg font-bold uppercase">{examConfig.examName}</h2>
            <h3 className="text-md font-bold uppercase">Môn học: {examConfig.subject}</h3>
            <p className="text-sm font-medium mt-2">Thời gian làm bài: {examConfig.time} phút (Không kể thời gian giao đề)</p>
            <div className="inline-block border-2 border-black px-6 py-1 mt-3 font-bold">
               MÃ ĐỀ THI: {examConfig.examCode}
            </div>
         </div>

         {/* QUESTIONS SECTION */}
         <div className="space-y-8">
            {shuffledQuestions.map((q, idx) => (
               <div key={q.id} className="text-[14px] leading-relaxed break-inside-avoid">
                  <div className="flex gap-2 font-bold mb-2">
                     <span>Câu {idx + 1}:</span>
                     <span>{formatText(q.content)}</span>
                  </div>
                  {/* Fix: use q.image instead of q.imageUrl */}
                  {q.image && <img src={q.image} className="max-h-[80mm] object-contain mx-auto mb-4 border" />}
                  
                  {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                     <div className="grid grid-cols-2 gap-x-10 gap-y-2 mt-2 ml-6">
                        {q.options.map((opt, i) => (
                           <div key={i} className="flex gap-2">
                              <span className="font-bold">{String.fromCharCode(65 + i)}.</span>
                              <span>{formatText(opt)}</span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            ))}
         </div>

         <div className="text-center mt-12 mb-12 italic text-sm">--- HẾT ---</div>

         {/* PAGE BREAK FOR ANSWERS (Visible in print) */}
         <div className="print:break-before-page pt-10 border-t-4 border-dashed border-gray-100 print:border-none">
            <h2 className="text-center text-xl font-bold uppercase mb-8">ĐÁP ÁN & HƯỚNG DẪN CHẤM</h2>
            
            <div className="mb-10">
               <h4 className="font-bold mb-4 underline">1. Bảng đáp án trắc nghiệm:</h4>
               <div className="grid grid-cols-5 md:grid-cols-10 border border-black">
                  {shuffledQuestions.map((q, i) => {
                     const ansIdx = q.type === QuestionType.MULTIPLE_CHOICE && q.options 
                        ? q.options.indexOf(q.correctAnswer)
                        : -1;
                     return (
                        <div key={i} className="border border-black p-2 text-center text-xs">
                           <div className="font-bold border-b border-gray-200 mb-1">{i+1}</div>
                           <div className="font-black text-blue-700">{ansIdx >= 0 ? String.fromCharCode(65 + ansIdx) : 'TL'}</div>
                        </div>
                     )
                  })}
               </div>
            </div>

            <div>
               <h4 className="font-bold mb-4 underline">2. Barem chi tiết & Giải thích:</h4>
               <div className="space-y-6">
                  {shuffledQuestions.map((q, i) => (
                     <div key={i} className="text-xs">
                        <p className="font-bold">Câu {i+1}: <span className="text-blue-700">{q.correctAnswer}</span></p>
                        <p className="italic text-gray-500 mt-1">Giải thích: {q.explanation}</p>
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
