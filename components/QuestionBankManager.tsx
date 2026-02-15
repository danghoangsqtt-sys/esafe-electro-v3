
import React, { useState, useMemo } from 'react';
import { Question, QuestionFolder, QuestionType } from '../types';
import ExamCreator from './ExamCreator';

interface QuestionBankManagerProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  folders: QuestionFolder[];
  setFolders: React.Dispatch<React.SetStateAction<QuestionFolder[]>>;
  showNotify: (message: string, type: any) => void;
}

const BLOOM_LEVELS = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Phân tích', 'Đánh giá', 'Sáng tạo'];

const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({ questions, setQuestions, folders, setFolders, showNotify }) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<QuestionType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [bloomFilter, setBloomFilter] = useState('Tất cả');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Selection & Details State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showExamCreator, setShowExamCreator] = useState(false);

  const formatContent = (text: string) => {
    if (!text) return null;
    let html = text;
    html = html.replace(/\$\$(.*?)\$\$/gs, (_, math) => {
      try { return (window as any).katex.renderToString(math, { displayMode: true, throwOnError: false }); } catch (e) { return math; }
    });
    html = html.replace(/\$(.*?)\$/g, (_, math) => {
      try { return (window as any).katex.renderToString(math, { displayMode: false, throwOnError: false }); } catch (e) { return math; }
    });
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-blue-900">$1</strong>');
    html = html.replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchFolder = selectedFolderId === 'all' || q.folderId === selectedFolderId;
      const matchTab = activeTab === 'ALL' || q.type === activeTab;
      const matchSearch = q.content.toLowerCase().includes(search.toLowerCase());
      const matchBloom = bloomFilter === 'Tất cả' || q.bloomLevel === bloomFilter;
      return matchFolder && matchTab && matchSearch && matchBloom;
    });
  }, [questions, selectedFolderId, activeTab, search, bloomFilter]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const deleteQuestion = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng?")) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      showNotify("Đã xóa câu hỏi khỏi ngân hàng.", "info");
    }
  };

  const saveEditedQuestion = () => {
    if (!editingQuestion) return;
    setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? editingQuestion : q));
    setEditingQuestion(null);
    showNotify("Đã cập nhật thay đổi thành công.", "success");
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingQuestion) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        setEditingQuestion({...editingQuestion, imageUrl: event.target?.result as string});
    };
    reader.readAsDataURL(file);
  };

  if (showExamCreator) {
      const selectedQuestions = questions.filter(q => selectedIds.has(q.id));
      return <ExamCreator questions={selectedQuestions} onBack={() => setShowExamCreator(false)} />;
  }

  return (
    <div className="h-full flex flex-col md:flex-row bg-white overflow-hidden animate-fade-in relative">
      {/* Sidebar Folders */}
      <aside className="w-full md:w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-200 bg-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <i className="fas fa-archive text-blue-600"></i>
            <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.2em]">Cấu trúc ngân hàng</h3>
          </div>
          <button onClick={() => setIsAddingFolder(true)} className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"><i className="fas fa-plus text-[10px]"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          <button onClick={() => setSelectedFolderId('all')} className={`w-full text-left px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-between transition-all ${selectedFolderId === 'all' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
            <span className="flex items-center gap-3"><i className="fas fa-globe-asia"></i> Toàn bộ hệ thống</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-lg">{questions.length}</span>
          </button>
          <div className="h-px bg-slate-200 my-4 mx-2"></div>
          {folders.map(f => (
            <button key={f.id} onClick={() => setSelectedFolderId(f.id)} className={`w-full text-left px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-between transition-all ${selectedFolderId === f.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
              <span className="flex items-center gap-3 truncate">
                <i className={`fas ${selectedFolderId === f.id ? 'fa-folder-open' : 'fa-folder'} ${selectedFolderId === f.id ? 'text-white' : 'text-yellow-500'}`}></i> 
                {f.name}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-lg ${selectedFolderId === f.id ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>
                {questions.filter(q => q.folderId === f.id).length}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="p-8 border-b border-slate-100 bg-white shadow-sm z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Kho lưu trữ tri thức</h2>
            <div className="flex gap-3">
               <div className="relative group">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition"></i>
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm nội dung..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="pl-11 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold w-64 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" 
                  />
               </div>
               {selectedIds.size > 0 && (
                  <button onClick={() => setShowExamCreator(true)} className="bg-green-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-3 shadow-xl shadow-green-500/20">
                     <i className="fas fa-file-pdf"></i> Xuất đề thi ({selectedIds.size})
                  </button>
               )}
            </div>
          </div>
          <div className="flex gap-8 mt-10">
            <button onClick={() => setActiveTab('ALL')} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest relative transition-all ${activeTab === 'ALL' ? 'text-blue-600' : 'text-slate-400'}`}>Tất cả bài ({filteredQuestions.length}){activeTab === 'ALL' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)]"></div>}</button>
            <button onClick={() => setActiveTab(QuestionType.MULTIPLE_CHOICE)} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest relative transition-all ${activeTab === QuestionType.MULTIPLE_CHOICE ? 'text-blue-600' : 'text-slate-400'}`}>Trắc nghiệm{activeTab === QuestionType.MULTIPLE_CHOICE && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)]"></div>}</button>
            <button onClick={() => setActiveTab(QuestionType.ESSAY)} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest relative transition-all ${activeTab === QuestionType.ESSAY ? 'text-blue-600' : 'text-slate-400'}`}>Tự luận{activeTab === QuestionType.ESSAY && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)]"></div>}</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar">
          <div className="grid grid-cols-1 gap-5 max-w-6xl mx-auto">
            {filteredQuestions.length === 0 && (
                <div className="text-center py-20 text-slate-300">
                    <i className="fas fa-search text-5xl mb-4"></i>
                    <p className="font-black uppercase tracking-[0.2em] text-xs">Không tìm thấy câu hỏi phù hợp</p>
                </div>
            )}
            {filteredQuestions.map((q) => (
              <div key={q.id} className={`group bg-white p-6 rounded-[2.5rem] border transition-all flex items-center gap-6 ${selectedIds.has(q.id) ? 'border-blue-500 bg-blue-50/50 shadow-xl' : 'border-slate-100 hover:border-slate-200 hover:shadow-lg'}`}>
                 <div className="flex items-center gap-4 shrink-0">
                    <input type="checkbox" checked={selectedIds.has(q.id)} onChange={() => toggleSelect(q.id)} className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${q.type === QuestionType.MULTIPLE_CHOICE ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>{q.type === QuestionType.MULTIPLE_CHOICE ? 'Trắc nghiệm' : 'Tự luận'}</span>
                        <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-tighter">{q.bloomLevel}</span>
                        {q.imageUrl && <i className="fas fa-image text-blue-400 text-[10px]"></i>}
                    </div>
                    <div className="font-bold text-slate-800 text-sm leading-relaxed line-clamp-2 math-content">{formatContent(q.content)}</div>
                 </div>
                 <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setViewingQuestion(q)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="Xem nhanh"><i className="fas fa-eye text-xs"></i></button>
                    <button onClick={() => setEditingQuestion(q)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="Chỉnh sửa"><i className="fas fa-pen text-xs"></i></button>
                    <button onClick={() => deleteQuestion(q.id)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm" title="Xóa bỏ"><i className="fas fa-trash text-xs"></i></button>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {viewingQuestion && (
         <div className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white w-full max-w-3xl rounded-[3.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-[0_40px_100px_rgba(0,0,0,0.5)] animate-fade-in-up border border-white/20">
               <div className="p-10 border-b flex justify-between items-center bg-slate-50/80">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/20"><i className="fas fa-search"></i></div>
                     <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Chi tiết câu hỏi</h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{viewingQuestion.bloomLevel} • {viewingQuestion.type}</span>
                     </div>
                  </div>
                  <button onClick={() => setViewingQuestion(null)} className="w-12 h-12 rounded-2xl bg-white text-slate-400 hover:text-red-500 flex items-center justify-center shadow-sm transition-all"><i className="fas fa-times"></i></button>
               </div>
               <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
                  <div className="text-2xl font-bold leading-relaxed text-slate-800 math-content">{formatContent(viewingQuestion.content)}</div>
                  {viewingQuestion.imageUrl && (
                    <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-inner bg-slate-50 p-4">
                        <img src={viewingQuestion.imageUrl} className="w-full max-h-[400px] object-contain mx-auto" alt="Question Diagram" />
                    </div>
                  )}
                  
                  {viewingQuestion.type === QuestionType.MULTIPLE_CHOICE && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewingQuestion.options?.map((opt, i) => (
                           <div key={i} className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${opt === viewingQuestion.correctAnswer ? 'bg-green-50 border-green-500/30 text-green-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${opt === viewingQuestion.correctAnswer ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>{String.fromCharCode(65+i)}</span>
                              <div className="math-content text-sm font-bold">{formatContent(opt)}</div>
                           </div>
                        ))}
                     </div>
                  )}
                  <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 shadow-inner">
                     <div className="flex items-center gap-3 mb-4">
                        <i className="fas fa-lightbulb text-blue-600"></i>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Đáp án & Giải thích chuyên sâu</p>
                     </div>
                     <div className="text-sm text-slate-800 leading-relaxed font-bold math-content mb-4">{formatContent(viewingQuestion.correctAnswer)}</div>
                     <div className="text-xs italic text-slate-500 leading-relaxed pt-4 border-t border-blue-100/50">
                        {viewingQuestion.explanation || "Chưa có lời giải thích chi tiết cho câu hỏi này."}
                     </div>
                  </div>
               </div>
               <div className="p-10 pt-0">
                  <button onClick={() => setViewingQuestion(null)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all">ĐÓNG XEM TRƯỚC</button>
               </div>
            </div>
         </div>
      )}

      {/* Editing Modal - NÂNG CẤP MỚI */}
      {editingQuestion && (
         <div className="fixed inset-0 z-[1001] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-[3.5rem] overflow-hidden flex flex-col max-h-[95vh] shadow-[0_40px_100px_rgba(0,0,0,0.5)] animate-fade-in-up border border-white/20">
               <div className="p-10 border-b flex justify-between items-center bg-slate-50/80">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg"><i className="fas fa-edit"></i></div>
                     <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Chỉnh sửa câu hỏi</h3>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">ID: {editingQuestion.id}</span>
                     </div>
                  </div>
                  <button onClick={() => setEditingQuestion(null)} className="w-12 h-12 rounded-2xl bg-white text-slate-400 hover:text-red-500 flex items-center justify-center shadow-sm transition-all"><i className="fas fa-times"></i></button>
               </div>

               <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung học liệu</label>
                           <textarea 
                              value={editingQuestion.content} 
                              onChange={(e) => setEditingQuestion({...editingQuestion, content: e.target.value})}
                              className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                              rows={5}
                           />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hình ảnh đính kèm</label>
                            <div className="flex items-center gap-4">
                                <label className="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-indigo-50/50 text-indigo-600 rounded-2xl border-2 border-dashed border-indigo-100 cursor-pointer hover:bg-indigo-50 transition-all">
                                    <i className="fas fa-image text-xl"></i>
                                    <span className="text-[9px] font-black uppercase">Thay đổi ảnh</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleEditImageUpload} />
                                </label>
                                {editingQuestion.imageUrl && (
                                    <div className="relative w-24 h-24 group">
                                        <img src={editingQuestion.imageUrl} className="w-full h-full object-cover rounded-2xl border shadow-sm" />
                                        <button onClick={() => setEditingQuestion({...editingQuestion, imageUrl: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-[10px] flex items-center justify-center shadow-lg"><i className="fas fa-times"></i></button>
                                    </div>
                                )}
                            </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chuyên đề</label>
                              <select 
                                 value={editingQuestion.folderId} 
                                 onChange={(e) => setEditingQuestion({...editingQuestion, folderId: e.target.value})}
                                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-indigo-600 outline-none"
                              >
                                 {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bloom</label>
                              <select 
                                 value={editingQuestion.bloomLevel} 
                                 onChange={(e) => setEditingQuestion({...editingQuestion, bloomLevel: e.target.value})}
                                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-slate-600 outline-none"
                              >
                                 {BLOOM_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                              </select>
                           </div>
                        </div>

                        {editingQuestion.type === QuestionType.MULTIPLE_CHOICE ? (
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Các phương án lựa chọn</label>
                              <div className="grid grid-cols-1 gap-3">
                                 {editingQuestion.options?.map((opt, i) => (
                                    <div key={i} className="flex gap-2">
                                       <input 
                                          type="text" 
                                          value={opt} 
                                          onChange={(e) => {
                                             const newOpts = [...(editingQuestion.options || [])];
                                             newOpts[i] = e.target.value;
                                             setEditingQuestion({...editingQuestion, options: newOpts});
                                          }}
                                          className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                                       />
                                       <button 
                                          onClick={() => setEditingQuestion({...editingQuestion, correctAnswer: opt})}
                                          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${editingQuestion.correctAnswer === opt ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-200'}`}
                                       >
                                          <i className="fas fa-check text-xs"></i>
                                       </button>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        ) : (
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đáp án chuẩn</label>
                              <textarea 
                                 value={editingQuestion.correctAnswer} 
                                 onChange={(e) => setEditingQuestion({...editingQuestion, correctAnswer: e.target.value})}
                                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                                 rows={4}
                              />
                           </div>
                        )}

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giải thích kỹ thuật</label>
                           <textarea 
                              value={editingQuestion.explanation} 
                              onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-500 italic"
                              rows={2}
                           />
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-10 pt-0 flex gap-4">
                  <button onClick={() => setEditingQuestion(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all">HỦY THAY ĐỔI</button>
                  <button onClick={saveEditedQuestion} className="flex-[2] py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all">LƯU CẬP NHẬT NGAY</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default QuestionBankManager;
