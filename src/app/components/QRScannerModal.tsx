import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, Loader } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScan
}) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const initScanner = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get available cameras
        const devices = await Html5Qrcode.getCameras();
        if (!mounted) return;

        if (devices.length === 0) {
          setError('Không tìm thấy camera. Vui lòng kiểm tra thiết bị của bạn.');
          setLoading(false);
          return;
        }

        setCameras(devices);
        const defaultCamera = devices[0].id;
        setSelectedCamera(defaultCamera);

        // Initialize scanner
        if (containerRef.current) {
          scannerRef.current = new Html5Qrcode('qr-reader');
          
          await scannerRef.current.start(
            defaultCamera,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1
            },
            (decodedText) => {
              // Successfully scanned
              onScan(decodedText);
              handleClose();
            },
            () => {
              // QR code not found - this is normal during scanning
            }
          );
        }

        setLoading(false);
      } catch (err) {
        console.error('Scanner initialization error:', err);
        if (mounted) {
          setError('Không thể khởi động camera. Vui lòng cấp quyền truy cập camera.');
          setLoading(false);
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
      scannerRef.current = null;
    }
    onClose();
  };

  const switchCamera = async (cameraId: string) => {
    if (!scannerRef.current) return;

    try {
      setLoading(true);
      await scannerRef.current.stop();
      
      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1
        },
        (decodedText) => {
          onScan(decodedText);
          handleClose();
        },
        () => {}
      );
      
      setSelectedCamera(cameraId);
      setLoading(false);
    } catch (err) {
      setError('Không thể chuyển đổi camera');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Quét Mã QR
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 font-medium mb-2">Lỗi Camera</p>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          ) : (
            <>
              {/* Scanner Container */}
              <div className="relative rounded-xl overflow-hidden bg-gray-900 mb-4">
                <div 
                  ref={containerRef}
                  id="qr-reader" 
                  className="w-full aspect-square"
                />
                
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                    <div className="text-center">
                      <Loader className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                      <p className="text-white text-sm">Đang khởi động camera...</p>
                    </div>
                  </div>
                )}

                {/* Scan Frame Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-white/30 rounded-xl" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-500 rounded-lg">
                    {/* Corner markers */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-blue-500" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-blue-500" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-blue-500" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-blue-500" />
                  </div>
                </div>
              </div>

              {/* Camera Selector */}
              {cameras.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn camera
                  </label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => switchCamera(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    disabled={loading}
                  >
                    {cameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label || `Camera ${cam.id.slice(0, 8)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 text-center">
                  Đưa mã QR vào khung quét để tra cứu hồ sơ tự động
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
