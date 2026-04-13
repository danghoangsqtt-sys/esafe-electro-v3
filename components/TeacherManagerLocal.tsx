
import React, { useState, useEffect, useMemo } from 'react';
import { TeacherInfo } from '../types';

// ===== SEED DATA =====
const SEED_TEACHERS: TeacherInfo[] = [
  { id: 'tch-001', fullName: 'TS. Nguyễn Văn An', email: 'an.nv@khoacs.edu.vn', department: 'Bộ môn Kỹ thuật Điện tử', specialization: 'Vi mạch & Hệ thống nhúng', phone: '0901111222', classIds: ['cls-001', 'cls-004'], status: 'active', createdAt: Date.now() - 86400000 * 120 },
  { id: 'tch-002', fullName: 'ThS. Trần Thị Bình', email: 'binh.tt@khoacs.edu.vn', department: 'Bộ môn Công nghệ Thông tin', specialization: 'Trí tuệ nhân tạo & Machine Learning', phone: '0912222333', classIds: ['cls-002'], status: 'active', createdAt: Date.now() - 86400000 * 100 },
  { id: 'tch-003', fullName: 'PGS.TS. Lê Hoàng Cường', email: 'cuong.lh@khoacs.edu.vn', department: 'Bộ môn Điện tử Viễn thông', specialization: 'Xử lý tín hiệu số & Radar', phone: '0923333444', classIds: ['cls-003'], status: 'active', createdAt: Date.now() - 86400000 * 90 },
  { id: 'tch-004', fullName: 'TS. Phạm Minh Đức', email: 'duc.pm@khoacs.edu.vn', department: 'Bộ môn Kỹ thuật Phần mềm', specialization: 'Kiến trúc Microservices & Cloud', phone: '0934444555', classIds: ['cls-005'], status: 'active', createdAt: Date.now() - 86400000 * 60 },
  { id: 'tch-005', fullName: 'ThS. Hoàng Thị Ema', email: 'ema.ht@khoacs.edu.vn', department: 'Bộ môn Toán - Lý cơ sở', specialization: 'Đại số tuyến tính & Xác suất thống kê', phone: '0945555666', classIds: [], status: 'active', createdAt: Date.now() - 86400000 * 45 },
  { id: 'tch-006', fullName: 'TS. Vũ Quang Phúc', email: 'phuc.vq@khoacs.edu.vn', department: 'Bộ môn An toàn Thông tin', specialization: 'Mật mã học & Bảo mật mạng', phone: '0956666777', classIds: [], status: 'inactive', createdAt: Date.now() - 86400000 * 30 },
  { id: 'tch-007', fullName: 'PGS.TS. Đỗ Ngọc Giang', email: 'giang.dn@khoacs.edu.vn', department: 'Bộ môn Điện tử Viễn thông', specialization: 'Thông tin vô tuyến & Anten', phone: '0967777888', classIds: [], status: 'active', createdAt: Date.now() - 86400000 * 20 },
];

const genId = () => 'tch-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

interface Props {
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const TeacherManagerLocal: React.FC<Props> = ({ onNotify }) => {
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherInfo | null>(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    fullName: '', email: '', department: '', specialization: '', phone: ''
  });

  // Load / seed
  useEffect(() => {
    const stored = localStorage.getItem('lms_teachers');
    if (stored) {
      setTeachers(JSON.parse(stored));
    } else {
      setTeachers(SEED_TEACHERS);
      localStorage.setItem('lms_teachers', JSON.stringify(SEED_TEACHERS));
    }
  }, []);

  // Persist
  useEffect(() => {
    if (teachers.length > 0) localStorage.setItem('lms_teachers', JSON.stringify(teachers));
  }, [teachers]);

  // Departments list
  const departments = useMemo(() => {
    const depts = new Set(teachers.map(t => t.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [teachers]);

  // Filtered
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchSearch = t.fullName.toLowerCase().includes(search.toLowerCase()) ||
        t.email.toLowerCase().includes(search.toLowerCase()) ||
        t.specialization.toLowerCase().includes(search.toLowerCase());
      const matchDept = filterDept ? t.department === filterDept : true;
      return matchSearch && matchDept;
    });
  }, [teachers, search, filterDept]);

  // Handlers
  const handleAddTeacher = () => {
    if (!newTeacher.fullName.trim()) return;
    const teacher: TeacherInfo = {
      id: genId(),
      fullName: newTeacher.fullName.trim(),
      email: newTeacher.email.trim() || `${newTeacher.fullName.trim().toLowerCase().replace(/\s+/g, '.')}@khoacs.edu.vn`,
      department: newTeacher.department.trim(),
      specialization: newTeacher.specialization.trim(),
      phone: newTeacher.phone.trim(),
      classIds: [],
      status: 'active',
      createdAt: Date.now(),
    };
    setTeachers(prev => [teacher, ...prev]);
    setShowAddModal(false);
    setNewTeacher({ fullName: '', email: '', department: '', specialization: '', phone: '' });
    onNotify(`Đã thêm giảng viên "${teacher.fullName}".`, 'success');
  };

  const handleToggleStatus = (id: string) => {
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' } : t));
    const t = teachers.find(t => t.id === id);
    if (t) {
      const newStatus = t.status === 'active' ? 'ngưng hoạt động' : 'hoạt động';
      onNotify(`${t.fullName} đã chuyển sang trạng thái ${newStatus}.`, 'info');
    }
  };

  const handleDeleteTeacher = (id: string, name: string) => {
    if (!confirm(`Xóa giảng viên "${name}" khỏi danh sách?`)) return;
    setTeachers(prev => prev.filter(t => t.id !== id));
    if (selectedTeacher?.id === id) setSelectedTeacher(null);
    onNotify(`Đã xóa giảng viên "${name}".`, 'info');
  };

  // ============================== RENDER ==============================
  return (
    <div className="p-6 md:p-8 animate-fade-in max-w-[1600px] mx-auto pb-20">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <i className="fas fa-chalkboard-user text-indigo-600"></i>
            Quản lý Giảng viên
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Hồ sơ nhân sự giảng dạy — Khoa Cơ sở</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
          >
            <i className="fas fa-user-plus"></i> Thêm Giảng viên
          </button>
        </div>
      </div>

      {/* STATS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng GV</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{teachers.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang hoạt động</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">{teachers.filter(t => t.status === 'active').length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bộ môn</p>
          <p className="text-3xl font-black text-indigo-600 mt-1">{departments.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Có lớp CN</p>
          <p className="text-3xl font-black text-blue-600 mt-1">{teachers.filter(t => t.classIds.length > 0).length}</p>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            placeholder="Tìm giảng viên (tên, email, chuyên ngành)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
        <select
          title="Lọc theo bộ môn"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-sm min-w-[220px]"
        >
          <option value="">Tất cả Bộ môn</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* ====================== MAIN CONTENT ====================== */}
      <div className="flex gap-6">
        {/* TABLE */}
        <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 transition-all ${selectedTeacher ? 'max-w-[calc(100%-400px)]' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ minWidth: 950 }}>
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50/80 to-slate-50 border-b-2 border-slate-200 sticky top-0 z-10">
                  <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-12 text-center border-r border-slate-100">STT</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Họ và Tên</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Email</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Bộ môn</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Chuyên ngành</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 text-center w-16">Lớp</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 text-center w-24">Trạng thái</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">Không có dữ liệu giảng viên</td></tr>
                ) : (
                  filteredTeachers.map((t, idx) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTeacher(t)}
                      className={`border-b border-slate-100 hover:bg-indigo-50/50 transition-colors cursor-pointer group ${idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'} ${selectedTeacher?.id === t.id ? 'bg-indigo-100/50 !border-indigo-200' : ''}`}
                    >
                      <td className="px-4 py-3.5 text-center text-xs font-bold text-slate-400 border-r border-slate-50">{idx + 1}</td>
                      <td className="px-4 py-3.5 border-r border-slate-50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">{t.fullName.charAt(0)}</div>
                          <span className="font-black text-slate-800 text-sm whitespace-nowrap">{t.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 border-r border-slate-50 text-xs font-medium text-slate-500 font-mono">{t.email}</td>
                      <td className="px-4 py-3.5 border-r border-slate-50 text-xs font-bold text-slate-600 max-w-[180px] truncate" title={t.department}>{t.department}</td>
                      <td className="px-4 py-3.5 border-r border-slate-50 text-xs font-medium text-slate-500 max-w-[200px] truncate" title={t.specialization}>{t.specialization}</td>
                      <td className="px-4 py-3.5 text-center border-r border-slate-50">
                        <span className="text-sm font-black text-indigo-600">{t.classIds.length}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center border-r border-slate-50">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${t.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {t.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(t.id); }} className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all text-xs ${t.status === 'active' ? 'bg-slate-100 text-slate-400 hover:bg-amber-500 hover:text-white' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`} title={t.status === 'active' ? 'Ngưng' : 'Kích hoạt'}>
                            <i className={`fas ${t.status === 'active' ? 'fa-pause' : 'fa-play'}`}></i>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteTeacher(t.id, t.fullName); }} className="w-7 h-7 rounded-lg inline-flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white transition-all text-xs" title="Xóa">
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
            <span>Hiển thị: {filteredTeachers.length} / {teachers.length} giảng viên</span>
            <span className="flex items-center gap-2"><i className="fas fa-database text-indigo-400"></i> LocalStorage</span>
          </div>
        </div>

        {/* DETAIL PANEL */}
        {selectedTeacher && (
          <div className="w-[380px] bg-white rounded-3xl border border-slate-200 shadow-sm p-6 shrink-0 animate-fade-in self-start sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Thông tin Giảng viên</h3>
              <button onClick={() => setSelectedTeacher(null)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all">
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">
                {selectedTeacher.fullName.charAt(0)}
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-lg leading-tight">{selectedTeacher.fullName}</h4>
                <p className="text-xs text-slate-400 font-medium">{selectedTeacher.email}</p>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block ${selectedTeacher.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  {selectedTeacher.status === 'active' ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { icon: 'fa-building-columns', label: 'Bộ môn', value: selectedTeacher.department || 'Chưa cập nhật' },
                { icon: 'fa-microscope', label: 'Chuyên ngành', value: selectedTeacher.specialization || 'Chưa cập nhật' },
                { icon: 'fa-phone', label: 'SĐT', value: selectedTeacher.phone || 'N/A' },
                { icon: 'fa-school', label: 'Số lớp chủ nhiệm', value: `${selectedTeacher.classIds.length} lớp` },
                { icon: 'fa-calendar-check', label: 'Ngày tham gia', value: new Date(selectedTeacher.createdAt).toLocaleDateString('vi-VN') },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <i className={`fas ${item.icon} w-5 text-center text-indigo-500 text-xs mt-0.5`}></i>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                    <p className="text-sm font-bold text-slate-800 break-words leading-snug">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedTeacher.classIds.length > 0 && (
              <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">Lớp chủ nhiệm</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.classIds.map(cId => (
                    <span key={cId} className="text-xs font-black text-indigo-700 bg-white px-3 py-1 rounded-lg border border-indigo-200">{cId}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====================== ADD TEACHER MODAL ====================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl border-t-4 border-indigo-600" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3"><i className="fas fa-user-plus text-indigo-600"></i> Thêm Giảng viên mới</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 mb-1 block">Họ và Tên *</label>
                  <input type="text" value={newTeacher.fullName} onChange={e => setNewTeacher({ ...newTeacher, fullName: e.target.value })} placeholder="TS. Nguyễn Văn A" className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white font-bold text-sm text-slate-800 transition-all" autoFocus />
                </div>
                <div>
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 mb-1 block">Email</label>
                  <input type="email" value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} placeholder="email@khoacs.edu.vn" className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white font-bold text-sm text-slate-800 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 mb-1 block">Bộ môn</label>
                <input type="text" value={newTeacher.department} onChange={e => setNewTeacher({ ...newTeacher, department: e.target.value })} placeholder="VD: Bộ môn Công nghệ Thông tin" className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white font-bold text-sm text-slate-800 transition-all" list="dept-suggestions" />
                <datalist id="dept-suggestions">
                  {departments.map(d => <option key={d} value={d} />)}
                </datalist>
              </div>
              <div>
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 mb-1 block">Chuyên ngành</label>
                <input type="text" value={newTeacher.specialization} onChange={e => setNewTeacher({ ...newTeacher, specialization: e.target.value })} placeholder="VD: Trí tuệ nhân tạo" className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white font-bold text-sm text-slate-800 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 mb-1 block">Số điện thoại</label>
                <input type="tel" value={newTeacher.phone} onChange={e => setNewTeacher({ ...newTeacher, phone: e.target.value })} placeholder="0901234567" className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white font-bold text-sm text-slate-800 transition-all" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Hủy</button>
                <button onClick={handleAddTeacher} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">Thêm GV</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagerLocal;
