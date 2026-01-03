import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DocumentFile, VectorChunk } from '../types';
import { extractDataFromPDF, chunkText, embedChunks } from '../services/documentProcessor';
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/build/pdf";

GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs";

interface DocumentsProps {
  onUpdateKnowledgeBase: (chunks: VectorChunk[]) => void;
  onDeleteDocumentData?: (docId: string) => void;
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const INITIAL_DOCS: DocumentFile[] = [
  { 
      id: '1', 
      name: 'Giao trinh An toan dien Co ban.pdf', 
      type: 'PDF', 
      url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf', 
      uploadDate: '2024-05-20',
      isProcessed: true,
      metadata: {
          title: 'Giáo trình An toàn điện',
          author: 'Bộ môn Điện',
          creationDate: '20/05/2024'
      }
  },
];

const PdfViewer: React.FC<{ url: string; isFullScreen: boolean; onToggleFullScreen: () => void }> = ({ url, isFullScreen, onToggleFullScreen }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [pdf, setPdf] = useState<any>(null);
    const [pageNum, setPageNum] = useState(1);
    const [total, setTotal] = useState(0);
    const [scale, setScale] = useState(1.1);
    const [rotation, setRotation] = useState(0);
    const [loading, setLoading] = useState(true);
    const [inputPage, setInputPage] = useState("1");

    const loadPdf = useCallback(async () => {
        setLoading(true);
        try {
            const loadingTask = getDocument(url);
            const loadedPdf = await loadingTask.promise;
            setPdf(loadedPdf);
            setTotal(loadedPdf.numPages);
            setPageNum(1);
            setInputPage("1");
            setLoading(false);
        } catch (err) {
            console.error("PDF Load Error:", err);
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
            const viewport = page.getViewport({ scale, rotation });
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (!context) return;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            await page.render(renderContext).promise;
        } catch (err) {
            console.error("Render Page Error:", err);
        }
    }, [pdf, pageNum, scale, rotation]);

    useEffect(() => {
        renderPage();
    }, [renderPage]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') setPageNum(p => Math.min(total, p + 1));
            if (e.key === 'ArrowLeft') setPageNum(p => Math.max(1, p - 1));
            if (e.key === '=' || e.key === '+') setScale(s => Math.min(3, s + 0.1));
            if (e.key === '-') setScale(s => Math.max(0.5, s - 0.1));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [total]);

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
        <div ref={containerRef} className={`flex flex-col h-full bg-[#1e1e24] transition-all relative ${isFullScreen ? 'fixed inset-0 z-[100]' : 'rounded-xl overflow-hidden border border-gray-800 shadow-xl'}`}>
             {/* Streamlined Toolbar */}
             <div className="bg-gray-900/90 backdrop-blur-md border-b border-white/5 p-2 flex flex-wrap justify-between items-center z-20 sticky top-0 px-4">
                 <div className="flex items-center gap-3">
                     <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
                         <button 
                            onClick={() => setPageNum(p => Math.max(1, p-1))} 
                            disabled={pageNum <= 1} 
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 disabled:opacity-20 transition-all text-white"
                         >
                             <i className="fas fa-chevron-left text-[10px]"></i>
                         </button>
                         <form onSubmit={handleJumpPage} className="flex items-center px-1">
                             <input 
                                type="text" 
                                value={inputPage} 
                                onChange={(e) => setInputPage(e.target.value)}
                                className="w-8 bg-transparent text-center text-[11px] font-bold text-blue-400 outline-none"
                             />
                             <span className="text-[9px] font-medium text-gray-500 mx-0.5">/ {total}</span>
                         </form>
                         <button 
                            onClick={() => setPageNum(p => Math.min(total, p+1))} 
                            disabled={pageNum >= total} 
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 disabled:opacity-20 transition-all text-white"
                         >
                             <i className="fas fa-chevron-right text-[10px]"></i>
                         </button>
                     </div>
                     <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
                     <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10 text-white">
                        <button onClick={() => setScale(s => Math.max(0.5, s-0.1))} className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-md transition-all"><i className="fas fa-minus text-[9px]"></i></button>
                        <span className="text-[10px] font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
                        <button onClick={() => setScale(s => Math.min(3.0, s+0.1))} className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-md transition-all"><i className="fas fa-plus text-[9px]"></i></button>
                     </div>
                 </div>

                 <div className="flex items-center gap-2">
                     <button 
                        onClick={() => setRotation(r => (r + 90) % 360)} 
                        title="Xoay"
                        className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all"
                     >
                        <i className="fas fa-rotate-right text-[10px]"></i>
                     </button>
                     <button 
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = 'Document.pdf';
                            link.click();
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all"
                     >
                        <i className="fas fa-download text-[10px]"></i>
                     </button>
                     <button 
                        onClick={onToggleFullScreen} 
                        className="w-8 h-8 flex items-center justify-center bg-blue-600 border border-blue-500 rounded-lg text-white hover:bg-blue-500 transition-all"
                     >
                        <i className={`fas ${isFullScreen ? 'fa-compress' : 'fa-expand'} text-[10px]`}></i>
                     </button>
                 </div>
             </div>

             {/* Main Viewer Area */}
             <div className="flex-1 overflow-auto bg-[#1e1e24] flex justify-center p-4 md:p-6 custom-scrollbar">
                 {loading ? (
                    <div className="text-white flex flex-col items-center justify-center gap-3 mt-10">
                        <i className="fas fa-circle-notch fa-spin text-3xl text-blue-500"></i>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Đang nạp PDF...</span>
                    </div>
                 ) : (
                    <div className="relative shadow-2xl">
                        <canvas ref={canvasRef} className="bg-white rounded-sm" />
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white px-3 py-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                           {pageNum} / {total}
                        </div>
                    </div>
                 )}
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return onNotify("Vui lòng tải tệp PDF.", "error");

    const newDocId = Date.now().toString();
    const blobUrl = URL.createObjectURL(file);
    const newDoc: DocumentFile = {
        id: newDocId,
        name: file.name,
        type: 'PDF',
        url: blobUrl,
        uploadDate: new Date().toLocaleDateString('vi-VN'),
        isProcessed: false,
        metadata: { title: 'Đang trích xuất...' }
    };
    
    setDocs(prev => [newDoc, ...prev]);
    setSelectedDoc(newDoc);
    setIsProcessing(true);
    setProcessingDocId(newDocId);
    setProgress(5);

    try {
        const { text, metadata } = await extractDataFromPDF(file);
        setDocs(prev => prev.map(d => d.id === newDocId ? { ...d, metadata } : d));
        
        setProgress(20);
        const chunks = chunkText(text);
        
        // Fixed: removed redundant process.env.API_KEY parameter as embedChunks uses it directly
        const vectorChunks = await embedChunks(newDocId, chunks, (p) => {
            setProgress(20 + Math.round(p * 0.8));
        });

        onUpdateKnowledgeBase(vectorChunks);
        setDocs(prev => prev.map(d => d.id === newDocId ? { ...d, isProcessed: true } : d));
        onNotify("Đã nạp tri thức thành công!", "success");
    } catch (error) {
        onNotify("Lỗi xử lý tài liệu.", "error");
        setDocs(prev => prev.filter(d => d.id !== newDocId));
    } finally {
        setIsProcessing(false);
        setProcessingDocId(null);
        setProgress(0);
    }
  };

  const deleteDoc = (doc: DocumentFile) => {
      if (!window.confirm(`Xóa tài liệu "${doc.name}"?`)) return;
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      if (onDeleteDocumentData) onDeleteDocumentData(doc.id);
      if (selectedDoc?.id === doc.id) setSelectedDoc(null);
  };

  return (
    <div className="h-full flex flex-col p-6 animate-fade-in bg-gray-50/30">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
         <div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Thư viện Tri thức</h2>
            <p className="text-xs text-gray-500 font-medium">Quản lý và huấn luyện AI từ giáo trình của bạn</p>
         </div>
         <label className={`cursor-pointer bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
            <i className="fas fa-file-upload"></i>
            TẢI GIÁO TRÌNH MỚI
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
         </label>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Compact Sidebar */}
        <div className="w-72 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Danh sách ({docs.length})</span>
                <i className="fas fa-folder text-blue-300 text-xs"></i>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {docs.map(doc => (
                    <div 
                        key={doc.id} 
                        onClick={() => setSelectedDoc(doc)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all relative group ${selectedDoc?.id === doc.id ? 'bg-blue-50 border-blue-100' : 'bg-white border-transparent hover:bg-gray-50'}`}
                    >
                        <button onClick={(e) => {e.stopPropagation(); deleteDoc(doc)}} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"><i className="fas fa-trash-alt text-[10px]"></i></button>
                        <div className="flex gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${doc.isProcessed ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500'}`}>
                                <i className={`fas ${doc.id === processingDocId ? 'fa-circle-notch fa-spin' : 'fa-file-pdf'} text-sm`}></i>
                            </div>
                            <div className="overflow-hidden">
                                <p className={`font-bold text-xs truncate ${selectedDoc?.id === doc.id ? 'text-blue-700' : 'text-gray-700'}`}>{doc.name}</p>
                                <div className="mt-1">
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${doc.isProcessed ? 'bg-green-600 text-white' : doc.id === processingDocId ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                        {doc.isProcessed ? 'ĐÃ HỌC' : doc.id === processingDocId ? `HỌC ${progress}%` : 'CHƯA HỌC'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {doc.id === processingDocId && (
                            <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all rounded-b-xl" style={{ width: `${progress}%` }}></div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Professional Viewer Container */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col relative">
            {selectedDoc ? (
                <PdfViewer url={selectedDoc.url} isFullScreen={isFullScreen} onToggleFullScreen={() => setIsFullScreen(!isFullScreen)} />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-gray-50/50">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl text-blue-100 border border-gray-100 mb-6">
                        <i className="fas fa-book-open"></i>
                    </div>
                    <h3 className="text-lg font-bold text-gray-700">Chọn tài liệu để xem</h3>
                    <p className="text-gray-400 text-xs mt-2 max-w-xs leading-relaxed">Chọn một giáo trình từ danh sách bên trái để bắt đầu học tập.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Documents;