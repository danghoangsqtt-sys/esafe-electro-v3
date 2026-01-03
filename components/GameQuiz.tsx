import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Question, QuestionType, QuestionFolder } from '../types';
import { evaluateOralAnswer } from '../services/geminiService';

interface GameQuizProps {
  questions: Question[];
  folders: QuestionFolder[];
}

type GameMode = 'LOBBY' | 'SETUP' | 'MILLIONAIRE' | 'ORAL' | 'FLASHCARD' | 'TIMED';

interface UserInfo {
    name: string;
    className: string;
}

interface ScoreEntry {
  userName: string;
  userClass: string;
  game: string;
  score: number | string;
  date: number;
}

/**
 * Hàm render nội dung có chứa LaTeX và Markdown dùng chung cho Games
 */
const formatContent = (text: string) => {
  if (!text) return null;
  let html = text;

  // 1. Render KaTeX
  html = html.replace(/\$\$(.*?)\$\$/gs, (_, math) => {
    try {
      return (window as any).katex.renderToString(math, { displayMode: true, throwOnError: false });
    } catch (e) { return math; }
  });
  html = html.replace(/\$(.*?)\$/g, (_, math) => {
    try {
      return (window as any).katex.renderToString(math, { displayMode: false, throwOnError: false });
    } catch (e) { return math; }
  });

  // 2. Render Simple Markdown
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black">$1</strong>');
  html = html.replace(/\n/g, '<br />');

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

// --- Timed Challenge Game (Thử Thách 60s) ---
const TimedChallengeGame = ({ userInfo, questions, onExit, onSaveScore }: { userInfo: UserInfo, questions: Question[], onExit: () => void, onSaveScore: (s: string) => void }) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameState, setGameState] = useState<'PLAYING' | 'SUMMARY'>('PLAYING');
    const [scores, setScores] = useState<number[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Voice/Input State
    const [transcript, setTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const timerRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'vi-VN';
            recognitionRef.current.onresult = (event: any) => {
                let current = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    current += event.results[i][0].transcript;
                }
                setTranscript(current);
            };
        }
    }, []);

    useEffect(() => {
        if (gameState === 'PLAYING') {
            setTimeLeft(60);
            startTimer();
        }
        return () => clearInterval(timerRef.current);
    }, [currentIdx, gameState]);

    const startTimer = () => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleTimeOut();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleTimeOut = () => {
        clearInterval(timerRef.current);
        if (isRecording) stopRecording();
        setScores(prev => [...prev, 0]); // Zero score for timeout
        goToNext();
    };

    const goToNext = () => {
        if (currentIdx + 1 < questions.length) {
            setCurrentIdx(prev => prev + 1);
            setTranscript('');
        } else {
            setGameState('SUMMARY');
        }
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) return;
        if (isRecording) {
            stopRecording();
        } else {
            setTranscript('');
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const stopRecording = () => {
        recognitionRef.current.stop();
        setIsRecording(false);
    };

    const handleMultipleChoice = (selected: string) => {
        if (isProcessing) return;
        clearInterval(timerRef.current);
        const correct = questions[currentIdx].correctAnswer;
        const score = selected === correct ? 10 : 0;
        setScores(prev => [...prev, score]);
        goToNext();
    };

    const handleEssaySubmit = async () => {
        if (!transcript.trim() || isProcessing) return;
        clearInterval(timerRef.current);
        if (isRecording) stopRecording();
        setIsProcessing(true);
        
        try {
            const currentQ = questions[currentIdx];
            const result = await evaluateOralAnswer(currentQ.content, currentQ.correctAnswer, transcript);
            setScores(prev => [...prev, result.score]);
        } catch (e) {
            setScores(prev => [...prev, 0]);
        } finally {
            setIsProcessing(false);
            goToNext();
        }
    };

    useEffect(() => {
        if (gameState === 'SUMMARY') {
            const total = scores.reduce((a, b) => a + b, 0);
            const avg = (total / questions.length).toFixed(1);
            onSaveScore(`Thử thách 60s: ${avg}/10`);
        }
    }, [gameState]);

    if (gameState === 'SUMMARY') {
        const totalScore = scores.reduce((a, b) => a + b, 0);
        const avgScore = (totalScore / questions.length).toFixed(1);
        return (
            <div className="min-h-full bg-slate-900 flex items-center justify-center p-6 text-white font-inter">
                <div className="bg-slate-800 p-12 rounded-[3.5rem] border border-white/10 text-center max-w-2xl shadow-2xl">
                    <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce shadow-[0_0_50px_rgba(249,115,22,0.4)]">
                        <i className="fas fa-bolt text-4xl"></i>
                    </div>
                    <h2 className="text-4xl font-black mb-4">THỬ THÁCH HOÀN TẤT</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-12">{userInfo.name} - {userInfo.className}</p>
                    
                    <div className="grid grid-cols-2 gap-6 mb-12">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <p className="text-[10px] text-orange-400 font-black uppercase mb-1">Tổng điểm</p>
                            <p className="text-4xl font-black">{totalScore}</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <p className="text-[10px] text-blue-400 font-black uppercase mb-1">Trung bình</p>
                            <p className="text-4xl font-black">{avgScore}/10</p>
                        </div>
                    </div>

                    <button onClick={onExit} className="w-full py-5 bg-orange-600 rounded-2xl font-black hover:bg-orange-500 transition shadow-xl uppercase tracking-widest">KẾT THÚC</button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentIdx];

    return (
        <div className="min-h-full bg-slate-950 text-white flex flex-col font-inter">
            {/* Top Bar with Timer */}
            <div className="p-6 flex justify-between items-center border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={onExit} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
                        <i className="fas fa-times"></i>
                    </button>
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tiến độ</div>
                        <div className="font-black">{currentIdx + 1} / {questions.length}</div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <div className={`text-4xl font-black font-mono transition-colors ${timeLeft < 10 ? 'text-red-500 scale-125 animate-pulse' : 'text-orange-500'}`}>
                        {timeLeft}<span className="text-sm ml-1">S</span>
                    </div>
                    <div className="w-48 h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ${timeLeft < 10 ? 'bg-red-500' : 'bg-orange-500'}`} 
                            style={{ width: `${(timeLeft / 60) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loại câu hỏi</div>
                    <div className={`font-black ${currentQ.type === QuestionType.MULTIPLE_CHOICE ? 'text-blue-400' : 'text-purple-400'}`}>
                        {currentQ.type === QuestionType.MULTIPLE_CHOICE ? 'TRẮC NGHIỆM' : 'TỰ LUẬN'}
                    </div>
                </div>
            </div>

            <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
                <div className="w-full text-center space-y-6 mb-12">
                    <div className="text-2xl md:text-4xl font-black leading-tight math-content">
                        {formatContent(currentQ.content)}
                    </div>
                </div>

                {currentQ.type === QuestionType.MULTIPLE_CHOICE ? (
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQ.options?.map((opt, i) => (
                            <button 
                                key={i}
                                onClick={() => handleMultipleChoice(opt)}
                                disabled={isProcessing}
                                className="p-6 bg-slate-900 border-2 border-white/5 hover:border-orange-500 hover:bg-slate-800 rounded-3xl text-left transition-all flex items-center group"
                            >
                                <span className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-black text-orange-500 mr-4 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                    {String.fromCharCode(65 + i)}
                                </span>
                                <div className="font-bold math-content">{formatContent(opt)}</div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="w-full space-y-6">
                        <div className="relative">
                            <textarea 
                                value={transcript}
                                onChange={(e) => setTranscript(e.target.value)}
                                placeholder="Trả lời câu hỏi tự luận bằng giọng nói hoặc gõ phím..."
                                className="w-full h-40 bg-white/5 border-2 border-white/10 rounded-[2rem] p-6 text-lg font-medium outline-none focus:border-orange-500 transition-all resize-none"
                            />
                            <button 
                                onClick={toggleRecording}
                                className={`absolute bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-orange-600 hover:bg-orange-500'}`}
                            >
                                <i className={`fas ${isRecording ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                            </button>
                        </div>
                        <button 
                            disabled={!transcript.trim() || isProcessing}
                            onClick={handleEssaySubmit}
                            className="w-full py-5 bg-orange-600 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-orange-500 disabled:opacity-50 transition-all"
                        >
                            {isProcessing ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-check-circle mr-2"></i>}
                            XÁC NHẬN TRẢ LỜI
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

// --- Flashcard Game (Thẻ Ghi Nhớ) ---
const FlashcardGame = ({ questions, onExit }: { questions: Question[], onExit: () => void }) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleNext = () => {
        if (currentIdx < questions.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIdx(currentIdx + 1), 150);
        }
    };

    const handlePrev = () => {
        if (currentIdx > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIdx(currentIdx - 1), 150);
        }
    };

    const q = questions[currentIdx];

    return (
        <div className="min-h-full bg-slate-50 flex flex-col items-center p-8 animate-fade-in font-inter overflow-hidden">
            <header className="w-full max-w-4xl flex justify-between items-center mb-12">
                <button onClick={onExit} className="bg-white hover:bg-gray-100 px-6 py-2 rounded-xl border border-gray-200 font-black text-[10px] uppercase tracking-widest transition shadow-sm text-gray-500">
                    <i className="fas fa-arrow-left mr-2"></i> Trở về
                </button>
                <div className="text-center">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Thẻ Ghi Nhớ</h2>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">{currentIdx + 1} / {questions.length} Thẻ</p>
                </div>
                <div className="w-[80px]"></div> {/* Spacer */}
            </header>

            <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center gap-12">
                {/* 3D Card Container */}
                <div 
                    className="w-full aspect-[4/3] perspective-1000 cursor-pointer group"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                        {/* Front Side */}
                        <div className="absolute inset-0 backface-hidden bg-white rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col p-12 items-center justify-center text-center">
                            <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8">Câu hỏi</span>
                            <div className="text-2xl md:text-3xl font-bold text-slate-800 leading-relaxed math-content">
                                {formatContent(q?.content)}
                            </div>
                            <div className="mt-auto pt-8 flex items-center gap-2 text-gray-300 font-bold text-[10px] uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                                <i className="fas fa-sync-alt animate-spin-slow"></i> Chạm để lật xem đáp án
                            </div>
                        </div>

                        {/* Back Side */}
                        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] shadow-2xl rotate-y-180 flex flex-col p-12 items-center justify-center text-center text-white">
                            <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8">Đáp án đúng</span>
                            <div className="bg-white/10 p-8 rounded-3xl border border-white/20 w-full mb-6">
                                <div className="text-2xl md:text-4xl font-black math-content">
                                    {formatContent(q?.correctAnswer)}
                                </div>
                            </div>
                            {q?.explanation && (
                                <div className="max-w-md">
                                    <div className="text-xs text-blue-100 italic leading-relaxed">
                                        <span className="font-black not-italic opacity-50 uppercase mr-1">Giải thích:</span> 
                                        {formatContent(q.explanation)}
                                    </div>
                                </div>
                            )}
                            <div className="mt-auto pt-8 text-[10px] font-black text-blue-200/50 uppercase tracking-widest">
                                Chạm để quay lại câu hỏi
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-8">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        disabled={currentIdx === 0}
                        className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-sm"
                    >
                        <i className="fas fa-chevron-left text-xl"></i>
                    </button>
                    
                    <div className="flex gap-2">
                        {questions.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentIdx ? 'bg-blue-600 scale-150' : 'bg-gray-200'}`}></div>
                        ))}
                    </div>

                    <button 
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        disabled={currentIdx === questions.length - 1}
                        className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 hover:shadow-2xl shadow-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        <i className="fas fa-chevron-right text-xl"></i>
                    </button>
                </div>
            </div>

            {currentIdx === questions.length - 1 && isFlipped && (
                <div className="mt-12 animate-fade-in-up">
                    <button 
                        onClick={onExit}
                        className="bg-green-600 text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-green-700 transition-all transform hover:scale-105"
                    >
                        Hoàn thành buổi học
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Oral Game (Vấn Đáp AI) ---
const OralGame = ({ userInfo, questions, onExit, onSaveScore }: { userInfo: UserInfo, questions: Question[], onExit: () => void, onSaveScore: (s: string) => void }) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [evaluation, setEvaluation] = useState<{score: number, feedback: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [scores, setScores] = useState<number[]>([]);
    const [gameState, setGameState] = useState<'PLAYING' | 'SUMMARY'>('PLAYING');

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'vi-VN';

            recognitionRef.current.onresult = (event: any) => {
                let current = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    current += event.results[i][0].transcript;
                }
                setTranscript(current);
            };

            recognitionRef.current.onerror = () => setIsRecording(false);
            recognitionRef.current.onend = () => setIsRecording(false);
        }
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) return alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            setTranscript('');
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const handleEvaluate = async () => {
        if (!transcript.trim() || isLoading) return;
        setIsLoading(true);
        try {
            const currentQ = questions[currentIdx];
            const result = await evaluateOralAnswer(currentQ.content, currentQ.correctAnswer, transcript);
            setEvaluation(result);
            setScores([...scores, result.score]);
        } catch (e) {
            alert("Lỗi khi chấm điểm AI.");
        } finally {
            setIsLoading(false);
        }
    };

    const nextQuestion = () => {
        if (currentIdx + 1 < questions.length) {
            setCurrentIdx(currentIdx + 1);
            setTranscript('');
            setEvaluation(null);
        } else {
            setGameState('SUMMARY');
            const total = scores.reduce((a, b) => a + b, 0);
            const avg = (total / questions.length).toFixed(1);
            onSaveScore(`Trung bình ${avg}/10`);
        }
    };

    if (gameState === 'SUMMARY') {
        const avgScore = (scores.reduce((a, b) => a + b, 0) / questions.length).toFixed(1);
        return (
            <div className="min-h-full bg-slate-950 flex items-center justify-center p-6 animate-fade-in text-white">
                <div className="bg-slate-900 p-12 rounded-[3rem] border border-blue-500/30 text-center max-w-2xl shadow-2xl">
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(37,99,235,0.4)]">
                        <i className="fas fa-award text-4xl"></i>
                    </div>
                    <h2 className="text-4xl font-black mb-2">HOÀN THÀNH VẤN ĐÁP</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-12">{userInfo.name} - {userInfo.className}</p>
                    
                    <div className="grid grid-cols-2 gap-8 mb-12">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <p className="text-[10px] text-blue-400 font-black uppercase mb-1">Số câu trả lời</p>
                            <p className="text-3xl font-black">{questions.length}</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <p className="text-[10px] text-green-400 font-black uppercase mb-1">Điểm trung bình</p>
                            <p className="text-3xl font-black text-green-400">{avgScore}/10</p>
                        </div>
                    </div>

                    <button onClick={onExit} className="w-full py-5 bg-blue-600 rounded-2xl font-black hover:bg-blue-700 transition shadow-xl uppercase tracking-widest">TRỞ VỀ TRUNG TÂM</button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentIdx];

    return (
        <div className="min-h-full bg-slate-950 text-white p-8 flex flex-col animate-fade-in font-inter">
             <header className="flex justify-between items-center mb-12">
                 <button onClick={onExit} className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-xl border border-white/10 font-black text-[10px] uppercase tracking-widest transition">
                    <i className="fas fa-arrow-left mr-2"></i> Thoát
                 </button>
                 <div className="flex gap-2">
                    {questions.map((_, i) => (
                        <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${i === currentIdx ? 'bg-blue-500 w-12' : i < scores.length ? 'bg-green-500' : 'bg-white/10'}`}></div>
                    ))}
                 </div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-blue-400">Câu hỏi {currentIdx + 1}/{questions.length}</div>
             </header>

             <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col items-center justify-center space-y-10">
                 <div className="text-center space-y-4">
                    <span className="bg-blue-600/20 text-blue-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-blue-500/20">Giám khảo AI đang đặt câu hỏi</span>
                    <div className="text-3xl md:text-4xl font-black leading-tight math-content">
                        {formatContent(currentQ?.content)}
                    </div>
                 </div>

                 <div className="w-full space-y-6">
                    <div className="relative">
                        <textarea 
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Nhấn vào biểu tượng Micro và bắt đầu nói câu trả lời của bạn..."
                            className="w-full h-48 bg-white/5 border-2 border-white/10 rounded-[2.5rem] p-8 text-lg font-medium outline-none focus:border-blue-500 transition-all resize-none"
                        />
                        <button 
                            onClick={toggleRecording}
                            className={`absolute bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl ${isRecording ? 'bg-red-500 animate-pulse scale-110' : 'bg-blue-600 hover:bg-blue-500'}`}
                        >
                            <i className={`fas ${isRecording ? 'fa-microphone-slash' : 'fa-microphone'} text-xl`}></i>
                        </button>
                    </div>

                    {!evaluation ? (
                        <button 
                            disabled={!transcript.trim() || isLoading}
                            onClick={handleEvaluate}
                            className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 uppercase tracking-widest"
                        >
                            {isLoading ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : <i className="fas fa-robot mr-2"></i>} 
                            Gửi câu trả lời cho AI chấm điểm
                        </button>
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 animate-fade-in-up">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black ${evaluation.score >= 8 ? 'bg-green-500 text-white' : evaluation.score >= 5 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {evaluation.score}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đánh giá của AI</p>
                                        <p className={`font-bold ${evaluation.score >= 8 ? 'text-green-400' : evaluation.score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {evaluation.score >= 8 ? 'Xuất sắc' : evaluation.score >= 5 ? 'Đạt yêu cầu' : 'Chưa đạt'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={nextQuestion} className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-black text-sm transition">Tiếp tục <i className="fas fa-chevron-right ml-2"></i></button>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-sm italic text-gray-300">
                                    <span className="text-blue-400 font-bold not-italic">Nhận xét:</span> {evaluation.feedback}
                                </div>
                                <div className="p-4 bg-blue-900/20 rounded-2xl border border-blue-500/20 text-sm math-content">
                                    <span className="text-blue-400 font-bold">Đáp án chuẩn:</span> {formatContent(currentQ.correctAnswer)}
                                </div>
                            </div>
                        </div>
                    )}
                 </div>
             </div>
        </div>
    );
};

// --- Millionaire Game ---
const MillionaireGame = ({ userInfo, questions, onExit, onSaveScore }: { userInfo: UserInfo, questions: Question[], onExit: () => void, onSaveScore: (s: string) => void }) => {
    const [currentLevel, setCurrentLevel] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [gameState, setGameState] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');
    const [lifelines, setLifelines] = useState({ fifty: true, audience: true, call: true });
    const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
    const [visibleOptions, setVisibleOptions] = useState<string[]>([]);
    const [showHint, setShowHint] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
    const [answerResult, setAnswerResult] = useState<'CORRECT' | 'WRONG' | null>(null);

    const moneyTree = [
        "200,000", "400,000", "600,000", "1,000,000", "2,000,000", 
        "3,000,000", "6,000,000", "10,000,000", "14,000,000", "22,000,000", 
        "30,000,000", "40,000,000", "60,000,000", "85,000,000", "150,000,000"
    ];

    useEffect(() => {
        const shuffled = [...questions].sort(() => 0.5 - Math.random());
        setGameQuestions(shuffled);
        if (shuffled.length > 0) setVisibleOptions(shuffled[0].options || []);
    }, [questions]);

    useEffect(() => {
        if (gameQuestions.length > 0 && currentLevel < gameQuestions.length) {
            setVisibleOptions(gameQuestions[currentLevel].options || []);
            setSelectedOption(null);
            setShowHint(null);
            setIsConfirming(false);
            setAnswerResult(null);
            setIsProcessingAnswer(false);
        }
    }, [currentLevel, gameQuestions]);

    const handleSelect = (opt: string) => {
        if (gameState !== 'PLAYING' || isConfirming || isProcessingAnswer) return;
        setSelectedOption(opt);
        setIsConfirming(true);
    };

    const handleConfirm = () => {
        if (!selectedOption || isProcessingAnswer) return;
        setIsProcessingAnswer(true);
        const correct = gameQuestions[currentLevel].correctAnswer;
        
        setTimeout(() => {
            if (selectedOption === correct) {
                setAnswerResult('CORRECT');
                setTimeout(() => {
                    if (currentLevel + 1 >= gameQuestions.length) {
                        setGameState('WON');
                        onSaveScore(`Chiến thắng (${gameQuestions.length}/${gameQuestions.length})`);
                    } else {
                        setCurrentLevel(prev => prev + 1);
                    }
                }, 1500);
            } else {
                setAnswerResult('WRONG');
                setTimeout(() => {
                    setGameState('LOST');
                    onSaveScore(`Dừng tại câu ${currentLevel + 1}`);
                }, 2000);
            }
        }, 1200);
    };

    const currentQ = gameQuestions[currentLevel];

    return (
        <div className="min-h-full bg-[#020617] text-white p-6 flex flex-col md:flex-row overflow-hidden relative animate-fade-in font-inter">
             <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[60%] bg-blue-600 rounded-full blur-[150px]"></div>
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[60%] bg-indigo-900 rounded-full blur-[150px]"></div>
             </div>

             <button onClick={onExit} className="absolute top-6 left-6 z-20 text-blue-400 hover:text-white font-black text-[10px] flex items-center gap-2 bg-blue-950/60 px-4 py-2 rounded-xl border border-blue-900 shadow-lg backdrop-blur-md uppercase tracking-widest">
                <i className="fas fa-door-open"></i> Thoát
             </button>

             {gameState !== 'PLAYING' && (
                 <div className="absolute inset-0 z-50 bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center animate-fade-in">
                     <div className="bg-[#0b0f2a] p-12 rounded-[3.5rem] border-2 border-yellow-500/50 text-center max-w-md shadow-[0_0_80px_rgba(234,179,8,0.15)]">
                         <h2 className={`text-4xl font-black mb-4 ${gameState === 'WON' ? 'text-yellow-400' : 'text-blue-400'}`}>
                             {gameState === 'WON' ? 'CHIẾN THẮNG!' : 'KẾT THÚC'}
                         </h2>
                         <p className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-[0.3em]">{userInfo.name}</p>
                         <div className="text-5xl font-black text-white mb-12">
                             {currentLevel}/{gameQuestions.length}
                         </div>
                         <button onClick={onExit} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-500 transition shadow-2xl uppercase tracking-widest">TRỞ VỀ</button>
                     </div>
                 </div>
             )}

             <div className="flex-1 flex flex-col justify-end items-center pb-12 z-10 relative">
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-4 bg-black/40 p-3 rounded-full border border-white/10 backdrop-blur-md">
                     {Object.entries(lifelines).map(([id, active]) => (
                        <button 
                            key={id}
                            disabled={!active || isConfirming || isProcessingAnswer}
                            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${!active ? 'border-slate-800 text-slate-800 opacity-20' : 'border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white shadow-lg'}`}
                            onClick={() => {
                                setLifelines(prev => ({...prev, [id]: false}));
                                if (id === 'fifty') {
                                    const currentQ = gameQuestions[currentLevel];
                                    const wrong = (currentQ.options || []).filter(o => o !== currentQ.correctAnswer).sort(() => 0.5 - Math.random()).slice(0, 2);
                                    setVisibleOptions((currentQ.options || []).map(o => wrong.includes(o) ? "" : o));
                                } else {
                                    setShowHint(id === 'call' ? `Người thân AI: "Mình tin chắc đáp án là ${currentQ.correctAnswer}"` : `Đa số khán giả chọn: ${currentQ.correctAnswer}`);
                                }
                            }}
                        >
                            <i className={`fas ${id === 'fifty' ? 'fa-percentage' : id === 'call' ? 'fa-robot' : 'fa-users'}`}></i>
                        </button>
                     ))}
                 </div>

                 {showHint && (
                     <div className="bg-blue-900/80 p-6 rounded-2xl border border-yellow-500/30 mb-8 max-w-lg text-center animate-fade-in">
                         <div className="text-blue-50 text-sm italic">"{formatContent(showHint)}"</div>
                     </div>
                 )}

                 <div className="w-full max-w-4xl bg-gradient-to-r from-transparent via-blue-900/60 to-transparent border-y-2 border-blue-500/40 py-10 px-12 text-center mb-12 shadow-2xl">
                     <div className="text-blue-400 text-[10px] font-black uppercase tracking-[0.5em] mb-4">CÂU HỎI SỐ {currentLevel + 1} / {gameQuestions.length}</div>
                     <div className="text-2xl md:text-3xl font-bold text-white math-content">{formatContent(currentQ?.content)}</div>
                 </div>

                 <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 px-6">
                     {(currentQ?.options || []).map((opt, idx) => {
                         const isVisible = visibleOptions[idx] !== "";
                         const isSelected = selectedOption === opt;
                         const isCorrect = opt === currentQ.correctAnswer;
                         
                         let btnStyle = "bg-[#0b0f2a]/80 border-blue-900/50 hover:border-blue-400";
                         if (isSelected) {
                            if (answerResult === 'CORRECT') btnStyle = "bg-green-600 border-green-400 animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.5)]";
                            else if (answerResult === 'WRONG') btnStyle = "bg-red-600 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]";
                            else btnStyle = "bg-orange-500 border-orange-400 animate-pulse";
                         } else if (answerResult !== null && isCorrect) {
                            btnStyle = "bg-green-600 border-green-400";
                         }

                         return (
                             <button 
                                key={idx} 
                                onClick={() => isVisible && handleSelect(opt)}
                                disabled={!isVisible || isProcessingAnswer || gameState !== 'PLAYING'}
                                className={`py-5 px-10 border-2 rounded-full flex items-center transition-all ${btnStyle} ${!isVisible ? 'opacity-0 cursor-default' : 'hover:scale-105'}`}
                             >
                                 <span className="text-yellow-500 font-black mr-4 italic">{String.fromCharCode(65 + idx)}:</span>
                                 <div className="font-bold text-left text-sm flex-1 truncate math-content">{formatContent(opt)}</div>
                             </button>
                         )
                     })}
                 </div>

                 {isConfirming && !isProcessingAnswer && (
                     <button onClick={handleConfirm} className="mt-10 px-12 py-3 bg-yellow-500 text-slate-900 font-black rounded-full hover:bg-yellow-400 transition-all transform hover:scale-110 shadow-xl uppercase tracking-widest border-b-4 border-yellow-700">
                        Chốt đáp án
                     </button>
                 )}
             </div>

             <div className="w-full md:w-72 bg-black/40 border-l border-white/5 flex flex-col justify-center p-6 text-[10px] backdrop-blur-lg">
                 <div className="flex-1 flex flex-col-reverse justify-center gap-1.5">
                    {moneyTree.slice(0, gameQuestions.length).map((money, idx) => {
                        const isActive = idx === currentLevel;
                        const isMilestone = (idx + 1) % 5 === 0;
                        return (
                            <div key={idx} className={`flex justify-between py-1.5 px-4 rounded-lg ${isActive ? 'bg-orange-500 text-white font-black scale-105 shadow-lg' : isMilestone ? 'text-white font-bold' : 'text-blue-300/40'}`}>
                                <span>{idx + 1}</span>
                                <span>{money}</span>
                            </div>
                        )
                    })}
                 </div>
             </div>
        </div>
    );
};

// --- Main Container ---
const GameQuiz: React.FC<GameQuizProps> = ({ questions, folders }) => {
  const [mode, setMode] = useState<GameMode>('LOBBY');
  const [targetGame, setTargetGame] = useState<GameMode>('LOBBY');
  
  // Game Configuration State
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>(['all']);
  const [questionLimit, setQuestionLimit] = useState<number>(10);
  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
      const saved = localStorage.getItem('last_user_info');
      return saved ? JSON.parse(saved) : { name: '', className: '' };
  });

  const [highScores, setHighScores] = useState<ScoreEntry[]>(() => {
      const saved = localStorage.getItem('game_scores');
      return saved ? JSON.parse(saved) : [];
  });

  // Questions filtered based on setup
  const filteredQuestions = useMemo(() => {
    let base = questions;
    if (!selectedFolderIds.includes('all')) {
        base = questions.filter(q => selectedFolderIds.includes(q.folderId));
    }
    
    if (targetGame === 'MILLIONAIRE' || targetGame === 'FLASHCARD') {
        base = base.filter(q => q.type === QuestionType.MULTIPLE_CHOICE);
    } else if (targetGame === 'ORAL') {
        base = base.filter(q => q.type === QuestionType.ESSAY);
    }

    return [...base].sort(() => 0.5 - Math.random()).slice(0, questionLimit);
  }, [questions, selectedFolderIds, questionLimit, targetGame]);

  /* Removed redundant maxAvailable useMemo block to resolve type errors on line 810 and 812 */

  // Re-calculate maxAvailable properly
  const calculatedMax = useMemo(() => {
    let base = questions;
    if (!selectedFolderIds.includes('all')) {
        base = questions.filter(q => selectedFolderIds.includes(q.folderId));
    }
    if (targetGame === 'MILLIONAIRE' || targetGame === 'FLASHCARD') {
        return base.filter(q => q.type === QuestionType.MULTIPLE_CHOICE).length;
    } else if (targetGame === 'ORAL') {
        return base.filter(q => q.type === QuestionType.ESSAY).length;
    }
    return base.length;
  }, [questions, selectedFolderIds, targetGame]);

  const saveScore = (game: string, score: number | string) => {
      const newEntry: ScoreEntry = { 
          userName: userInfo.name || 'Ẩn danh',
          userClass: userInfo.className || 'Tự do',
          game, score, date: Date.now() 
      };
      const updated = [newEntry, ...highScores].slice(0, 50);
      setHighScores(updated);
      localStorage.setItem('game_scores', JSON.stringify(updated));
      localStorage.setItem('last_user_info', JSON.stringify(userInfo));
  };

  const startSetup = (game: GameMode) => {
      setTargetGame(game);
      setMode('SETUP');
      // Set reasonable defaults for each game type
      if (game === 'MILLIONAIRE') setQuestionLimit(Math.min(15, 15));
      else if (game === 'FLASHCARD') setQuestionLimit(Math.min(20, 20));
      else if (game === 'TIMED') setQuestionLimit(Math.min(10, 10));
      else setQuestionLimit(Math.min(5, 5));
  };

  const toggleFolder = (id: string) => {
      if (id === 'all') {
          setSelectedFolderIds(['all']);
          return;
      }
      setSelectedFolderIds(prev => {
          const withoutAll = prev.filter(p => p !== 'all');
          if (withoutAll.includes(id)) {
              const res = withoutAll.filter(p => p !== id);
              return res.length === 0 ? ['all'] : res;
          } else {
              return [...withoutAll, id];
          }
      });
  };

  // Helper to count questions in a folder for the specific target game
  const getQuestionCountForFolder = (folderId: string | 'all') => {
      let base = questions;
      if (folderId !== 'all') {
          base = questions.filter(q => q.folderId === folderId);
      }
      
      if (targetGame === 'MILLIONAIRE' || targetGame === 'FLASHCARD') {
          return base.filter(q => q.type === QuestionType.MULTIPLE_CHOICE).length;
      } else if (targetGame === 'ORAL') {
          return base.filter(q => q.type === QuestionType.ESSAY).length;
      }
      return base.length;
  };

  if (mode === 'SETUP') {
      return (
          <div className="h-full bg-gray-50 flex items-center justify-center p-6 animate-fade-in overflow-hidden">
              <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                  <header className="p-8 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white shrink-0">
                      <div>
                          <h3 className="text-2xl font-black uppercase tracking-tight">Cấu hình trận đấu</h3>
                          <p className="text-xs font-bold text-blue-100 uppercase mt-1">
                            Trò chơi: {targetGame === 'MILLIONAIRE' ? 'Ai là Triệu Phú' : targetGame === 'ORAL' ? 'Vấn Đáp AI' : targetGame === 'FLASHCARD' ? 'Thẻ Ghi Nhớ' : targetGame === 'TIMED' ? 'Thử Thách 60s' : 'Ôn tập'}
                          </p>
                      </div>
                      <button onClick={() => setMode('LOBBY')} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition">
                          <i className="fas fa-times"></i>
                      </button>
                  </header>

                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                      {/* User Info Section */}
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">Họ tên người chơi</label>
                              <input 
                                type="text" 
                                value={userInfo.name} 
                                onChange={e => setUserInfo({...userInfo, name: e.target.value})}
                                placeholder="Vd: Nguyễn Văn A"
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:border-blue-500 shadow-sm"
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">Lớp / Đơn vị</label>
                              <input 
                                type="text" 
                                value={userInfo.className} 
                                onChange={e => setUserInfo({...userInfo, className: e.target.value})}
                                placeholder="Vd: Điện K21"
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:border-blue-500 shadow-sm"
                              />
                          </div>
                      </div>

                      {/* Multi-Folder Selection List Section */}
                      <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">Chọn nguồn câu hỏi (Nhiều thư mục)</label>
                            <span className="text-[9px] font-black text-blue-500 uppercase italic">Bạn có thể chọn một hoặc nhiều bài học để ôn tập</span>
                          </div>
                          
                          <div className="bg-gray-50 rounded-[2.5rem] border border-gray-100 p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                              <div className="space-y-1.5">
                                  {/* All Folders Option */}
                                  <button 
                                      onClick={() => toggleFolder('all')}
                                      className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all ${selectedFolderIds.includes('all') ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-white/60 border border-gray-200/50 shadow-sm'}`}
                                  >
                                      <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selectedFolderIds.includes('all') ? 'bg-white/20' : 'bg-blue-50 text-blue-500'}`}>
                                              <i className="fas fa-globe-asia"></i>
                                          </div>
                                          <div className="text-left">
                                              <p className="font-black text-sm uppercase tracking-tight">Tất cả bài học</p>
                                              <p className={`text-[9px] font-bold ${selectedFolderIds.includes('all') ? 'text-blue-100' : 'text-gray-400'}`}>Sử dụng toàn bộ kho lưu trữ</p>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <span className={`text-[10px] font-black px-3 py-1 rounded-full ${selectedFolderIds.includes('all') ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}>
                                              {getQuestionCountForFolder('all')} CÂU
                                          </span>
                                          {selectedFolderIds.includes('all') && <i className="fas fa-check-circle text-white"></i>}
                                      </div>
                                  </button>

                                  <div className="h-2"></div>
                                  <div className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Thư mục đề thi</div>

                                  {/* Individual Folders */}
                                  {folders.map(f => {
                                      const isSelected = selectedFolderIds.includes(f.id);
                                      const count = getQuestionCountForFolder(f.id);
                                      return (
                                          <button 
                                              key={f.id}
                                              onClick={() => toggleFolder(f.id)}
                                              className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-white/60 border border-gray-200/50 shadow-sm'}`}
                                          >
                                              <div className="flex items-center gap-4">
                                                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-indigo-50 text-indigo-500'}`}>
                                                      <i className="fas fa-folder"></i>
                                                  </div>
                                                  <div className="text-left">
                                                      <p className="font-bold text-sm truncate max-w-[250px]">{f.name}</p>
                                                      <p className={`text-[9px] font-bold ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>Bài học chuyên đề</p>
                                                  </div>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                  <span className={`text-[10px] font-black px-3 py-1 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                                      {count} CÂU
                                                  </span>
                                                  {isSelected && <i className="fas fa-check-circle text-white"></i>}
                                              </div>
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      </div>

                      {/* Question Limit Slider Section */}
                      <div className="space-y-4">
                          <div className="flex justify-between items-end">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">Số lượng câu hỏi lượt này</label>
                              <span className="text-2xl font-black text-blue-600">{questionLimit} <span className="text-[10px] text-gray-400">/ {calculatedMax} CÂU KHẢ DỤNG</span></span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max={calculatedMax || 1} 
                            value={questionLimit} 
                            onChange={e => setQuestionLimit(parseInt(e.target.value))}
                            className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600 shadow-inner"
                          />
                          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                             <p className="text-[10px] text-blue-700 font-bold leading-relaxed flex items-start gap-2">
                                <i className="fas fa-info-circle mt-0.5"></i>
                                <span>{targetGame === 'TIMED' ? 'Trận đấu 60s sẽ chọn ngẫu nhiên cả trắc nghiệm và tự luận từ danh sách thư mục bạn đã chọn.' : targetGame === 'ORAL' ? 'Hệ thống sẽ chỉ lấy các câu Tự luận từ nguồn bạn chọn để phục vụ thi Vấn đáp AI.' : 'Hệ thống sẽ chỉ lấy các câu Trắc nghiệm để phục vụ trò chơi này.'}</span>
                             </p>
                          </div>
                      </div>
                  </div>

                  <footer className="p-8 bg-gray-50 border-t border-gray-100 shrink-0">
                      <button 
                        disabled={calculatedMax === 0 || !userInfo.name}
                        onClick={() => setMode(targetGame)}
                        className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-2xl hover:bg-blue-700 disabled:bg-gray-300 disabled:shadow-none transition-all uppercase tracking-[0.2em] transform active:scale-95 flex items-center justify-center gap-3"
                      >
                         <i className="fas fa-play"></i> BẮT ĐẦU TRẬN ĐẤU
                      </button>
                  </footer>
              </div>
          </div>
      );
  }

  if (mode === 'MILLIONAIRE') return <MillionaireGame userInfo={userInfo} questions={filteredQuestions} onExit={() => setMode('LOBBY')} onSaveScore={(s) => saveScore('Ai Là Triệu Phú', s)} />;
  if (mode === 'ORAL') return <OralGame userInfo={userInfo} questions={filteredQuestions} onExit={() => setMode('LOBBY')} onSaveScore={(s) => saveScore('Vấn Đáp AI', s)} />;
  if (mode === 'FLASHCARD') return <FlashcardGame questions={filteredQuestions} onExit={() => setMode('LOBBY')} />;
  if (mode === 'TIMED') return <TimedChallengeGame userInfo={userInfo} questions={filteredQuestions} onExit={() => setMode('LOBBY')} onSaveScore={(s) => saveScore('Thử Thách 60s', s)} />;

  return (
    <div className="h-full p-8 overflow-y-auto bg-gray-50 custom-scrollbar pb-24 animate-fade-in">
        <div className="max-w-7xl mx-auto">
            <header className="mb-12 flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Trung tâm Ôn luyện</h2>
                    <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-xs">Môn: Nguồn điện an toàn và môi trường</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black">{questions.length}</div>
                   <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Câu hỏi khả dụng</div>
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                <GameCard 
                    title="Ai Là Triệu Phú" 
                    desc="15 câu hỏi kịch tính với 3 quyền trợ giúp. Chinh phục đỉnh cao tri thức."
                    icon="fa-trophy"
                    color="from-blue-600 to-indigo-800"
                    count={questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE).length}
                    onClick={() => startSetup('MILLIONAIRE')}
                    disabled={questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE).length < 1}
                />
                <GameCard 
                    title="Vấn Đáp AI" 
                    desc="Giám khảo AI trực tiếp đặt câu hỏi và chấm điểm giọng nói của bạn."
                    icon="fa-headset"
                    color="from-purple-600 to-indigo-700"
                    count={questions.filter(q => q.type === QuestionType.ESSAY).length}
                    onClick={() => startSetup('ORAL')}
                    disabled={questions.filter(q => q.type === QuestionType.ESSAY).length < 1}
                />
                <GameCard 
                    title="Thẻ Ghi Nhớ" 
                    desc="Ôn tập nhanh qua hệ thống lật thẻ 3D trực quan sử dụng câu hỏi trắc nghiệm."
                    icon="fa-clone"
                    color="from-teal-500 to-emerald-700"
                    count={questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE).length}
                    onClick={() => startSetup('FLASHCARD')}
                    disabled={questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE).length < 1}
                />
                <GameCard 
                    title="Thử Thách 60s" 
                    desc="Trả lời nhiều nhất có thể trong thời gian giới hạn 60 giây mỗi câu."
                    icon="fa-stopwatch"
                    color="from-orange-500 to-red-700"
                    count={questions.length}
                    onClick={() => startSetup('TIMED')}
                    disabled={questions.length < 1}
                />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Lịch sử ôn luyện gần đây</h3>
                    <i className="fas fa-history text-blue-500"></i>
                </div>
                <div className="overflow-x-auto">
                    {highScores.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 italic">Chưa có lịch sử thi đấu mới. Hãy bắt đầu trận đấu đầu tiên!</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-4">Người chơi</th>
                                    <th className="px-8 py-4">Lớp</th>
                                    <th className="px-8 py-4">Trò chơi</th>
                                    <th className="px-8 py-4">Kết quả</th>
                                    <th className="px-8 py-4">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {highScores.map((score, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition">
                                        <td className="px-8 py-4 font-bold text-gray-700">{score.userName}</td>
                                        <td className="px-8 py-4 text-xs font-medium text-gray-500">{score.userClass}</td>
                                        <td className="px-8 py-4 text-xs font-bold text-blue-600">{score.game}</td>
                                        <td className="px-8 py-4 font-black text-gray-800">{score.score}</td>
                                        <td className="px-8 py-4 text-[10px] text-gray-400">{new Date(score.date).toLocaleString('vi-VN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

const GameCard = ({ title, desc, icon, color, count, onClick, disabled }: any) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`flex flex-col text-left p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden ${disabled ? 'opacity-50 grayscale' : 'hover:-translate-y-2'}`}
    >
        <div className={`w-14 h-14 bg-gradient-to-br ${color} text-white rounded-2xl flex items-center justify-center text-xl mb-6 shadow-xl`}>
            <i className={`fas ${icon}`}></i>
        </div>
        <h3 className="font-black text-slate-900 mb-2 text-lg uppercase tracking-tight">{title}</h3>
        <p className="text-xs text-slate-400 mb-8 flex-1 leading-relaxed font-bold">{desc}</p>
        <div className="flex justify-between items-center mt-auto">
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{count} CÂU HỎI</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                <i className="fas fa-play text-[10px] ml-1"></i>
            </div>
        </div>
    </button>
);

export default GameQuiz;