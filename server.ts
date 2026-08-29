import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Server-side lazy Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment. Mock/fallback generation will be used if needed.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Simple in-memory & file-backed persistence for Exams and Submissions
const DATA_DIR = path.join(process.cwd(), ".data");
const EXAMS_FILE = path.join(DATA_DIR, "exams.json");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function saveJson<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err);
  }
}

let storedExams: any[] = loadJson(EXAMS_FILE, []);
let storedSubmissions: any[] = loadJson(SUBMISSIONS_FILE, []);

// API Routes
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// App configuration & share info for QR Code
app.get("/api/app-info", (req: Request, res: Response) => {
  const host = req.get("host") || `localhost:${PORT}`;
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const appUrl = process.env.APP_URL || `${protocol}://${host}`;
  res.json({
    appUrl,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
  });
});

// Exams CRUD
app.get("/api/exams", (_req: Request, res: Response) => {
  res.json({ success: true, exams: storedExams });
});

app.post("/api/exams", (req: Request, res: Response) => {
  const exam = req.body;
  if (!exam.id) {
    exam.id = `exam-${Date.now()}`;
  }
  exam.updatedAt = new Date().toISOString();
  if (!exam.createdAt) {
    exam.createdAt = exam.updatedAt;
  }
  
  const existingIdx = storedExams.findIndex((e) => e.id === exam.id);
  if (existingIdx >= 0) {
    storedExams[existingIdx] = exam;
  } else {
    storedExams.unshift(exam);
  }
  saveJson(EXAMS_FILE, storedExams);
  res.json({ success: true, exam });
});

app.delete("/api/exams/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  storedExams = storedExams.filter((e) => e.id !== id);
  saveJson(EXAMS_FILE, storedExams);
  res.json({ success: true, id });
});

// Submissions CRUD
app.get("/api/submissions", (req: Request, res: Response) => {
  const { examId } = req.query;
  let results = storedSubmissions;
  if (examId) {
    results = results.filter((s) => s.examId === examId);
  }
  res.json({ success: true, submissions: results });
});

app.post("/api/submissions", (req: Request, res: Response) => {
  const submission = req.body;
  if (!submission.id) {
    submission.id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }
  submission.submittedAt = new Date().toISOString();
  storedSubmissions.unshift(submission);
  saveJson(SUBMISSIONS_FILE, storedSubmissions);
  res.json({ success: true, submission });
});

app.delete("/api/submissions/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  storedSubmissions = storedSubmissions.filter((s) => s.id !== id);
  saveJson(SUBMISSIONS_FILE, storedSubmissions);
  res.json({ success: true, id });
});

// AI Gemini Generator: Full Coordinated Matrix, Specification & Exam Paper
app.post("/api/gemini/generate-full-package", async (req: Request, res: Response) => {
  try {
    const { grade, curriculum, period, units, durationMinutes = 60, customRequirements = "" } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({
        error: "GEMINI_API_KEY chưa được cấu hình. Vui lòng kiểm tra Settings > Secrets.",
      });
    }

    const ai = getGeminiClient();

    const systemPrompt = `Bạn là Chuyên gia Khảo thí và Giáo viên Tiếng Anh THCS cốt cán hàng đầu Việt Nam theo Chương trình Giáo dục Phổ thông 2018 (GDPT 2018), am hiểu sâu sắc quy định của Bộ Giáo dục & Đào tạo về ma trận, bản đặc tả và đề kiểm tra định kì (Thông tư 22/2021/TT-BGDĐT).

Nhiệm vụ của bạn: Tạo một BỘ HỒ SƠ ĐỀ KIỂM TRA ĐỊNH KÌ TIẾNG ANH THCS HOÀN CHỈNH, CHUẨN XÁC, CHẤT LƯỢNG CAO gồm 3 phần liên kết chặt chẽ:
1. MA TRẬN ĐỀ KIỂM TRA (Exam Matrix): 4 mức độ nhận thức (Nhận biết 40%, Thông hiểu 30%, Vận dụng 20%, Vận dụng cao 10%), tổng 40 câu hỏi, thang điểm 10 (mỗi câu trắc nghiệm 0.25 điểm). Bao gồm 4 kĩ năng chuẩn: Listening (2.0đ - 8 câu), Language Focus (2.5đ - 10 câu), Reading (2.5đ - 10 câu), Writing (2.5đ - 8-10 câu), có phần gợi ý Speaking (0.5-1.0đ kiểm tra bổ trợ).
2. BẢN ĐẶC TẢ ĐỀ KIỂM TRA (Test Specifications): Mô tả chi tiết từng mạch kiến thức, yêu cầu cần đạt (chuẩn GDPT 2018), số lượng câu hỏi và vị trí câu trong đề (C1 -> C40).
3. ĐỀ THI ĐẦY ĐỦ 40 CÂU (Complete Exam Paper) + ĐÁP ÁN & LỜI GIẢI THÍCH NGỮ PHÁP CHI TIẾT:
   - Part 1: LISTENING (Kèm Audio Script hoàn chỉnh và 8 câu trắc nghiệm chọn A/B/C/D hoặc điền từ).
   - Part 2: LANGUAGE FOCUS (10 câu: Ngữ âm Phát âm/Trọng âm, Từ vựng, Ngữ pháp, Giao tiếp Everyday English).
   - Part 3: READING (10 câu: 5 câu Cloze Test điền khuyết + 5 câu Comprehension Passage đọc hiểu văn bản).
   - Part 4: WRITING (8-10 câu: Tìm lỗi sai, Sắp xếp câu, Viết lại câu không đổi nghĩa, Viết câu/đoạn văn ngắn).
   - Phần Speaking Prompts (2 chủ đề nói kèm câu hỏi gợi ý và hướng dẫn giáo viên chấm).

Hãy trả về định dạng JSON thuần túy theo đúng cấu trúc chỉ định.`;

    const userPrompt = `Hãy thiết kế bộ Ma trận, Bản đặc tả và Đề kiểm tra Tiếng Anh THCS định kì:
- Khối lớp: Lớp ${grade} THCS
- Bộ sách giáo khoa: ${curriculum}
- Loại bài kiểm tra: ${period}
- Đơn vị bài học (Units/Chủ đề): ${units || "Các Unit theo phân phối chương trình của kì kiểm tra"}
- Thời gian làm bài: ${durationMinutes} phút
- Yêu cầu bổ sung của giáo viên: ${customRequirements || "Bám sát chuẩn kiến thức kĩ năng, câu hỏi hay, ngữ liệu tự nhiên, giải thích ngữ pháp đáp án rõ ràng."}

Yêu cầu định dạng JSON xuất ra:
{
  "matrix": {
    "title": "Ma trận đề kiểm tra...",
    "grade": "${grade}",
    "curriculum": "${curriculum}",
    "period": "${period}",
    "durationMinutes": ${durationMinutes},
    "schoolYear": "2024 - 2025",
    "totalScore": 10,
    "pointPerQuestion": 0.25,
    "recognitionPercent": 40,
    "comprehensionPercent": 30,
    "applicationPercent": 20,
    "highAppPercent": 10,
    "rows": [
      {
        "id": "row-1",
        "skillName": "I. LISTENING",
        "contentTopic": "Chủ đề nghe cụ thể...",
        "recognitionMCQ": 4,
        "recognitionEssay": 0,
        "comprehensionMCQ": 2,
        "comprehensionEssay": 0,
        "applicationMCQ": 2,
        "applicationEssay": 0,
        "highAppMCQ": 0,
        "highAppEssay": 0,
        "totalQuestions": 8,
        "totalPoints": 2.0,
        "weightPercent": 20
      },
      ...
    ]
  },
  "specification": {
    "title": "Bản đặc tả đề kiểm tra...",
    "grade": "${grade}",
    "curriculum": "${curriculum}",
    "period": "${period}",
    "durationMinutes": ${durationMinutes},
    "items": [
      {
        "id": "spec-1",
        "stt": 1,
        "skill": "Listening",
        "contentUnit": "Unit ...",
        "learningStandard": "Yêu cầu cần đạt chuẩn GDPT 2018...",
        "recognitionSpecs": "Mô tả nhận biết...",
        "comprehensionSpecs": "Mô tả thông hiểu...",
        "applicationSpecs": "Mô tả vận dụng...",
        "highAppSpecs": "Mô tả vận dụng cao...",
        "questionCount": { "recognition": 4, "comprehension": 2, "application": 2, "highApp": 0 },
        "questionFormat": "TNKQ",
        "questionIndices": "C1 -> C8"
      },
      ...
    ]
  },
  "exam": {
    "title": "ĐỀ KIỂM TRA ĐỊNH KÌ MÔN TIẾNG ANH ${grade}",
    "schoolName": "TRƯỜNG THCS...",
    "departmentName": "TỔ NGOẠI NGỮ",
    "grade": "${grade}",
    "curriculum": "${curriculum}",
    "period": "${period}",
    "schoolYear": "2024 - 2025",
    "examCode": "101",
    "durationMinutes": ${durationMinutes},
    "totalScore": 10,
    "audioScriptListening": "Đoạn văn transcript bài nghe chi tiết...",
    "questions": [
      {
        "id": "q-1",
        "number": 1,
        "section": "Listening",
        "partTitle": "PART 1. LISTENING",
        "instruction": "Listen to ... and choose the best answer (A, B, C or D).",
        "questionText": "Nội dung câu hỏi...",
        "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
        "correctAnswer": "A",
        "explanation": "Giải thích chi tiết vì sao A đúng...",
        "score": 0.25,
        "cognitiveLevel": "recognition",
        "format": "multiple_choice"
      },
      ...
    ],
    "speakingPrompts": [
      {
        "id": "spk-1",
        "topic": "Topic 1: ...",
        "questions": ["1. ...", "2. ...", "3. ..."],
        "guideForTeacher": "Hướng dẫn chấm..."
      }
    ],
    "rubricWriting": "Hướng dẫn chấm bài viết chi tiết..."
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const textOutput = response.text?.trim() || "{}";
    const parsed = JSON.parse(textOutput);

    // Generate unique IDs
    const timestamp = Date.now();
    const matrixId = `matrix-${timestamp}`;
    const specId = `spec-${timestamp}`;
    const examId = `exam-${timestamp}`;

    if (parsed.matrix) {
      parsed.matrix.id = matrixId;
      parsed.matrix.createdAt = new Date().toISOString();
      parsed.matrix.updatedAt = parsed.matrix.createdAt;
    }
    if (parsed.specification) {
      parsed.specification.id = specId;
      parsed.specification.matrixId = matrixId;
      parsed.specification.createdAt = new Date().toISOString();
      parsed.specification.updatedAt = parsed.specification.createdAt;
    }
    if (parsed.exam) {
      parsed.exam.id = examId;
      parsed.exam.matrixId = matrixId;
      parsed.exam.specId = specId;
      parsed.exam.createdAt = new Date().toISOString();
      parsed.exam.updatedAt = parsed.exam.createdAt;

      // Ensure question ids and sequence
      if (Array.isArray(parsed.exam.questions)) {
        parsed.exam.questions = parsed.exam.questions.map((q: any, idx: number) => ({
          ...q,
          id: q.id || `q-${timestamp}-${idx + 1}`,
          number: idx + 1,
          score: q.score || 0.25,
        }));
      }
    }

    // Automatically persist the generated exam to the storage
    if (parsed.exam) {
      storedExams.unshift(parsed.exam);
      saveJson(EXAMS_FILE, storedExams);
    }

    res.json({
      success: true,
      matrix: parsed.matrix,
      specification: parsed.specification,
      exam: parsed.exam,
    });
  } catch (error: any) {
    console.error("Error generating exam package with Gemini:", error);
    res.status(500).json({
      error: "Không thể tạo bộ đề thi qua AI. " + (error?.message || ""),
    });
  }
});

// AI Writing Auto-Grader & Feedback
app.post("/api/gemini/grade-writing", async (req: Request, res: Response) => {
  try {
    const { promptTopic, studentText, grade = "7", maxScore = 1.0 } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({
        error: "GEMINI_API_KEY chưa được cấu hình.",
      });
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Hãy chấm điểm và đưa ra nhận xét chi tiết bằng tiếng Việt cho bài viết Tiếng Anh lớp ${grade} của học sinh.
Chủ đề bài viết: "${promptTopic}"
Bài làm của học sinh: "${studentText}"
Thang điểm tối đa: ${maxScore} điểm.

Đánh giá 4 tiêu chí:
1. Nội dung & Bố cục (Task fulfillment & Organization)
2. Từ vựng & Độ chính xác (Vocabulary & Word Choice)
3. Ngữ pháp & Cấu trúc câu (Grammar & Sentence structures)
4. Chính tả & Dấu câu (Spelling & Punctuation)

Trả về JSON:
{
  "score": 0.8,
  "maxScore": ${maxScore},
  "feedback": "Nhận xét tổng quan tích cực và động viên...",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "areasForImprovement": ["Điểm cần cải thiện 1", "Lỗi ngữ pháp cần sửa 2"],
  "correctedText": "Đoạn văn đã được sửa chuẩn ngữ pháp và mượt mà hơn..."
}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json({ success: true, result: parsed });
  } catch (err: any) {
    console.error("Error grading writing:", err);
    res.status(500).json({ error: "Lỗi chấm điểm bài viết: " + err?.message });
  }
});

// Start Express Server with Vite Middleware in Development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EngMatrix THCS server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
