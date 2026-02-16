
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Chatbot from './components/Chatbot';
import QuestionGenerator from './components/QuestionGenerator/index'; 
import Documents from './components/Documents';
import GameQuiz from './components/GameQuiz';
import UserGuide from './components/UserGuide';
import Settings from './components/Settings';
import QuestionBankManager from './components/QuestionBankManager';
import ChangelogModal from './components/ChangelogModal';
import NewsSection from './components/NewsSection';
import { Question, VectorChunk, QuestionFolder, Exam } from './types';

// Sử dụng Window augmentation từ types.ts để truy cập require một cách an toàn
const ipcRenderer = typeof window !== 'undefined' && window.require 
  ? window.require('electron').ipcRenderer 
  : null;

const SidebarLink = ({ to, icon, label }: { to: string, icon: string, label: string }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 font-bold ${
        active 
          ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-blue-600'
      }`}
    >
      <i className={`fas ${icon} w-6 text-center text-lg`}></i>
      <span className="text-[14px]">{label}</span>
    </Link>
  );
};

const Dashboard = ({ questions, knowledgeBase, exams }: any) => {
    return (
        <div className="p-8 space-y-12 animate-fade-in max-w-7xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-3 text-blue-600 font-black text-[11px] uppercase tracking-[0.3em]">
                    <i className="fas fa-graduation-cap animate-bounce"></i>
                    Nền tảng Quản lý Học tập & Thi cử Toàn diện
                  </div>
                  <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
                    LMS Core <br/> <span className="text-blue-600">Learning Center</span>
                  </h1>
                  <p className="text-slate-500 text-xl font-medium max-w-xl">
                    Hệ thống thông minh hỗ trợ quản lý học liệu, ngân hàng câu hỏi và tổ chức kiểm tra đa môn học.
                  </p>
                </div>
                <div className="flex flex-col gap-4 relative z-10">
                  <Link to="/game" className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 group">
                    <i className="fas fa-play group-hover:scale-110 transition"></i> ÔN LUYỆN NGAY
                  </Link>
                  <Link to="/generate" className="bg-blue-50 text-blue-600 px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-3">
                    <i className="fas fa-magic"></i> AI BIÊN SOẠN
                  </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard icon="fa-database" color="blue" label="Kho câu hỏi" value={questions.length} unit="Câu hỏi" />
                <StatCard icon="fa-file-invoice" color="indigo" label="Ngân hàng đề" value={exams?.length || 0} unit="Đề thi" />
                <StatCard icon="fa-layer-group" color="orange" label="Chuyên đề học tập" value={JSON.parse(localStorage.getItem('question_folders') || '[]').length} unit="Chủ đề" />
                <StatCard icon="fa-file-pdf" color="purple" label="Kho giáo trình" value={JSON.parse(localStorage.getItem('elearning_docs') || '[]').length} unit="Tài liệu" />
            </div>

            <div className="mt-10">
                <NewsSection />
            </div>
        </div>
    );
};

const StatCard = ({ icon, color, label, value, unit }: any) => (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl group">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 text-xl bg-${color}-50 text-${color}-600 border border-${color}-100/50`}>
            <i className={`fas ${icon}`}></i>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="flex items-end gap-2 mt-2">
            <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
            <p className="text-xs font-bold text-slate-400 mb-1.5">{unit}</p>
        </div>
    </div>
);

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [folders, setFolders] = useState<QuestionFolder[]>([{"id":"default","name":"Mặc định","createdAt":0}]);
  const [knowledgeBase, setKnowledgeBase] = useState<VectorChunk[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [notifications, setNotifications] = useState<{ id: number, message: string, type: string }[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const initData = async () => {
      if (ipcRenderer) {
        try {
          const db = await ipcRenderer.invoke('load-database');
          if (db) {
            setQuestions(db.questions || []);
            setFolders(db.folders || [{"id":"default","name":"Mặc định","createdAt":0}]);
            setKnowledgeBase(db.knowledgeBase || []);
            setExams(db.exams || []);
          }
        } catch (e) { console.error(e); }
      } else {
        setQuestions(JSON.parse(localStorage.getItem('questions') || '[]'));
        setFolders(JSON.parse(localStorage.getItem('question_folders') || '[{"id":"default","name":"Mặc định","createdAt":0}]'));
        setKnowledgeBase(JSON.parse(localStorage.getItem('knowledge_base') || '[]'));
        setExams(JSON.parse(localStorage.getItem('exams') || '[]'));
      }
      setIsDataLoaded(true);
    };
    initData();
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem('questions', JSON.stringify(questions));
    localStorage.setItem('question_folders', JSON.stringify(folders));
    localStorage.setItem('knowledge_base', JSON.stringify(knowledgeBase));
    localStorage.setItem('exams', JSON.stringify(exams));
    
    if (ipcRenderer) {
      ipcRenderer.invoke('save-database', { questions, folders, knowledgeBase, exams, lastSync: Date.now() });
    }
  }, [questions, folders, knowledgeBase, exams, isDataLoaded]);

  const showNotify = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const deleteKnowledgeByDocId = useCallback((docId: string) => {
    setKnowledgeBase(prev => prev.filter(chunk => chunk.docId !== docId));
  }, []);

  const updateKnowledgeBase = useCallback((newChunks: VectorChunk[]) => {
    setKnowledgeBase(prev => [...prev, ...newChunks]);
  }, []);

  return (
    <Router>
      <div className="flex h-screen bg-slate-50 font-sans overflow-hidden relative">
        <ChangelogModal />
        
        <div className="fixed top-8 right-8 z-[100] space-y-3 pointer-events-none">
            {notifications.map(n => (
                <div key={n.id} className={`px-6 py-4 rounded-3xl shadow-2xl border flex items-center gap-4 animate-fade-in-up pointer-events-auto bg-white min-w-[320px] border-${n.type === 'success' ? 'green' : n.type === 'error' ? 'red' : 'blue'}-100`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-${n.type === 'success' ? 'green' : n.type === 'error' ? 'red' : 'blue'}-50`}>
                        <i className={`fas ${n.type === 'success' ? 'fa-check-circle text-green-500' : n.type === 'error' ? 'fa-triangle-exclamation text-red-500' : 'fa-info-circle text-blue-500'}`}></i>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{n.message}</span>
                </div>
            ))}
        </div>

        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-sm overflow-hidden">
          <div className="p-10 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-[1.8rem] flex items-center justify-center text-2xl shadow-xl shadow-blue-500/30 transform -rotate-3">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tighter leading-none text-slate-900">LMS Core</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Version 2.1</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] px-4 mb-4">Học thuật</div>
            <SidebarLink to="/" icon="fa-house" label="Tổng quan" />
            <SidebarLink to="/documents" icon="fa-book-open" label="Giáo trình PDF" />
            <SidebarLink to="/bank" icon="fa-database" label="Ngân hàng đề" />
            
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] px-4 mt-10 mb-4">Thông minh</div>
            <SidebarLink to="/generate" icon="fa-wand-magic-sparkles" label="AI Biên soạn" />
            <SidebarLink to="/game" icon="fa-gamepad-modern" label="Trung tâm Game" />
            
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] px-4 mt-10 mb-4">Hệ thống</div>
            <SidebarLink to="/guide" icon="fa-circle-info" label="Hướng dẫn" />
            <SidebarLink to="/settings" icon="fa-gear" label="Cấu hình" />
          </nav>

          <div className="p-10 border-t border-slate-50">
             <div className="bg-slate-50 p-4 rounded-2xl text-[9px] font-black text-slate-400 text-center uppercase tracking-[0.3em]">
                Standard LMS Environment
             </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
            {!isDataLoaded ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="loader-spin"></div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto custom-scrollbar">
                  <Routes>
                      <Route path="/" element={<Dashboard questions={questions} knowledgeBase={knowledgeBase} exams={exams} />} />
                      <Route path="/documents" element={<Documents onUpdateKnowledgeBase={updateKnowledgeBase} onDeleteDocumentData={deleteKnowledgeByDocId} onNotify={showNotify} />} />
                      <Route path="/generate" element={<QuestionGenerator folders={folders} onSaveQuestions={(q)=>setQuestions(p=>[...p,...q])} onNotify={showNotify}/>} />
                      <Route path="/bank" element={<QuestionBankManager questions={questions} setQuestions={setQuestions} folders={folders} setFolders={setFolders} exams={exams} setExams={setExams} showNotify={showNotify} />} />
                      <Route path="/game" element={<GameQuiz questions={questions} folders={folders} />} />
                      <Route path="/guide" element={<UserGuide />} />
                      <Route path="/settings" element={<Settings onNotify={showNotify} />} />
                      <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
              </div>
            )}
        </main>

        <Chatbot knowledgeBase={knowledgeBase} onNotify={showNotify} />
      </div>
    </Router>
  );
};

export default App;
