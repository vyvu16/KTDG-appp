import { ExamMatrix, ExamSpecification, ExamPaper, StudentSubmission, GenerationRequest } from '../types';
import { PREBUILT_TEMPLATES } from '../data/standardTemplates';

const LOCAL_STORAGE_EXAMS_KEY = 'engmatrix_exams_v1';
const LOCAL_STORAGE_MATRICES_KEY = 'engmatrix_matrices_v1';
const LOCAL_STORAGE_SPECS_KEY = 'engmatrix_specs_v1';
const LOCAL_STORAGE_SUBMISSIONS_KEY = 'engmatrix_submissions_v1';

export async function getAppInfo(): Promise<{ appUrl: string; hasGeminiKey: boolean }> {
  try {
    const res = await fetch('/api/app-info');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Could not fetch app info from server, using window.location');
  }
  return {
    appUrl: window.location.origin,
    hasGeminiKey: false,
  };
}

export async function fetchExams(): Promise<ExamPaper[]> {
  try {
    const res = await fetch('/api/exams');
    if (res.ok) {
      const data = await res.json();
      if (data.exams && Array.isArray(data.exams) && data.exams.length > 0) {
        return data.exams;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch exams from server, fallback to local', e);
  }

  // Fallback to localStorage or prebuilt templates
  const local = localStorage.getItem(LOCAL_STORAGE_EXAMS_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // ignore
    }
  }

  // Seed with prebuilt
  const prebuiltExams = PREBUILT_TEMPLATES.map((t) => t.exam);
  localStorage.setItem(LOCAL_STORAGE_EXAMS_KEY, JSON.stringify(prebuiltExams));
  return prebuiltExams;
}

export async function saveExam(exam: ExamPaper): Promise<ExamPaper> {
  try {
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.exam) exam = data.exam;
    }
  } catch (e) {
    console.warn('Failed to save exam to server', e);
  }

  // Also update local storage
  const current = await fetchExams();
  const index = current.findIndex((e) => e.id === exam.id);
  if (index >= 0) {
    current[index] = exam;
  } else {
    current.unshift(exam);
  }
  localStorage.setItem(LOCAL_STORAGE_EXAMS_KEY, JSON.stringify(current));
  return exam;
}

export async function deleteExam(examId: string): Promise<boolean> {
  try {
    await fetch(`/api/exams/${examId}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('Failed to delete on server', e);
  }
  const current = await fetchExams();
  const filtered = current.filter((e) => e.id !== examId);
  localStorage.setItem(LOCAL_STORAGE_EXAMS_KEY, JSON.stringify(filtered));
  return true;
}

export async function fetchSubmissions(examId?: string): Promise<StudentSubmission[]> {
  try {
    const url = examId ? `/api/submissions?examId=${encodeURIComponent(examId)}` : '/api/submissions';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.submissions && Array.isArray(data.submissions)) {
        return data.submissions;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch submissions from server', e);
  }

  const local = localStorage.getItem(LOCAL_STORAGE_SUBMISSIONS_KEY);
  if (local) {
    try {
      const all: StudentSubmission[] = JSON.parse(local);
      if (examId) return all.filter((s) => s.examId === examId);
      return all;
    } catch {
      // ignore
    }
  }
  return [];
}

export async function saveSubmission(submission: StudentSubmission): Promise<StudentSubmission> {
  try {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.submission) submission = data.submission;
    }
  } catch (e) {
    console.warn('Failed to save submission on server', e);
  }

  const current = await fetchSubmissions();
  current.unshift(submission);
  localStorage.setItem(LOCAL_STORAGE_SUBMISSIONS_KEY, JSON.stringify(current));
  return submission;
}

export async function generateFullPackageAI(req: GenerationRequest): Promise<{
  matrix: ExamMatrix;
  specification: ExamSpecification;
  exam: ExamPaper;
}> {
  const res = await fetch('/api/gemini/generate-full-package', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi từ máy chủ (${res.status})`);
  }

  const data = await res.json();
  if (!data.success || !data.exam) {
    throw new Error('Dữ liệu trả về từ AI không hợp lệ');
  }

  return {
    matrix: data.matrix,
    specification: data.specification,
    exam: data.exam,
  };
}

export async function gradeWritingAI(params: {
  promptTopic: string;
  studentText: string;
  grade?: string;
  maxScore?: number;
}): Promise<{
  score: number;
  maxScore: number;
  feedback: string;
  strengths: string[];
  areasForImprovement: string[];
  correctedText: string;
}> {
  const res = await fetch('/api/gemini/grade-writing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Lỗi chấm bài tự luận qua AI');
  }

  const data = await res.json();
  return data.result;
}

// Browser Speech Synthesis for Audio Script Listening simulation
export function playTextToSpeech(text: string, onEnd?: () => void): () => void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    alert('Trình duyệt không hỗ trợ Web Speech API.');
    return () => {};
  }

  window.speechSynthesis.cancel(); // stop current audio

  const cleanText = text.replace(/\[AUDIO SCRIPT\]|Part \d+:|"/g, '').trim();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'en-US';
  utterance.rate = 0.88; // clear natural English teacher pace

  // Find natural English voice if available
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
}
