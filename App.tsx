
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Chatbot from './components/Chatbot';
import QuestionGenerator from './components/QuestionGenerator';
import Documents from './components/Documents';
import GameQuiz from './components/GameQuiz';
import UserGuide from './components/UserGuide';
import Settings from './components/Settings';
import QuestionBankManager from './components/QuestionBankManager';
import ChangelogModal from './components/ChangelogModal';
import { Question, VectorChunk, QuestionFolder, AppVersionInfo } from './types';

// Electron integration
const isElectron = navigator.userAgent.toLowerCase().includes(' electron/');
const ipcRenderer = isElectron ? (window as any).require('electron').ipcRenderer : null;

const SidebarLink = ({ to, icon, label }: { to: string, icon: string, label: string }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 font-bold ${
        active 
          ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1' 
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      <i className={`fas ${icon} w-5 text-center text-[16px]`}></i>
      <span className="text-[14px]">{label}</span>
    </Link>
  );
};

const Dashboard = ({ questions, knowledgeBase }: any) => {
    return (
        <div className="p-8 space-y-12 animate-fade-in max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.3em]">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
                    Hệ thống đã sẵn sàng phục vụ
                  </div>
                  <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Xin chào Giảng viên!</h1>
                  <p className="text-slate-500 text-lg font-medium">Bắt đầu quản lý ngân hàng đề và tri thức AI của bạn ngay hôm nay.</p>
                </div>
                <div className="flex gap-4">
                  <Link to="/game" className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all flex items-center gap-3">
                    <i className="fas fa-play"></i> TRUNG TÂM ÔN LUYỆN
                  </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard icon="fa-bolt-lightning" color="blue" label="Câu hỏi an toàn" value={questions.length} />
                <StatCard icon="fa-brain-circuit" color="purple" label="Phân đoạn tri thức" value={knowledgeBase.length} />
                <StatCard icon="fa-book-bookmark" color="orange" label="Bài học" value={JSON.parse(localStorage.getItem('question_folders') || '[]').length} />
                <StatCard icon="fa-leaf" color="green" label="Tài liệu môi trường" value={JSON.parse(localStorage.getItem('elearning_docs') || '[]').length} />
            </div>

            <div className="bg-blue-50 p-12 rounded-[3.5rem] border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-4xl text-blue-600 shrink-0">
                        <i className="fas fa-microchip"></i>
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="text-2xl font-black text-blue-900 mb-2">Trợ lý AI chuyên sâu</h3>
                        <p className="text-blue-700 font-medium leading-relaxed max-w-2xl">
                            Hệ thống AI đã được nạp dữ liệu từ giáo trình môn Nguồn điện an toàn và môi trường. Bạn có thể trò chuyện trực tiếp hoặc yêu cầu AI biên soạn đề thi từ các tài liệu PDF đã tải lên.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, color, label, value }: any) => (
    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl group hover:-translate-y-1">
        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 text-2xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform duration-500 shadow-inner border border-${color}-100/50`}>
            <i className={`fas ${icon}`}></i>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
        <p className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">{value}</p>
    </div>
);

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [folders, setFolders] = useState<QuestionFolder[]>([{"id":"default","name":"Mặc định","createdAt":0}]);
  const [knowledgeBase, setKnowledgeBase] = useState<VectorChunk[]>([]);
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
          }
        } catch (e) { console.error(e); }
      } else {
        setQuestions(JSON.parse(localStorage.getItem('questions') || '[]'));
        setFolders(JSON.parse(localStorage.getItem('question_folders') || '[{"id":"default","name":"Mặc định","createdAt":0}]'));
        setKnowledgeBase(JSON.parse(localStorage.getItem('knowledge_base') || '[]'));
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
    if (ipcRenderer) {
      ipcRenderer.invoke('save-database', { questions, folders, knowledgeBase, lastSync: Date.now() });
    }
  }, [questions, folders, knowledgeBase, isDataLoaded]);

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
        
        <div className="fixed top-12 right-6 z-[100] space-y-3 pointer-events-none">
            {notifications.map(n => (
                <div key={n.id} className={`px-6 py-4 rounded-[1.5rem] shadow-2xl border flex items-center gap-4 animate-fade-in-up pointer-events-auto bg-white min-w-[320px] border-${n.type === 'success' ? 'green' : n.type === 'error' ? 'red' : 'blue'}-100`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${n.type === 'success' ? 'green' : n.type === 'error' ? 'red' : 'blue'}-50`}>
                        <i className={`fas ${n.type === 'success' ? 'fa-check-circle text-green-500' : n.type === 'error' ? 'fa-triangle-exclamation text-red-500' : 'fa-info-circle text-blue-500'}`}></i>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{n.message}</span>
                </div>
            ))}
        </div>

        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-sm overflow-hidden">
          <div className="p-10">
            <div className="flex items-center gap-4 text-blue-600">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-2xl shadow-blue-500/40 transform -rotate-6">
                <i className="fas fa-shield-bolt"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter leading-none">E-SafePower</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">DHsystem Pro</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] px-6 mb-4 mt-6">Trung tâm học thuật</div>
            <SidebarLink to="/" icon="fa-house" label="Tổng quan" />
            <SidebarLink to="/documents" icon="fa-book-open-reader" label="Thư viện giáo trình" />
            <SidebarLink to="/bank" icon="fa-database" label="Ngân hàng đề thi" />
            
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] px-6 mt-10 mb-4">Hệ thống AI</div>
            <SidebarLink to="/generate" icon="fa-wand-sparkles" label="AI Biên soạn" />
            <SidebarLink to="/game" icon="fa-gamepad-modern" label="Ôn luyện Game" />
            
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] px-6 mt-10 mb-4">Hỗ trợ</div>
            <SidebarLink to="/guide" icon="fa-circle-question" label="Hướng dẫn" />
            <SidebarLink to="/settings" icon="fa-sliders" label="Cấu hình" />
          </nav>

          <div className="p-10 border-t border-slate-100">
             <div className="bg-slate-50 p-4 rounded-2xl text-[9px] font-black text-slate-400 text-center uppercase tracking-[0.2em]">
                Phiên bản v2.1.0 LTS
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
                      <Route path="/" element={<Dashboard questions={questions} knowledgeBase={knowledgeBase} />} />
                      <Route path="/documents" element={<Documents onUpdateKnowledgeBase={updateKnowledgeBase} onDeleteDocumentData={deleteKnowledgeByDocId} onNotify={showNotify} />} />
                      <Route path="/generate" element={<QuestionGenerator folders={folders} onSaveQuestions={(q)=>setQuestions(p=>[...p,...q])} onNotify={showNotify}/>} />
                      <Route path="/bank" element={<QuestionBankManager questions={questions} setQuestions={setQuestions} folders={folders} setFolders={setFolders} showNotify={showNotify} />} />
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
