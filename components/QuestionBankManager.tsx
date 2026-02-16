
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
    showNotify(`Đã tạo thư mục bài: "${newFolderName}"`, "success");
  };

  const deleteFolder = (id: string, name: string) => {
      if (id === 'default') return showNotify("Không thể xóa thư mục hệ thống", "warning");
      if (window.confirm(`Xóa thư mục "${name}"? Toàn bộ câu hỏi bên trong sẽ bị xóa khỏi ngân hàng đề.`)) {
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
      showNotify("Đã cập nhật thay đổi câu hỏi.", "success");
  };

  const currentFolder = folders.find(f => f.id === selectedFolderId);

  return (
    <div className="h-full flex flex-col md:flex-row bg-white overflow-hidden animate-fade-in">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-200 bg-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <i className="fas fa-archive text-blue-600"></i>
            <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest">Ngân hàng đề</h3>
          </div>
          <button 
            onClick={() => setIsAddingFolder(true)}
            className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm"
          >
            <i className="fas fa-folder-plus text-xs"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          <button 
            onClick={() => setSelectedFolderId('all')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition ${selectedFolderId === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <i className="fas fa-globe-asia"></i> Tất cả câu hỏi
          </button>
          
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mt-6 mb-2">Thư mục bài học</div>

          {folders.map(f => (
            <div key={f.id} className="group relative">
                <button 
                    onClick={() => setSelectedFolderId(f.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition pr-10 ${selectedFolderId === f.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-200/50'}`}
                >
                    <i className={`fas ${selectedFolderId === f.id ? 'fa-folder-open' : 'fa-folder'} ${selectedFolderId === f.id ? 'text-white' : 'text-yellow-500'}`}></i> 
                    <span className="truncate">{f.name}</span>
                </button>
                {f.id !== 'default' && (
                    <button 
                        onClick={() => deleteFolder(f.id, f.name)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg text-gray-400 hover:bg-red-500 hover:text-white transition opacity-0 group-hover:opacity-100 flex items-center justify-center"
                    >
                        <i className="fas fa-trash text-[10px]"></i>
                    </button>
                )}
            </div>
          ))}

          {isAddingFolder && (
            <div className="p-3 bg-white rounded-xl border border-blue-200 mt-2 shadow-sm animate-fade-in-up">
              <input 
                autoFocus
                type="text" 
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFolder()}
                placeholder="Tên bài mới..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm focus:border-blue-500"
              />
              <div className="flex gap-2 mt-3">
                <button onClick={handleAddFolder} className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-bold">Tạo</button>
                <button onClick={() => setIsAddingFolder(false)} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-500">Hủy</button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="p-6 border-b border-gray-100 bg-white shadow-sm z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                <i className="fas fa-home"></i>
                <span>/ Ngân hàng đề</span>
              </nav>
              <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                <i className={`fas ${selectedFolderId === 'all' ? 'fa-layer-group text-blue-600' : 'fa-folder-open text-yellow-500'}`}></i>
                {selectedFolderId === 'all' ? 'Tổng hợp ngân hàng' : currentFolder?.name}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
               <div className="relative group">
                 <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"></i>
                 <input 
                    type="text" 
                    placeholder="Tìm câu hỏi..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                 />
               </div>
               <select 
                value={bloomFilter}
                onChange={e => setBloomFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 outline-none hover:bg-white transition"
               >
                 <option value="Tất cả">Cấp độ Bloom</option>
                 {BLOOM_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
               </select>
            </div>
          </div>

          <div className="flex gap-6 mt-8 border-b border-gray-100">
            <button 
                onClick={() => setActiveTab('ALL')}
                className={`pb-3 px-1 text-sm font-bold transition-all relative ${activeTab === 'ALL' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Tất cả ({filteredQuestions.length})
                {activeTab === 'ALL' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>}
            </button>
            <button 
                onClick={() => setActiveTab(QuestionType.MULTIPLE_CHOICE)}
                className={`pb-3 px-1 text-sm font-bold transition-all relative ${activeTab === QuestionType.MULTIPLE_CHOICE ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Trắc nghiệm
                {activeTab === QuestionType.MULTIPLE_CHOICE && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>}
            </button>
            <button 
                onClick={() => setActiveTab(QuestionType.ESSAY)}
                className={`pb-3 px-1 text-sm font-bold transition-all relative ${activeTab === QuestionType.ESSAY ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Tự luận
                {activeTab === QuestionType.ESSAY && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 custom-scrollbar">
          {filteredQuestions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <i className="fas fa-folder-open text-5xl mb-4 opacity-20"></i>
                <p className="font-bold text-sm uppercase tracking-widest">Không tìm thấy câu hỏi</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 max-w-5xl mx-auto">
              {filteredQuestions.map((q) => (
                <div key={q.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                   <div className={`absolute top-0 left-0 w-1.5 h-full ${q.type === QuestionType.MULTIPLE_CHOICE ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                   
                   <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase border border-blue-100">{q.category}</span>
                          <span className="text-[10px] font-black bg-green-50 text-green-600 px-3 py-1 rounded-full uppercase border border-green-100">{q.bloomLevel}</span>
                          {q.image && (
                              <span className="text-[10px] font-black bg-orange-50 text-orange-600 px-3 py-1 rounded-full uppercase border border-orange-100">
                                  <i className="fas fa-image mr-1"></i> Đính kèm
                              </span>
                          )}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => setViewingQuestion(q)} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 hover:bg-slate-900 hover:text-white transition flex items-center justify-center" title="Xem chi tiết">
                            <i className="fas fa-eye text-[10px]"></i>
                         </button>
                         <button onClick={() => setEditingQuestion(q)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition flex items-center justify-center" title="Sửa câu hỏi">
                            <i className="fas fa-pen text-[10px]"></i>
                         </button>
                         <button onClick={() => deleteQuestion(q.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition flex items-center justify-center" title="Xóa câu hỏi">
                            <i className="fas fa-trash text-[10px]"></i>
                         </button>
                      </div>
                   </div>

                   {/* Rút gọn nội dung: sử dụng line-clamp-3 */}
                   <div className="font-bold text-gray-800 leading-relaxed text-lg mb-6 line-clamp-3 overflow-hidden text-ellipsis">
                     {formatContent(q.content)}
                   </div>
                   
                   <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                       <span><i className="fas fa-folder text-yellow-500 mr-2"></i> {folders.find(f => f.id === q.folderId)?.name}</span>
                       <span><i className="far fa-calendar-alt mr-2"></i> {new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Xem chi tiết câu hỏi */}
        {viewingQuestion && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-gray-100">
                    <header className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${viewingQuestion.type === QuestionType.MULTIPLE_CHOICE ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                    {viewingQuestion.type === QuestionType.MULTIPLE_CHOICE ? 'Câu hỏi trắc nghiệm' : 'Câu hỏi tự luận'}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã: {viewingQuestion.id.toUpperCase()}</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">Chi tiết nội dung học thuật</h3>
                        </div>
                        <button onClick={() => setViewingQuestion(null)} className="w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 text-gray-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95">
                            <i className="fas fa-times"></i>
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                        {/* Nội dung câu hỏi đầy đủ */}
                        <section className="space-y-4">
                             <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] block">Nội dung câu hỏi</label>
                             <div className="text-xl font-bold text-slate-800 leading-relaxed bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                                 {formatContent(viewingQuestion.content)}
                             </div>
                        </section>

                        {/* Hình ảnh minh họa lớn */}
                        {viewingQuestion.image && (
                            <section className="space-y-4">
                                <label className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] block">Hình ảnh minh họa</label>
                                <div className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-inner flex justify-center overflow-hidden">
                                    <img src={viewingQuestion.image} className="max-h-96 object-contain rounded-2xl shadow-xl border border-slate-50" alt="Minh họa đầy đủ" />
                                </div>
                            </section>
                        )}

                        {/* Các phương án (Nếu là trắc nghiệm) */}
                        {viewingQuestion.type === QuestionType.MULTIPLE_CHOICE && viewingQuestion.options && (
                            <section className="space-y-4">
                                <label className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] block">Phương án lựa chọn</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {viewingQuestion.options.map((opt, i) => (
                                        <div key={i} className={`p-6 rounded-3xl border transition-all flex items-center gap-4 ${opt === viewingQuestion.correctAnswer ? 'bg-green-50 border-green-200 ring-2 ring-green-100 shadow-md shadow-green-100/50' : 'bg-white border-slate-100 text-slate-500'}`}>
                                            <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${opt === viewingQuestion.correctAnswer ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <div className="font-bold flex-1">{formatContent(opt)}</div>
                                            {opt === viewingQuestion.correctAnswer && <i className="fas fa-check-circle text-green-600 text-xl"></i>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Đáp án chuẩn (Nếu là tự luận) */}
                        {viewingQuestion.type === QuestionType.ESSAY && (
                            <section className="space-y-4">
                                <label className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] block">Đáp án mẫu / Căn cứ chấm điểm</label>
                                <div className="bg-purple-50/50 p-8 rounded-[2rem] border border-purple-100 text-slate-700 leading-relaxed italic">
                                    {formatContent(viewingQuestion.correctAnswer)}
                                </div>
                            </section>
                        )}

                        {/* Giải thích bổ sung */}
                        {viewingQuestion.explanation && (
                            <section className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Giải thích chi tiết</label>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm text-slate-500 font-medium">
                                    {formatContent(viewingQuestion.explanation)}
                                </div>
                            </section>
                        )}

                        {/* Metadata Footer */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-slate-100">
                             <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><i className="fas fa-brain"></i></div>
                                 <div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase">Mức độ Bloom</p>
                                     <p className="text-xs font-black text-slate-700">{viewingQuestion.bloomLevel}</p>
                                 </div>
                             </div>
                             <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-yellow-500 shadow-sm"><i className="fas fa-folder"></i></div>
                                 <div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase">Thư mục bài</p>
                                     <p className="text-xs font-black text-slate-700 truncate max-w-[120px]">{folders.find(f => f.id === viewingQuestion.folderId)?.name}</p>
                                 </div>
                             </div>
                             <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm"><i className="fas fa-calendar-alt"></i></div>
                                 <div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase">Ngày khởi tạo</p>
                                     <p className="text-xs font-black text-slate-700">{new Date(viewingQuestion.createdAt).toLocaleDateString('vi-VN')}</p>
                                 </div>
                             </div>
                        </div>
                    </div>

                    <footer className="p-10 border-t border-gray-50 bg-gray-50/30 flex justify-end gap-4 shrink-0">
                        <button 
                            onClick={() => setViewingQuestion(null)} 
                            className="px-8 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                        >
                            Đóng cửa sổ
                        </button>
                        <button 
                            onClick={() => {
                                const q = viewingQuestion;
                                setViewingQuestion(null);
                                setEditingQuestion(q);
                            }} 
                            className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <i className="fas fa-pen-to-square"></i> SỬA CÂU HỎI
                        </button>
                    </footer>
                </div>
            </div>
        )}

        {/* Modal: Chỉnh sửa câu hỏi (Edit Mode) */}
        {editingQuestion && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
                <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-gray-100">
                    <header className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                        <div>
                            <h3 className="text-2xl font-black text-gray-800">Chỉnh sửa câu hỏi</h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Mã: {editingQuestion.id.toUpperCase()}</p>
                        </div>
                        <button onClick={() => setEditingQuestion(null)} className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                            <i className="fas fa-times"></i>
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nội dung câu hỏi</label>
                                    <textarea 
                                        value={editingQuestion.content} 
                                        onChange={e => setEditingQuestion({...editingQuestion, content: e.target.value})}
                                        className="w-full h-40 p-5 bg-gray-50 border border-gray-200 rounded-3xl outline-none focus:border-blue-500 font-medium transition"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Loại câu hỏi</label>
                                        <select 
                                            value={editingQuestion.type}
                                            onChange={e => setEditingQuestion({...editingQuestion, type: e.target.value as QuestionType, options: e.target.value === QuestionType.ESSAY ? undefined : editingQuestion.options || ['', '', '', '']})}
                                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-700 outline-none"
                                        >
                                            <option value={QuestionType.MULTIPLE_CHOICE}>Trắc nghiệm</option>
                                            <option value={QuestionType.ESSAY}>Tự luận / Vấn đáp</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Mức độ Bloom</label>
                                        <select 
                                            value={editingQuestion.bloomLevel}
                                            onChange={e => setEditingQuestion({...editingQuestion, bloomLevel: e.target.value})}
                                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-700 outline-none"
                                        >
                                            {BLOOM_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Thư mục bài học</label>
                                    <select 
                                        value={editingQuestion.folderId}
                                        onChange={e => setEditingQuestion({...editingQuestion, folderId: e.target.value})}
                                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-700 outline-none"
                                    >
                                        {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {editingQuestion.type === QuestionType.MULTIPLE_CHOICE ? (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Phương án trả lời (Nhấn nút xanh để chọn đáp án đúng)</label>
                                        {editingQuestion.options?.map((opt, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={opt}
                                                    onChange={e => {
                                                        const n = [...(editingQuestion.options || [])];
                                                        n[i] = e.target.value;
                                                        setEditingQuestion({...editingQuestion, options: n});
                                                    }}
                                                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                                    placeholder={`Phương án ${String.fromCharCode(65+i)}`}
                                                />
                                                <button 
                                                    onClick={() => setEditingQuestion({...editingQuestion, correctAnswer: opt})}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${editingQuestion.correctAnswer === opt && opt !== '' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}
                                                >
                                                    <i className="fas fa-check"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Đáp án chuẩn / Gợi ý chấm điểm</label>
                                        <textarea 
                                            value={editingQuestion.correctAnswer}
                                            onChange={e => setEditingQuestion({...editingQuestion, correctAnswer: e.target.value})}
                                            className="w-full h-60 p-5 bg-gray-50 border border-gray-200 rounded-3xl outline-none focus:border-blue-500 font-medium transition"
                                            placeholder="Nhập nội dung đáp án chuẩn..."
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Giải thích thêm (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={editingQuestion.explanation}
                                        onChange={e => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                                        placeholder="Ghi chú về nguồn tài liệu hoặc cách giải..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <footer className="p-8 border-t border-gray-50 bg-gray-50/50 flex justify-end gap-4 shrink-0">
                        <button onClick={() => setEditingQuestion(null)} className="px-8 py-3 bg-white border border-gray-200 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 transition-all">Hủy bỏ</button>
                        <button onClick={handleUpdateQuestion} className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all">LƯU THAY ĐỔI</button>
                    </footer>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBankManager;
