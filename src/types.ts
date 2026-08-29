export type GradeLevel = '6' | '7' | '8' | '9';

export type CurriculumBook = 
  | 'Global Success (Kết nối tri thức)'
  | 'Friends Plus (Chân trời sáng tạo)'
  | 'i-Learn Smart World'
  | 'English Discovery'
  | 'Right On!'
  | 'Explore English (Cánh diều)';

export type ExamPeriod = 
  | 'Giữa học kì 1 (Midterm 1)'
  | 'Cuối học kì 1 (Final 1)'
  | 'Giữa học kì 2 (Midterm 2)'
  | 'Cuối học kì 2 (Final 2)'
  | 'Kiểm tra định kì 45 phút'
  | 'Kiểm tra 15 phút';

export type CognitiveLevel = 'recognition' | 'comprehension' | 'application' | 'high_application';

export type QuestionFormat = 'multiple_choice' | 'short_answer' | 'fill_blank' | 'transformation' | 'writing' | 'speaking';

export interface MatrixSkillRow {
  id: string;
  skillName: string; // Nghe (Listening), Ngữ âm & Ngữ pháp (Language Focus), Đọc (Reading), Viết (Writing), Nói (Speaking)
  contentTopic: string; // Mạch kiến thức / Chủ đề / Ngữ liệu
  recognitionMCQ: number; // Nhận biết - TNKQ
  recognitionEssay: number; // Nhận biết - Tự luận
  comprehensionMCQ: number; // Thông hiểu - TNKQ
  comprehensionEssay: number; // Thông hiểu - Tự luận
  applicationMCQ: number; // Vận dụng - TNKQ
  applicationEssay: number; // Vận dụng - Tự luận
  highAppMCQ: number; // Vận dụng cao - TNKQ
  highAppEssay: number; // Vận dụng cao - Tự luận
  totalQuestions: number;
  totalPoints: number;
  weightPercent: number; // Tỉ lệ %
}

export interface ExamMatrix {
  id: string;
  title: string;
  grade: GradeLevel;
  curriculum: CurriculumBook;
  period: ExamPeriod;
  durationMinutes: number;
  schoolYear: string;
  totalScore: number;
  pointPerQuestion: number;
  recognitionPercent: number; // e.g., 40%
  comprehensionPercent: number; // e.g., 30%
  applicationPercent: number; // e.g., 20%
  highAppPercent: number; // e.g., 10%
  rows: MatrixSkillRow[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpecItem {
  id: string;
  stt: number;
  skill: string; // Kĩ năng / Mạch kiến thức
  contentUnit: string; // Đơn vị kiến thức / Chủ đề (Unit 1, 2, 3...)
  learningStandard: string; // Chuẩn kiến thức, kĩ năng cần đánh giá (Yêu cầu cần đạt)
  recognitionSpecs: string; // Đặc tả mức độ Nhận biết
  comprehensionSpecs: string; // Đặc tả mức độ Thông hiểu
  applicationSpecs: string; // Đặc tả mức độ Vận dụng
  highAppSpecs: string; // Đặc tả mức độ Vận dụng cao
  questionCount: {
    recognition: number;
    comprehension: number;
    application: number;
    highApp: number;
  };
  questionFormat: string; // TNKQ (MCQ) hoặc Tự luận
  questionIndices: string; // Vị trí câu hỏi trong đề (ví dụ: C1, C2, C3, C4)
}

export interface ExamSpecification {
  id: string;
  matrixId: string;
  title: string;
  grade: GradeLevel;
  curriculum: CurriculumBook;
  period: ExamPeriod;
  durationMinutes: number;
  items: SpecItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionItem {
  id: string;
  number: number;
  section: 'Listening' | 'Language Focus' | 'Reading' | 'Writing' | 'Speaking';
  partTitle: string; // Ví dụ: Part 1: Phonetics, Part 2: Vocabulary & Grammar...
  instruction: string; // Lời dẫn: Choose the word whose underlined part is pronounced differently...
  contextPassage?: string; // Đoạn văn đọc hoặc Audio Transcript nếu có
  audioUrl?: string;
  audioScript?: string;
  questionText: string;
  options?: string[]; // [ 'A. ...', 'B. ...', 'C. ...', 'D. ...' ]
  correctAnswer: string; // A / B / C / D hoặc đáp án tự luận
  explanation: string; // Lời giải thích chi tiết ngữ pháp, từ vựng
  score: number;
  cognitiveLevel: CognitiveLevel;
  format: QuestionFormat;
}

export interface ExamPaper {
  id: string;
  matrixId?: string;
  specId?: string;
  title: string;
  schoolName: string;
  departmentName: string;
  grade: GradeLevel;
  curriculum: CurriculumBook;
  period: ExamPeriod;
  schoolYear: string;
  examCode: string; // Mã đề (ví dụ: 101, 102...)
  durationMinutes: number;
  audioScriptListening?: string;
  questions: QuestionItem[];
  speakingPrompts?: {
    id: string;
    topic: string;
    questions: string[];
    guideForTeacher: string;
  }[];
  rubricWriting?: string;
  totalScore: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentSubmission {
  id: string;
  examId: string;
  examTitle: string;
  grade: GradeLevel;
  studentName: string;
  studentClass: string;
  schoolName?: string;
  studentCode?: string;
  answers: Record<string, string>; // questionId -> studentAnswer
  score: number;
  totalScore: number;
  percentage: number;
  listeningScore: number;
  listeningMax: number;
  languageScore: number;
  languageMax: number;
  readingScore: number;
  readingMax: number;
  writingScore: number;
  writingMax: number;
  timeSpentSeconds: number;
  submittedAt: string;
  teacherFeedback?: string;
}

export interface GenerationRequest {
  grade: GradeLevel;
  curriculum: CurriculumBook;
  period: ExamPeriod;
  units: string; // e.g. "Unit 1, 2, 3: My Hobbies, Healthy Living, Community Service"
  durationMinutes: number;
  examCode?: string;
  customRequirements?: string;
  customInstructions?: string;
}
