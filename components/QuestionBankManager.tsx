
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

  // Edit State
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

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
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => setEditingQuestion(q)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition flex items-center justify-center" title="Sửa câu hỏi">
                            <i className="fas fa-pen text-[10px]"></i>
                         </button>
                         <button onClick={() => deleteQuestion(q.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition flex items-center justify-center" title="Xóa câu hỏi">
                            <i className="fas fa-trash text-[10px]"></i>
                         </button>
                      </div>
                   </div>

                   <div className="font-bold text-gray-800 leading-relaxed text-lg mb-6">
                     {formatContent(q.content)}
                   </div>
                   
                   {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                           {q.options.map((opt, i) => (
                               <div key={i} className={`text-sm p-4 rounded-2xl border transition-all ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-700 font-bold ring-2 ring-green-100' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                                   <div className="flex items-center gap-3">
                                       <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 ${opt === q.correctAnswer ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                           {String.fromCharCode(65 + i)}
                                       </span>
                                       {formatContent(opt)}
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}

                   {q.type === QuestionType.ESSAY && (
                       <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 mb-6">
                           <p className="text-[10px] font-black text-purple-600 uppercase mb-2">Đáp án mẫu / Gợi ý</p>
                           <div className="text-sm text-purple-800 leading-relaxed italic">
                             {formatContent(q.correctAnswer)}
                           </div>
                       </div>
                   )}
                   
                   <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                       <span><i className="fas fa-folder text-yellow-500 mr-2"></i> {folders.find(f => f.id === q.folderId)?.name}</span>
                       <span><i className="far fa-calendar-alt mr-2"></i> {new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingQuestion && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
                <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-gray-100">
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
