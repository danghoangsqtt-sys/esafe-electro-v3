
import React, { useState, useEffect, useMemo } from 'react';
import { ClassInfo, StudentInfo } from '../types';

// ===== SEED DATA =====
const SEED_CLASSES: ClassInfo[] = [
  { id: 'cls-001', name: 'K65-KTĐT-01', teacherId: 'tch-001', teacherName: 'TS. Nguyễn Văn An', studentCount: 35, isActive: true, createdAt: Date.now() - 86400000 * 30 },
  { id: 'cls-002', name: 'K65-CNTT-02', teacherId: 'tch-002', teacherName: 'ThS. Trần Thị Bình', studentCount: 40, isActive: true, createdAt: Date.now() - 86400000 * 25 },
  { id: 'cls-003', name: 'K66-ĐTVT-01', teacherId: 'tch-003', teacherName: 'PGS.TS. Lê Hoàng Cường', studentCount: 32, isActive: true, createdAt: Date.now() - 86400000 * 15 },
  { id: 'cls-004', name: 'K66-ATTT-01', teacherId: 'tch-001', teacherName: 'TS. Nguyễn Văn An', studentCount: 28, isActive: false, createdAt: Date.now() - 86400000 * 10 },
  { id: 'cls-005', name: 'K67-KTPM-01', teacherId: 'tch-004', teacherName: 'TS. Phạm Minh Đức', studentCount: 45, isActive: true, createdAt: Date.now() - 86400000 * 5 },
];

const SEED_STUDENTS: StudentInfo[] = [
  { id: 'std-001', fullName: 'Nguyễn Minh Tuấn', email: 'tuan.nm@student.edu.vn', classId: 'cls-001', className: 'K65-KTĐT-01', gender: 'Nam', phone: '0901234567', status: 'active', enrolledAt: Date.now() - 86400000 * 28 },
  { id: 'std-002', fullName: 'Trần Thu Hà', email: 'ha.tt@student.edu.vn', classId: 'cls-001', className: 'K65-KTĐT-01', gender: 'Nữ', phone: '0912345678', status: 'active', enrolledAt: Date.now() - 86400000 * 27 },
  { id: 'std-003', fullName: 'Lê Văn Hùng', email: 'hung.lv@student.edu.vn', classId: 'cls-001', className: 'K65-KTĐT-01', gender: 'Nam', phone: '0923456789', status: 'active', enrolledAt: Date.now() - 86400000 * 26 },
  { id: 'std-004', fullName: 'Phạm Thị Mai', email: 'mai.pt@student.edu.vn', classId: 'cls-002', className: 'K65-CNTT-02', gender: 'Nữ', phone: '0934567890', status: 'active', enrolledAt: Date.now() - 86400000 * 23 },
  { id: 'std-005', fullName: 'Hoàng Đức Anh', email: 'anh.hd@student.edu.vn', classId: 'cls-002', className: 'K65-CNTT-02', gender: 'Nam', phone: '0945678901', status: 'pending', enrolledAt: Date.now() - 86400000 * 22 },
  { id: 'std-006', fullName: 'Vũ Thị Ngọc', email: 'ngoc.vt@student.edu.vn', classId: 'cls-002', className: 'K65-CNTT-02', gender: 'Nữ', phone: '0956789012', status: 'active', enrolledAt: Date.now() - 86400000 * 21 },
  { id: 'std-007', fullName: 'Đỗ Quang Minh', email: 'minh.dq@student.edu.vn', classId: 'cls-003', className: 'K66-ĐTVT-01', gender: 'Nam', phone: '0967890123', status: 'active', enrolledAt: Date.now() - 86400000 * 14 },
  { id: 'std-008', fullName: 'Bùi Thanh Huyền', email: 'huyen.bt@student.edu.vn', classId: 'cls-003', className: 'K66-ĐTVT-01', gender: 'Nữ', phone: '0978901234', status: 'active', enrolledAt: Date.now() - 86400000 * 13 },
  { id: 'std-009', fullName: 'Ngô Hải Đăng', email: 'dang.nh@student.edu.vn', classId: 'cls-004', className: 'K66-ATTT-01', gender: 'Nam', phone: '0989012345', status: 'inactive', enrolledAt: Date.now() - 86400000 * 9 },
  { id: 'std-010', fullName: 'Lý Thị Kim Oanh', email: 'oanh.ltk@student.edu.vn', classId: 'cls-005', className: 'K67-KTPM-01', gender: 'Nữ', phone: '0990123456', status: 'active', enrolledAt: Date.now() - 86400000 * 4 },
  { id: 'std-011', fullName: 'Trương Văn Phong', email: 'phong.tv@student.edu.vn', classId: 'cls-005', className: 'K67-KTPM-01', gender: 'Nam', phone: '0901122334', status: 'active', enrolledAt: Date.now() - 86400000 * 3 },
  { id: 'std-012', fullName: 'Đinh Thị Lan Anh', email: 'lanh.dt@student.edu.vn', classId: 'cls-005', className: 'K67-KTPM-01', gender: 'Nữ', phone: '0912233445', status: 'pending', enrolledAt: Date.now() - 86400000 * 2 },
];

// ===== UTILITY =====
const genId = () => 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Hoạt động' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Chờ duyệt' },
  inactive: { bg: 'bg-red-100', text: 'text-red-700', label: 'Ngưng' },
};

interface Props {
  onNotify: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const ClassStudentManager: React.FC<Props> = ({ onNotify }) => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'classes' | 'students'>('classes');
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Modal states
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', teacherName: '' });
  const [newStudent, setNewStudent] = useState({ fullName: '', email: '', classId: '', gender: 'Nam', phone: '' });

  // Detail panel
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);

  // Load / seed
  useEffect(() => {
    const storedClasses = localStorage.getItem('lms_classes');
    const storedStudents = localStorage.getItem('lms_students');
    if (storedClasses) {
      setClasses(JSON.parse(storedClasses));
    } else {
      setClasses(SEED_CLASSES);
      localStorage.setItem('lms_classes', JSON.stringify(SEED_CLASSES));
    }
    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    } else {
      setStudents(SEED_STUDENTS);
      localStorage.setItem('lms_students', JSON.stringify(SEED_STUDENTS));
    }
  }, []);

  // Persist
  useEffect(() => {
    if (classes.length > 0) localStorage.setItem('lms_classes', JSON.stringify(classes));
  }, [classes]);
  useEffect(() => {
    if (students.length > 0) localStorage.setItem('lms_students', JSON.stringify(students));
  }, [students]);

  // Derived
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
      const matchClass = filterClass ? s.classId === filterClass : true;
      return matchSearch && matchClass;
    });
  }, [students, search, filterClass]);

  const filteredClasses = useMemo(() => {
    return classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.teacherName.toLowerCase().includes(search.toLowerCase()));
  }, [classes, search]);

  // Handlers
  const handleAddClass = () => {
    if (!newClass.name.trim()) return;
    const cls: ClassInfo = {
      id: genId(),
      name: newClass.name.trim(),
      teacherId: genId(),
      teacherName: newClass.teacherName.trim() || 'Chưa phân công',
      studentCount: 0,
      isActive: true,
      createdAt: Date.now(),
    };
    setClasses(prev => [cls, ...prev]);
    setShowAddClass(false);
    setNewClass({ name: '', teacherName: '' });
    onNotify(`Đã tạo lớp "${cls.name}" thành công.`, 'success');
  };

  const handleToggleClass = (id: string) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const handleDeleteClass = (id: string, name: string) => {
    if (!confirm(`Xóa lớp "${name}"? Tất cả học viên trong lớp cũng sẽ bị xóa.`)) return;
    setClasses(prev => prev.filter(c => c.id !== id));
    setStudents(prev => prev.filter(s => s.classId !== id));
    onNotify(`Đã xóa lớp "${name}".`, 'info');
  };

  const handleAddStudent = () => {
    if (!newStudent.fullName.trim() || !newStudent.classId) return;
    const cls = classes.find(c => c.id === newStudent.classId);
    const stu: StudentInfo = {
      id: genId(),
      fullName: newStudent.fullName.trim(),
      email: newStudent.email.trim() || `${newStudent.fullName.trim().toLowerCase().replace(/\s+/g, '.')}@student.edu.vn`,
      classId: newStudent.classId,
      className: cls?.name || '',
      gender: newStudent.gender,
      phone: newStudent.phone.trim(),
      status: 'active',
      enrolledAt: Date.now(),
    };
    setStudents(prev => [stu, ...prev]);
    // Update class student count
    setClasses(prev => prev.map(c => c.id === stu.classId ? { ...c, studentCount: c.studentCount + 1 } : c));
    setShowAddStudent(false);
    setNewStudent({ fullName: '', email: '', classId: '', gender: 'Nam', phone: '' });
    onNotify(`Đã thêm học viên "${stu.fullName}".`, 'success');
  };

  const handleDeleteStudent = (id: string, name: string, classId: string) => {
    if (!confirm(`Xóa học viên "${name}" khỏi danh sách?`)) return;
    setStudents(prev => prev.filter(s => s.id !== id));
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, studentCount: Math.max(0, c.studentCount - 1) } : c));
    if (selectedStudent?.id === id) setSelectedStudent(null);
    onNotify(`Đã xóa học viên "${name}".`, 'info');
  };

  // ============================== RENDER ==============================
  return (
    <div className="p-6 md:p-8 animate-fade-in max-w-[1600px] mx-auto pb-20">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <i className="fas fa-school text-blue-600"></i>
            Quản lý Lớp học & Học viên
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Dữ liệu tổ chức đào tạo — Khoa Cơ sở</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => activeTab === 'classes' ? setShowAddClass(true) : setShowAddStudent(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95"
          >
            <i className="fas fa-plus"></i>
            {activeTab === 'classes' ? 'Thêm Lớp' : 'Thêm Học viên'}
          </button>
        </div>
      </div>

      {/* TAB SELECTOR + SEARCH */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => { setActiveTab('classes'); setSearch(''); setFilterClass(''); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'classes' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
          >
            <i className="fas fa-building"></i> Lớp học ({classes.length})
          </button>
          <button
            onClick={() => { setActiveTab('students'); setSearch(''); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
          >
            <i className="fas fa-user-graduate"></i> Học viên ({students.length})
          </button>
        </div>

        <div className="flex-1 flex gap-3">
          <div className="relative flex-1 max-w-md">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          {activeTab === 'students' && (
            <select
              title="Lọc theo lớp"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm min-w-[180px]"
            >
              <option value="">Tất cả lớp</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* ====================== CLASSES TABLE ====================== */}
      {activeTab === 'classes' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ minWidth: 800 }}>
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 sticky top-0 z-10">
                  <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-14 text-center border-r border-slate-100">STT</th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Tên Lớp / Mã</th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Giảng viên chủ nhiệm</th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 text-center w-24">Sĩ số</th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 text-center w-28">Trạng thái</th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 text-center w-36">Ngày tạo</th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">Không có dữ liệu</td></tr>
                ) : (
                  filteredClasses.map((c, idx) => (
                    <tr key={c.id} className={`border-b border-slate-100 hover:bg-blue-50/60 transition-colors group ${idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}>
                      <td className="px-5 py-3.5 text-center text-xs font-bold text-slate-400 border-r border-slate-50">{idx + 1}</td>
                      <td className="px-5 py-3.5 border-r border-slate-50">
                        <span className="font-black text-slate-800 text-sm">{c.name}</span>
                      </td>
                      <td className="px-5 py-3.5 border-r border-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">{c.teacherName.charAt(0)}</div>
                          <span className="text-sm font-bold text-slate-700">{c.teacherName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center border-r border-slate-50">
                        <span className="text-lg font-black text-blue-600">{students.filter(s => s.classId === c.id).length}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center border-r border-slate-50">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {c.isActive ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center border-r border-slate-50 text-xs font-medium text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleToggleClass(c.id)} className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition-all text-xs ${c.isActive ? 'bg-slate-100 text-slate-400 hover:bg-amber-500 hover:text-white' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`} title={c.isActive ? 'Tạm dừng' : 'Kích hoạt'}>
                            <i className={`fas ${c.isActive ? 'fa-pause' : 'fa-play'}`}></i>
                          </button>
                          <button onClick={() => handleDeleteClass(c.id, c.name)} className="w-8 h-8 rounded-lg inline-flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white transition-all text-xs" title="Xóa">
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
            <span>Tổng: {filteredClasses.length} lớp</span>
            <span className="flex items-center gap-2"><i className="fas fa-database text-blue-400"></i> LocalStorage</span>
          </div>
        </div>
      )}

      {/* ====================== STUDENTS TABLE ====================== */}
      {activeTab === 'students' && (
        <div className="flex gap-6">
          <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 transition-all ${selectedStudent ? 'max-w-[calc(100%-380px)]' : ''}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ minWidth: 900 }}>
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 sticky top-0 z-10">
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-12 text-center border-r border-slate-100">STT</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Họ và Tên</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Email</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 w-28">Lớp</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 text-center w-16">GT</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 w-28">SĐT</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 text-center w-24">Trạng thái</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-20">TT</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={8} className="py-16 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">Không có dữ liệu</td></tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const badge = STATUS_BADGE[s.status] || STATUS_BADGE.active;
                      return (
                        <tr
                          key={s.id}
                          onClick={() => setSelectedStudent(s)}
                          className={`border-b border-slate-100 hover:bg-blue-50/60 transition-colors cursor-pointer group ${idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'} ${selectedStudent?.id === s.id ? 'bg-blue-100/50 !border-blue-200' : ''}`}
                        >
                          <td className="px-4 py-3 text-center text-xs font-bold text-slate-400 border-r border-slate-50">{idx + 1}</td>
                          <td className="px-4 py-3 border-r border-slate-50">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0">{s.fullName.charAt(0)}</div>
                              <span className="font-bold text-slate-800 text-sm whitespace-nowrap">{s.fullName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-50 text-xs font-medium text-slate-500 font-mono">{s.email}</td>
                          <td className="px-4 py-3 border-r border-slate-50">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{s.className}</span>
                          </td>
                          <td className="px-4 py-3 text-center border-r border-slate-50 text-xs font-bold text-slate-600">{s.gender}</td>
                          <td className="px-4 py-3 border-r border-slate-50 text-xs font-medium text-slate-500">{s.phone}</td>
                          <td className="px-4 py-3 text-center border-r border-slate-50">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${badge.bg} ${badge.text}`}>{badge.label}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteStudent(s.id, s.fullName, s.classId); }}
                              className="w-7 h-7 rounded-md inline-flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all text-xs"
                              title="Xóa"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Hiển thị: {filteredStudents.length} / {students.length} học viên</span>
              <span className="flex items-center gap-2"><i className="fas fa-database text-blue-400"></i> LocalStorage</span>
            </div>
          </div>

          {/* DETAIL PANEL */}
          {selectedStudent && (
            <div className="w-[360px] bg-white rounded-3xl border border-slate-200 shadow-sm p-6 shrink-0 animate-fade-in self-start sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Chi tiết Học viên</h3>
                <button onClick={() => setSelectedStudent(null)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all">
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">{selectedStudent.fullName.charAt(0)}</div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg leading-tight">{selectedStudent.fullName}</h4>
                  <p className="text-xs text-slate-400 font-medium">{selectedStudent.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { icon: 'fa-building', label: 'Lớp', value: selectedStudent.className },
                  { icon: 'fa-venus-mars', label: 'Giới tính', value: selectedStudent.gender },
                  { icon: 'fa-phone', label: 'SĐT', value: selectedStudent.phone || 'N/A' },
                  { icon: 'fa-signal', label: 'Trạng thái', value: STATUS_BADGE[selectedStudent.status]?.label || selectedStudent.status },
                  { icon: 'fa-calendar', label: 'Ngày nhập học', value: new Date(selectedStudent.enrolledAt).toLocaleDateString('vi-VN') },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <i className={`fas ${item.icon} w-5 text-center text-blue-500 text-xs`}></i>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                      <p className="text-sm font-bold text-slate-800">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================== ADD CLASS MODAL ====================== */}
      {showAddClass && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-sm" onClick={() => setShowAddClass(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border-t-4 border-blue-600" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3"><i className="fas fa-plus-circle text-blue-600"></i> Tạo Lớp học mới</h3>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 mb-1 block">Tên / Mã lớp</label>
                <input type="text" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} placeholder="VD: K67-CNTT-01" className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white font-bold text-sm text-slate-800 transition-all" autoFocus />
              </div>
              <div>
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 mb-1 block">GV chủ nhiệm (tuỳ chọn)</label>
                <input type="text" value={newClass.teacherName} onChange={e => setNewClass({ ...newClass, teacherName: e.target.value })} placeholder="VD: TS. Nguyễn Văn A" className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white font-bold text-sm text-slate-800 transition-all" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setShowAddClass(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Hủy</button>
                <button onClick={handleAddClass} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all">Tạo lớp</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================== ADD STUDENT MODAL ====================== */}
      {showAddStudent && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-sm" onClick={() => setShowAddStudent(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border-t-4 border-blue-600" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3"><i className="fas fa-user-plus text-blue-600"></i> Thêm Học viên</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 mb-1 block">Họ và Tên *</label>
                <input type="text" value={newStudent.fullName} onChange={e => setNewStudent({ ...newStudent, fullName: e.target.value })} placeholder="Nguyễn Văn A" className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white font-bold text-sm text-slate-800 transition-all" autoFocus />
              </div>
              <div>
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 mb-1 block">Email</label>
                <input type="email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} placeholder="email@student.edu.vn" className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white font-bold text-sm text-slate-800 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 mb-1 block">Lớp *</label>
                  <select value={newStudent.classId} onChange={e => setNewStudent({ ...newStudent, classId: e.target.value })} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white font-bold text-sm text-slate-800 transition-all">
                    <option value="">-- Chọn lớp --</option>
                    {classes.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 mb-1 block">Giới tính</label>
                  <select value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white font-bold text-sm text-slate-800 transition-all">
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 mb-1 block">Số điện thoại</label>
                <input type="tel" value={newStudent.phone} onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })} placeholder="0901234567" className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white font-bold text-sm text-slate-800 transition-all" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setShowAddStudent(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Hủy</button>
                <button onClick={handleAddStudent} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all">Thêm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassStudentManager;
