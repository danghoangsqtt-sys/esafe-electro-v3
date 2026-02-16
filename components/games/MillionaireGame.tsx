
import React, { useState } from 'react';
import { Question } from '../../types';
import { formatContent } from '../../utils/textFormatter';

interface MillionaireGameProps {
  questions: Question[];
  onExit: () => void;
}

const MONEY_PYRAMID = [
  "15.000.000", "7.000.000", "4.000.000", "2.500.000", "1.500.000",
  "1.000.000", "600.000", "400.000", "200.000", "100.000"
].reverse();

const MillionaireGame: React.FC<MillionaireGameProps> = ({ questions, onExit }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'PLAYING' | 'CORRECT' | 'WRONG' | 'WIN'>('PLAYING');

  const currentQ = questions[currentIdx];

  const handleSelect = (ans: string) => {
    if (gameState !== 'PLAYING') return;
    setSelectedAns(ans);
    
    setTimeout(() => {
        if (ans === currentQ.correctAnswer) {
            setGameState('CORRECT');
            setTimeout(() => {
                if (currentIdx + 1 < questions.length && currentIdx + 1 < MONEY_PYRAMID.length) {
                    setCurrentIdx(prev => prev + 1);
                    setSelectedAns(null);
                    setGameState('PLAYING');
                } else {
                    setGameState('WIN');
                }
            }, 1500);
        } else {
            setGameState('WRONG');
        }
    }, 1000);
  };

  if (gameState === 'WIN') {
    return (
        <div className="min-h-full bg-slate-950 flex flex-col items-center justify-center text-center p-10 space-y-8 animate-fade-in">
            <div className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center text-slate-900 text-5xl shadow-[0_0_50px_rgba(250,204,21,0.4)] animate-bounce">
                <i className="fas fa-crown"></i>
            </div>
            <h2 className="text-5xl font-black text-white">CHÚC MỪNG TÂN TRIỆU PHÚ!</h2>
            <p className="text-yellow-400 text-2xl font-black tracking-widest">BẠN ĐÃ CHIẾN THẮNG {MONEY_PYRAMID[currentIdx]} ĐIỂM THÀNH TÍCH</p>
            <button onClick={onExit} className="px-16 py-5 bg-white text-slate-900 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">TRỞ VỀ SẢNH CHỜ</button>
        </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 text-white flex flex-col overflow-hidden font-inter relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.1),transparent)] pointer-events-none"></div>
      
      <header className="p-6 border-b border-white/5 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <i className="fas fa-trophy"></i>
             </div>
             <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Mức thưởng hiện tại</p>
                <p className="text-lg font-black text-white tabular-nums">{MONEY_PYRAMID[currentIdx]} <span className="text-[10px] text-slate-500">PT</span></p>
             </div>
          </div>
          <button onClick={onExit} className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-red-500 transition-all">Rút lui</button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10 max-w-6xl mx-auto w-full overflow-y-auto custom-scrollbar">
          {/* Question Box */}
          <div className="w-full relative mb-12">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-blue-500/30 -z-10"></div>
              <div className="bg-slate-900 border-2 border-blue-500/50 p-10 md:p-16 rounded-[4rem] text-center shadow-[0_0_60px_rgba(59,130,246,0.1)] relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">CÂU HỎI {currentIdx + 1}</div>
                  <div className="text-2xl md:text-3xl font-black leading-tight text-blue-50">
                    {formatContent(currentQ.content)}
                  </div>
                  {/* Hiển thị ảnh minh họa */}
                  {(currentQ.image || currentQ.imageUrl) && (
                    <div className="mt-8 flex justify-center">
                        <img 
                            src={currentQ.image || currentQ.imageUrl} 
                            alt="Sơ đồ minh họa" 
                            className="max-h-64 object-contain rounded-xl mx-auto my-4 shadow-md border border-white/10" 
                        />
                    </div>
                  )}
              </div>
          </div>

          {/* Answers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {currentQ.options?.map((opt, i) => {
                  let statusColor = "bg-slate-900 border-blue-500/30 text-white";
                  if (selectedAns === opt) {
                      if (gameState === 'PLAYING') statusColor = "bg-orange-500 border-orange-400 text-white shadow-[0_0_30px_rgba(249,115,22,0.3)] animate-pulse";
                      if (gameState === 'CORRECT') statusColor = "bg-green-600 border-green-400 text-white shadow-[0_0_30px_rgba(34,197,94,0.3)]";
                      if (gameState === 'WRONG') statusColor = "bg-red-600 border-red-400 text-white";
                  } else if (gameState === 'WRONG' && opt === currentQ.correctAnswer) {
                      statusColor = "bg-green-600 border-green-400 text-white animate-pulse";
                  }

                  return (
                    <button 
                        key={i} 
                        onClick={() => handleSelect(opt)}
                        disabled={gameState !== 'PLAYING'}
                        className={`p-6 rounded-full border-2 transition-all text-left flex items-center gap-4 group ${statusColor} hover:scale-[1.02] active:scale-95`}
                    >
                        <span className="text-blue-500 font-black text-sm group-hover:text-white transition">{String.fromCharCode(65+i)}:</span>
                        <span className="font-bold text-sm md:text-md flex-1">{formatContent(opt)}</span>
                    </button>
                  );
              })}
          </div>

          {gameState === 'WRONG' && (
              <div className="mt-10 animate-fade-in-up text-center">
                  <p className="text-red-400 font-black text-xl uppercase tracking-widest mb-4">RẤT TIẾC, ĐÁP ÁN SAI!</p>
                  <button onClick={onExit} className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest">KẾT THÚC LƯỢT CHƠI</button>
              </div>
          )}
      </main>

      {/* Money Sidebar */}
      <div className="hidden lg:flex fixed right-10 top-1/2 -translate-y-1/2 flex-col-reverse gap-2 bg-slate-900/50 p-6 rounded-[3rem] border border-white/5 backdrop-blur-md">
          {MONEY_PYRAMID.map((m, i) => (
              <div key={i} className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${currentIdx === i ? 'bg-orange-500 text-white scale-110 shadow-lg' : i < currentIdx ? 'text-green-500 opacity-40' : 'text-slate-500'}`}>
                  {10 - i}. <span className="ml-2">{m}</span>
              </div>
          ))}
      </div>
    </div>
  );
};

export default MillionaireGame;
