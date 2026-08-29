import React from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  GraduationCap, 
  QrCode, 
  Sparkles, 
  BarChart3, 
  Printer, 
  BookOpen, 
  Layers 
} from 'lucide-react';
import { GradeLevel, ExamPeriod, CurriculumBook } from '../types';

interface NavbarProps {
  activeTab: 'matrix' | 'spec' | 'exam' | 'student' | 'results';
  setActiveTab: (tab: 'matrix' | 'spec' | 'exam' | 'student' | 'results') => void;
  selectedGrade: GradeLevel;
  setSelectedGrade: (grade: GradeLevel) => void;
  selectedCurriculum: CurriculumBook;
  setSelectedCurriculum: (curriculum: CurriculumBook) => void;
  selectedPeriod: ExamPeriod;
  setSelectedPeriod: (period: ExamPeriod) => void;
  onOpenQrModal: () => void;
  onOpenAiWizard: () => void;
  onSelectPrebuilt: (templateId: string) => void;
  onPrintExam: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedGrade,
  setSelectedGrade,
  selectedCurriculum,
  setSelectedCurriculum,
  selectedPeriod,
  setSelectedPeriod,
  onOpenQrModal,
  onOpenAiWizard,
  onSelectPrebuilt,
  onPrintExam,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner with branding & quick actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-sm font-bold text-xl tracking-tight">
              EM
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">EngMatrix THCS</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  GDPT 2018
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Thiết kế Ma trận, Bản đặc tả & Đề kiểm tra Tiếng Anh THCS</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* AI Assistant Button */}
            <button
              id="btn-ai-wizard"
              onClick={onOpenAiWizard}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 mr-1.5 animate-pulse" />
              <span>AI Tạo Đề Nhanh</span>
            </button>

            {/* QR Code Button */}
            <button
              id="btn-open-qr"
              onClick={onOpenQrModal}
              className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
              title="Quét mã QR để truy cập hoặc cho học sinh làm bài"
            >
              <QrCode className="w-4 h-4 mr-1.5 text-indigo-600" />
              <span className="hidden md:inline">Mã QR Truy Cập</span>
            </button>

            {/* Print / Export button */}
            <button
              id="btn-print-exam"
              onClick={onPrintExam}
              className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="In hoặc Xuất đề thi chuẩn Bộ GD&ĐT"
            >
              <Printer className="w-4 h-4 mr-1.5 text-slate-600" />
              <span className="hidden sm:inline">In / Xuất Đề</span>
            </button>
          </div>
        </div>

        {/* Filter bar: Grade, Curriculum, Period */}
        <div className="py-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Grade Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khối:</span>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                {(['6', '7', '8', '9'] as GradeLevel[]).map((g) => (
                  <button
                    key={g}
                    id={`btn-grade-${g}`}
                    onClick={() => {
                      setSelectedGrade(g);
                      onSelectPrebuilt(`template-grade${g}-midterm1`);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      selectedGrade === g
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Lớp {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Curriculum Book Selector */}
            <div className="flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="select-curriculum"
                value={selectedCurriculum}
                onChange={(e) => setSelectedCurriculum(e.target.value as CurriculumBook)}
                className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Global Success (Kết nối tri thức)">Global Success (Kết nối tri thức)</option>
                <option value="Friends Plus (Chân trời sáng tạo)">Friends Plus (Chân trời sáng tạo)</option>
                <option value="i-Learn Smart World">i-Learn Smart World</option>
                <option value="English Discovery">English Discovery</option>
                <option value="Right On!">Right On!</option>
                <option value="Explore English (Cánh diều)">Explore English (Cánh diều)</option>
              </select>
            </div>

            {/* Exam Period Selector */}
            <div className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="select-period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as ExamPeriod)}
                className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Giữa học kì 1 (Midterm 1)">Giữa học kì 1</option>
                <option value="Cuối học kì 1 (Final 1)">Cuối học kì 1</option>
                <option value="Giữa học kì 2 (Midterm 2)">Giữa học kì 2</option>
                <option value="Cuối học kì 2 (Final 2)">Cuối học kì 2</option>
                <option value="Kiểm tra định kì 45 phút">Định kì 45 phút</option>
                <option value="Kiểm tra 15 phút">15 phút</option>
              </select>
            </div>
          </div>

          {/* Quick template loader */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <span>Mẫu chuẩn GDPT 2018:</span>
            <button
              onClick={() => onSelectPrebuilt(`template-grade${selectedGrade}-midterm1`)}
              className="text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 cursor-pointer"
            >
              Nạp mẫu Lớp {selectedGrade}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 overflow-x-auto py-1">
          <button
            id="tab-matrix"
            onClick={() => setActiveTab('matrix')}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            1. Ma trận đề thi
          </button>

          <button
            id="tab-spec"
            onClick={() => setActiveTab('spec')}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'spec'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            2. Bản đặc tả chi tiết
          </button>

          <button
            id="tab-exam"
            onClick={() => setActiveTab('exam')}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'exam'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            3. Đề thi & Đáp án
          </button>

          <button
            id="tab-student"
            onClick={() => setActiveTab('student')}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'student'
                ? 'border-emerald-600 text-emerald-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            4. Học sinh làm bài Online
          </button>

          <button
            id="tab-results"
            onClick={() => setActiveTab('results')}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'results'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            5. Sổ điểm & Thống kê kết quả
          </button>
        </nav>
      </div>
    </header>
  );
};
