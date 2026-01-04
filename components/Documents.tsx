

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DocumentFile, VectorChunk } from '../types';
import { extractDataFromPDF, chunkText, embedChunks } from '../services/documentProcessor';
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const isElectron = navigator.userAgent.toLowerCase().includes(' electron/');
const ipcRenderer = isElectron ? (window as any).require('electron').ipcRenderer : null;

interface DocumentsProps {
  onUpdateKnowledgeBase: (chunks: VectorChunk[]) => void;
  onDeleteDocumentData: (docId: string) => void;
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const PdfViewer: React.FC<{ url: string; isFullScreen: boolean; onToggleFullScreen: () => void }> = ({ url, isFullScreen, onToggleFullScreen }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
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
        try {
            const loadingTask = pdfjsLib.getDocument(url);
            const loadedPdf = await loadingTask.promise;
            setPdf(loadedPdf);
            setTotal(loadedPdf.numPages);
            setLoading(false);

            const thumbList: string[] = [];
            for (let i = 1; i <= Math.min(10, loadedPdf.numPages); i++) {
                const page = await loadedPdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.2 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: canvas.getContext('2d')!, viewport, canvas }).promise;
                thumbList.push(canvas.toDataURL());
            }
            setThumbnails(thumbList);
        } catch (err: any) {
            setError("Lỗi tải PDF.");
            setLoading(false);
        }
    }, [url]);

    useEffect(() => { loadPdf(); }, [loadPdf]);

    const renderPage = useCallback(async () => {
        if (!pdf || !canvasRef.current) return;
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport, canvas }).promise;
    }, [pdf, pageNum, scale]);

    useEffect(() => { renderPage(); }, [renderPage]);

    return (
        <div className={`flex h-full bg-[#111827] transition-all relative ${isFullScreen ? 'fixed inset-0 z-[100]' : 'rounded-3xl overflow-hidden border border-gray-800'}`}>
             {showThumbnails && (
                 <aside className="w-52 bg-gray-900 border-r border-white/10 flex flex-col overflow-hidden">
                     <div className="p-4 border-b border-white/5 flex justify-between items-center shrink-0">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Xem trước</span>
                         <button onClick={() => setShowThumbnails(false)} className="text-gray-500 hover:text-white"><i className="fas fa-chevron-left"></i></button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-4">
                         {thumbnails.map((src, i) => (
                             <div key={i} onClick={() => setPageNum(i + 1)} className={`cursor-pointer rounded-lg overflow-hidden border-2 ${pageNum === i + 1 ? 'border-blue-500' : 'border-transparent opacity-60'}`}>
                                 <img src={src} className="w-full h-auto" />
                             </div>
                         ))}
                     </div>
                 </aside>
             )}
             <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-gray-900/95 p-3 flex justify-between items-center z-20 sticky top-0 px-6">
                    <div className="flex items-center gap-4 text-white">
                        <button onClick={() => setShowThumbnails(!showThumbnails)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5"><i className="fas fa-th-list"></i></button>
                        <span>{pageNum} / {total}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onToggleFullScreen} className="w-9 h-9 flex items-center justify-center bg-blue-600 rounded-xl text-white">
                            <i className={`fas ${isFullScreen ? 'fa-compress' : 'fa-expand'}`}></i>
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto flex flex-col items-center p-8">
                    {loading ? <div className="text-white">Đang nạp...</div> : <canvas ref={canvasRef} />}
                </div>
             </div>
        </div>
    );
};

const Documents: React.FC<DocumentsProps> = ({ onUpdateKnowledgeBase, onDeleteDocumentData, onNotify }) => {
  const [docs, setDocs] = useState<DocumentFile[]>(() => {
      const saved = localStorage.getItem('elearning_docs');
      return saved ? JSON.parse(saved) : [];
  });
  const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => { localStorage.setItem('elearning_docs', JSON.stringify(docs)); }, [docs]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return onNotify("Vui lòng tải tệp PDF.", "error");

    const newDocId = Date.now().toString();
    setIsProcessing(true);
    setProcessingDocId(newDocId);
    setProgress(5);

    try {
        let persistentUrl = URL.createObjectURL(file);
        const { text, metadata } = await extractDataFromPDF(file);
        
        const newDoc: DocumentFile = {
            id: newDocId, name: file.name, type: 'PDF', url: persistentUrl,
            uploadDate: new Date().toLocaleDateString('vi-VN'), isProcessed: false, metadata: metadata
        };
        
        setDocs(prev => [newDoc, ...prev]);
        setSelectedDoc(newDoc);
        
        const chunks = chunkText(text);
        const vectorChunks = await embedChunks(newDocId, chunks, (p) => setProgress(20 + Math.round(p * 0.8)));

        onUpdateKnowledgeBase(vectorChunks);
        setDocs(prev => prev.map(d => d.id === newDocId ? { ...d, isProcessed: true } : d));
        onNotify("Đã lưu và nạp tri thức RAG thành công!", "success");
    } catch (error: any) {
        onNotify(`Lỗi: ${error.message}`, "error");
    } finally {
        setIsProcessing(false);
        setProcessingDocId(null);
        setProgress(0);
    }
  };

  const deleteDoc = (doc: DocumentFile) => {
      if (!window.confirm(`Xóa tài liệu "${doc.name}"?`)) return;
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      onDeleteDocumentData(doc.id);
      if (selectedDoc?.id === doc.id) setSelectedDoc(null);
  };

  return (
    <div className="h-full flex flex-col p-8 bg-gray-50/30">
      <div className="flex justify-between items-center mb-8 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
         <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Thư viện Tri thức RAG</h2>
            <p className="text-sm text-gray-500 font-medium italic">Tài liệu PDF được AI phân tích và lưu trữ vector</p>
         </div>
         <label className={`cursor-pointer bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-blue-700 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
            {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-upload"></i>}
            {isProcessing ? "ĐANG HỌC..." : "TẢI GIÁO TRÌNH"}
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
         </label>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        <div className="w-80 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden shrink-0">
            <div className="p-6 border-b border-slate-50 bg-gray-50/50 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Giáo trình ({docs.length})</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {docs.map(doc => (
                    <div key={doc.id} onClick={() => setSelectedDoc(doc)} className={`p-4 rounded-[1.5rem] border-2 cursor-pointer transition-all relative group ${selectedDoc?.id === doc.id ? 'bg-blue-50 border-blue-500/20' : 'bg-white border-transparent'}`}>
                        <button onClick={(e) => {e.stopPropagation(); deleteDoc(doc)}} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"><i className="fas fa-trash-alt text-[10px]"></i></button>
                        <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${doc.isProcessed ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500'}`}>
                                <i className={`fas ${doc.id === processingDocId ? 'fa-circle-notch fa-spin' : 'fa-file-pdf'} text-lg`}></i>
                            </div>
                            <div className="overflow-hidden">
                                <p className={`font-black text-sm truncate`}>{doc.name}</p>
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${doc.isProcessed ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {doc.isProcessed ? 'Đã học' : doc.id === processingDocId ? `Học ${progress}%` : 'Đang chờ'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="flex-1 bg-[#111827] rounded-[3rem] border border-gray-800 overflow-hidden flex flex-col relative">
            {selectedDoc ? <PdfViewer url={selectedDoc.url} isFullScreen={isFullScreen} onToggleFullScreen={() => setIsFullScreen(!isFullScreen)} /> : <div className="flex-1 flex items-center justify-center text-gray-500">Chọn tài liệu để xem</div>}
        </div>
      </div>
    </div>
  );
};

export default Documents;
