
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Question, QuestionType, QuestionFolder } from '../../types';

interface ManualCreatorTabProps {
  folders: QuestionFolder[];
  selectedFolderId: string;
  onQuestionCreated: (question: Question) => void;
  onQuestionsGenerated: (questions: Question[]) => void;
  onNotify: (message: string, type: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const BLOOM_LEVELS = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Phân tích', 'Đánh giá', 'Sáng tạo'];

const ManualCreatorTab: React.FC<ManualCreatorTabProps> = ({ 
  folders, 
  selectedFolderId, 
  onQuestionCreated, 
  onQuestionsGenerated,
  onNotify, 
  isLoading, 
  setIsLoading 
}) => {
  const [manualQ, setManualQ] = useState({
    content: '',
    type: QuestionType.MULTIPLE_CHOICE,
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    bloomLevel: 'Nhận biết',
    category: 'An toàn điện',
    folderId: selectedFolderId
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleAiFileAnalysis = async (file: File) => {
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: "Hãy phân tích tệp/hình ảnh này và trích xuất toàn bộ câu hỏi. Chuyển đổi mọi công thức toán học, ký hiệu điện học thành LaTeX đặt trong dấu $...$. Nếu là tự luận, hãy tạo ra đáp án chuẩn đầy đủ cho trường 'correctAnswer'. Trả về định dạng JSON array: [{content, type, options, correctAnswer, explanation, bloomLevel, category}]. Lưu ý: Trường 'type' bắt buộc là 'MULTIPLE_CHOICE' hoặc 'ESSAY'." },
            { inlineData: { data: await fileToBase64(file), mimeType: file.type } }
          ]
        }
      });

      const text = response.text || "[]";
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      const processed = parsed.map((q: any) => ({
        ...q, 
        id: Math.random().toString(36).substr(2, 9), 
        folderId: selectedFolderId, 
        createdAt: Date.now(),
        type: (String(q.type).includes('MULTIPLE') || String(q.type).includes('TRẮC NGHIỆM')) ? QuestionType.MULTIPLE_CHOICE : QuestionType.ESSAY
      }));
      
      onQuestionsGenerated(processed);
      onNotify("AI đã trích xuất dữ liệu từ hình ảnh thành công.", "success");
    } catch (e) {
      onNotify("Không thể xử lý tệp này.", "error");
    } finally { setIsLoading(false); }
  };

  const handleAddManual = () => {
    if (!manualQ.content.trim()) return onNotify("Nội dung câu hỏi không được để trống", "warning");
    if (manualQ.type === QuestionType.MULTIPLE_CHOICE) {
      if (manualQ.options.some(opt => !opt.trim())) return onNotify("Vui lòng nhập đầy đủ các phương án", "warning");
      if (!manualQ.correctAnswer) return onNotify("Vui lòng chọn đáp án đúng", "warning");
    } else {
      if (!manualQ.correctAnswer.trim()) return onNotify("Vui lòng nhập đáp án chuẩn cho câu hỏi tự luận", "warning");
    }

    const newQuestion: Question = {
      ...manualQ,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      options: manualQ.type === QuestionType.MULTIPLE_CHOICE ? manualQ.options : undefined
    } as Question;

    onQuestionCreated(newQuestion);
    setManualQ({ ...manualQ, content: '', correctAnswer: '', explanation: '', options: ['', '', '', ''] });
    onNotify("Đã thêm câu hỏi vào ngân hàng đề.", "success");
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nội dung câu hỏi & Hình ảnh</label>
             <div className="relative group">
                <textarea 
                   value={manualQ.content} 
                   onChange={e => setManualQ({...manualQ, content: e.target.value})} 
                   placeholder="Nhập nội dung câu hỏi (sử dụng $...$ cho LaTeX)..." 
                   className="w-full h-64 p-8 bg-gray-50 border border-gray-200 rounded-[2.5rem] outline-none focus:border-blue-500 font-medium transition-all focus:bg-white focus:shadow-xl" 
                />
                <label className="absolute bottom-6 right-6 w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-lg border border-gray-100 cursor-pointer hover:bg-blue-600 hover:text-white transition-all active:scale-90">
                   <i className="fas fa-camera text-xl"></i>
                   <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleAiFileAnalysis(e.target.files[0])} />
                </label>
             </div>
             <p className="text-[10px] text-gray-400 italic px-4">Nhấn vào biểu tượng camera để AI trích xuất câu hỏi từ ảnh chụp đề thi.</p>
          </div>
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mức độ trí tuệ</label>
                   <select 
                      value={manualQ.bloomLevel} 
                      onChange={e => setManualQ({...manualQ, bloomLevel: e.target.value})} 
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-slate-700 focus:bg-white outline-none"
                   >
                      {BLOOM_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hình thức thi</label>
                   <div className="flex gap-1 bg-gray-50 p-1 rounded-2xl border border-gray-200">
                      <button onClick={() => setManualQ({...manualQ, type: QuestionType.MULTIPLE_CHOICE})} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase transition-all ${manualQ.type === QuestionType.MULTIPLE_CHOICE ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>Trắc nghiệm</button>
                      <button onClick={() => setManualQ({...manualQ, type: QuestionType.ESSAY})} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase transition-all ${manualQ.type === QuestionType.ESSAY ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>Tự luận</button>
                   </div>
                </div>
             </div>

             {manualQ.type === QuestionType.MULTIPLE_CHOICE ? (
                <div className="grid grid-cols-1 gap-3 bg-blue-50/30 p-6 rounded-[2.5rem] border border-blue-100/50">
                   <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 mb-1 block">Các phương án & Đáp án đúng</label>
                   <div className="grid grid-cols-1 gap-2">
                      {manualQ.options.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <input 
                            type="text" 
                            value={opt} 
                            onChange={e => { const n = [...manualQ.options]; n[i] = e.target.value; setManualQ({...manualQ, options: n}); }} 
                            placeholder={`Phương án ${String.fromCharCode(65+i)}`} 
                            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-sm font-medium" 
                          />
                          <button 
                            onClick={() => setManualQ({...manualQ, correctAnswer: opt})} 
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${manualQ.correctAnswer === opt && opt !== '' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-300 border border-gray-100 hover:border-blue-300'}`}
                          >
                            <i className="fas fa-check text-xs"></i>
                          </button>
                        </div>
                      ))}
                   </div>
                </div>
             ) : (
                <div className="space-y-2 bg-purple-50/30 p-6 rounded-[2.5rem] border border-purple-100/50">
                   <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest ml-1 mb-1 block">Đáp án chuẩn / Gợi ý chấm điểm</label>
                   <textarea 
                      value={manualQ.correctAnswer} 
                      onChange={e => setManualQ({...manualQ, correctAnswer: e.target.value})} 
                      placeholder="Nhập nội dung đáp án chuẩn chi tiết..." 
                      className="w-full h-32 p-5 bg-white border border-purple-100 rounded-2xl outline-none focus:border-purple-500 font-medium transition-all" 
                   />
                </div>
             )}

             <button 
               onClick={handleAddManual} 
               disabled={isLoading}
               className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95"
             >
                <i className="fas fa-plus-circle"></i> THÊM VÀO GIỎ CÂU HỎI
             </button>
          </div>
       </div>
    </div>
  );
};

export default ManualCreatorTab;
