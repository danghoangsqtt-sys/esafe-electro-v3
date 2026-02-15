
import React, { useState, useEffect } from 'react';
import { generateQuestionsByAI } from '../services/geminiService';
import { Question, QuestionType, QuestionFolder } from '../types';
import { extractTextFromPDF } from '../services/documentProcessor';

interface QuestionGeneratorProps {
  folders: QuestionFolder[];
  onSaveQuestions: (questions: Question[]) => void;
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

type TabMode = 'AI' | 'MANUAL' | 'IMPORT';

const BLOOM_LEVELS = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Phân tích', 'Đánh giá', 'Sáng tạo'];

const QuestionGenerator: React.FC<QuestionGeneratorProps> = ({ folders, onSaveQuestions, onNotify }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('AI');
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('default');

  // AI State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [bloomCounts, setBloomCounts] = useState<Record<string, number>>({
    'Nhận biết': 0, 'Thông hiểu': 0, 'Vận dụng': 0, 'Phân tích': 0, 'Đánh giá': 0, 'Sáng tạo': 0
  });
  const [qType, setQType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);

  // Manual Input State
  const [manualQ, setManualQ] = useState({
    content: '',
    type: QuestionType.MULTIPLE_CHOICE,
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    bloomLevel: 'Nhận biết',
    category: 'An toàn điện',
    folderId: 'default',
    imageUrl: ''
  });

  useEffect(() => {
    setManualQ(prev => ({ ...prev, folderId: selectedFolderId }));
  }, [selectedFolderId]);

  const formatText = (text: string) => {
    if (!text) return null;
    let html = text;
    html = html.replace(/\$\$(.*?)\$\$/gs, (_, math) => {
      try { return (window as any).katex.renderToString(math, { displayMode: true, throwOnError: false }); } catch (e) { return math; }
    });
    html = html.replace(/\$(.*?)\$/g, (_, math) => {
      try { return (window as any).katex.renderToString(math, { displayMode: false, throwOnError: false }); } catch (e) { return math; }
    });
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const totalQuestions: number = (Object.values(bloomCounts) as number[]).reduce((a: number, b: number) => a + b, 0);

  const normalizeType = (rawType: any): QuestionType => {
    const typeStr = String(rawType || "").toUpperCase();
    if (typeStr.includes("MULTIPLE") || typeStr.includes("TRẮC NGHIỆM")) return QuestionType.MULTIPLE_CHOICE;
    return QuestionType.ESSAY;
  };

  const handleAiGenerate = async () => {
    if (totalQuestions === 0) return onNotify("Hãy chọn ít nhất 1 mức độ Bloom", "warning");
    if (!pdfFile) return onNotify("Hãy tải lên tệp tài liệu nguồn", "warning");

    setIsLoading(true);
    try {
      const contextContent = await extractTextFromPDF(pdfFile);
      const bloomRequest = Object.entries(bloomCounts)
        .filter(([_, c]) => (c as number) > 0)
        .map(([l, c]) => `${c as number} câu mức độ ${l}`)
        .join(', ');
      
      const prompt = `Dựa vào tài liệu: "${contextContent.substring(0, 15000)}" hãy tạo ${totalQuestions} câu ${qType === QuestionType.MULTIPLE_CHOICE ? 'Trắc nghiệm (MULTIPLE_CHOICE)' : 'Tự luận (ESSAY)'} bao gồm: ${bloomRequest}. Trả về JSON array.`;
      const rawQuestions = await generateQuestionsByAI(prompt, totalQuestions as number, "Phân tích tài liệu");
      
      const processed = rawQuestions.map(q => ({
        ...q, 
        id: Math.random().toString(36).substr(2, 9), 
        folderId: selectedFolderId, 
        createdAt: Date.now(),
        type: normalizeType(q.type)
      } as Question));
      setGeneratedQuestions(processed);
      setIsPreview(true);
      onNotify("AI đã tạo xong câu hỏi dự thảo. Vui lòng kiểm duyệt nội dung.", "info");
    } catch (e) { 
      console.error(e);
      onNotify("Lỗi AI khi phân tích tài liệu.", "error"); 
    } finally { setIsLoading(false); }
  };

  const handleManualImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        setManualQ({...manualQ, imageUrl: event.target?.result as string});
    };
    reader.readAsDataURL(file);
  };

  const handleAddManual = () => {
    if (!manualQ.content.trim()) return onNotify("Nội dung không được để trống", "warning");
    const newQuestion: Question = {
      ...manualQ,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      options: manualQ.type === QuestionType.MULTIPLE_CHOICE ? manualQ.options : undefined
    } as Question;
    onSaveQuestions([newQuestion]);
    setManualQ({
      content: '', type: QuestionType.MULTIPLE_CHOICE, options: ['', '', '', ''],
      correctAnswer: '', explanation: '', bloomLevel: 'Nhận biết', category: 'An toàn điện',
      folderId: selectedFolderId, imageUrl: ''
    });
    onNotify("Đã thêm câu hỏi thành công.", "success");
  };

  // Logic chỉnh sửa câu hỏi dự thảo từ AI
  const handleUpdateDraft = (id: string, field: keyof Question, value: any) => {
    setGeneratedQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleRemoveDraft = (id: string) => {
    setGeneratedQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSaveFinal = () => {
    if (generatedQuestions.length === 0) {
        onNotify("Không có câu hỏi nào để lưu.", "warning");
        return;
    }
    onSaveQuestions(generatedQuestions);
    setGeneratedQuestions([]);
    setIsPreview(false);
    onNotify(`Đã phê duyệt và lưu ${generatedQuestions.length} câu hỏi vào ngân hàng.`, "success");
  };

  if (isPreview) {
    return (
      <div className="bg-white rounded-[3rem] shadow-2xl p-10 border border-slate-100 h-full flex flex-col animate-fade-in-up">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Khu vực Kiểm duyệt AI</h2>
            <p className="text-slate-500 text-sm font-medium">Lưu vào chuyên đề: <span className="text-blue-600 font-black">{folders.find(f => f.id === selectedFolderId)?.name}</span></p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsPreview(false)} className="px-8 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition">Hủy bỏ</button>
            <button onClick={handleSaveFinal} className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition active:scale-95">
               Phê duyệt {generatedQuestions.length} câu
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar">
          {generatedQuestions.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
               <i className="fas fa-folder-open text-6xl mb-4"></i>
               <p className="font-black uppercase tracking-widest text-xs">Tất cả câu hỏi đã bị loại bỏ</p>
            </div>
          )}
          {generatedQuestions.map((q, i) => (
            <div key={q.id} className="group p-8 bg-slate-50/80 rounded-[2.5rem] border border-slate-200 relative overflow-hidden transition-all hover:bg-white hover:shadow-xl hover:border-blue-200">
               <div className={`absolute top-0 left-0 w-2 h-full ${q.type === QuestionType.MULTIPLE_CHOICE ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
               
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                     <span className="bg-white px-4 py-1.5 rounded-full text-[9px] font-black text-blue-600 border border-blue-100 shadow-sm uppercase tracking-widest">Dự thảo {i+1}</span>
                     <select 
                        value={q.bloomLevel} 
                        onChange={(e) => handleUpdateDraft(q.id, 'bloomLevel', e.target.value)}
                        className="text-[9px] font-black text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-200 outline-none"
                     >
                        {BLOOM_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                     </select>
                  </div>
                  <button onClick={() => handleRemoveDraft(q.id)} className="w-10 h-10 rounded-xl bg-white text-red-400 border border-slate-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                     <i className="fas fa-trash-alt text-xs"></i>
                  </button>
               </div>

               <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung câu hỏi (Markdown/LaTeX)</label>
                      <textarea 
                        value={q.content} 
                        onChange={(e) => handleUpdateDraft(q.id, 'content', e.target.value)}
                        className="w-full p-6 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        rows={3}
                      />
                   </div>

                   {q.type === QuestionType.MULTIPLE_CHOICE ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options?.map((opt, idx) => (
                           <div key={idx} className="flex gap-2">
                              <input 
                                type="text" 
                                value={opt} 
                                onChange={(e) => {
                                   const newOpts = [...(q.options || [])];
                                   newOpts[idx] = e.target.value;
                                   handleUpdateDraft(q.id, 'options', newOpts);
                                }}
                                className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                placeholder={`Lựa chọn ${String.fromCharCode(65+idx)}`}
                              />
                              <button 
                                onClick={() => handleUpdateDraft(q.id, 'correctAnswer', opt)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${q.correctAnswer === opt ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-200'}`}
                              >
                                 <i className="fas fa-check text-[10px]"></i>
                              </button>
                           </div>
                        ))}
                      </div>
                   ) : (
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Đáp án mẫu / Gợi ý chấm điểm</label>
                         <textarea 
                           value={q.correctAnswer} 
                           onChange={(e) => handleUpdateDraft(q.id, 'correctAnswer', e.target.value)}
                           className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium italic text-slate-600"
                           rows={2}
                         />
                      </div>
                   )}

                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Giải thích chi tiết</label>
                      <textarea 
                        value={q.explanation} 
                        onChange={(e) => handleUpdateDraft(q.id, 'explanation', e.target.value)}
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-500"
                        rows={2}
                      />
                   </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 max-w-6xl mx-auto flex flex-col h-[820px] overflow-hidden animate-fade-in-up">
      <div className="p-10 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 shrink-0 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Biên soạn học liệu chuyên sâu</h2>
          <p className="text-slate-500 text-sm font-medium italic mt-1">Hỗ trợ đầy đủ biểu thức Toán học và Kỹ thuật điện qua LaTeX ($...$)</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          {['AI', 'MANUAL', 'IMPORT'].map((m) => (
            <button 
                key={m} 
                onClick={() => setActiveTab(m as TabMode)} 
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === m ? 'bg-white text-blue-600 shadow-md transform scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {m === 'AI' ? 'Phân tích PDF' : m === 'MANUAL' ? 'Nhập thủ công' : 'Tải tệp JSON'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
        {activeTab === 'MANUAL' ? (
          <div className="space-y-10 animate-fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nội dung câu hỏi</label>
                      <textarea 
                        value={manualQ.content} 
                        onChange={e => setManualQ({...manualQ, content: e.target.value})} 
                        placeholder="Nhập nội dung câu hỏi kỹ thuật... sử dụng $E = mc^2$ cho công thức." 
                        className="w-full h-56 p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none font-bold text-slate-800 text-lg focus:ring-4 focus:ring-blue-500/5 transition-all" 
                      />
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Hình ảnh minh họa (Sơ đồ, mạch điện...)</label>
                      <div className="flex items-center gap-6">
                        <label className="flex-1 flex flex-col items-center justify-center gap-3 p-8 bg-blue-50/50 text-blue-600 rounded-[2rem] border-2 border-dashed border-blue-200 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group">
                            <i className="fas fa-cloud-upload-alt text-3xl group-hover:scale-110 transition"></i>
                            <span className="text-[10px] font-black uppercase tracking-widest">Chọn ảnh từ máy tính</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleManualImageUpload} />
                        </label>
                        {manualQ.imageUrl && (
                            <div className="relative w-36 h-36 shrink-0 group">
                                <img src={manualQ.imageUrl} className="w-full h-full object-cover rounded-[1.8rem] border-2 border-white shadow-xl ring-1 ring-slate-200" />
                                <button onClick={() => setManualQ({...manualQ, imageUrl: ''})} className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"><i className="fas fa-times"></i></button>
                            </div>
                        )}
                      </div>
                   </div>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Chuyên đề lưu trữ</label>
                        <select 
                            value={manualQ.folderId} 
                            onChange={e => setManualQ({...manualQ, folderId: e.target.value})} 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-blue-700 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Mức độ Bloom</label>
                        <select 
                            value={manualQ.bloomLevel} 
                            onChange={e => setManualQ({...manualQ, bloomLevel: e.target.value})} 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {BLOOM_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Hình thức kiểm tra</label>
                    <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                      <button 
                        onClick={() => setManualQ({...manualQ, type: QuestionType.MULTIPLE_CHOICE, correctAnswer: ''})} 
                        className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${manualQ.type === QuestionType.MULTIPLE_CHOICE ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
                      >
                        Trắc nghiệm
                      </button>
                      <button 
                        onClick={() => setManualQ({...manualQ, type: QuestionType.ESSAY, correctAnswer: ''})} 
                        className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${manualQ.type === QuestionType.ESSAY ? 'bg-white text-purple-600 shadow-md' : 'text-slate-400'}`}
                      >
                        Tự luận
                      </button>
                    </div>
                  </div>

                  {manualQ.type === QuestionType.MULTIPLE_CHOICE ? (
                    <div className="space-y-4 bg-blue-50/30 p-8 rounded-[2.5rem] border border-blue-100 shadow-inner">
                       <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block text-center mb-2">Quản lý phương án & Đáp án</label>
                       <div className="grid grid-cols-1 gap-4">
                          {manualQ.options.map((opt, i) => (
                            <div key={i} className="flex gap-3 group">
                              <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center font-black text-slate-400 group-focus-within:border-blue-500 transition-all">{String.fromCharCode(65+i)}</div>
                              <input 
                                type="text" 
                                value={opt} 
                                onChange={e => { const n = [...manualQ.options]; n[i] = e.target.value; setManualQ({...manualQ, options: n}); }} 
                                placeholder={`Phương án trả lời ${i+1}...`} 
                                className="flex-1 px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all" 
                              />
                              <button 
                                onClick={() => setManualQ({...manualQ, correctAnswer: opt})} 
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${manualQ.correctAnswer === opt && opt !== '' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-200 hover:border-green-400'}`}
                              >
                                <i className="fas fa-check text-sm"></i>
                              </button>
                            </div>
                          ))}
                       </div>
                    </div>
                 ) : (
                    <div className="space-y-4 bg-purple-50/30 p-8 rounded-[2.5rem] border border-purple-100 shadow-inner">
                       <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest block mb-2">Đáp án chuẩn (Tự luận)</label>
                       <textarea 
                        value={manualQ.correctAnswer} 
                        onChange={e => setManualQ({...manualQ, correctAnswer: e.target.value})} 
                        placeholder="Mô tả đáp án chi tiết hoặc barem chấm điểm..." 
                        className="w-full h-44 p-6 bg-white border border-purple-100 rounded-3xl outline-none font-medium italic text-slate-700" 
                       />
                    </div>
                 )}
                </div>
             </div>
          </div>
        ) : activeTab === 'AI' ? (
           <div className="h-full flex flex-col items-center justify-center space-y-12 animate-fade-in p-10">
              <div className="relative group">
                 <div className="absolute -inset-10 bg-blue-500/10 rounded-full blur-3xl animate-pulse group-hover:scale-125 transition-transform duration-1000"></div>
                 <div className="w-32 h-32 bg-blue-600 text-white rounded-[2.5rem] flex items-center justify-center text-5xl shadow-2xl relative z-10 transform rotate-3 group-hover:rotate-0 transition-all duration-500">
                    <i className="fas fa-magic"></i>
                 </div>
              </div>

              <div className="text-center space-y-4 max-w-xl">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tight">AI Content Analyzer</h3>
                 <p className="text-slate-500 font-medium leading-relaxed">
                    Tải giáo trình PDF, AI sẽ tự động trích xuất kiến thức và tạo câu hỏi theo các mức độ Bloom. Bạn hoàn toàn có quyền chỉnh sửa trước khi lưu.
                 </p>
              </div>

              <div className="w-full max-w-3xl bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-12 transition-all hover:border-blue-400 hover:bg-blue-50/30">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tài liệu nguồn (PDF)</label>
                          <label className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:shadow-lg transition-all group">
                             <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <i className="fas fa-file-pdf"></i>
                             </div>
                             <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-black truncate text-slate-700">{pdfFile ? pdfFile.name : 'Chọn tệp PDF...'}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{pdfFile ? `${(pdfFile.size/1024/1024).toFixed(2)} MB` : 'Dung lượng tối đa 20MB'}</p>
                             </div>
                             <input type="file" accept=".pdf" className="hidden" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                          </label>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cấu hình câu hỏi</label>
                          <div className="grid grid-cols-2 gap-3">
                             <select value={qType} onChange={e => setQType(e.target.value as QuestionType)} className="p-3.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase text-slate-600 outline-none">
                                <option value={QuestionType.MULTIPLE_CHOICE}>Trắc nghiệm</option>
                                <option value={QuestionType.ESSAY}>Tự luận</option>
                             </select>
                             <select value={selectedFolderId} onChange={e => setSelectedFolderId(e.target.value)} className="p-3.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase text-blue-600 outline-none">
                                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                             </select>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phân bổ mức độ Bloom ({totalQuestions} câu)</label>
                       <div className="grid grid-cols-2 gap-3">
                          {Object.entries(bloomCounts).map(([level, count]) => (
                             <div key={level} className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-black text-slate-500 uppercase ml-1">{level}</span>
                                <input 
                                    type="number" min="0" max="20" 
                                    value={count} 
                                    onChange={e => setBloomCounts({...bloomCounts, [level]: parseInt(e.target.value) || 0})}
                                    className="p-3 bg-white border border-slate-200 rounded-xl font-black text-xs text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <button 
                    onClick={handleAiGenerate}
                    disabled={isLoading || totalQuestions === 0 || !pdfFile}
                    className="w-full mt-10 py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                 >
                    {isLoading ? <><i className="fas fa-spinner fa-spin mr-3"></i> ĐANG PHÂN TÍCH...</> : 'BẮT ĐẦU BIÊN SOẠN AI'}
                 </button>
              </div>
           </div>
        ) : null}
      </div>

      <div className="p-10 border-t border-slate-100 bg-slate-50/80 flex justify-end items-center shrink-0">
         <div className="flex items-center gap-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">Kiểm tra kỹ nội dung trước khi cập nhật</p>
            <button 
                onClick={handleAddManual} 
                className="bg-slate-900 text-white px-14 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all"
            >
                CẬP NHẬT NGÂN HÀNG
            </button>
         </div>
      </div>
    </div>
  );
};

export default QuestionGenerator;
