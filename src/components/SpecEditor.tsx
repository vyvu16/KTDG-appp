import React from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  Layers, 
  GraduationCap 
} from 'lucide-react';
import { ExamSpecification, SpecItem } from '../types';

interface SpecEditorProps {
  spec: ExamSpecification;
  onChangeSpec: (updatedSpec: ExamSpecification) => void;
  onSave: () => void;
  onNavigateToExam: () => void;
  onNavigateToMatrix: () => void;
}

export const SpecEditor: React.FC<SpecEditorProps> = ({
  spec,
  onChangeSpec,
  onSave,
  onNavigateToExam,
  onNavigateToMatrix,
}) => {
  const handleUpdateItem = (index: number, field: keyof SpecItem, value: any) => {
    const newItems = [...spec.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    onChangeSpec({
      ...spec,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateQuestionCount = (
    index: number,
    subField: keyof SpecItem['questionCount'],
    value: number
  ) => {
    const newItems = [...spec.items];
    newItems[index] = {
      ...newItems[index],
      questionCount: {
        ...newItems[index].questionCount,
        [subField]: value,
      },
    };
    onChangeSpec({
      ...spec,
      items: newItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddItem = () => {
    const newItem: SpecItem = {
      id: `spec-${Date.now()}`,
      stt: spec.items.length + 1,
      skill: 'Kỹ năng mới',
      contentUnit: 'Đơn vị kiến thức / Unit...',
      learningStandard: 'Chuẩn kiến thức kĩ năng cần đánh giá (Yêu cầu cần đạt GDPT 2018)...',
      recognitionSpecs: 'Mô tả mức độ Nhận biết...',
      comprehensionSpecs: 'Mô tả mức độ Thông hiểu...',
      applicationSpecs: 'Mô tả mức độ Vận dụng...',
      highAppSpecs: 'Mô tả mức độ Vận dụng cao...',
      questionCount: { recognition: 2, comprehension: 2, application: 1, highApp: 0 },
      questionFormat: 'TNKQ',
      questionIndices: `C${spec.items.length * 5 + 1} -> C${spec.items.length * 5 + 5}`,
    };

    onChangeSpec({
      ...spec,
      items: [...spec.items, newItem],
    });
  };

  const handleDeleteItem = (index: number) => {
    const newItems = spec.items
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, stt: idx + 1 }));
    onChangeSpec({
      ...spec,
      items: newItems,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Meta */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <FileText className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Bản Đặc Tả Đề Kiểm Tra Định Kì (Test Specifications)
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Mô tả chi tiết chuẩn kiến thức, kĩ năng và các mức độ nhận thức đánh giá tương ứng với từng câu hỏi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onNavigateToMatrix}
              className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <span>← Về Ma trận</span>
            </button>

            <button
              onClick={onSave}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Lưu bản đặc tả
            </button>

            <button
              onClick={onNavigateToExam}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
              <span>Xem Đề thi & Đáp án</span>
              <span className="ml-1 font-bold">→</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tiêu đề Bản đặc tả:</label>
            <input
              type="text"
              value={spec.title}
              onChange={(e) => onChangeSpec({ ...spec, title: e.target.value })}
              className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bộ sách & Khối:</label>
            <div className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5">
              Lớp {spec.grade} • {spec.curriculum}
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-center">
                <th className="p-3 border-r border-slate-200 w-12">STT</th>
                <th className="p-3 border-r border-slate-200 w-36 text-left">Kĩ năng</th>
                <th className="p-3 border-r border-slate-200 w-44 text-left">Đơn vị kiến thức</th>
                <th className="p-3 border-r border-slate-200 min-w-[280px] text-left">
                  Mức độ đánh giá (Chuẩn cần đạt GDPT 2018)
                </th>
                <th className="p-3 border-r border-slate-200 w-40 text-center">Số câu hỏi (NB/TH/VD/VDC)</th>
                <th className="p-3 border-r border-slate-200 w-28 text-center">Hình thức</th>
                <th className="p-3 border-r border-slate-200 w-24 text-center">Vị trí câu</th>
                <th className="p-3 w-10 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {spec.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-200 align-top">
                    {item.stt || idx + 1}
                  </td>

                  {/* Skill */}
                  <td className="p-2.5 border-r border-slate-200 align-top">
                    <input
                      type="text"
                      value={item.skill}
                      onChange={(e) => handleUpdateItem(idx, 'skill', e.target.value)}
                      className="w-full font-bold text-indigo-900 bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-1"
                    />
                  </td>

                  {/* Content Unit */}
                  <td className="p-2.5 border-r border-slate-200 align-top">
                    <textarea
                      rows={3}
                      value={item.contentUnit}
                      onChange={(e) => handleUpdateItem(idx, 'contentUnit', e.target.value)}
                      className="w-full font-medium text-slate-800 bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-1 resize-none"
                    />
                  </td>

                  {/* Learning Standards & Cognitive specs */}
                  <td className="p-3 border-r border-slate-200 space-y-2 align-top">
                    <div>
                      <span className="font-semibold text-slate-800 block text-[11px] text-slate-500 mb-0.5">
                        Chuẩn kiến thức kĩ năng chung:
                      </span>
                      <textarea
                        rows={2}
                        value={item.learningStandard}
                        onChange={(e) => handleUpdateItem(idx, 'learningStandard', e.target.value)}
                        className="w-full text-slate-700 bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded p-1.5 text-xs resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 pt-1 text-[11px] border-t border-slate-100">
                      <div className="p-1.5 bg-blue-50/50 rounded">
                        <strong className="text-blue-700">* Nhận biết:</strong>
                        <input
                          type="text"
                          value={item.recognitionSpecs}
                          onChange={(e) => handleUpdateItem(idx, 'recognitionSpecs', e.target.value)}
                          className="w-full text-slate-700 bg-transparent focus:bg-white rounded px-1 mt-0.5"
                        />
                      </div>

                      <div className="p-1.5 bg-emerald-50/50 rounded">
                        <strong className="text-emerald-700">* Thông hiểu:</strong>
                        <input
                          type="text"
                          value={item.comprehensionSpecs}
                          onChange={(e) => handleUpdateItem(idx, 'comprehensionSpecs', e.target.value)}
                          className="w-full text-slate-700 bg-transparent focus:bg-white rounded px-1 mt-0.5"
                        />
                      </div>

                      <div className="p-1.5 bg-amber-50/50 rounded">
                        <strong className="text-amber-700">* Vận dụng:</strong>
                        <input
                          type="text"
                          value={item.applicationSpecs}
                          onChange={(e) => handleUpdateItem(idx, 'applicationSpecs', e.target.value)}
                          className="w-full text-slate-700 bg-transparent focus:bg-white rounded px-1 mt-0.5"
                        />
                      </div>

                      <div className="p-1.5 bg-purple-50/50 rounded">
                        <strong className="text-purple-700">* Vận dụng cao:</strong>
                        <input
                          type="text"
                          value={item.highAppSpecs}
                          onChange={(e) => handleUpdateItem(idx, 'highAppSpecs', e.target.value)}
                          className="w-full text-slate-700 bg-transparent focus:bg-white rounded px-1 mt-0.5"
                        />
                      </div>
                    </div>
                  </td>

                  {/* Question Counts per cognitive level */}
                  <td className="p-2 border-r border-slate-200 text-center align-top">
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <div className="p-1 bg-blue-50 rounded">
                        <span className="text-blue-800 text-[10px] block">NB</span>
                        <input
                          type="number"
                          min="0"
                          value={item.questionCount.recognition}
                          onChange={(e) => handleUpdateQuestionCount(idx, 'recognition', Number(e.target.value))}
                          className="w-full text-center font-bold bg-white border border-slate-200 rounded py-0.5"
                        />
                      </div>
                      <div className="p-1 bg-emerald-50 rounded">
                        <span className="text-emerald-800 text-[10px] block">TH</span>
                        <input
                          type="number"
                          min="0"
                          value={item.questionCount.comprehension}
                          onChange={(e) => handleUpdateQuestionCount(idx, 'comprehension', Number(e.target.value))}
                          className="w-full text-center font-bold bg-white border border-slate-200 rounded py-0.5"
                        />
                      </div>
                      <div className="p-1 bg-amber-50 rounded">
                        <span className="text-amber-800 text-[10px] block">VD</span>
                        <input
                          type="number"
                          min="0"
                          value={item.questionCount.application}
                          onChange={(e) => handleUpdateQuestionCount(idx, 'application', Number(e.target.value))}
                          className="w-full text-center font-bold bg-white border border-slate-200 rounded py-0.5"
                        />
                      </div>
                      <div className="p-1 bg-purple-50 rounded">
                        <span className="text-purple-800 text-[10px] block">VDC</span>
                        <input
                          type="number"
                          min="0"
                          value={item.questionCount.highApp}
                          onChange={(e) => handleUpdateQuestionCount(idx, 'highApp', Number(e.target.value))}
                          className="w-full text-center font-bold bg-white border border-slate-200 rounded py-0.5"
                        />
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-slate-700">
                      Tổng:{' '}
                      {(item.questionCount.recognition || 0) +
                        (item.questionCount.comprehension || 0) +
                        (item.questionCount.application || 0) +
                        (item.questionCount.highApp || 0)}{' '}
                      câu
                    </div>
                  </td>

                  {/* Question Format */}
                  <td className="p-2 border-r border-slate-200 text-center align-top">
                    <input
                      type="text"
                      value={item.questionFormat}
                      onChange={(e) => handleUpdateItem(idx, 'questionFormat', e.target.value)}
                      className="w-full text-center font-medium text-slate-700 bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded py-1"
                    />
                  </td>

                  {/* Question Indices */}
                  <td className="p-2 border-r border-slate-200 text-center align-top">
                    <input
                      type="text"
                      value={item.questionIndices}
                      onChange={(e) => handleUpdateItem(idx, 'questionIndices', e.target.value)}
                      className="w-full text-center font-bold text-indigo-700 bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded py-1"
                    />
                  </td>

                  {/* Delete Item */}
                  <td className="p-2 text-center align-top">
                    <button
                      onClick={() => handleDeleteItem(idx)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded hover:bg-red-50 cursor-pointer"
                      title="Xóa mục đặc tả này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleAddItem}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Thêm dòng bản đặc tả
          </button>

          <div className="text-xs text-slate-500">
            Tổng cộng: <strong>{spec.items.length}</strong> phần kĩ năng/chủ đề đặc tả
          </div>
        </div>
      </div>
    </div>
  );
};
