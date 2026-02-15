
import React, { useState } from 'react';
import { Question, QuestionFolder } from '../../types';
import AIGeneratorTab from './AIGeneratorTab';
import ManualCreatorTab from './ManualCreatorTab';
import ReviewList from './ReviewList';

interface QuestionGeneratorProps {
  folders: QuestionFolder[];
  onSaveQuestions: (questions: Question[]) => void;
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

type TabMode = 'AI' | 'MANUAL';

const QuestionGenerator: React.FC<QuestionGeneratorProps> = ({ folders, onSaveQuestions, onNotify }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('AI');
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('default');

  const handleQuestionsGenerated = (questions: Question[]) => {
    setPendingQuestions(questions);
    setIsPreviewMode(true);
  };

  const handleSingleQuestionCreated = (question: Question) => {
    // Với manual creator, chúng ta có thể thêm trực tiếp hoặc cho vào hàng chờ
    setPendingQuestions(prev => [...prev, question]);
    setIsPreviewMode(true);
  };

  const handleUpdatePending = (index: number, updated: Question) => {
    const newList = [...pendingQuestions];
    newList[index] = updated;
    setPendingQuestions(newList);
  };

  const handleRemovePending = (index: number) => {
    const newList = pendingQuestions.filter((_, i) => i !== index);
    setPendingQuestions(newList);
    if (newList.length === 0) setIsPreviewMode(false);
  };

  const handleSaveFinal = () => {
    onSaveQuestions(pendingQuestions);
    setPendingQuestions([]);
    setIsPreviewMode(false);
    onNotify(`Đã lưu ${pendingQuestions.length} câu hỏi mới vào hệ thống.`, "success");
  };

  if (isPreviewMode) {
    return (
      <ReviewList 
        questions={pendingQuestions}
        folders={folders}
        selectedFolderId={selectedFolderId}
        onUpdateQuestion={handleUpdatePending}
        onRemoveQuestion={handleRemovePending}
        onApproveAll={handleSaveFinal}
        onCancel={() => { setPendingQuestions([]); setIsPreviewMode(false); }}
      />
    );
  }

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 max-w-6xl mx-auto flex flex-col h-[780px] overflow-hidden animate-fade-in-up">
      {/* HEADER SECTION */}
      <div className="p-10 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 shrink-0 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">Biên soạn học liệu AI</h2>
          <p className="text-slate-500 text-sm font-medium italic flex items-center gap-2">
            <i className="fas fa-microchip text-blue-500"></i> Sử dụng Gemini 3 để tự động hóa quy trình soạn thảo đề thi
          </p>
        </div>
        
        <div className="flex bg-gray-100/80 p-1.5 rounded-[1.8rem] border border-gray-200">
          <button 
            onClick={() => setActiveTab('AI')} 
            className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'AI' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Phân tích PDF
          </button>
          <button 
            onClick={() => setActiveTab('MANUAL')} 
            className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'MANUAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Nhập liệu & Ảnh
          </button>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
        <div className="mb-8 p-6 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                 <i className="fas fa-folder-tree"></i>
              </div>
              <div>
                 <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Lưu trữ vào bài học</label>
                 <span className="font-black text-slate-700">Ngân hàng đề thi chính</span>
              </div>
           </div>
           <select 
             value={selectedFolderId} 
             onChange={e => setSelectedFolderId(e.target.value)} 
             className="w-full md:w-80 p-4 bg-white border border-blue-100 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/5 outline-none"
           >
             {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
           </select>
        </div>

        {activeTab === 'AI' ? (
          <AIGeneratorTab 
            folders={folders}
            selectedFolderId={selectedFolderId}
            onQuestionsGenerated={handleQuestionsGenerated}
            onNotify={onNotify}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        ) : (
          <ManualCreatorTab 
            folders={folders}
            selectedFolderId={selectedFolderId}
            onQuestionCreated={handleSingleQuestionCreated}
            onQuestionsGenerated={handleQuestionsGenerated}
            onNotify={onNotify}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
      </div>

      {/* FOOTER STATUS */}
      <div className="px-10 py-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-orange-500 animate-pulse' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]'}`}></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {isLoading ? 'Hệ thống AI đang tính toán...' : 'Hệ thống sẵn nạp dữ liệu'}
              </span>
          </div>
          <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
            Data Processor: Gemini-3-Flash-Core
          </div>
      </div>
    </div>
  );
};

export default QuestionGenerator;
