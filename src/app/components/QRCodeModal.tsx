import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Share2, CheckCircle } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  title?: string;
  description?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  value,
  title = 'Mã QR Theo Dõi',
  description = 'Quét mã QR này để tra cứu hồ sơ'
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `qr-code-${value}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-sm text-gray-600 mb-6">{description}</p>

          {/* QR Code */}
          <div className="inline-block p-4 bg-white rounded-xl shadow-lg border-2 border-gray-100 mb-6">
            <QRCodeSVG
              id="qr-code-svg"
              value={value}
              size={200}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: '/img/tbt-logo.png',
                height: 30,
                width: 30,
                excavate: true,
              }}
            />
          </div>

          {/* Code Display */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">Mã theo dõi</p>
            <p className="font-mono text-lg font-semibold text-gray-900">{value}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Tải xuống
            </button>
            <button
              onClick={handleCopyCode}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Đã sao chép
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Sao chép mã
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
