import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Search, 
  Trash2, 
  Award, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  FileSpreadsheet, 
  Clock, 
  RefreshCw,
  Filter
} from 'lucide-react';
import { StudentSubmission } from '../types';

interface ResultsTrackerProps {
  submissions: StudentSubmission[];
  onRefresh: () => void;
  onDeleteSubmission?: (id: string) => void;
}

export const ResultsTracker: React.FC<ResultsTrackerProps> = ({
  submissions,
  onRefresh,
  onDeleteSubmission,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  // Available classes list
  const classList = Array.from(new Set(submissions.map((s) => s.studentClass).filter(Boolean)));

  // Filtered submissions
  const filtered = submissions.filter((s) => {
    const matchName = s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.examTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = selectedClass === 'ALL' || s.studentClass === selectedClass;
    return matchName && matchClass;
  });

  // Calculate statistics
  const totalStudents = filtered.length;
  const avgScore = totalStudents > 0 
    ? (filtered.reduce((sum, s) => sum + s.score, 0) / totalStudents).toFixed(2)
    : '0.00';

  const highestScore = totalStudents > 0
    ? Math.max(...filtered.map((s) => s.score)).toFixed(2)
    : '0.00';

  const lowestScore = totalStudents > 0
    ? Math.min(...filtered.map((s) => s.score)).toFixed(2)
    : '0.00';

  const passCount = filtered.filter((s) => s.score >= 5.0).length;
  const passRate = totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0;

  const excellentCount = filtered.filter((s) => s.score >= 8.0).length;
  const excellentRate = totalStudents > 0 ? Math.round((excellentCount / totalStudents) * 100) : 0;

  // Score distribution brackets: [0-3.5), [3.5-5), [5-6.5), [6.5-8), [8-10]
  const dist = {
    weak: filtered.filter((s) => s.score < 3.5).length,
    belowAvg: filtered.filter((s) => s.score >= 3.5 && s.score < 5.0).length,
    average: filtered.filter((s) => s.score >= 5.0 && s.score < 6.5).length,
    good: filtered.filter((s) => s.score >= 6.5 && s.score < 8.0).length,
    excellent: filtered.filter((s) => s.score >= 8.0).length,
  };

  // Skill averages
  const avgListening = totalStudents > 0
    ? (filtered.reduce((sum, s) => sum + (s.listeningScore || 0), 0) / totalStudents).toFixed(2)
    : '0.00';
  const avgLanguage = totalStudents > 0
    ? (filtered.reduce((sum, s) => sum + (s.languageScore || 0), 0) / totalStudents).toFixed(2)
    : '0.00';
  const avgReading = totalStudents > 0
    ? (filtered.reduce((sum, s) => sum + (s.readingScore || 0), 0) / totalStudents).toFixed(2)
    : '0.00';
  const avgWriting = totalStudents > 0
    ? (filtered.reduce((sum, s) => sum + (s.writingScore || 0), 0) / totalStudents).toFixed(2)
    : '0.00';

  // Export to CSV
  const handleExportCsv = () => {
    if (filtered.length === 0) {
      alert('Không có dữ liệu để xuất.');
      return;
    }

    const headers = [
      'STT',
      'Họ và Tên',
      'Lớp',
      'Trường',
      'Bài kiểm tra',
      'Điểm tổng (thang 10)',
      'Tỉ lệ (%)',
      'Điểm Listening',
      'Điểm Language Focus',
      'Điểm Reading',
      'Điểm Writing',
      'Thời gian làm (giây)',
      'Thời điểm nộp',
    ];

    const rows = filtered.map((s, idx) => [
      idx + 1,
      `"${s.studentName}"`,
      `"${s.studentClass}"`,
      `"${s.schoolName || ''}"`,
      `"${s.examTitle}"`,
      s.score,
      `${s.percentage}%`,
      s.listeningScore || 0,
      s.languageScore || 0,
      s.readingScore || 0,
      s.writingScore || 0,
      s.timeSpentSeconds || 0,
      `"${new Date(s.submittedAt).toLocaleString('vi-VN')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bang_Diem_TiengAnh_THCS_${selectedClass}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Sổ Điểm & Theo Dõi Kết Quả Kiểm Tra Định Kì
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống tự động lưu trữ và phân tích kết quả bài làm của học sinh khi làm bài online qua mã QR
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Làm mới
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
            Xuất Excel / CSV
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Students */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lượt làm bài</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalStudents}</div>
          <div className="text-[11px] text-slate-500">Học sinh đã nộp bài</div>
        </div>

        {/* Card 2: Average Score */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Điểm TB</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600">{avgScore}</div>
          <div className="text-[11px] text-slate-500">Thang điểm 10.0</div>
        </div>

        {/* Card 3: Pass Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tỉ lệ Đạt (&ge;5.0)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{passRate}%</div>
          <div className="text-[11px] text-slate-500">{passCount} học sinh đạt</div>
        </div>

        {/* Card 4: Excellent Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tỉ lệ Giỏi (&ge;8.0)</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600">{excellentRate}%</div>
          <div className="text-[11px] text-slate-500">{excellentCount} học sinh giỏi</div>
        </div>

        {/* Card 5: Highest / Lowest */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cao / Thấp</span>
            <BarChart3 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-slate-800">
            <span className="text-emerald-600">{highestScore}</span> / <span className="text-red-500">{lowestScore}</span>
          </div>
          <div className="text-[11px] text-slate-500">Điểm cao nhất / thấp nhất</div>
        </div>
      </div>

      {/* Analytics Breakdown: Score Distribution & Skill Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Bars */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center">
            <BarChart3 className="w-4 h-4 mr-1.5 text-indigo-600" />
            Phổ Điểm Toàn Khối / Lớp
          </h3>

          <div className="space-y-2 text-xs">
            {/* Giỏi (8.0 - 10.0) */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Giỏi (8.0 - 10.0 điểm):</span>
                <strong className="text-purple-700">{dist.excellent} HS ({totalStudents > 0 ? Math.round((dist.excellent / totalStudents) * 100) : 0}%)</strong>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${totalStudents > 0 ? (dist.excellent / totalStudents) * 100 : 0}%` }} 
                  className="bg-purple-600 h-full rounded-full transition-all"
                />
              </div>
            </div>

            {/* Khá (6.5 - 7.9) */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Khá (6.5 - 7.9 điểm):</span>
                <strong className="text-blue-700">{dist.good} HS ({totalStudents > 0 ? Math.round((dist.good / totalStudents) * 100) : 0}%)</strong>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${totalStudents > 0 ? (dist.good / totalStudents) * 100 : 0}%` }} 
                  className="bg-blue-500 h-full rounded-full transition-all"
                />
              </div>
            </div>

            {/* Trung bình (5.0 - 6.4) */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Trung bình (5.0 - 6.4 điểm):</span>
                <strong className="text-emerald-700">{dist.average} HS ({totalStudents > 0 ? Math.round((dist.average / totalStudents) * 100) : 0}%)</strong>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${totalStudents > 0 ? (dist.average / totalStudents) * 100 : 0}%` }} 
                  className="bg-emerald-500 h-full rounded-full transition-all"
                />
              </div>
            </div>

            {/* Yếu (3.5 - 4.9) */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Yếu (3.5 - 4.9 điểm):</span>
                <strong className="text-amber-700">{dist.belowAvg} HS ({totalStudents > 0 ? Math.round((dist.belowAvg / totalStudents) * 100) : 0}%)</strong>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${totalStudents > 0 ? (dist.belowAvg / totalStudents) * 100 : 0}%` }} 
                  className="bg-amber-500 h-full rounded-full transition-all"
                />
              </div>
            </div>

            {/* Kém (<3.5) */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Kém (&lt;3.5 điểm):</span>
                <strong className="text-red-600">{dist.weak} HS ({totalStudents > 0 ? Math.round((dist.weak / totalStudents) * 100) : 0}%)</strong>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${totalStudents > 0 ? (dist.weak / totalStudents) * 100 : 0}%` }} 
                  className="bg-red-500 h-full rounded-full transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skill Mastery Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center">
            <TrendingUp className="w-4 h-4 mr-1.5 text-blue-600" />
            Mức Độ Thành Thạo Từng Kỹ Năng (Điểm Trung Bình)
          </h3>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1">
              <span className="text-xs font-semibold text-blue-900 block">Kỹ năng Nghe (Listening)</span>
              <div className="text-xl font-bold text-blue-700">{avgListening} <span className="text-xs font-normal text-slate-500">/ 2.0 đ</span></div>
              <p className="text-[11px] text-slate-500">Nhận diện thông tin chi tiết</p>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 space-y-1">
              <span className="text-xs font-semibold text-emerald-900 block">Ngữ âm & Ngữ pháp (Language)</span>
              <div className="text-xl font-bold text-emerald-700">{avgLanguage} <span className="text-xs font-normal text-slate-500">/ 2.5 đ</span></div>
              <p className="text-[11px] text-slate-500">Từ vựng, cấu trúc câu</p>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100 space-y-1">
              <span className="text-xs font-semibold text-amber-900 block">Kỹ năng Đọc (Reading)</span>
              <div className="text-xl font-bold text-amber-700">{avgReading} <span className="text-xs font-normal text-slate-500">/ 2.5 đ</span></div>
              <p className="text-[11px] text-slate-500">Đọc hiểu ý chính và chi tiết</p>
            </div>

            <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 space-y-1">
              <span className="text-xs font-semibold text-purple-900 block">Kỹ năng Viết (Writing)</span>
              <div className="text-xl font-bold text-purple-700">{avgWriting} <span className="text-xs font-normal text-slate-500">/ 2.5 đ</span></div>
              <p className="text-[11px] text-slate-500">Viết lại câu & đoạn văn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, đề thi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 font-medium">Lọc theo Lớp:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">Tất cả các lớp ({submissions.length})</option>
              {classList.map((c) => (
                <option key={c} value={c}>
                  Lớp {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Hiển thị: <strong>{filtered.length}</strong> / {submissions.length} bản ghi
        </div>
      </div>

      {/* Main Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-semibold">Chưa có kết quả làm bài nào</p>
            <p className="text-xs">
              Chia sẻ mã QR hoặc link làm bài trực tuyến cho học sinh để tự động thu thập kết quả và chấm điểm.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3 min-w-[160px]">Họ và tên</th>
                  <th className="p-3 w-20">Lớp</th>
                  <th className="p-3 min-w-[200px]">Đề kiểm tra</th>
                  <th className="p-3 w-24 text-center">Điểm số</th>
                  <th className="p-3 w-24 text-center">Tỉ lệ</th>
                  <th className="p-3 w-28 text-center">Kỹ năng (L/LF/R/W)</th>
                  <th className="p-3 w-28 text-center">Thời gian</th>
                  <th className="p-3 w-36 text-center">Thời điểm nộp</th>
                  {onDeleteSubmission && <th className="p-3 w-10 text-center">Xóa</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((sub, idx) => {
                  const isHigh = sub.score >= 8.0;
                  const isPass = sub.score >= 5.0;

                  return (
                    <tr key={sub.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center font-semibold text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{sub.studentName}</td>
                      <td className="p-3 font-semibold text-indigo-700">{sub.studentClass}</td>
                      <td className="p-3 text-slate-700">{sub.examTitle}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-extrabold text-xs ${
                            isHigh
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPass
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sub.score} / 10
                        </span>
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-700">{sub.percentage}%</td>
                      <td className="p-3 text-center text-slate-600 font-mono text-[11px]">
                        {sub.listeningScore}/{sub.languageScore}/{sub.readingScore}/{sub.writingScore}
                      </td>
                      <td className="p-3 text-center text-slate-600">
                        {Math.round((sub.timeSpentSeconds || 0) / 60)} phút
                      </td>
                      <td className="p-3 text-center text-slate-500 text-[11px]">
                        {new Date(sub.submittedAt).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </td>
                      {onDeleteSubmission && (
                        <td className="p-3 text-center">
                          <button
                            onClick={() => onDeleteSubmission(sub.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50 cursor-pointer"
                            title="Xóa kết quả này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
