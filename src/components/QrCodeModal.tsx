import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ExternalLink, Download, Smartphone, Laptop, Share2, BookOpen } from 'lucide-react';
import { ExamPaper } from '../types';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
  currentExam: ExamPaper;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  appUrl,
  currentExam,
}) => {
  const [qrType, setQrType] = useState<'app' | 'student_exam' | 'answer_key'>('student_exam');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build URLs based on selected QR type
  const origin = appUrl || window.location.origin;
  let targetUrl = origin;
  let title = 'Mã QR Truy cập Ứng dụng EngMatrix THCS';
  let subtitle = 'Quét mã để mở toàn bộ ứng dụng trên điện thoại hoặc máy tính bảng';

  if (qrType === 'student_exam') {
    targetUrl = `${origin}?mode=student&examId=${currentExam.id}`;
    title = `Mã QR Học sinh Làm bài Online: ${currentExam.title}`;
    subtitle = `Học sinh quét mã bằng Camera/Zalo trên điện thoại để làm bài kiểm tra trực tuyến (Lớp ${currentExam.grade} - Mã đề ${currentExam.examCode})`;
  } else if (qrType === 'answer_key') {
    targetUrl = `${origin}?mode=exam&tab=keys&examId=${currentExam.id}`;
    title = `Mã QR Tra cứu Đáp án & Lời giải: ${currentExam.title}`;
    subtitle = 'Quét mã để tra cứu đáp án chi tiết và hướng dẫn chấm sau giờ thi';
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById('engmatrix-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20, 360, 360);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR_${currentExam.examCode}_${qrType}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Mã QR Code Tiện ích</h3>
            <p className="text-xs text-slate-500">Truy cập tức thì cho Giáo viên và Học sinh</p>
          </div>
        </div>

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-medium">
          <button
            onClick={() => setQrType('student_exam')}
            className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer ${
              qrType === 'student_exam'
                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-600" />
            Học sinh làm bài
          </button>

          <button
            onClick={() => setQrType('app')}
            className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer ${
              qrType === 'app'
                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-600" />
            Mở Ứng dụng
          </button>

          <button
            onClick={() => setQrType('answer_key')}
            className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer ${
              qrType === 'answer_key'
                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 mx-auto mb-1 text-purple-600" />
            Tra cứu Đáp án
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center bg-slate-50 border border-slate-200/80 rounded-2xl p-6 mb-5">
          <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
            <QRCodeSVG
              id="engmatrix-qr-svg"
              value={targetUrl}
              size={220}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjNDMzOGNhIi8+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmZmZmYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCI+RU08L3RleHQ+PC9zdmc+",
                x: undefined,
                y: undefined,
                height: 38,
                width: 38,
                excavate: true,
              }}
            />
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-800 text-center">{title}</p>
          <p className="text-xs text-slate-500 text-center max-w-xs mt-1">{subtitle}</p>
        </div>

        {/* URL Box & Actions */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={targetUrl}
              className="w-full text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 select-all focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-4 h-4 mr-1 text-emerald-300" /> : <Copy className="w-4 h-4 mr-1" />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <button
              onClick={handleDownloadQr}
              className="inline-flex items-center text-slate-600 hover:text-slate-900 font-medium py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Tải ảnh QR (PNG)
            </button>

            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium py-1.5 px-3 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Mở liên kết ngay
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
