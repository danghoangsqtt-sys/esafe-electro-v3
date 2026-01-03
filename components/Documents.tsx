
// Fix: Added missing required 'canvas' property to RenderParameters in PdfViewer component (lines 56 and 105)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DocumentFile, VectorChunk } from '../types';
import { extractDataFromPDF, chunkText, embedChunks } from '../services/documentProcessor';
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Kiểm tra xem có đang chạy trong Electron không
const isElectron = navigator.userAgent.toLowerCase().includes(' electron/');
const ipcRenderer = isElectron ? (window as any).require('electron').ipcRenderer : null;

interface DocumentsProps {
  onUpdateKnowledgeBase: (chunks: VectorChunk[]) => void;
  onDeleteDocumentData: (docId: string) => void;
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const INITIAL_DOCS: DocumentFile[] = [];

const PdfViewer: React.FC<{ url: string; isFullScreen: boolean; onToggleFullScreen: () => void }> = ({ url, isFullScreen, onToggleFullScreen }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [pdf, setPdf] = useState<any>(null);
    const [pageNum, setPageNum] = useState(1);
    const [total, setTotal] = useState(0);
    const [scale, setScale] = useState(1.1);
    const [loading, setLoading] = useState(true);
    const [inputPage, setInputPage] = useState("1");
    const [error, setError] = useState<string | null>(null);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [showThumbnails, setShowThumbnails] = useState(false);

    const loadPdf = useCallback(async () => {
        setLoading(true);
        setError(null);
        setThumbnails([]);
        try {
            const loadingTask = pdfjsLib.getDocument(url);
            const loadedPdf = await loadingTask.promise;
            setPdf(loadedPdf);
            setTotal(loadedPdf.numPages);
            setPageNum(1);
            setInputPage("1");
            setLoading(false);

            // Generate Thumbnails for first few pages (simulating TOC)
            const thumbList: string[] = [];
            for (let i = 1; i <= Math.min(10, loadedPdf.numPages); i++) {
                const page = await loadedPdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.2 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                // Fix: Added missing required 'canvas' property to RenderParameters
                await page.render({ canvasContext: canvas.getContext('2d')!, viewport, canvas }).promise;
                thumbList.push(canvas.toDataURL());
            }
            setThumbnails(thumbList);
        } catch (err: any) {
            console.error("PDF Load Error:", err);
            setError("Không thể tải tệp PDF. Tệp có thể đã bị xóa hoặc không thể truy cập.");
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        loadPdf();
    }, [loadPdf]);

    const renderPage = useCallback(async () => {
        if (!pdf || !canvasRef.current) return;
        try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (!context) return;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Fix: Added missing required 'canvas' property to RenderParameters
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
                canvas: canvas,
            };
            await page.render(renderContext).promise;
        } catch (err) {
            console.error("Render Page Error:", err);
        }
    }, [pdf, pageNum, scale]);

    useEffect(() => {
        renderPage();
    }, [renderPage]);

    const handleJumpPage = (e: React.FormEvent) => {
        e.preventDefault();
        const p = parseInt(inputPage);
        if (p >= 1 && p <= total) {
            setPageNum(p);
        } else {
            setInputPage(pageNum.toString());
        }
    };

    useEffect(() => {
        setInputPage(pageNum.toString());
    }, [pageNum]);

    return (
        <div ref={containerRef} className={`flex h-full bg-[#111827] transition-all relative ${isFullScreen ? 'fixed inset-0 z-[100]' : 'rounded-3xl overflow-hidden border border-gray-800 shadow-2xl'}`}>
             {/* Thumbnail Sidebar */}
             {showThumbnails && (
                 <aside className="w-52 bg-gray-900 border-r border-white/10 flex flex-col animate-slide-in-left overflow-hidden">
                     <div className="p-4 border-b border-white/5 flex justify-between items-center shrink-0">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Xem trước</span>
                         <button onClick={() => setShowThumbnails(false)} className="text-gray-500 hover:text-white"><i className="fas fa-chevron-left"></i></button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                         {thumbnails.map((src, i) => (
                             <div 
                                key={i} 
                                onClick={() => setPageNum(i + 1)} 
                                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${pageNum === i + 1 ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                             >
                                 <img src={src} alt={`Page ${i+1}`} className="w-full h-auto" />
                                 <p className="text-center text-[9px] font-bold text-gray-500 mt-1">Trang {i+1}</p>
                             </div>
                         ))}
                         {total > 10 && <p className="text-center text-[9px] text-gray-600 italic">Còn {total - 10} trang...</p>}
                     </div>
                 </aside>
             )}

             <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="bg-gray-900/95 backdrop-blur-md border-b border-white/5 p-3 flex flex-wrap justify-between items-center z-20 sticky top-0 px-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowThumbnails(!showThumbnails)} className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${showThumbnails ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                            <i className="fas fa-th-list text-xs"></i>
                        </button>
                        <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
                            <button onClick={() => setPageNum(p => Math.max(1, p-1))} disabled={pageNum <= 1} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-20 transition-all text-white">
                                <i className="fas fa-chevron-left text-[10px]"></i>
                            </button>
                            <form onSubmit={handleJumpPage} className="flex items-center px-2">
                                <input type="text" value={inputPage} onChange={(e) => setInputPage(e.target.value)} className="w-10 bg-transparent text-center text-xs font-black text-blue-400 outline-none" />
                                <span className="text-[10px] font-bold text-gray-500 mx-1">/ {total}</span>
                            </form>
                            <button onClick={() => setPageNum(p => Math.min(total, p+1))} disabled={pageNum >= total} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-20 transition-all text-white">
                                <i className="fas fa-chevron-right text-[10px]"></i>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 text-white">
                            <button onClick={() => setScale(s => Math.max(0.5, s-0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all"><i className="fas fa-minus text-[9px]"></i></button>
                            <span className="text-[10px] font-black w-14 text-center">{Math.round(scale * 100)}%</span>
                            <button onClick={() => setScale(s => Math.min(3.0, s+0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all"><i className="fas fa-plus text-[9px]"></i></button>
                        </div>
                        <button onClick={onToggleFullScreen} className="w-9 h-9 flex items-center justify-center bg-blue-600 border border-blue-500 rounded-xl text-white hover:bg-blue-500 shadow-lg shadow-blue-900/40 transition-all">
                            <i className={`fas ${isFullScreen ? 'fa-compress' : 'fa-expand'} text-xs`}></i>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-[#111827] flex flex-col items-center p-8 custom-scrollbar scroll-smooth">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white">
                            <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Đang nạp dữ liệu giáo trình...</span>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-3xl text-red-500 mb-6 border border-red-500/20">
                                <i className="fas fa-file-circle-exclamation"></i>
                            </div>
                            <p className="text-white font-black text-xl mb-2">{error}</p>
                            <p className="text-gray-500 text-sm max-w-xs">Tài liệu này không khả dụng hoặc đường dẫn đã thay đổi.</p>
                        </div>
                    ) : (
                        <div className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-white rounded-sm mb-12">
                            <canvas ref={canvasRef} />
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};

const Documents: React.FC<DocumentsProps> = ({ onUpdateKnowledgeBase, onDeleteDocumentData, onNotify }) => {
  const [docs, setDocs] = useState<DocumentFile[]>(() => {
      const saved = localStorage.getItem('elearning_docs');
      return saved ? JSON.parse(saved) : INITIAL_DOCS;
  });
  const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
      localStorage.setItem('elearning_docs', JSON.stringify(docs));
  }, [docs]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return onNotify("Vui lòng tải tệp PDF.", "error");

    const newDocId = Date.now().toString();
    setIsProcessing(true);
    setProcessingDocId(newDocId);
    setProgress(5);

    try {
        let persistentUrl = "";
        if (ipcRenderer) {
            const base64 = await fileToBase64(file);
            const result = await ipcRenderer.invoke('save-pdf', { fileName: file.name, base64Data: base64 });
            if (result.success) {
                persistentUrl = result.filePath;
            } else {
                throw new Error(result.error);
            }
        } else {
            persistentUrl = URL.createObjectURL(file);
        }

        const { text, metadata } = await extractDataFromPDF(file);
        
        const newDoc: DocumentFile = {
            id: newDocId,
            name: file.name,
            type: 'PDF',
            url: persistentUrl,
            uploadDate: new Date().toLocaleDateString('vi-VN'),
            isProcessed: false,
            metadata: metadata
        };
        
        setDocs(prev => [newDoc, ...prev]);
        setSelectedDoc(newDoc);
        
        setProgress(20);
        const chunks = chunkText(text);
        
        const vectorChunks = await embedChunks(newDocId, chunks, (p) => {
            setProgress(20 + Math.round(p * 0.8));
        });

        onUpdateKnowledgeBase(vectorChunks);
        setDocs(prev => prev.map(d => d.id === newDocId ? { ...d, isProcessed: true } : d));
        onNotify("Đã lưu và nạp tri thức RAG thành công!", "success");
    } catch (error: any) {
        onNotify(`Lỗi xử lý tài liệu: ${error.message}`, "error");
    } finally {
        setIsProcessing(false);
        setProcessingDocId(null);
        setProgress(0);
    }
  };

  const deleteDoc = (doc: DocumentFile) => {
      if (!window.confirm(`Xóa tài liệu "${doc.name}" và toàn bộ dữ liệu vector RAG liên quan?`)) return;
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      onDeleteDocumentData(doc.id); // Trigger RAG cleanup in App.tsx
      if (selectedDoc?.id === doc.id) setSelectedDoc(null);
      onNotify(`Đã xóa tài liệu và tri thức liên quan.`, "info");
  };

  return (
    <div className="h-full flex flex-col p-8 animate-fade-in bg-gray-50/30">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
         <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <i className="fas fa-layer-group text-blue-600"></i>
                Thư viện Tri thức RAG
            </h2>
            <p className="text-sm text-gray-500 font-medium italic">Tài liệu PDF được AI phân tích và lưu trữ vector tại chỗ</p>
         </div>
         <label className={`cursor-pointer bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
            {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-upload"></i>}
            {isProcessing ? "ĐANG XỬ LÝ..." : "TẢI GIÁO TRÌNH MỚI"}
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
         </label>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        <div className="w-80 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden shrink-0">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Giáo trình ({docs.length})</span>
                <i className="fas fa-microchip text-blue-400 text-xs animate-pulse"></i>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {docs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                        <i className="fas fa-book-medical text-4xl mb-3"></i>
                        <p className="text-[10px] font-black uppercase tracking-widest">Trống</p>
                    </div>
                )}
                {docs.map(doc => (
                    <div key={doc.id} onClick={() => setSelectedDoc(doc)} className={`p-4 rounded-[1.5rem] border-2 cursor-pointer transition-all relative group ${selectedDoc?.id === doc.id ? 'bg-blue-50 border-blue-500/20' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                        <button onClick={(e) => {e.stopPropagation(); deleteDoc(doc)}} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"><i className="fas fa-trash-alt text-[10px]"></i></button>
                        <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${doc.isProcessed ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500'}`}>
                                <i className={`fas ${doc.id === processingDocId ? 'fa-circle-notch fa-spin' : 'fa-file-pdf'} text-lg`}></i>
                            </div>
                            <div className="overflow-hidden">
                                <p className={`font-black text-sm truncate ${selectedDoc?.id === doc.id ? 'text-blue-900' : 'text-gray-700'}`}>{doc.name}</p>
                                <div className="mt-1.5 flex items-center gap-2">
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${doc.isProcessed ? 'bg-green-600 text-white shadow-lg shadow-green-900/10' : doc.id === processingDocId ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                                        {doc.isProcessed ? 'Đã học' : doc.id === processingDocId ? `Học ${progress}%` : 'Đang chờ'}
                                    </span>
                                    <span className="text-[8px] text-gray-300 font-bold">{doc.uploadDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex-1 bg-[#111827] rounded-[3rem] border border-gray-800 shadow-2xl overflow-hidden flex flex-col relative">
            {selectedDoc ? (
                <PdfViewer url={selectedDoc.url} isFullScreen={isFullScreen} onToggleFullScreen={() => setIsFullScreen(!isFullScreen)} />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[#0b0f1a]">
                    <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] shadow-inner flex items-center justify-center text-4xl text-blue-500/20 border border-white/10 mb-8 animate-float">
                        <i className="fas fa-book-reader"></i>
                    </div>
                    <h3 className="text-xl font-black text-gray-300 uppercase tracking-widest">Sẵn sàng đọc tài liệu</h3>
                    <p className="text-gray-600 text-sm mt-4 max-w-sm leading-relaxed font-medium">Chọn một giáo trình từ danh sách bên trái. AI sẽ tự động kích hoạt tri thức liên quan khi bạn đặt câu hỏi.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Documents;
