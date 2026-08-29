import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  BookOpen, 
  Layers, 
  GraduationCap, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import { GradeLevel, CurriculumBook, ExamPeriod, GenerationRequest, ExamMatrix, ExamSpecification, ExamPaper } from '../types';
import { generateFullPackageAI } from '../services/api';

interface AiWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGrade: GradeLevel;
  initialCurriculum: CurriculumBook;
  initialPeriod: ExamPeriod;
  onGenerationSuccess: (data: {
    matrix: ExamMatrix;
    specification: ExamSpecification;
    exam: ExamPaper;
  }) => void;
}

export const AiWizardModal: React.FC<AiWizardModalProps> = ({
  isOpen,
  onClose,
  initialGrade,
  initialCurriculum,
  initialPeriod,
  onGenerationSuccess,
}) => {
  const [grade, setGrade] = useState<GradeLevel>(initialGrade);
  const [curriculum, setCurriculum] = useState<CurriculumBook>(initialCurriculum);
  const [period, setPeriod] = useState<ExamPeriod>(initialPeriod);
  const [units, setUnits] = useState('Unit 1, Unit 2, Unit 3');
  const [examCode, setExamCode] = useState('101');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const req: GenerationRequest = {
        grade,
        curriculum,
        period,
        units,
        examCode,
        durationMinutes: 60,
        customInstructions: customInstructions.trim() || undefined,
      };

      const result = await generateFullPackageAI(req);
      onGenerationSuccess(result);
      onClose();
    } catch (err: any) {
      console.error('AI Generation error', err);
      setErrorMessage(err.message || 'Không thể tạo đề qua AI. Vui lòng kiểm tra lại GEMINI_API_KEY hoặc thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              AI Trợ Lý Thiết Kế Trọn Gói GDPT 2018
            </h3>
            <p className="text-xs text-slate-500">
              Tự động khởi tạo đồng bộ: Khung Ma trận + Bản đặc tả + Đề 40 câu + Audio & Đáp án
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong>Không thành công:</strong>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4 text-xs">
          {/* Grade selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">1. Chọn Khối Lớp:</label>
            <div className="grid grid-cols-4 gap-2">
              {(['6', '7', '8', '9'] as GradeLevel[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    grade === g
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs ring-1 ring-indigo-600'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  Lớp {g}
                </button>
              ))}
            </div>
          </div>

          {/* Curriculum */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">2. Bộ Sách Giáo Khoa:</label>
            <select
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value as CurriculumBook)}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Global Success (Kết nối tri thức)">Global Success (Kết nối tri thức với cuộc sống)</option>
              <option value="Friends Plus (Chân trời sáng tạo)">Friends Plus (Chân trời sáng tạo)</option>
              <option value="i-Learn Smart World">i-Learn Smart World</option>
              <option value="English Discovery">English Discovery</option>
              <option value="Right On!">Right On!</option>
              <option value="Explore English (Cánh diều)">Explore English (Cánh diều)</option>
            </select>
          </div>

          {/* Exam Period & Units */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">3. Kì Kiểm Tra:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as ExamPeriod)}
                className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Giữa học kì 1 (Midterm 1)">Giữa học kì 1 (Midterm 1)</option>
                <option value="Cuối học kì 1 (Final 1)">Cuối học kì 1 (Final 1)</option>
                <option value="Giữa học kì 2 (Midterm 2)">Giữa học kì 2 (Midterm 2)</option>
                <option value="Cuối học kì 2 (Final 2)">Cuối học kì 2 (Final 2)</option>
                <option value="Kiểm tra định kì 45 phút">Định kì 45 phút</option>
                <option value="Kiểm tra 15 phút">15 phút</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">4. Giới Hạn Bài Học (Units):</label>
              <input
                type="text"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="Ví dụ: Unit 1, Unit 2, Unit 3"
                className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Additional Notes / Custom Prompts */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              5. Yêu cầu bổ sung (tùy chọn):
            </label>
            <textarea
              rows={2}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Ví dụ: Nhấn mạnh vào thì Hiện tại hoàn thành, chủ đề My New School, bài đọc về trường học thông minh..."
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini AI đang sinh Ma trận, Đặc tả & Đề thi... (khoảng 5-10 giây)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Bắt Đầu Tạo Trọn Bộ Hồ Sơ Kiểm Tra</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
