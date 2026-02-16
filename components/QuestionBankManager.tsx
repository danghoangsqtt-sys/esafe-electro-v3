
import React, { useState, useMemo } from 'react';
import { Question, QuestionFolder, QuestionType } from '../types';
import { formatContent } from '../utils/textFormatter';

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

  // Modals States
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);

  // Filtering Logic
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchFolder = selectedFolderId === 'all' || q.folderId === selectedFolderId;
      const matchTab = activeTab === 'ALL' || q.type === activeTab;
      const matchSearch = q.content.toLowerCase().includes(search.toLowerCase()) || q.category.toLowerCase().includes(search.toLowerCase());
      const matchBloom = bloomFilter === 'Tất cả' || q.bloomLevel === bloomFilter;
      return matchFolder && matchTab && matchSearch && matchBloom;
    });
  }, [questions, selectedFolderId, activeTab, search, bloomFilter]);

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: QuestionFolder = {
      id: Date.now().toString(),
      name: newFolderName,
      createdAt: Date.now()
    };
    setFolders(prev => [...prev, newFolder]);
    setNewFolderName('');
    setIsAddingFolder(false);
    showNotify(`Đã tạo thư mục chuyên đề: "${newFolderName}"`, "success");
  };

  const deleteFolder = (id: string, name: string) => {
      if (id === 'default') return showNotify("Không thể xóa thư mục hệ thống", "warning");
      if (window.confirm(`Xóa thư mục "${name}"? Toàn bộ câu hỏi bên trong sẽ bị xóa.`)) {
          setFolders(prev => prev.filter(f => f.id !== id));
          setQuestions(prev => prev.filter(q => q.folderId !== id));
          if (selectedFolderId === id) setSelectedFolderId('all');
          showNotify("Đã dọn dẹp thư mục và câu hỏi liên quan.", "info");
      }
  };

  const deleteQuestion = (id: string) => {
      if (window.confirm("Xóa câu hỏi này khỏi ngân hàng?")) {
          setQuestions(prev => prev.filter(q => q.id !== id));
          showNotify("Đã xóa câu hỏi.", "info");
      }
  };

  const handleUpdateQuestion = () => {
      if (!editingQuestion) return;
      setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? editingQuestion : q));
      setEditingQuestion(null);
      showNotify("Đã lưu thay đổi câu hỏi.", "success");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingQuestion) return;

    if (!file.type.startsWith('image/')) {
      showNotify("Vui lòng chỉ chọn định dạng hình ảnh.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      setEditingQuestion({ ...editingQuestion, image: base64 });
      showNotify("Đã cập nhật ảnh minh họa mới.", "success");
    };
  };

  const handleRemoveImage = () => {
    if (editingQuestion) {
      setEditingQuestion({ ...editingQuestion, image: undefined });
      showNotify("Đã xóa ảnh minh họa.", "info");
    }
  };

  const currentFolder = folders.find(f => f.id === selectedFolderId);

  return (
    <div className="h-full flex flex-col md:flex-row bg-white overflow-hidden animate-fade-in font-inter">
      {/* Sidebar - Folders */}
      <aside className="w-full md:w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <i className="fas fa-database text-blue-600"></i>
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Kho học liệu</h3>
          </div>
          <button 
            onClick={() => setIsAddingFolder(true)}
            className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm active:scale-90"
          >
            <i className="fas fa-plus text-xs"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <button 
            onClick={() => setSelectedFolderId('all')}
            className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all ${selectedFolderId === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-slate-200/50'}`}
          >
            <i className="fas fa-layer-group"></i> Tất cả câu hỏi
          </button>
          
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5 mt-8 mb-3">Chuyên đề bài học</div>

          {folders.map(f => (
            <div key={f.id} className="group relative">
                <button 
                    onClick={() => setSelectedFolderId(f.id)}
                    className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all pr-12 ${selectedFolderId === f.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-slate-200/50'}`}
                >
                    <i className={`fas ${selectedFolderId === f.id ? 'fa-folder-open' : 'fa-folder'} ${selectedFolderId === f.id ? 'text-white' : 'text-yellow-500'}`}></i> 
                    <span className="truncate">{f.name}</span>
                </button>
                {f.id !== 'default' && (
                    <button 
                        onClick={() => deleteFolder(f.id, f.name)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl text-slate-400 hover:bg-red-500 hover:text-white transition opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-sm"
                    >
                        <i className="fas fa-trash-alt text-[10px]"></i>
                    </button>
                )}
            </div>
          ))}

          {isAddingFolder && (
            <div className="p-4 bg-white rounded-2xl border border-blue-200 mt-2 shadow-xl animate-fade-in-up">
              <input 
                autoFocus
                type="text" 
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFolder()}
                placeholder="Tên chuyên đề..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:border-blue-500 transition-all"
              />
              <div className="flex gap-2 mt-3">
                <button onClick={handleAddFolder} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Tạo</button>
                <button onClick={() => setIsAddingFolder(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">Hủy</button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content - List View Rút Gọn */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="p-8 border-b border-slate-100 bg-white shadow-sm z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">
                <i className="fas fa-home"></i>
                <span>/ Quản lý học liệu</span>
              </nav>
              <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4 tracking-tighter">
                {selectedFolderId === 'all' ? 'Tổng hợp ngân hàng' : currentFolder?.name}
                <span className="text-sm font-bold bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full">{filteredQuestions.length}</span>
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
               <div className="relative group">
                 <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                 <input 
                    type="text" 
                    placeholder="Tìm theo nội dung..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all w-full lg:w-72"
                 />
               </div>
               <select 
                value={bloomFilter}
                onChange={e => setBloomFilter(e.target.value)}
                className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-600 outline-none hover:bg-white transition cursor-pointer"
               >
                 <option value="Tất cả">Cấp độ Bloom</option>
                 {BLOOM_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
               </select>
            </div>
          </div>

          <div className="flex gap-8 mt-10 border-b border-slate-100">
            {['ALL', QuestionType.MULTIPLE_CHOICE, QuestionType.ESSAY].map(tab => (
              <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`pb-4 px-2 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  {tab === 'ALL' ? 'Tất cả' : tab === QuestionType.MULTIPLE_CHOICE ? 'Trắc nghiệm' : 'Tự luận'}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1.5 bg-blue-600 rounded-t-full animate-fade-in"></div>}
              </button>
            ))}
          </div>
        </header>

        {/* List View Container */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 custom-scrollbar">
          {filteredQuestions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <i className="fas fa-folder-open text-7xl mb-6 opacity-20"></i>
                <p className="font-black text-xs uppercase tracking-[0.3em]">Kho câu hỏi trống</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-6xl mx-auto">
              {filteredQuestions.map((q) => (
                <div key={q.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group flex items-center gap-6 relative overflow-hidden">
                   <div className={`absolute top-0 left-0 w-2 h-full ${q.type === QuestionType.MULTIPLE_CHOICE ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                   
                   {/* Mã ID rút gọn */}
                   <div className="hidden md:flex flex-col items-center justify-center w-20 shrink-0 border-r border-slate-50 pr-4">
                      <span className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">ID</span>
                      <span className="text-xs font-black text-slate-800">{q.id.substring(0, 4).toUpperCase()}</span>
                   </div>

                   {/* Nội dung rút gọn (Line Clamp) */}
                   <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 leading-relaxed text-base line-clamp-2 overflow-hidden mb-2">
                        {q.content}
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-tighter border border-slate-200">{q.category}</span>
                         <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${q.bloomLevel === 'Sáng tạo' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{q.bloomLevel}</span>
                         {q.image && <i className="fas fa-image text-orange-400 text-xs" title="Có ảnh minh họa"></i>}
                      </div>
                   </div>

                   {/* Cột Hành động */}
                   <div className="flex items-center gap-2 shrink-0 md:opacity-0 group-hover:opacity-100 transition-all transform md:translate-x-4 group-hover:translate-x-0">
                      <button 
                        onClick={() => setViewingQuestion(q)} 
                        className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition shadow-lg shadow-slate-900/10" 
                        title="Xem chi tiết"
                      >
                        <i className="fas fa-eye text-sm"></i>
                      </button>
                      <button 
                        onClick={() => setEditingQuestion(q)} 
                        className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:scale-110 active:scale-90 transition shadow-lg shadow-blue-100" 
                        title="Chỉnh sửa"
                      >
                        <i className="fas fa-pen text-sm"></i>
                      </button>
                      <button 
                        onClick={() => deleteQuestion(q.id)} 
                        className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white hover:scale-110 active:scale-90 transition shadow-lg shadow-red-100" 
                        title="Xóa"
                      >
                        <i className="fas fa-trash-alt text-sm"></i>
                      </button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Xem chi tiết câu hỏi (Detail Modal) */}
        {viewingQuestion && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 bg-slate-950/80 backdrop-blur-md animate-fade-in">
                <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[4rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-fade-in-up">
                    <header className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/20 relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${viewingQuestion.type === QuestionType.MULTIPLE_CHOICE ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                                    {viewingQuestion.type === QuestionType.MULTIPLE_CHOICE ? 'Trắc nghiệm' : 'Tự luận'}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 px-3 py-1.5 rounded-full">REF: {viewingQuestion.id.toUpperCase()}</span>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Chi tiết hồ sơ học thuật</h3>
                        </div>
                        <button onClick={() => setViewingQuestion(null)} className="w-14 h-14 rounded-full bg-white shadow-xl border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all transform active:scale-90">
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                        {/* 1. Nội dung văn bản câu hỏi */}
                        <section className="space-y-4">
                             <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] block ml-1">Nội dung câu hỏi</label>
                             <div className="text-2xl font-black text-slate-800 leading-relaxed bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-inner">
                                 {formatContent(viewingQuestion.content)}
                             </div>
                        </section>

                        {/* 2. Ảnh minh họa (nếu có) */}
                        {viewingQuestion.image && (
                            <section className="space-y-4">
                                <label className="text-[10px] font-black text-orange-600 uppercase tracking-[0.4em] block ml-1">Hình ảnh / Sơ đồ đính kèm</label>
                                <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-2xl flex justify-center">
                                    <img 
                                        src={viewingQuestion.image} 
                                        className="max-h-[500px] w-auto object-contain rounded-2xl shadow-2xl border border-white/5" 
                                        alt="Tư liệu minh họa" 
                                    />
                                </div>
                            </section>
                        )}

                        {/* 3. Phản hồi chuẩn (Options hoặc Answer Box) */}
                        <section className="space-y-4">
                            <label className="text-[10px] font-black text-green-600 uppercase tracking-[0.4em] block ml-1">
                                {viewingQuestion.type === QuestionType.MULTIPLE_CHOICE ? 'Phương án lựa chọn' : 'Đáp án chuẩn từ giáo trình'}
                            </label>
                            
                            {viewingQuestion.type === QuestionType.MULTIPLE_CHOICE ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {viewingQuestion.options?.map((opt, i) => (
                                        <div key={i} className={`p-8 rounded-[2.5rem] border-2 transition-all flex items-center gap-6 ${opt === viewingQuestion.correctAnswer ? 'bg-green-50 border-green-500 shadow-xl shadow-green-100' : 'bg-white border-slate-100 text-slate-400'}`}>
                                            <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${opt === viewingQuestion.correctAnswer ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <div className="font-bold text-base flex-1">{formatContent(opt)}</div>
                                            {opt === viewingQuestion.correctAnswer && <i className="fas fa-check-circle text-green-600 text-2xl"></i>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-purple-50/50 p-10 rounded-[3rem] border border-purple-100 text-slate-700 leading-relaxed font-bold text-lg italic shadow-inner">
                                    {formatContent(viewingQuestion.correctAnswer)}
                                </div>
                            )}
                        </section>

                        {/* 4. Giải thích / Metadata */}
                        {viewingQuestion.explanation && (
                            <section className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block ml-1">Giải thích chi tiết</label>
                                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-sm text-slate-500 font-medium leading-relaxed italic">
                                    <i className="fas fa-info-circle mr-3 text-blue-400"></i>
                                    {formatContent(viewingQuestion.explanation)}
                                </div>
                            </section>
                        )}

                        {/* Footer Metadata Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 border-t border-slate-100">
                             {[
                                 { icon: 'fa-brain', color: 'blue', label: 'Cấp độ Bloom', value: viewingQuestion.bloomLevel },
                                 { icon: 'fa-folder-open', color: 'yellow', label: 'Chuyên đề', value: folders.find(f => f.id === viewingQuestion.folderId)?.name },
                                 { icon: 'fa-clock', color: 'indigo', label: 'Ngày tạo', value: new Date(viewingQuestion.createdAt).toLocaleString('vi-VN') }
                             ].map((item, idx) => (
                                <div key={idx} className="bg-slate-50 p-5 rounded-3xl flex items-center gap-5 border border-slate-100">
                                    <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-${item.color}-500 shadow-sm border border-slate-100`}>
                                        <i className={`fas ${item.icon}`}></i>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                        <p className="text-xs font-black text-slate-700 truncate">{item.value}</p>
                                    </div>
                                </div>
                             ))}
                        </div>
                    </div>

                    <footer className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-5 shrink-0">
                        <button 
                            onClick={() => setViewingQuestion(null)} 
                            className="px-10 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                        >
                            Đóng cửa sổ
                        </button>
                        <button 
                            onClick={() => {
                                const q = viewingQuestion;
                                setViewingQuestion(null);
                                setEditingQuestion(q);
                            }} 
                            className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3"
                        >
                            <i className="fas fa-edit"></i> CHỈNH SỬA
                        </button>
                    </footer>
                </div>
            </div>
        )}

        {/* Modal: Chỉnh sửa câu hỏi (Edit Modal - Đã nâng cấp quản lý ảnh) */}
        {editingQuestion && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-xl animate-fade-in">
                <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                    <header className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Cập nhật câu hỏi</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                                <i className="fas fa-code"></i> ID: {editingQuestion.id.toUpperCase()}
                            </p>
                        </div>
                        <button onClick={() => setEditingQuestion(null)} className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all transform active:scale-90">
                            <i className="fas fa-times text-lg"></i>
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Nội dung đề bài & Ảnh minh họa</label>
                                    <div className="relative">
                                      <textarea 
                                          value={editingQuestion.content} 
                                          onChange={e => setEditingQuestion({...editingQuestion, content: e.target.value})}
                                          className="w-full h-48 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:border-blue-500 font-bold text-slate-800 transition-all shadow-inner focus:bg-white"
                                      />
                                      <label className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-600 hover:text-white transition-all">
                                          <i className="fas fa-image"></i>
                                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                      </label>
                                    </div>

                                    {/* Ảnh minh họa Section */}
                                    {editingQuestion.image && (
                                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-4 group animate-fade-in-up">
                                          <div className="h-16 w-16 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm shrink-0">
                                              <img src={editingQuestion.image} className="w-full h-full object-contain" alt="Preview" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Ảnh minh họa đang nạp</p>
                                              <p className="text-[10px] text-slate-400 truncate font-medium">Sơ đồ kỹ thuật đính kèm</p>
                                          </div>
                                          <button 
                                            onClick={handleRemoveImage}
                                            className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                          >
                                              <i className="fas fa-trash text-[9px]"></i>
                                          </button>
                                      </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Cấp độ Bloom</label>
                                        <select 
                                            value={editingQuestion.bloomLevel}
                                            onChange={e => setEditingQuestion({...editingQuestion, bloomLevel: e.target.value})}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                        >
                                            {BLOOM_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Thư mục bài</label>
                                        <select 
                                            value={editingQuestion.folderId}
                                            onChange={e => setEditingQuestion({...editingQuestion, folderId: e.target.value})}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                        >
                                            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {editingQuestion.type === QuestionType.MULTIPLE_CHOICE ? (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Phương án & Đáp án đúng (Xanh)</label>
                                        <div className="space-y-3">
                                            {editingQuestion.options?.map((opt, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <input 
                                                        type="text" 
                                                        value={opt}
                                                        onChange={e => {
                                                            const n = [...(editingQuestion.options || [])];
                                                            n[i] = e.target.value;
                                                            setEditingQuestion({...editingQuestion, options: n});
                                                        }}
                                                        className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 shadow-sm"
                                                        placeholder={`Đáp án ${String.fromCharCode(65+i)}`}
                                                    />
                                                    <button 
                                                        onClick={() => setEditingQuestion({...editingQuestion, correctAnswer: opt})}
                                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${editingQuestion.correctAnswer === opt && opt !== '' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                                                    >
                                                        <i className="fas fa-check"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Đáp án mẫu tiêu chuẩn</label>
                                        <textarea 
                                            value={editingQuestion.correctAnswer}
                                            onChange={e => setEditingQuestion({...editingQuestion, correctAnswer: e.target.value})}
                                            className="w-full h-72 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:border-blue-500 font-bold text-slate-800 transition-all shadow-inner focus:bg-white"
                                            placeholder="Gợi ý chấm điểm..."
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Ghi chú / Giải thích</label>
                                    <input 
                                        type="text" 
                                        value={editingQuestion.explanation}
                                        onChange={e => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium text-slate-600 focus:bg-white"
                                        placeholder="Vd: Nguồn PV đạt hiệu suất..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <footer className="p-10 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-5 shrink-0">
                        <button onClick={() => setEditingQuestion(null)} className="px-10 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all">Hủy</button>
                        <button onClick={handleUpdateQuestion} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-blue-600 transition-all transform hover:scale-105 active:scale-95">LƯU CẬP NHẬT</button>
                    </footer>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBankManager;
