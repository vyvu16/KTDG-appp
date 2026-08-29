/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GradeLevel, 
  CurriculumBook, 
  ExamPeriod, 
  ExamMatrix, 
  ExamSpecification, 
  ExamPaper, 
  StudentSubmission 
} from './types';
import { PREBUILT_TEMPLATES } from './data/standardTemplates';
import { 
  fetchExams, 
  saveExam, 
  fetchSubmissions, 
  getAppInfo 
} from './services/api';
import { Navbar } from './components/Navbar';
import { MatrixEditor } from './components/MatrixEditor';
import { SpecEditor } from './components/SpecEditor';
import { ExamViewer } from './components/ExamViewer';
import { StudentTestView } from './components/StudentTestView';
import { ResultsTracker } from './components/ResultsTracker';
import { QrCodeModal } from './components/QrCodeModal';
import { AiWizardModal } from './components/AiWizardModal';
import { CheckCircle2, Info } from 'lucide-react';

export default function App() {
  // Default to Grade 7 Midterm 1 Global Success template
  const defaultTemplate = PREBUILT_TEMPLATES[1];

  const [activeTab, setActiveTab] = useState<'matrix' | 'spec' | 'exam' | 'student' | 'results'>('matrix');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('7');
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumBook>('Global Success (Kết nối tri thức)');
  const [selectedPeriod, setSelectedPeriod] = useState<ExamPeriod>('Giữa học kì 1 (Midterm 1)');

  const [matrix, setMatrix] = useState<ExamMatrix>(defaultTemplate.matrix);
  const [spec, setSpec] = useState<ExamSpecification>(defaultTemplate.specification);
  const [exam, setExam] = useState<ExamPaper>(defaultTemplate.exam);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isAiWizardOpen, setIsAiWizardOpen] = useState(false);
  const [appUrl, setAppUrl] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Check URL parameters for QR scan student mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const examId = params.get('examId');

    if (mode === 'student') {
      setActiveTab('student');
    } else if (mode === 'exam') {
      setActiveTab('exam');
    }

    if (examId) {
      // If template matches or in local storage
      const found = PREBUILT_TEMPLATES.find((t) => t.exam.id === examId);
      if (found) {
        setMatrix(found.matrix);
        setSpec(found.specification);
        setExam(found.exam);
        setSelectedGrade(found.exam.grade);
      }
    }
  }, []);

  // Initialize data from API
  useEffect(() => {
    async function loadData() {
      try {
        const info = await getAppInfo();
        setAppUrl(info.appUrl || window.location.origin);

        const loadedExams = await fetchExams();
        if (loadedExams && loadedExams.length > 0) {
          // If current exam not in list, pick the first
          const current = loadedExams.find((e) => e.grade === selectedGrade) || loadedExams[0];
          setExam(current);
        }

        const loadedSubmissions = await fetchSubmissions();
        setSubmissions(loadedSubmissions);
      } catch (err) {
        console.warn('Error loading initial data', err);
      }
    }
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle selecting a prebuilt standard template
  const handleSelectPrebuilt = (templateId: string) => {
    const found = PREBUILT_TEMPLATES.find((t) => t.id === templateId);
    if (found) {
      setMatrix(found.matrix);
      setSpec(found.specification);
      setExam(found.exam);
      setSelectedGrade(found.exam.grade);
      setSelectedCurriculum(found.exam.curriculum);
      setSelectedPeriod(found.exam.period);
      showToast(`Đã nạp thành công Mẫu chuẩn Lớp ${found.exam.grade} (${found.exam.period})!`);
    }
  };

  // Save current Exam package
  const handleSaveExam = async () => {
    try {
      const saved = await saveExam(exam);
      setExam(saved);
      showToast('Đã lưu đề thi và bản ma trận/đặc tả thành công!');
    } catch (e) {
      showToast('Đã lưu đề thi vào bộ nhớ cục bộ.');
    }
  };

  // Save Matrix handler
  const handleSaveMatrix = () => {
    showToast('Đã cập nhật khung ma trận đề thi!');
  };

  // Save Specification handler
  const handleSaveSpec = () => {
    showToast('Đã cập nhật bản đặc tả chi tiết!');
  };

  // AI Generation success
  const handleAiGenerationSuccess = (data: {
    matrix: ExamMatrix;
    specification: ExamSpecification;
    exam: ExamPaper;
  }) => {
    setMatrix(data.matrix);
    setSpec(data.specification);
    setExam(data.exam);
    setSelectedGrade(data.exam.grade);
    setSelectedCurriculum(data.exam.curriculum);
    setSelectedPeriod(data.exam.period);
    setActiveTab('exam');
    showToast('Đã tạo thành công trọn bộ Ma trận, Bản đặc tả & Đề thi bằng AI!');
  };

  // Student submission completed
  const handleStudentSubmissionComplete = (newSubmission: StudentSubmission) => {
    setSubmissions((prev) => [newSubmission, ...prev]);
    showToast(`Học sinh ${newSubmission.studentName} đã nộp bài (${newSubmission.score}/10đ)!`);
  };

  // Refresh submissions list
  const handleRefreshSubmissions = async () => {
    const updated = await fetchSubmissions();
    setSubmissions(updated);
    showToast('Đã cập nhật sổ điểm mới nhất!');
  };

  const handleDeleteSubmission = (subId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi kết quả này không?')) {
      const filtered = submissions.filter((s) => s.id !== subId);
      setSubmissions(filtered);
      localStorage.setItem('engmatrix_submissions_v1', JSON.stringify(filtered));
      showToast('Đã xóa bản ghi kết quả.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedGrade={selectedGrade}
        setSelectedGrade={setSelectedGrade}
        selectedCurriculum={selectedCurriculum}
        setSelectedCurriculum={setSelectedCurriculum}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenAiWizard={() => setIsAiWizardOpen(true)}
        onSelectPrebuilt={handleSelectPrebuilt}
        onPrintExam={() => {
          setActiveTab('exam');
          setTimeout(() => window.print(), 200);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Tab 1: Matrix Editor */}
        {activeTab === 'matrix' && (
          <MatrixEditor
            matrix={matrix}
            onChangeMatrix={setMatrix}
            onSave={handleSaveMatrix}
            onNavigateToSpec={() => setActiveTab('spec')}
          />
        )}

        {/* Tab 2: Specification Editor */}
        {activeTab === 'spec' && (
          <SpecEditor
            spec={spec}
            onChangeSpec={setSpec}
            onSave={handleSaveSpec}
            onNavigateToExam={() => setActiveTab('exam')}
            onNavigateToMatrix={() => setActiveTab('matrix')}
          />
        )}

        {/* Tab 3: Exam Paper & Answer Keys */}
        {activeTab === 'exam' && (
          <ExamViewer
            exam={exam}
            onChangeExam={setExam}
            onSaveExam={handleSaveExam}
            onOpenQrModal={() => setIsQrModalOpen(true)}
          />
        )}

        {/* Tab 4: Student Online Test Taking Portal */}
        {activeTab === 'student' && (
          <StudentTestView
            exam={exam}
            onSubmissionComplete={handleStudentSubmissionComplete}
          />
        )}

        {/* Tab 5: Results & Gradebook Analytics */}
        {activeTab === 'results' && (
          <ResultsTracker
            submissions={submissions}
            onRefresh={handleRefreshSubmissions}
            onDeleteSubmission={handleDeleteSubmission}
          />
        )}
      </main>

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        appUrl={appUrl}
        currentExam={exam}
      />

      {/* AI Wizard Modal */}
      <AiWizardModal
        isOpen={isAiWizardOpen}
        onClose={() => setIsAiWizardOpen(false)}
        initialGrade={selectedGrade}
        initialCurriculum={selectedCurriculum}
        initialPeriod={selectedPeriod}
        onGenerationSuccess={handleAiGenerationSuccess}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>EngMatrix THCS</strong> • Công cụ thiết kế Ma trận, Bản đặc tả & Đề kiểm tra định kì môn Tiếng Anh THCS theo chuẩn GDPT 2018
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Thông tư 22/2021/TT-BGDĐT</span>
            <span>•</span>
            <span>QR Code & Chấm điểm trực tuyến</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
