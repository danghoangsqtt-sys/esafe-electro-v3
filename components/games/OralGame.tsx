
import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../../types';
import { evaluateOralAnswer } from '../../services/geminiService';
import { formatContent } from '../../utils/textFormatter';
import SummaryReview from './shared/SummaryReview';

interface OralGameProps {
  questions: Question[];
  onExit: () => void;
}

const OralGame: React.FC<OralGameProps> = ({ questions, onExit }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'PLAYING' | 'SUMMARY'>('PLAYING');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'vi-VN';
      
      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        setTranscript(fullTranscript);
      };
      
      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
        alert("Trình duyệt không hỗ trợ nhận diện giọng nói.");
        return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleEvaluate = async () => {
    if (!transcript.trim()) return;
    
    setIsEvaluating(true);
    if (isRecording) recognitionRef.current.stop();

    try {
      const currentQ = questions[currentIdx];
      const res = await evaluateOralAnswer(currentQ.content, currentQ.correctAnswer, transcript);
      
      const newScores = [...scores, res.score];
      const newAnswers = [...userAnswers, transcript];
      
      setScores(newScores);
      setUserAnswers(newAnswers);

      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(currentIdx + 1);
        setTranscript('');
      } else {
        setGameState('SUMMARY');
      }
    } catch (e) {
      alert("Lỗi đánh giá AI. Vui lòng thử lại.");
    } finally {
      setIsEvaluating(false);
    }
  };

  if (gameState === 'SUMMARY') {
    return (
      <div className="min-h-full bg-slate-950 p-8 overflow-y-auto custom-scrollbar">
        <SummaryReview questions={questions} userAnswers={scores} onExit={onExit} />
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div className="min-h-full bg-slate-950 text-white p-6 md:p-10 flex flex-col items-center justify-center font-inter">
      <div className="w-full max-w-3xl space-y-8 animate-fade-in">
        <header className="flex justify-between items-center mb-4">
           <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">AI Oral Examination Mode</span>
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Q: {currentIdx + 1}/{questions.length}</span>
        </header>

        <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl">
          <h2 className="text-2xl md:text-3xl font-black mb-4 leading-tight">
            {formatContent(currentQ.content)}
          </h2>
          <p className="text-slate-500 text-xs italic">AI sẽ chấm điểm dựa trên độ chính xác kỹ thuật của bạn.</p>
        </div>

        <div className="relative group">
           <textarea 
            value={transcript} 
            onChange={e => setTranscript(e.target.value)} 
            placeholder="Nói hoặc nhập câu trả lời..."
            className="w-full h-56 bg-white/5 border border-white/10 rounded-[2.5rem] p-10 text-lg font-medium outline-none focus:border-blue-500 transition-all resize-none shadow-inner" 
          />
          {isRecording && (
              <div className="absolute top-6 right-8 flex items-center gap-2">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                 <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live Recording</span>
              </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
          <button 
            onClick={toggleRecording} 
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl transform active:scale-90 ${isRecording ? 'bg-red-500 shadow-red-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}
          >
            <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} text-2xl`}></i>
          </button>
          
          <button 
            onClick={handleEvaluate} 
            disabled={isEvaluating || !transcript.trim()} 
            className="px-12 py-5 bg-green-600 hover:bg-green-500 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center gap-3"
          >
            {isEvaluating ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-brain"></i>}
            {isEvaluating ? "AI ĐANG CHẤM ĐIỂM..." : "NỘP BÀI CHO GIẢNG VIÊN AI"}
          </button>
        </div>

        <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest">
            Sử dụng Microphone để tăng hiệu quả ôn luyện
        </p>
      </div>
    </div>
  );
};

export default OralGame;
