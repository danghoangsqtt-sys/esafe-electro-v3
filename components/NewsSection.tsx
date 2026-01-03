import React, { useState } from 'react';
import { NewsArticle } from '../types';

const NewsSection: React.FC = () => {
  const [articles] = useState<NewsArticle[]>([
    {
      id: '1',
      title: 'Ứng dụng năng lượng tái tạo trong bảo vệ môi trường 2026',
      summary: 'Các công nghệ mới giúp tối ưu hóa nguồn điện sạch và giảm thiểu rác thải điện tử trong kỷ nguyên kinh tế xanh.',
      date: '20/05/2026',
      source: 'Khoa học Điện'
    },
    {
      id: '2',
      title: 'Tiêu chuẩn an toàn điện mới trong công nghiệp (TCVN 2026)',
      summary: 'Cập nhật các quy định về an toàn lưới điện, khoảng cách phóng điện và bảo hộ lao động cho sinh viên kỹ thuật.',
      date: '18/05/2026',
      source: 'Môi trường & Đời sống'
    },
    {
      id: '3',
      title: 'Chuyển đổi số trong đào tạo kỹ thuật điện hiện đại',
      summary: 'Sử dụng AI và thực tế ảo (VR) để mô phỏng các tình huống cứu hộ điện giật và vận hành trạm biến áp.',
      date: '15/05/2026',
      source: 'Giáo dục Số'
    }
  ]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-fade-in h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0 border border-blue-100/50">
              <i className="fas fa-newspaper"></i>
          </div>
          <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Tin tức Chuyên ngành</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 px-0.5">Cập nhật xu hướng an toàn & môi trường</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
        {articles.map(news => (
          <div key={news.id} className="p-6 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-blue-100 hover:shadow-lg transition-all duration-300 group flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <span className="text-[9px] font-black text-blue-600 bg-white px-3 py-1 rounded-full shadow-sm border border-blue-50 uppercase tracking-tighter">{news.source}</span>
                <span className="text-[11px] text-slate-400 font-bold">{news.date}</span>
             </div>
             <h3 className="text-[15px] font-black text-slate-800 mb-3 group-hover:text-blue-600 transition-colors leading-tight line-clamp-2">{news.title}</h3>
             <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-3 font-medium flex-1">{news.summary}</p>
             <div className="mt-6 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    Chi tiết <i className="fas fa-arrow-right text-[8px]"></i>
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsSection;