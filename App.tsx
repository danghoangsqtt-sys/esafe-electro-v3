
import React, { useState, useEffect } from 'react';
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
import { checkAppUpdate } from './services/updateService';

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
    const [hasApiKey, setHasApiKey] = useState(!!localStorage.getItem('manual_api_key'));

    useEffect(() => {
        const checkKey = () => setHasApiKey(!!localStorage.getItem('manual_api_key'));
        window.addEventListener('storage', checkKey);
        return () => window.removeEventListener('storage', checkKey);
    }, []);

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in main-container">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <nav className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 opacity-70">Control Center</nav>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Bảng điều khiển học tập</h1>
                  <p className="text-slate-500 font-medium mt-2">Hệ thống giáo dục chuyên sâu về An toàn điện & Môi trường.</p>
                </div>
            </header>

            {/* API KEY WARNING SECTION */}
            {!hasApiKey && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl shadow-amber-900/5 animate-fade-in-up">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-amber-500 text-3xl shadow-lg border border-amber-100 shrink-0">
                            <i className="fas fa-triangle-exclamation animate-pulse"></i>
                        </div>
                        <div className="flex-1 text-center lg:text-left">
                            <h3 className="text-xl font-black text-amber-900 mb-2">Hệ thống AI chưa được kích hoạt!</h3>
                            <p className="text-sm text-amber-700 font-medium leading-relaxed max-w-2xl">
                                Để sử dụng các tính năng Trợ lý AI, Biên soạn đề thi tự động và Vấn đáp giọng nói, bạn cần cấu hình <strong>Google Gemini API Key</strong>. Đây là dịch vụ miễn phí từ Google dành cho học tập.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                rel="noreferrer"
                                className="bg-white text-amber-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-amber-200 shadow-sm hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-external-link-alt"></i> Lấy mã API miễn phí
                            </a>
                            <Link 
                                to="/settings"
                                className="bg-amber-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-900/20 hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-cog"></i> Cấu hình ngay
                            </Link>
                        </div>
                    </div>
                </div>
            )}

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

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>(() => JSON.parse(localStorage.getItem('questions') || '[]'));
  const [folders, setFolders] = useState<QuestionFolder[]>(() => JSON.parse(localStorage.getItem('question_folders') || '[{"id":"default","name":"Mặc định","createdAt":0}]'));
  const [knowledgeBase, setKnowledgeBase] = useState<VectorChunk[]>(() => JSON.parse(localStorage.getItem('knowledge_base') || '[]'));
  const [notifications, setNotifications] = useState<{ id: number, message: string, type: string }[]>([]);
  const [pendingUpdate, setPendingUpdate] = useState<AppVersionInfo | null>(null);

  // Kiểm tra cập nhật ngầm khi khởi động
  useEffect(() => {
    const silentUpdateCheck = async () => {
      try {
        const info = await checkAppUpdate();
        if (info.isUpdateAvailable) {
          setPendingUpdate(info);
        }
      } catch (e) {
        console.warn("Silent update check failed.");
      }
    };
    silentUpdateCheck();
  }, []);

  useEffect(() => {
    localStorage.setItem('questions', JSON.stringify(questions));
    localStorage.setItem('question_folders', JSON.stringify(folders));
    localStorage.setItem('knowledge_base', JSON.stringify(knowledgeBase));
  }, [questions, folders, knowledgeBase]);

  const showNotify = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  return (
    <Router>
      <div className="flex h-screen bg-slate-50 font-sans overflow-hidden relative">
        <ChangelogModal />
        
        {/* Biểu ngữ thông báo cập nhật mới (Chỉ hiện khi có bản mới) */}
        {pendingUpdate && (
          <div className="fixed top-0 left-0 w-full z-[1000] bg-blue-600 text-white p-2 text-center animate-fade-in flex items-center justify-center gap-4 shadow-xl">
             <i className="fas fa-sparkles text-yellow-300"></i>
             <span className="text-xs font-bold uppercase tracking-widest">Phát hiện phiên bản mới v{pendingUpdate.latestVersion} ({pendingUpdate.releaseDate})</span>
             <Link to="/settings" onClick={() => setPendingUpdate(null)} className="bg-white text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase hover:bg-blue-50 transition-all">Xem ngay</Link>
             <button onClick={() => setPendingUpdate(null)} className="text-white/50 hover:text-white"><i className="fas fa-times"></i></button>
          </div>
        )}

        <div className="fixed top-12 right-6 z-[100] space-y-3 pointer-events-none">
            {notifications.map(n => (
                <div key={n.id} className={`px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-4 animate-fade-in-up pointer-events-auto bg-white min-w-[300px] border-${n.type === 'success' ? 'green' : n.type === 'error' ? 'red' : 'blue'}-100`}>
                    <i className={`fas ${n.type === 'success' ? 'fa-check-circle text-green-500' : n.type === 'error' ? 'fa-exclamation-circle text-red-500' : 'fa-info-circle text-blue-500'}`}></i>
                    <span className="text-sm font-medium text-slate-700">{n.message}</span>
                </div>
            ))}
        </div>

        <aside className={`w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-sm overflow-y-auto ${pendingUpdate ? 'pt-10' : ''}`}>
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

        <main className={`flex-1 flex flex-col h-full overflow-hidden ${pendingUpdate ? 'pt-10' : ''}`}>
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
