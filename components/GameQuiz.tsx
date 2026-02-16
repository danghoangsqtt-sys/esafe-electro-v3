
import React, { useState, useMemo, useEffect } from 'react';
import { Question, QuestionType, QuestionFolder } from '../types';
import TimedChallengeGame from './games/TimedChallengeGame';
import OralGame from './games/OralGame';
import FlashcardGame from './games/FlashcardGame';
import MillionaireGame from './games/MillionaireGame';

interface PlayerProfile {
  name: string;
  className: string;
}

interface GameQuizProps {
  questions: Question[];
  folders: QuestionFolder[];
}

type GameMode = 'LOBBY' | 'TIMED' | 'ORAL' | 'FLASHCARD' | 'MILLIONAIRE';

const GameQuiz: React.FC<GameQuizProps> = ({ questions, folders }) => {
  const [mode, setMode] = useState<GameMode>('LOBBY');
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>(['all']);
  const [questionLimit, setQuestionLimit] = useState<number>(10);
  
  // Player Identification State
  const [currentPlayer, setCurrentPlayer] = useState<PlayerProfile | null>(() => {
    const saved = sessionStorage.getItem('game_player');
    return saved ? JSON.parse(saved) : null;
  });
  const [inputName, setInputName] = useState('');
  const [inputClass, setInputClass] = useState('');

  // Lọc câu hỏi dựa trên cài đặt tại Lobby
  const filteredQuestions = useMemo(() => {
    let base = selectedFolderIds.includes('all') 
      ? questions 
      : questions.filter(q => selectedFolderIds.includes(q.folderId));
    
    if (mode === 'ORAL') {
      base = base.filter(q => q.type === QuestionType.ESSAY);
    }
    
    return [...base].sort(() => 0.5 - Math.random()).slice(0, questionLimit);
  }, [questions, selectedFolderIds, questionLimit, mode]);

  const handleStartGaming = () => {
    if (inputName.trim() && inputClass.trim()) {
      const profile = { name: inputName.trim(), className: inputClass.trim() };
      setCurrentPlayer(profile);
      sessionStorage.setItem('game_player', JSON.stringify(profile));
    }
  };

  const handleLogout = () => {
    setCurrentPlayer(null);
    sessionStorage.removeItem('game_player');
    setInputName('');
    setInputClass('');
  };

  // Màn hình định danh người chơi (Login Screen)
  if (!currentPlayer) {
    return (
      <div className="h-full bg-gradient-to-br from-indigo-900 via-slate-900 to-black flex items-center justify-center p-6 font-inter overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent)] pointer-events-none"></div>
        
        <div className="w-full max-w-xl bg-white rounded-[3.5rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.6)] p-12 relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="text-center space-y-4 mb-10 relative z-10">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-xl shadow-blue-500/20 transform -rotate-6 animate-float">
               <i className="fas fa-gamepad"></i>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">TRUNG TÂM GAME</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Định danh người học để bắt đầu thử thách</p>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên sinh viên</label>
              <div className="relative">
                <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="text" 
                  value={inputName}
                  onChange={e => setInputName(e.target.value)}
                  placeholder="Nhập tên của bạn..."
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lớp / Nhóm học tập</label>
              <div className="relative">
                <i className="fas fa-users absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="text" 
                  value={inputClass}
                  onChange={e => setInputClass(e.target.value)}
                  placeholder="Ví dụ: K65-ĐCN01..."
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button 
              onClick={handleStartGaming}
              disabled={!inputName.trim() || !inputClass.trim()}
              className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-900/10 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3 group"
            >
              BẮT ĐẦU CHƠI NGAY <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between opacity-50">
             <span className="text-[9px] font-black uppercase tracking-widest">Powered by DHsystem Engine</span>
             <i className="fas fa-shield-halved text-blue-500"></i>
          </div>
        </div>
      </div>
    );
  }

  // Điều hướng Game Engine
  if (mode === 'TIMED') {
    return <TimedChallengeGame questions={filteredQuestions} onExit={() => setMode('LOBBY')} />;
  }

  if (mode === 'ORAL') {
    return <OralGame questions={filteredQuestions} onExit={() => setMode('LOBBY')} />;
  }

  if (mode === 'FLASHCARD') {
    return <FlashcardGame questions={filteredQuestions} onExit={() => setMode('LOBBY')} />;
  }

  if (mode === 'MILLIONAIRE') {
    return <MillionaireGame questions={filteredQuestions} onExit={() => setMode('LOBBY')} />;
  }

  return (
    <div className="h-full p-8 bg-gray-50 overflow-y-auto custom-scrollbar font-inter">
      <header className="max-w-6xl mx-auto mb-12 animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-4 text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mb-3">
            <i className="fas fa-gamepad"></i> Trung tâm Giải trí & Học thuật
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Học mà chơi,<br/> <span className="text-blue-600">Chơi mà học</span></h2>
        </div>

        <div className="bg-white px-8 py-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 group transition-all hover:shadow-xl">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl shrink-0 border border-blue-100">
              <i className="fas fa-user-graduate"></i>
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Đang đăng nhập</p>
              <h4 className="font-black text-slate-800 text-sm">{currentPlayer.name} <span className="text-blue-600 font-medium ml-2">— {currentPlayer.className}</span></h4>
           </div>
           <button 
             onClick={handleLogout}
             className="ml-4 w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shadow-inner"
             title="Đổi người chơi"
           >
              <i className="fas fa-right-from-bracket text-xs"></i>
           </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cài đặt trò chơi */}
        <div className="lg:col-span-1 space-y-8 animate-fade-in-up">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-folder-open text-blue-500"></i> Chọn chủ đề ôn tập
                 </label>
                 <select 
                    multiple
                    value={selectedFolderIds}
                    onChange={e => setSelectedFolderIds(Array.from(e.target.selectedOptions, option => option.value))}
                    className="w-full h-48 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all custom-scrollbar"
                 >
                    <option value="all">Tất cả ngân hàng đề</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                 </select>
                 <p className="text-[10px] text-slate-400 italic">Nhấn Ctrl (Cmd) để chọn nhiều chủ đề.</p>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số lượng câu hỏi</label>
                    <span className="font-black text-blue-600 text-lg">{questionLimit}</span>
                 </div>
                 <input 
                    type="range" min="5" max="50" step="5"
                    value={questionLimit}
                    onChange={e => setQuestionLimit(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-full appearance-none accent-blue-600 cursor-pointer"
                 />
              </div>
           </div>
        </div>

        {/* Danh sách các chế độ chơi */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up [animation-delay:0.2s]">
          <GameCard 
            onClick={() => setMode('TIMED')}
            icon="fa-bolt-lightning"
            color="orange"
            title="Thử thách 60s"
            description="Trả lời nhanh nhất có thể trước khi đồng hồ đếm ngược về 0."
            available={filteredQuestions.length >= 5}
          />
          <GameCard 
            onClick={() => setMode('ORAL')}
            icon="fa-microphone"
            color="blue"
            title="Vấn đáp AI"
            description="Trò chuyện với giảng viên AI, trình bày kiến thức bằng giọng nói."
            available={questions.filter(q => q.type === QuestionType.ESSAY).length > 0}
          />
          <GameCard 
            onClick={() => setMode('MILLIONAIRE')}
            icon="fa-money-bill-trend-up"
            color="green"
            title="Ai là triệu phú"
            description="Leo lên đỉnh kim tự tháp kiến thức và nhận điểm thưởng khổng lồ."
            available={questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE).length >= 10}
          />
          <GameCard 
            onClick={() => setMode('FLASHCARD')}
            icon="fa-clone"
            color="purple"
            title="Thẻ ghi nhớ"
            description="Phương pháp học tập chủ động qua các thẻ câu hỏi lật mặt."
            available={questions.length > 0}
          />
          
          <div className="md:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-3xl border border-white/10 shadow-2xl group-hover:rotate-12 transition-transform">
                     <i className="fas fa-trophy text-yellow-400"></i>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                     <h3 className="text-2xl font-black mb-2 tracking-tight">Hệ thống thành tích</h3>
                     <p className="text-slate-400 font-medium text-sm leading-relaxed">Tham gia ôn luyện hàng ngày để tích lũy điểm và mở khóa các huy hiệu học tập cao cấp.</p>
                  </div>
                  <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl active:scale-95">
                     Bảng xếp hạng
                  </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GameCard = ({ onClick, icon, color, title, description, available }: any) => (
  <button 
    onClick={onClick}
    disabled={!available}
    className={`group p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm text-left transition-all hover:shadow-2xl hover:scale-[1.02] active:scale-95 flex flex-col items-start h-full disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed`}
  >
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-2xl transition-all group-hover:rotate-12 bg-${color}-50 text-${color}-600 border border-${color}-100`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight leading-none">{title}</h3>
    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 flex-1">{description}</p>
    <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${available ? `text-${color}-600` : 'text-slate-400'}`}>
       {available ? (
         <>CHƠI NGAY <i className="fas fa-arrow-right animate-bounce-x"></i></>
       ) : (
         <>CHƯA ĐỦ CÂU HỎI <i className="fas fa-lock"></i></>
       )}
    </div>
  </button>
);

export default GameQuiz;
