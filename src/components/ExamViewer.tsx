import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  Volume2, 
  VolumeX, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  HelpCircle, 
  Share2, 
  Sparkles, 
  FileText, 
  Shuffle, 
  Save,
  MessageSquare,
  BookOpen
} from 'lucide-react';
import { ExamPaper, QuestionItem, CognitiveLevel, QuestionFormat } from '../types';
import { playTextToSpeech } from '../services/api';

interface ExamViewerProps {
  exam: ExamPaper;
  onChangeExam: (updatedExam: ExamPaper) => void;
  onSaveExam: () => void;
  onOpenQrModal: () => void;
}

export const ExamViewer: React.FC<ExamViewerProps> = ({
  exam,
  onChangeExam,
  onSaveExam,
  onOpenQrModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'paper' | 'keys' | 'speaking'>('paper');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [stopAudioFn, setStopAudioFn] = useState<(() => void) | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Audio Playback simulation
  const handleToggleAudio = () => {
    if (isPlayingAudio && stopAudioFn) {
      stopAudioFn();
      setIsPlayingAudio(false);
      setStopAudioFn(null);
    } else {
      if (!exam.audioScriptListening) {
        alert('Không có nội dung Audio Script trong đề thi.');
        return;
      }
      setIsPlayingAudio(true);
      const cancelFn = playTextToSpeech(exam.audioScriptListening, () => {
        setIsPlayingAudio(false);
        setStopAudioFn(null);
      });
      setStopAudioFn(() => cancelFn);
    }
  };

  const handleUpdateQuestion = (qIndex: number, field: keyof QuestionItem, value: any) => {
    const newQuestions = [...exam.questions];
    newQuestions[qIndex] = {
      ...newQuestions[qIndex],
      [field]: value,
    };
    onChangeExam({
      ...exam,
      questions: newQuestions,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, newOptionText: string) => {
    const newQuestions = [...exam.questions];
    const options = [...(newQuestions[qIndex].options || [])];
    options[optIndex] = newOptionText;
    newQuestions[qIndex].options = options;
    onChangeExam({
      ...exam,
      questions: newQuestions,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddQuestion = (section: QuestionItem['section']) => {
    const newQ: QuestionItem = {
      id: `q-${Date.now()}`,
      number: exam.questions.length + 1,
      section,
      partTitle: `PART ${section.toUpperCase()}`,
      instruction: 'Choose the best answer (A, B, C or D).',
      questionText: 'New question sentence...',
      options: ['A. option 1', 'B. option 2', 'C. option 3', 'D. option 4'],
      correctAnswer: 'A',
      explanation: 'Giải thích vì sao đáp án A đúng...',
      score: 0.25,
      cognitiveLevel: 'comprehension',
      format: 'multiple_choice',
    };

    onChangeExam({
      ...exam,
      questions: [...exam.questions, newQ],
    });
  };

  const handleDeleteQuestion = (qIndex: number) => {
    const newQuestions = exam.questions
      .filter((_, idx) => idx !== qIndex)
      .map((q, idx) => ({ ...q, number: idx + 1 }));
    onChangeExam({
      ...exam,
      questions: newQuestions,
    });
  };

  const handleShuffleVariants = () => {
    const currentCodeNum = parseInt(exam.examCode, 10) || 101;
    const nextCode = (currentCodeNum + 1).toString();

    // Group questions by section to preserve pedagogical order while shuffling inside sections
    const sections = ['Listening', 'Language Focus', 'Reading', 'Writing', 'Speaking'] as const;
    let newShuffledQuestions: QuestionItem[] = [];

    sections.forEach((sec) => {
      const secQuestions = exam.questions.filter((q) => q.section === sec);
      // Shuffle question order within the section (keep multiple choice options consistent with correct letter)
      const shuffledSec = [...secQuestions].sort(() => Math.random() - 0.5);
      newShuffledQuestions = [...newShuffledQuestions, ...shuffledSec];
    });

    // Re-index question numbers
    newShuffledQuestions = newShuffledQuestions.map((q, idx) => ({
      ...q,
      number: idx + 1,
    }));

    onChangeExam({
      ...exam,
      id: `exam-${Date.now()}`,
      examCode: nextCode,
      questions: newShuffledQuestions,
      title: `${exam.title} (Mã đề ${nextCode})`,
    });

    alert(`Đã hoán vị và tạo thành công Mã đề mới: ${nextCode}!`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Group questions by section for clean rendering
  const listeningQuestions = exam.questions.filter((q) => q.section === 'Listening');
  const languageQuestions = exam.questions.filter((q) => q.section === 'Language Focus');
  const readingQuestions = exam.questions.filter((q) => q.section === 'Reading');
  const writingQuestions = exam.questions.filter((q) => q.section === 'Writing');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Controls Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        {/* Sub tabs: Paper vs Answer Keys vs Speaking */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('paper')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'paper'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1" />
            Đề kiểm tra (Học sinh)
          </button>

          <button
            onClick={() => setActiveSubTab('keys')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'keys'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
            Đáp án & Lời giải chi tiết
          </button>

          <button
            onClick={() => setActiveSubTab('speaking')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'speaking'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
            Đề kiểm tra Nói (Speaking)
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Audio script playback */}
          {exam.audioScriptListening && (
            <button
              onClick={handleToggleAudio}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isPlayingAudio
                  ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              }`}
              title="Phát âm thanh bài nghe Listening bằng AI Giọng đọc tiếng Anh chuẩn"
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 mr-1" />
                  <span>Dừng Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 mr-1" />
                  <span>Phát Audio Bài Nghe</span>
                </>
              )}
            </button>
          )}

          {/* Shuffle to create code 102/103 */}
          <button
            onClick={handleShuffleVariants}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
            title="Đảo câu hỏi và tạo mã đề mới (Mã 102, 103...)"
          >
            <Shuffle className="w-3.5 h-3.5 mr-1 text-slate-600" />
            <span>Tạo Mã Đề Mới</span>
          </button>

          {/* QR Code */}
          <button
            onClick={onOpenQrModal}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            <span>Mã QR Đề Thi</span>
          </button>

          {/* Save */}
          <button
            onClick={onSaveExam}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            <span>Lưu đề thi</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-slate-600" />
            <span>In Đề (A4)</span>
          </button>
        </div>
      </div>

      {/* Main Paper Content Container (Standard A4 Exam layout) */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-md print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Official Header Table */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6">
          <div className="grid grid-cols-2 gap-4 text-xs font-serif">
            {/* Left Header: Department & School */}
            <div className="text-center space-y-1">
              <input
                type="text"
                value={exam.departmentName || 'PHÒNG GD&ĐT QUẬN / HUYỆN'}
                onChange={(e) => onChangeExam({ ...exam, departmentName: e.target.value })}
                className="w-full text-center font-bold uppercase tracking-wide text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none"
              />
              <input
                type="text"
                value={exam.schoolName || 'TRƯỜNG THCS NGUYỄN DU'}
                onChange={(e) => onChangeExam({ ...exam, schoolName: e.target.value })}
                className="w-full text-center font-bold text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none"
              />
              <div className="text-[11px] text-slate-600 font-sans mt-2">
                Họ và tên học sinh: .................................................... Lớp: ..........
              </div>
            </div>

            {/* Right Header: Exam Period & Code */}
            <div className="text-center space-y-1 border-l border-slate-300 pl-4">
              <h2 className="font-bold text-sm uppercase text-slate-900 tracking-wide">
                {exam.title || 'ĐỀ KIỂM TRA ĐỊNH KÌ MÔN TIẾNG ANH'}
              </h2>
              <div className="text-xs font-semibold text-slate-700">
                Năm học: {exam.schoolYear} • Thời gian: {exam.durationMinutes} phút
              </div>
              <div className="inline-block px-3 py-0.5 rounded border border-slate-800 font-bold text-xs mt-1">
                MÃ ĐỀ THI: {exam.examCode || '101'}
              </div>
            </div>
          </div>
        </div>

        {/* View Mode 1: Student Paper */}
        {activeSubTab === 'paper' && (
          <div className="space-y-8 font-serif text-slate-900 leading-relaxed text-sm">
            {/* Audio Script for Teacher Note (Collapsible) */}
            {exam.audioScriptListening && (
              <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 font-sans text-xs text-slate-700 space-y-1.5 print:hidden">
                <div className="flex items-center justify-between font-bold text-indigo-900">
                  <span className="flex items-center">
                    <Volume2 className="w-4 h-4 mr-1 text-indigo-600" />
                    Audio Transcript (Nội dung bài nghe cho Giáo viên/Học sinh):
                  </span>
                  <button
                    onClick={handleToggleAudio}
                    className="text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    {isPlayingAudio ? 'Dừng phát' : 'Nghe thử AI'}
                  </button>
                </div>
                <p className="whitespace-pre-line text-slate-600 italic pl-1 border-l-2 border-indigo-400">
                  {exam.audioScriptListening}
                </p>
              </div>
            )}

            {/* Section 1: Listening */}
            {listeningQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                  <h3 className="font-bold text-base uppercase text-slate-900 font-sans tracking-wide">
                    SECTION A. LISTENING (2.0 points)
                  </h3>
                  <span className="text-xs font-sans text-slate-500 print:hidden">
                    {listeningQuestions.length} câu hỏi
                  </span>
                </div>

                <div className="space-y-4 pl-2">
                  {listeningQuestions.map((q, idx) => (
                    <QuestionCard
                      key={q.id || idx}
                      question={q}
                      onUpdate={(field, val) => {
                        const realIdx = exam.questions.findIndex((item) => item.id === q.id);
                        if (realIdx >= 0) handleUpdateQuestion(realIdx, field, val);
                      }}
                      onUpdateOption={(optIdx, val) => {
                        const realIdx = exam.questions.findIndex((item) => item.id === q.id);
                        if (realIdx >= 0) handleUpdateOption(realIdx, optIdx, val);
                      }}
                      onDelete={() => {
                        const realIdx = exam.questions.findIndex((item) => item.id === q.id);
                        if (realIdx >= 0) handleDeleteQuestion(realIdx);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: Language Focus */}
            {languageQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                  <h3 className="font-bold text-base uppercase text-slate-900 font-sans tracking-wide">
                    SECTION B. LANGUAGE FOCUS (2.5 points)
                  </h3>
                  <span className="text-xs font-sans text-slate-500 print:hidden">
                    {languageQuestions.length} câu hỏi
                  </span>
                </div>

                <div className="space-y-4 pl-2">
                  {languageQuestions.map((q, idx) => (
                    <QuestionCard
                      key={q.id || idx}
                      question={q}
                      onUpdate={(field, val) => {
                        const realIdx = exam.questions.findIndex((item) => item.id === q.id);
                        if (realIdx >= 0) handleUpdateQuestion(realIdx, field, val);
                      }}
                      onUpdateOption={(optIdx, val) => {
                        const realIdx = exam.questions.findIndex((item) => item.id === q.id);
                        if (realIdx >= 0) handleUpdateOption(realIdx, optIdx, val);
                      }}
                      onDelete={() => {
                        const realIdx = exam.questions.findIndex((item) => item.id === q.id);
                        if (realIdx >= 0) handleDeleteQuestion(realIdx);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Reading */}
            {readingQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                  <h3 className="font-bold text-base uppercase text-slate-900 font-sans tracking-wide">
                    SECTION C. READING (2.5 points)
                  </h3>
                  <span className="text-xs font-sans text-slate-500 print:hidden">
                    {readingQuestions.length} câu hỏi
                  </span>
                </div>

                {/* Display Passage if available on first reading question */}
                {readingQuestions[0]?.contextPassage && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs italic text-slate-800 leading-relaxed font-sans">
                    <p className="whitespace-pre-line">{readingQuestions[0].contextPassage}</p>
                  </div>
                )}

                <div className="space-y-4 pl-2">
                  {readingQuestions.map((q, idx) => (
                    <QuestionCard
                      key={q.id || idx}
                      question={q}
                      onUpdate={(field, val) => {
                        const realIdx = exam.questions.findIndex((item) => item.id === q.id);
                        if (realIdx >= 0) handleUpdateQuestion(realIdx, field, val);
                      }}
                      onUpdateOption={(optIdx, val) => {
                        const realIdx = exam.questions.findIndex((item) => item.id === q.id);
                        if (realIdx >= 0) handleUpdateOption(realIdx, optIdx, val);
                      }}
                      onDelete={() => {
                        const realIdx = exam.questions.findIndex((item) => item.id === q.id);
                        if (realIdx >= 0) handleDeleteQuestion(realIdx);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: Writing */}
            {writingQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                  <h3 className="font-bold text-base uppercase text-slate-900 font-sans tracking-wide">
                    SECTION D. WRITING (2.5 points)
                  </h3>
                  <span className="text-xs font-sans text-slate-500 print:hidden">
                    {writingQuestions.length} câu hỏi
                  </span>
                </div>

                <div className="space-y-4 pl-2">
                  {writingQuestions.map((q, idx) => (
                    <QuestionCard
                      key={q.id || idx}
                      question={q}
                      onUpdate={(field, val) => {
                        const realIdx = exam.questions.findIndex((item) => item.id === q.id);
                        if (realIdx >= 0) handleUpdateQuestion(realIdx, field, val);
                      }}
                      onUpdateOption={(optIdx, val) => {
                        const realIdx = exam.questions.findIndex((item) => item.id === q.id);
                        if (realIdx >= 0) handleUpdateOption(realIdx, optIdx, val);
                      }}
                      onDelete={() => {
                        const realIdx = exam.questions.findIndex((item) => item.id === q.id);
                        if (realIdx >= 0) handleDeleteQuestion(realIdx);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* End of Exam marker */}
            <div className="text-center text-xs font-sans font-bold text-slate-500 pt-6 border-t border-slate-200">
              --- HẾT (Cán bộ coi thi không giải thích gì thêm) ---
            </div>
          </div>
        )}

        {/* View Mode 2: Answer Keys & Detailed Explanations */}
        {activeSubTab === 'keys' && (
          <div className="space-y-6 font-sans text-slate-800 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-emerald-950 text-sm">
                  ĐÁP ÁN & HƯỚNG DẪN CHẤM CHI TIẾT (MÃ ĐỀ {exam.examCode})
                </h3>
                <p className="text-emerald-700 text-xs mt-0.5">
                  Thang điểm 10.0 • Mỗi câu trắc nghiệm 0.25 điểm
                </p>
              </div>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-xs cursor-pointer"
              >
                In Đáp Án
              </button>
            </div>

            {/* Quick Answer Key Matrix Grid */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wide">
                BẢNG ĐÁP ÁN NHANH (MÃ ĐỀ {exam.examCode}):
              </h4>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 text-center">
                {exam.questions.map((q) => (
                  <div
                    key={q.id}
                    className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                  >
                    <div className="font-bold text-slate-500 text-[11px]">C{q.number}</div>
                    <div className="font-extrabold text-sm text-emerald-700">{q.correctAnswer}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Explanations Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3 w-14 text-center border-r border-slate-200">Câu</th>
                    <th className="p-3 w-20 text-center border-r border-slate-200">Đáp án</th>
                    <th className="p-3 w-20 text-center border-r border-slate-200">Điểm</th>
                    <th className="p-3 min-w-[200px]">Lời giải thích ngữ pháp / Dẫn chứng bài đọc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {exam.questions.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center font-bold text-slate-600 border-r border-slate-200">
                        {q.number}
                      </td>
                      <td className="p-2.5 text-center font-extrabold text-emerald-700 border-r border-slate-200">
                        {q.correctAnswer}
                      </td>
                      <td className="p-2.5 text-center font-medium text-slate-600 border-r border-slate-200">
                        {q.score}đ
                      </td>
                      <td className="p-2.5 text-slate-700">
                        <textarea
                          rows={2}
                          value={q.explanation || ''}
                          onChange={(e) => {
                            const realIdx = exam.questions.findIndex((item) => item.id === q.id);
                            if (realIdx >= 0) handleUpdateQuestion(realIdx, 'explanation', e.target.value);
                          }}
                          className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded p-1 resize-none text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Writing Rubric Box */}
            {exam.rubricWriting && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  HƯỚNG DẪN CHẤM BÀI VIẾT ĐOẠN VĂN (WRITING RUBRIC):
                </h4>
                <p className="whitespace-pre-line text-slate-700 leading-relaxed text-xs">
                  {exam.rubricWriting}
                </p>
              </div>
            )}
          </div>
        )}

        {/* View Mode 3: Speaking Prompts */}
        {activeSubTab === 'speaking' && (
          <div className="space-y-6 font-sans text-slate-800 text-xs">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h3 className="font-bold text-purple-950 text-sm">
                ĐỀ KIỂM TRA NÓI ĐỊNH KÌ (SPEAKING ASSESSMENT)
              </h3>
              <p className="text-purple-700 text-xs mt-0.5">
                Hướng dẫn tổ chức kiểm tra kĩ năng Nói môn Tiếng Anh THCS theo định hướng giao tiếp
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exam.speakingPrompts?.map((spk, idx) => (
                <div key={spk.id || idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                  <h4 className="font-bold text-indigo-900 text-sm border-b border-slate-100 pb-2">
                    {spk.topic}
                  </h4>
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-700 text-xs">Câu hỏi gợi ý cho Học sinh:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                      {spk.questions.map((qText, qIdx) => (
                        <li key={qIdx}>{qText}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                    <strong>Hướng dẫn giáo viên:</strong> {spk.guideForTeacher}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component for individual question card
interface QuestionCardProps {
  question: QuestionItem;
  onUpdate: (field: keyof QuestionItem, value: any) => void;
  onUpdateOption: (optIndex: number, value: string) => void;
  onDelete: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onUpdate,
  onUpdateOption,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="p-3 rounded-xl border border-transparent hover:border-slate-200 transition-colors relative group">
      {/* Instruction if present */}
      {question.instruction && (
        <p className="text-xs font-sans font-semibold text-slate-600 italic mb-1.5">
          {question.instruction}
        </p>
      )}

      {/* Question Text */}
      <div className="flex items-baseline space-x-2">
        <span className="font-bold font-sans text-slate-900 text-sm shrink-0">
          Question {question.number}:
        </span>
        {isEditing ? (
          <textarea
            rows={2}
            value={question.questionText}
            onChange={(e) => onUpdate('questionText', e.target.value)}
            className="w-full text-sm font-serif bg-white border border-indigo-300 rounded p-1.5 focus:outline-none"
          />
        ) : (
          <span className="text-sm font-serif text-slate-900 leading-relaxed">
            {question.questionText}
          </span>
        )}
      </div>

      {/* Multiple Choice Options */}
      {question.options && question.options.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-2 pl-4">
          {question.options.map((opt, optIdx) => (
            <div key={optIdx} className="text-xs font-serif text-slate-800">
              {isEditing ? (
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => onUpdateOption(optIdx, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs"
                />
              ) : (
                <span className="cursor-default">{opt}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Teacher Quick Edit Controls in Browser Mode */}
      <div className="mt-2 flex items-center justify-between text-[11px] font-sans text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
        <div className="flex items-center space-x-2">
          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
            Đáp án: <strong className="text-emerald-700">{question.correctAnswer}</strong>
          </span>
          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
            Điểm: {question.score}đ
          </span>
          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
            Mức: {question.cognitiveLevel}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 cursor-pointer"
            title="Chỉnh sửa câu hỏi"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-slate-500 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
            title="Xóa câu hỏi"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
