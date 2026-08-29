import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Clock, 
  Send, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  XCircle, 
  Award, 
  RotateCcw, 
  BarChart2, 
  BookOpen, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { ExamPaper, StudentSubmission } from '../types';
import { playTextToSpeech, saveSubmission, gradeWritingAI } from '../services/api';

interface StudentTestViewProps {
  exam: ExamPaper;
  onSubmissionComplete?: (submission: StudentSubmission) => void;
}

export const StudentTestView: React.FC<StudentTestViewProps> = ({
  exam,
  onSubmissionComplete,
}) => {
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentSchool, setStudentSchool] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<StudentSubmission | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [stopAudioFn, setStopAudioFn] = useState<(() => void) | null>(null);
  const [writingAiFeedback, setWritingAiFeedback] = useState<any>(null);

  // Timer countdown
  useEffect(() => {
    if (!hasStarted || submissionResult || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, submissionResult, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentClass.trim()) {
      alert('Vui lòng nhập đầy đủ Họ tên và Lớp của bạn trước khi làm bài.');
      return;
    }
    setHasStarted(true);
    setTimeLeft(exam.durationMinutes * 60);
  };

  const handleSelectOption = (questionId: string, optionLetter: string) => {
    if (submissionResult) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionLetter,
    }));
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    if (submissionResult) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio && stopAudioFn) {
      stopAudioFn();
      setIsPlayingAudio(false);
      setStopAudioFn(null);
    } else {
      if (!exam.audioScriptListening) return;
      setIsPlayingAudio(true);
      const cancelFn = playTextToSpeech(exam.audioScriptListening, () => {
        setIsPlayingAudio(false);
        setStopAudioFn(null);
      });
      setStopAudioFn(() => cancelFn);
    }
  };

  const handleSubmitTest = async () => {
    if (isSubmitting || submissionResult) return;

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < exam.questions.length && timeLeft > 0) {
      const confirmSubmit = window.confirm(
        `Bạn mới làm được ${answeredCount}/${exam.questions.length} câu. Bạn có chắc chắn muốn nộp bài sớm không?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);

    try {
      // Calculate scores
      let totalEarnedScore = 0;
      let listeningScore = 0;
      let listeningMax = 0;
      let languageScore = 0;
      let languageMax = 0;
      let readingScore = 0;
      let readingMax = 0;
      let writingScore = 0;
      let writingMax = 0;

      let writingParagraphQuestion = exam.questions.find((q) => q.format === 'writing');
      let writingText = writingParagraphQuestion ? answers[writingParagraphQuestion.id] || '' : '';

      exam.questions.forEach((q) => {
        const studentAns = (answers[q.id] || '').trim();
        const correctAns = (q.correctAnswer || '').trim();
        const qScore = q.score || 0.25;

        let isCorrect = false;

        if (q.format === 'multiple_choice') {
          // Compare option letter (A, B, C, D)
          isCorrect = studentAns.toUpperCase() === correctAns.toUpperCase();
        } else if (q.format === 'transformation' || q.format === 'short_answer') {
          // Normalize whitespace and punctuation
          const normStudent = studentAns.toLowerCase().replace(/[.,!?;:]/g, '').trim();
          const normCorrect = correctAns.toLowerCase().replace(/[.,!?;:]/g, '').trim();
          isCorrect = normStudent === normCorrect || normCorrect.includes(normStudent);
        }

        const earned = isCorrect ? qScore : 0;
        totalEarnedScore += earned;

        // Skill category breakdown
        if (q.section === 'Listening') {
          listeningMax += qScore;
          if (isCorrect) listeningScore += qScore;
        } else if (q.section === 'Language Focus') {
          languageMax += qScore;
          if (isCorrect) languageScore += qScore;
        } else if (q.section === 'Reading') {
          readingMax += qScore;
          if (isCorrect) readingScore += qScore;
        } else if (q.section === 'Writing') {
          writingMax += qScore;
          if (isCorrect) writingScore += qScore;
        }
      });

      // AI auto-evaluation for writing paragraph if written
      let aiWritingScore = 0;
      if (writingParagraphQuestion && writingText && writingText.length > 15) {
        try {
          const aiResult = await gradeWritingAI({
            promptTopic: writingParagraphQuestion.questionText,
            studentText: writingText,
            grade: exam.grade,
            maxScore: writingParagraphQuestion.score || 0.5,
          });
          setWritingAiFeedback(aiResult);
          aiWritingScore = Number(aiResult.score) || 0;
          totalEarnedScore += aiWritingScore;
          writingScore += aiWritingScore;
        } catch (e) {
          console.warn('AI writing grading fallback', e);
        }
      }

      totalEarnedScore = Number(Math.min(10, totalEarnedScore).toFixed(2));
      const percentage = Math.round((totalEarnedScore / (exam.totalScore || 10)) * 100);

      const submission: StudentSubmission = {
        id: `sub-${Date.now()}`,
        examId: exam.id,
        examTitle: exam.title,
        grade: exam.grade,
        studentName: studentName.trim(),
        studentClass: studentClass.trim(),
        schoolName: studentSchool.trim() || exam.schoolName,
        answers,
        score: totalEarnedScore,
        totalScore: exam.totalScore || 10,
        percentage,
        listeningScore: Number(listeningScore.toFixed(2)),
        listeningMax: Number(listeningMax.toFixed(2)),
        languageScore: Number(languageScore.toFixed(2)),
        languageMax: Number(languageMax.toFixed(2)),
        readingScore: Number(readingScore.toFixed(2)),
        readingMax: Number(readingMax.toFixed(2)),
        writingScore: Number(writingScore.toFixed(2)),
        writingMax: Number(writingMax.toFixed(2)),
        timeSpentSeconds: exam.durationMinutes * 60 - timeLeft,
        submittedAt: new Date().toISOString(),
      };

      const saved = await saveSubmission(submission);
      setSubmissionResult(saved);
      if (onSubmissionComplete) {
        onSubmissionComplete(saved);
      }

      // Celebrate if high score >= 8
      if (totalEarnedScore >= 8) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Error submitting test', err);
      alert('Đã xảy ra lỗi khi nộp bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Initial State: Enter Student Details
  if (!hasStarted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Cổng Làm Bài Kiểm Tra Trực Tuyến
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {exam.title} (Lớp {exam.grade} • {exam.curriculum} • Mã đề {exam.examCode})
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span>Thời gian làm bài:</span>
              <strong className="text-slate-900">{exam.durationMinutes} phút</strong>
            </div>
            <div className="flex justify-between">
              <span>Tổng số câu hỏi:</span>
              <strong className="text-slate-900">{exam.questions.length} câu</strong>
            </div>
            <div className="flex justify-between">
              <span>Hình thức:</span>
              <strong className="text-indigo-700">Trắc nghiệm & Tự luận ngắn</strong>
            </div>
          </div>

          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên học sinh <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Nguyễn Văn An"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lớp học <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 7A1"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trường THCS (tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: THCS Nguyễn Du"
                  value={studentSchool}
                  onChange={(e) => setStudentSchool(e.target.value)}
                  className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Bắt Đầu Làm Bài Ngay
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Submission Results Screen
  if (submissionResult) {
    const isPass = submissionResult.score >= 5.0;
    const isExcellent = submissionResult.score >= 8.0;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Score Summary Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-4 relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-10 h-10 text-indigo-600" />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Kết Quả Làm Bài Kiểm Tra
            </span>
            <h2 className="text-2xl font-bold text-slate-900">{submissionResult.studentName}</h2>
            <p className="text-xs text-slate-500">
              Lớp {submissionResult.studentClass} • {submissionResult.examTitle}
            </p>
          </div>

          <div className="flex items-center justify-center space-x-3 py-2">
            <div className="text-5xl font-black tracking-tight text-indigo-600">
              {submissionResult.score}
              <span className="text-2xl font-bold text-slate-400">/10</span>
            </div>
            <div className="text-left pl-3 border-l border-slate-200">
              <div
                className={`text-sm font-bold ${
                  isExcellent
                    ? 'text-emerald-600'
                    : isPass
                    ? 'text-blue-600'
                    : 'text-amber-600'
                }`}
              >
                {isExcellent ? 'Xuất sắc / Giỏi' : isPass ? 'Đạt yêu cầu' : 'Cần cố gắng'}
              </div>
              <div className="text-xs text-slate-500">
                Đúng {submissionResult.percentage}% • Thời gian: {Math.round(submissionResult.timeSpentSeconds / 60)} phút
              </div>
            </div>
          </div>

          {/* Skill Breakdown Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-100 text-xs">
            <div className="p-2.5 bg-blue-50/70 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Listening:</span>
              <strong className="text-blue-900 font-bold text-sm">
                {submissionResult.listeningScore} / {submissionResult.listeningMax} đ
              </strong>
            </div>
            <div className="p-2.5 bg-emerald-50/70 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Language Focus:</span>
              <strong className="text-emerald-900 font-bold text-sm">
                {submissionResult.languageScore} / {submissionResult.languageMax} đ
              </strong>
            </div>
            <div className="p-2.5 bg-amber-50/70 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Reading:</span>
              <strong className="text-amber-900 font-bold text-sm">
                {submissionResult.readingScore} / {submissionResult.readingMax} đ
              </strong>
            </div>
            <div className="p-2.5 bg-purple-50/70 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Writing:</span>
              <strong className="text-purple-900 font-bold text-sm">
                {submissionResult.writingScore} / {submissionResult.writingMax} đ
              </strong>
            </div>
          </div>

          {/* AI Writing Feedback if available */}
          {writingAiFeedback && (
            <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 text-left text-xs space-y-2 mt-4">
              <div className="flex items-center space-x-1.5 font-bold text-purple-900">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Nhận xét bài viết tự luận từ Giáo viên AI:</span>
              </div>
              <p className="text-slate-700 italic">{writingAiFeedback.feedback}</p>
              {writingAiFeedback.correctedText && (
                <div className="pt-2 border-t border-purple-100 text-slate-600">
                  <strong>Đoạn văn gợi ý sửa chuẩn:</strong>
                  <p className="mt-0.5 text-slate-800">{writingAiFeedback.correctedText}</p>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-center space-x-3">
            <button
              onClick={() => {
                setSubmissionResult(null);
                setHasStarted(false);
                setAnswers({});
              }}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Làm lại bài thi
            </button>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
            Chi Tiết Lời Giải Từng Câu & Nhận Xét
          </h3>

          <div className="space-y-4">
            {exam.questions.map((q) => {
              const studentAns = (answers[q.id] || '').trim();
              const correctAns = (q.correctAnswer || '').trim();
              const isCorrect =
                q.format === 'multiple_choice'
                  ? studentAns.toUpperCase() === correctAns.toUpperCase()
                  : (studentAns.toLowerCase().replace(/[.,!?;:]/g, '') === correctAns.toLowerCase().replace(/[.,!?;:]/g, ''));

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border transition-colors ${
                    isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-red-50/40 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-800">
                        Câu {q.number} ({q.section}):
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Đúng (+{q.score}đ)
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-bold text-red-600">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Sai (0đ)
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-serif text-slate-900 mt-1">{q.questionText}</p>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white/80 rounded-lg border border-slate-200/60">
                      <span className="text-slate-500 block text-[10px]">Bạn chọn:</span>
                      <strong className={isCorrect ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                        {studentAns || '(Chưa trả lời)'}
                      </strong>
                    </div>

                    <div className="p-2 bg-white/80 rounded-lg border border-slate-200/60">
                      <span className="text-slate-500 block text-[10px]">Đáp án đúng:</span>
                      <strong className="text-emerald-700 font-bold">{correctAns}</strong>
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="mt-2 text-[11px] text-slate-600 bg-white/60 p-2 rounded-lg border border-slate-200/40">
                      <strong>Giải thích:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Test Taking Screen
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Sticky Header: Student Info & Timer */}
      <div className="sticky top-24 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-md flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-slate-900">
            {studentName} • Lớp {studentClass}
          </div>
          <div className="text-[11px] text-slate-500">
            {exam.title} (Mã đề {exam.examCode})
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Listening audio playback for students */}
          {exam.audioScriptListening && (
            <button
              onClick={handleToggleAudio}
              className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isPlayingAudio
                  ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 mr-1" />
                  Dừng Nghe
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 mr-1" />
                  Bật Bài Nghe
                </>
              )}
            </button>
          )}

          {/* Countdown Clock */}
          <div
            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${
              timeLeft < 300
                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
            {formatTime(timeLeft)}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitTest}
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {isSubmitting ? 'Đang nộp...' : 'Nộp Bài'}
          </button>
        </div>
      </div>

      {/* Questions Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
        {/* Progress tracker */}
        <div className="flex items-center justify-between text-xs text-slate-500 pb-4 border-b border-slate-100">
          <span>Tiến độ làm bài:</span>
          <span>
            Đã chọn{' '}
            <strong className="text-indigo-600 font-bold">
              {Object.keys(answers).length}
            </strong>{' '}
            / {exam.questions.length} câu
          </span>
        </div>

        {/* Question Items list */}
        <div className="space-y-8">
          {exam.questions.map((q, idx) => {
            const selectedOpt = answers[q.id] || '';

            return (
              <div key={q.id || idx} className="space-y-3 pb-6 border-b border-slate-100 last:border-none">
                {/* Section title & instruction */}
                {q.instruction && (
                  <p className="text-xs font-semibold text-slate-500 italic">
                    {q.instruction}
                  </p>
                )}

                {/* Context Passage for reading/listening */}
                {q.contextPassage && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs italic text-slate-700 leading-relaxed font-sans">
                    <p className="whitespace-pre-line">{q.contextPassage}</p>
                  </div>
                )}

                {/* Question Sentence */}
                <div className="text-sm font-serif text-slate-900 leading-relaxed">
                  <strong className="font-sans text-indigo-900 font-bold mr-1.5">
                    Câu {q.number}:
                  </strong>
                  {q.questionText}
                </div>

                {/* Multiple Choice Options */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const letter = opt.trim().substring(0, 1).toUpperCase(); // "A", "B", "C", "D"
                      const isSelected = selectedOpt.toUpperCase() === letter;

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(q.id, letter)}
                          className={`flex items-center text-left p-3 rounded-xl border text-xs font-serif transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-xs ring-1 ring-indigo-600'
                              : 'bg-slate-50/50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-sans text-xs font-bold mr-2.5 shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-slate-300 text-slate-600'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Open-ended Writing or Transformation Answer input */}
                {(q.format === 'transformation' || q.format === 'short_answer') && (
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Nhập câu trả lời của bạn vào đây..."
                      value={selectedOpt}
                      onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                      className="w-full text-xs font-serif bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Paragraph writing */}
                {q.format === 'writing' && (
                  <div className="pt-2">
                    <textarea
                      rows={4}
                      placeholder="Viết đoạn văn ngắn của bạn bằng tiếng Anh..."
                      value={selectedOpt}
                      onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                      className="w-full text-xs font-serif bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Submission Action */}
        <div className="pt-6 border-t border-slate-200 text-center">
          <button
            onClick={handleSubmitTest}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Đang chấm điểm...' : 'Hoàn Tất & Nộp Bài'}
          </button>
        </div>
      </div>
    </div>
  );
};
