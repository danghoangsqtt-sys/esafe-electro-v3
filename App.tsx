
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Chatbot from './components/Chatbot';
import QuestionGenerator from './components/QuestionGenerator';
import Documents from './components/Documents';
import GameQuiz from './components/GameQuiz';
import UserGuide from './components/UserGuide';
import Settings from './components/Settings';
import QuestionBankManager from './components/QuestionBankManager';
import ChangelogModal from './components/ChangelogModal';
import { Question, VectorChunk, QuestionFolder } from './types';

const SidebarLink = ({ to, icon, label }: { to: string, icon: string, label: string }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-bold ${
        active 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-100 translate-x-1' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <i className={`fas ${icon} w-5 text-center text-[16px]`}></i>
      <span className="text-[13px]">{label}</span>
    </Link>
  );
};

const Dashboard = ({ questions, knowledgeBase }: any) => {
    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in main-container">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <nav className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 opacity-70">Control Center</nav>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Bảng điều khiển học tập</h1>
                  <p className="text-slate-500 font-medium mt-2">Hệ thống giáo dục chuyên sâu về An toàn điện & Môi trường.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="fa-layer-group" color="blue" label="Câu hỏi học tập" value={questions.length} />
                <StatCard icon="fa-brain" color="purple" label="Đoạn tri thức AI" value={knowledgeBase.length} />
                <StatCard icon="fa-folder-open" color="orange" label="Chương bài học" value={JSON.parse(localStorage.getItem('question_folders') || '[]').length} />
                <StatCard icon="fa-bolt" color="green" label="Tài liệu" value={JSON.parse(localStorage.getItem('elearning_docs') || '[]').length} />
            </div>
            
            <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center">
                 <i className="fas fa-info-circle text-blue-400 text-3xl mb-4"></i>
                 <h2 className="text-xl font-black text-slate-800 mb-2">Sẵn sàng bắt đầu buổi học?</h2>
                 <p className="text-sm text-slate-500 mb-6">Sử dụng thanh menu bên trái để truy cập các tính năng chính.</p>
                 <div className="flex justify-center gap-4">
                     <Link to="/game" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100">Luyện tập ngay</Link>
                     <Link to="/documents" className="bg-slate-50 text-slate-500 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200">Xem giáo trình</Link>
                 </div>
            </section>
        </div>
    );
};

const StatCard = ({ icon, color, label, value }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-lg bg-${color}-50 text-${color}-600`}>
            <i className={`fas ${icon}`}></i>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    </div>
);

const DebugConsole = ({ show, onClose }: { show: boolean, onClose: () => void }) => {
    if (!show) return null;
    return (
        <div className="fixed top-0 right-0 w-80 h-full bg-slate-900/95 backdrop-blur-md z-[10000] border-l border-white/10 p-6 flex flex-col font-mono text-[10px] text-green-400">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <span className="font-black text-white uppercase">System Debug logs</span>
                <button onClick={onClose} className="text-white hover:text-red-500"><i className="fas fa-times"></i></button>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar space-y-2">
                {(window as any).bootLogs?.map((log: string, i: number) => (
                    <div key={i} className="opacity-80 border-b border-white/5 pb-1">{log}</div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 text-white/50 text-[8px] uppercase">
                DHsystem Diagnostics v2.0
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>(() => JSON.parse(localStorage.getItem('questions') || '[]'));
  const [folders, setFolders] = useState<QuestionFolder[]>(() => JSON.parse(localStorage.getItem('question_folders') || '[{"id":"default","name":"Mặc định","createdAt":0}]'));
  const [knowledgeBase, setKnowledgeBase] = useState<VectorChunk[]>(() => JSON.parse(localStorage.getItem('knowledge_base') || '[]'));
  const [notifications, setNotifications] = useState<{ id: number, message: string, type: string }[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    localStorage.setItem('questions', JSON.stringify(questions));
    localStorage.setItem('question_folders', JSON.stringify(folders));
    localStorage.setItem('knowledge_base', JSON.stringify(knowledgeBase));
  }, [questions, folders, knowledgeBase]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            setShowDebug(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showNotify = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  return (
    <Router>
      <div className="flex h-screen bg-slate-50 font-sans overflow-hidden relative">
        <DebugConsole show={showDebug} onClose={() => setShowDebug(false)} />
        <ChangelogModal />
        
        <div className="fixed top-6 right-6 z-[100] space-y-3 pointer-events-none">
            {notifications.map(n => (
                <div key={n.id} className={`px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-4 animate-fade-in-up pointer-events-auto bg-white min-w-[300px] border-${n.type === 'success' ? 'green' : n.type === 'error' ? 'red' : 'blue'}-100`}>
                    <i className={`fas ${n.type === 'success' ? 'fa-check-circle text-green-500' : 'fa-info-circle text-blue-500'}`}></i>
                    <span className="text-sm font-medium text-slate-700">{n.message}</span>
                </div>
            ))}
        </div>

        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-sm overflow-y-auto">
          <div className="p-8">
            <div className="flex items-center gap-3 text-blue-600 font-black">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-100">
                <i className="fas fa-shield-bolt"></i>
              </div>
              <span className="text-xl">E-SafePower</span>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1.5">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5 mb-4 mt-2 opacity-60">Trung tâm quản lý</div>
            <SidebarLink to="/" icon="fa-home" label="Dashboard" />
            <SidebarLink to="/documents" icon="fa-book" label="Thư viện giáo trình" />
            <SidebarLink to="/bank" icon="fa-database" label="Ngân hàng đề thi" />
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5 mt-8 mb-4 opacity-60">Hệ thống AI</div>
            <SidebarLink to="/generate" icon="fa-magic" label="AI Biên soạn đề" />
            <SidebarLink to="/game" icon="fa-gamepad" label="Ôn tập giải trí" />
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-5 mt-8 mb-4 opacity-60">Hỗ trợ</div>
            <SidebarLink to="/guide" icon="fa-circle-info" label="Hướng dẫn" />
            <SidebarLink to="/settings" icon="fa-cog" label="Cài đặt" />
          </nav>

          <div className="p-8 border-t border-slate-100 text-[10px] font-black text-slate-300 text-center uppercase tracking-[0.3em]">
             DH-SYSTEM &copy; 2026
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-auto custom-scrollbar">
                <Routes>
                    <Route path="/" element={<Dashboard questions={questions} knowledgeBase={knowledgeBase} />} />
                    <Route path="/documents" element={<Documents onUpdateKnowledgeBase={(c)=>setKnowledgeBase(p=>[...p,...c])} onNotify={showNotify} />} />
                    <Route path="/generate" element={<QuestionGenerator folders={folders} onSaveQuestions={(q)=>setQuestions(p=>[...p,...q])} onNotify={showNotify}/>} />
                    <Route path="/bank" element={<QuestionBankManager questions={questions} setQuestions={setQuestions} folders={folders} setFolders={setFolders} showNotify={showNotify} />} />
                    <Route path="/game" element={<GameQuiz questions={questions} folders={folders} />} />
                    <Route path="/guide" element={<UserGuide />} />
                    <Route path="/settings" element={<Settings onNotify={showNotify} />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </main>

        <Chatbot knowledgeBase={knowledgeBase} />
      </div>
    </Router>
  );
};

export default App;
