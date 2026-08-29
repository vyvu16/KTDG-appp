import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Sliders, 
  FileSpreadsheet,
  HelpCircle
} from 'lucide-react';
import { ExamMatrix, MatrixSkillRow } from '../types';

interface MatrixEditorProps {
  matrix: ExamMatrix;
  onChangeMatrix: (updatedMatrix: ExamMatrix) => void;
  onSave: () => void;
  onNavigateToSpec: () => void;
}

export const MatrixEditor: React.FC<MatrixEditorProps> = ({
  matrix,
  onChangeMatrix,
  onSave,
  onNavigateToSpec,
}) => {
  const [showHelper, setShowHelper] = useState(false);

  // Recalculate row totals
  const handleUpdateRow = (rowIndex: number, field: keyof MatrixSkillRow, value: any) => {
    const newRows = [...matrix.rows];
    const row = { ...newRows[rowIndex], [field]: value };

    // Auto sum total questions in this row
    const totalMCQ = (Number(row.recognitionMCQ) || 0) + 
                     (Number(row.comprehensionMCQ) || 0) + 
                     (Number(row.applicationMCQ) || 0) + 
                     (Number(row.highAppMCQ) || 0);

    const totalEssay = (Number(row.recognitionEssay) || 0) + 
                       (Number(row.comprehensionEssay) || 0) + 
                       (Number(row.applicationEssay) || 0) + 
                       (Number(row.highAppEssay) || 0);

    row.totalQuestions = totalMCQ + totalEssay;
    row.totalPoints = Number((row.totalQuestions * matrix.pointPerQuestion).toFixed(2));
    
    newRows[rowIndex] = row;
    
    // Recalculate weights
    const grandTotalScore = newRows.reduce((sum, r) => sum + r.totalPoints, 0) || 10;
    newRows.forEach((r) => {
      r.weightPercent = Math.round((r.totalPoints / grandTotalScore) * 100);
    });

    onChangeMatrix({
      ...matrix,
      rows: newRows,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddRow = () => {
    const newRow: MatrixSkillRow = {
      id: `row-${Date.now()}`,
      skillName: 'Kỹ năng mới',
      contentTopic: 'Chủ đề kiến thức...',
      recognitionMCQ: 2,
      recognitionEssay: 0,
      comprehensionMCQ: 2,
      comprehensionEssay: 0,
      applicationMCQ: 1,
      applicationEssay: 0,
      highAppMCQ: 0,
      highAppEssay: 0,
      totalQuestions: 5,
      totalPoints: 1.25,
      weightPercent: 12,
    };
    onChangeMatrix({
      ...matrix,
      rows: [...matrix.rows, newRow],
    });
  };

  const handleDeleteRow = (index: number) => {
    const newRows = matrix.rows.filter((_, idx) => idx !== index);
    onChangeMatrix({
      ...matrix,
      rows: newRows,
    });
  };

  // Grand totals
  const totalRecMCQ = matrix.rows.reduce((sum, r) => sum + (Number(r.recognitionMCQ) || 0), 0);
  const totalRecEssay = matrix.rows.reduce((sum, r) => sum + (Number(r.recognitionEssay) || 0), 0);
  const totalRecQuestions = totalRecMCQ + totalRecEssay;

  const totalCompMCQ = matrix.rows.reduce((sum, r) => sum + (Number(r.comprehensionMCQ) || 0), 0);
  const totalCompEssay = matrix.rows.reduce((sum, r) => sum + (Number(r.comprehensionEssay) || 0), 0);
  const totalCompQuestions = totalCompMCQ + totalCompEssay;

  const totalAppMCQ = matrix.rows.reduce((sum, r) => sum + (Number(r.applicationMCQ) || 0), 0);
  const totalAppEssay = matrix.rows.reduce((sum, r) => sum + (Number(r.applicationEssay) || 0), 0);
  const totalAppQuestions = totalAppMCQ + totalAppEssay;

  const totalHighMCQ = matrix.rows.reduce((sum, r) => sum + (Number(r.highAppMCQ) || 0), 0);
  const totalHighEssay = matrix.rows.reduce((sum, r) => sum + (Number(r.highAppEssay) || 0), 0);
  const totalHighQuestions = totalHighMCQ + totalHighEssay;

  const grandTotalQuestions = totalRecQuestions + totalCompQuestions + totalAppQuestions + totalHighQuestions;
  const grandTotalPoints = Number(matrix.rows.reduce((sum, r) => sum + (Number(r.totalPoints) || 0), 0).toFixed(2));

  const actualRecPercent = grandTotalPoints > 0 ? Math.round(((totalRecQuestions * matrix.pointPerQuestion) / grandTotalPoints) * 100) : 0;
  const actualCompPercent = grandTotalPoints > 0 ? Math.round(((totalCompQuestions * matrix.pointPerQuestion) / grandTotalPoints) * 100) : 0;
  const actualAppPercent = grandTotalPoints > 0 ? Math.round(((totalAppQuestions * matrix.pointPerQuestion) / grandTotalPoints) * 100) : 0;
  const actualHighPercent = grandTotalPoints > 0 ? Math.round(((totalHighQuestions * matrix.pointPerQuestion) / grandTotalPoints) * 100) : 0;

  const isBalanced = Math.abs(grandTotalPoints - 10.0) < 0.05;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Meta Config */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Khung Ma Trận Đề Kiểm Tra Định Kì (Tiếng Anh THCS)
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Thiết kế theo chuẩn 4 mức độ nhận thức theo định hướng Thông tư 22/2021/TT-BGDĐT & GDPT 2018
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowHelper(!showHelper)}
              className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Hướng dẫn tỉ lệ
            </button>

            <button
              onClick={onSave}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Lưu ma trận
            </button>

            <button
              onClick={onNavigateToSpec}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
            >
              <span>Xem Bản đặc tả</span>
              <span className="ml-1 font-bold">→</span>
            </button>
          </div>
        </div>

        {/* Title & Basic details input */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên ma trận đề kiểm tra:</label>
            <input
              type="text"
              value={matrix.title}
              onChange={(e) => onChangeMatrix({ ...matrix, title: e.target.value })}
              className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian làm bài:</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={matrix.durationMinutes}
                onChange={(e) => onChangeMatrix({ ...matrix, durationMinutes: Number(e.target.value) || 60 })}
                className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-slate-500 shrink-0">phút</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm mỗi câu trắc nghiệm:</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.05"
                value={matrix.pointPerQuestion}
                onChange={(e) => onChangeMatrix({ ...matrix, pointPerQuestion: Number(e.target.value) || 0.25 })}
                className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-slate-500 shrink-0">điểm/câu</span>
            </div>
          </div>
        </div>

        {/* Cognitive Balance Visual Indicator */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center">
              <Sliders className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              Tỉ lệ mức độ nhận thức đạt được:
            </span>
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-500">Tổng điểm: <strong className={isBalanced ? 'text-emerald-600' : 'text-amber-600'}>{grandTotalPoints} / 10.0 đ</strong></span>
              <span className="text-slate-500">Tổng số câu: <strong className="text-slate-800">{grandTotalQuestions} câu</strong></span>
            </div>
          </div>

          {/* Progress bar visual */}
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${actualRecPercent}%` }} 
              className="bg-blue-500 h-full transition-all" 
              title={`Nhận biết: ${actualRecPercent}% (${totalRecQuestions} câu)`}
            />
            <div 
              style={{ width: `${actualCompPercent}%` }} 
              className="bg-emerald-500 h-full transition-all" 
              title={`Thông hiểu: ${actualCompPercent}% (${totalCompQuestions} câu)`}
            />
            <div 
              style={{ width: `${actualAppPercent}%` }} 
              className="bg-amber-500 h-full transition-all" 
              title={`Vận dụng: ${actualAppPercent}% (${totalAppQuestions} câu)`}
            />
            <div 
              style={{ width: `${actualHighPercent}%` }} 
              className="bg-purple-500 h-full transition-all" 
              title={`Vận dụng cao: ${actualHighPercent}% (${totalHighQuestions} câu)`}
            />
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
            <div className="flex items-center space-x-1.5 p-1.5 bg-blue-50/60 rounded-md">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
              <span className="text-slate-700">1. Nhận biết: <strong>{actualRecPercent}%</strong> ({totalRecQuestions} câu)</span>
            </div>
            <div className="flex items-center space-x-1.5 p-1.5 bg-emerald-50/60 rounded-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-slate-700">2. Thông hiểu: <strong>{actualCompPercent}%</strong> ({totalCompQuestions} câu)</span>
            </div>
            <div className="flex items-center space-x-1.5 p-1.5 bg-amber-50/60 rounded-md">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <span className="text-slate-700">3. Vận dụng: <strong>{actualAppPercent}%</strong> ({totalAppQuestions} câu)</span>
            </div>
            <div className="flex items-center space-x-1.5 p-1.5 bg-purple-50/60 rounded-md">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
              <span className="text-slate-700">4. Vận dụng cao: <strong>{actualHighPercent}%</strong> ({totalHighQuestions} câu)</span>
            </div>
          </div>
        </div>

        {/* Validation Alert */}
        {!isBalanced && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-amber-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Lưu ý: Tổng điểm hiện tại đang là <strong>{grandTotalPoints} điểm</strong> (khác với chuẩn 10.0 điểm). Hãy điều chỉnh lại số lượng câu hỏi hoặc thang điểm để cân bằng.
            </span>
          </div>
        )}
      </div>

      {/* Helper Box */}
      {showHelper && (
        <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 font-bold text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Khung Tỉ Lệ Chuẩn Bộ GD&ĐT Cho Môn Tiếng Anh THCS (40 câu - 10 điểm):</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
            <li><strong>Nhận biết (40% - 4.0 điểm - 16 câu):</strong> Nhận diện âm, từ vựng cơ bản, thông tin hiển ngôn trong bài nghe và đọc.</li>
            <li><strong>Thông hiểu (30% - 3.0 điểm - 12 câu):</strong> Chia thì, liên từ, hiểu nghĩa theo ngữ cảnh, chọn câu đúng ngữ pháp.</li>
            <li><strong>Vận dụng (20% - 2.0 điểm - 8 câu):</strong> Viết lại câu không đổi nghĩa, sắp xếp trật tự từ, liên hệ thực tế.</li>
            <li><strong>Vận dụng cao (10% - 1.0 điểm - 4 câu/viết đoạn văn):</strong> Viết đoạn văn ngắn (50-60 từ), giải quyết tình huống giao tiếp phức tạp.</li>
          </ul>
        </div>
      )}

      {/* Main Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-center">
                <th rowSpan={2} className="p-3 border-r border-slate-200 w-12">TT</th>
                <th rowSpan={2} className="p-3 border-r border-slate-200 w-48 text-left">Kỹ năng / Mạch kiến thức</th>
                <th rowSpan={2} className="p-3 border-r border-slate-200 min-w-[200px] text-left">Nội dung / Đơn vị kiến thức</th>
                <th colSpan={2} className="p-2 border-r border-slate-200 bg-blue-50/80 text-blue-900">1. Nhận biết</th>
                <th colSpan={2} className="p-2 border-r border-slate-200 bg-emerald-50/80 text-emerald-900">2. Thông hiểu</th>
                <th colSpan={2} className="p-2 border-r border-slate-200 bg-amber-50/80 text-amber-900">3. Vận dụng</th>
                <th colSpan={2} className="p-2 border-r border-slate-200 bg-purple-50/80 text-purple-900">4. Vận dụng cao</th>
                <th rowSpan={2} className="p-2 border-r border-slate-200 bg-slate-200/70 w-20">Tổng số câu</th>
                <th rowSpan={2} className="p-2 border-r border-slate-200 bg-slate-200/70 w-20">Tổng điểm</th>
                <th rowSpan={2} className="p-2 border-r border-slate-200 bg-slate-200/70 w-16">Tỉ lệ (%)</th>
                <th rowSpan={2} className="p-2 w-10">Xóa</th>
              </tr>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-center text-[11px]">
                <th className="p-1.5 border-r border-slate-200 bg-blue-50/50 w-12">TNKQ</th>
                <th className="p-1.5 border-r border-slate-200 bg-blue-50/50 w-12">TL</th>
                <th className="p-1.5 border-r border-slate-200 bg-emerald-50/50 w-12">TNKQ</th>
                <th className="p-1.5 border-r border-slate-200 bg-emerald-50/50 w-12">TL</th>
                <th className="p-1.5 border-r border-slate-200 bg-amber-50/50 w-12">TNKQ</th>
                <th className="p-1.5 border-r border-slate-200 bg-amber-50/50 w-12">TL</th>
                <th className="p-1.5 border-r border-slate-200 bg-purple-50/50 w-12">TNKQ</th>
                <th className="p-1.5 border-r border-slate-200 bg-purple-50/50 w-12">TL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {matrix.rows.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2.5 text-center font-bold text-slate-500 border-r border-slate-200">
                    {idx + 1}
                  </td>
                  <td className="p-2 border-r border-slate-200">
                    <input
                      type="text"
                      value={row.skillName}
                      onChange={(e) => handleUpdateRow(idx, 'skillName', e.target.value)}
                      className="w-full font-semibold text-slate-800 bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-1"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-200">
                    <textarea
                      rows={2}
                      value={row.contentTopic}
                      onChange={(e) => handleUpdateRow(idx, 'contentTopic', e.target.value)}
                      className="w-full text-slate-700 bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-1 resize-none"
                    />
                  </td>
                  {/* Nhận biết */}
                  <td className="p-1.5 border-r border-slate-200 text-center bg-blue-50/20">
                    <input
                      type="number"
                      min="0"
                      value={row.recognitionMCQ}
                      onChange={(e) => handleUpdateRow(idx, 'recognitionMCQ', Number(e.target.value))}
                      className="w-10 text-center font-medium text-slate-800 bg-white border border-slate-200 rounded py-1"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center bg-blue-50/20">
                    <input
                      type="number"
                      min="0"
                      value={row.recognitionEssay}
                      onChange={(e) => handleUpdateRow(idx, 'recognitionEssay', Number(e.target.value))}
                      className="w-10 text-center font-medium text-slate-800 bg-white border border-slate-200 rounded py-1"
                    />
                  </td>
                  {/* Thông hiểu */}
                  <td className="p-1.5 border-r border-slate-200 text-center bg-emerald-50/20">
                    <input
                      type="number"
                      min="0"
                      value={row.comprehensionMCQ}
                      onChange={(e) => handleUpdateRow(idx, 'comprehensionMCQ', Number(e.target.value))}
                      className="w-10 text-center font-medium text-slate-800 bg-white border border-slate-200 rounded py-1"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center bg-emerald-50/20">
                    <input
                      type="number"
                      min="0"
                      value={row.comprehensionEssay}
                      onChange={(e) => handleUpdateRow(idx, 'comprehensionEssay', Number(e.target.value))}
                      className="w-10 text-center font-medium text-slate-800 bg-white border border-slate-200 rounded py-1"
                    />
                  </td>
                  {/* Vận dụng */}
                  <td className="p-1.5 border-r border-slate-200 text-center bg-amber-50/20">
                    <input
                      type="number"
                      min="0"
                      value={row.applicationMCQ}
                      onChange={(e) => handleUpdateRow(idx, 'applicationMCQ', Number(e.target.value))}
                      className="w-10 text-center font-medium text-slate-800 bg-white border border-slate-200 rounded py-1"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center bg-amber-50/20">
                    <input
                      type="number"
                      min="0"
                      value={row.applicationEssay}
                      onChange={(e) => handleUpdateRow(idx, 'applicationEssay', Number(e.target.value))}
                      className="w-10 text-center font-medium text-slate-800 bg-white border border-slate-200 rounded py-1"
                    />
                  </td>
                  {/* Vận dụng cao */}
                  <td className="p-1.5 border-r border-slate-200 text-center bg-purple-50/20">
                    <input
                      type="number"
                      min="0"
                      value={row.highAppMCQ}
                      onChange={(e) => handleUpdateRow(idx, 'highAppMCQ', Number(e.target.value))}
                      className="w-10 text-center font-medium text-slate-800 bg-white border border-slate-200 rounded py-1"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center bg-purple-50/20">
                    <input
                      type="number"
                      min="0"
                      value={row.highAppEssay}
                      onChange={(e) => handleUpdateRow(idx, 'highAppEssay', Number(e.target.value))}
                      className="w-10 text-center font-medium text-slate-800 bg-white border border-slate-200 rounded py-1"
                    />
                  </td>
                  {/* Totals for this row */}
                  <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-800 bg-slate-50">
                    {row.totalQuestions}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center font-bold text-indigo-700 bg-slate-50">
                    {row.totalPoints.toFixed(2)}đ
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center font-semibold text-slate-700 bg-slate-50">
                    {row.weightPercent}%
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleDeleteRow(idx)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50 cursor-pointer"
                      title="Xóa hàng này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Total Summary Row */}
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-center">
                <td colSpan={3} className="p-3 text-right uppercase tracking-wider border-r border-slate-300">
                  Tổng cộng:
                </td>
                <td className="p-2 border-r border-slate-300 bg-blue-100/60">{totalRecMCQ}</td>
                <td className="p-2 border-r border-slate-300 bg-blue-100/60">{totalRecEssay}</td>
                <td className="p-2 border-r border-slate-300 bg-emerald-100/60">{totalCompMCQ}</td>
                <td className="p-2 border-r border-slate-300 bg-emerald-100/60">{totalCompEssay}</td>
                <td className="p-2 border-r border-slate-300 bg-amber-100/60">{totalAppMCQ}</td>
                <td className="p-2 border-r border-slate-300 bg-amber-100/60">{totalAppEssay}</td>
                <td className="p-2 border-r border-slate-300 bg-purple-100/60">{totalHighMCQ}</td>
                <td className="p-2 border-r border-slate-300 bg-purple-100/60">{totalHighEssay}</td>
                <td className="p-2 border-r border-slate-300 bg-slate-200 text-indigo-900">{grandTotalQuestions} câu</td>
                <td className="p-2 border-r border-slate-300 bg-slate-200 text-indigo-900">{grandTotalPoints} đ</td>
                <td className="p-2 border-r border-slate-300 bg-slate-200 text-indigo-900">100%</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Table footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleAddRow}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Thêm hàng kĩ năng / mạch kiến thức
          </button>

          <div className="text-xs text-slate-500">
            <span>Khối {matrix.grade} THCS • Năm học {matrix.schoolYear}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
