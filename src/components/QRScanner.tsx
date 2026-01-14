import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, Camera } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Extract invite code from URL if scanned a full URL
            let code = decodedText;
            const joinMatch = decodedText.match(/\/join\/([a-zA-Z0-9]+)/);
            if (joinMatch) {
              code = joinMatch[1];
            }
            onScan(code);
          },
          () => {
            // Ignore scan failures (happens frequently during scanning)
          }
        );

        if (mounted) {
          setIsStarting(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to start camera');
          setIsStarting(false);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <span className="font-medium">Scan QR Code</span>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {error ? (
          <div className="text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={onClose}>Go Back</Button>
          </div>
        ) : (
          <>
            <div 
              id="qr-reader" 
              ref={containerRef}
              className="w-full max-w-sm aspect-square rounded-lg overflow-hidden bg-muted"
            />
            {isStarting && (
              <p className="mt-4 text-muted-foreground animate-pulse">
                Starting camera...
              </p>
            )}
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Point your camera at a group invite QR code
            </p>
          </>
        )}
      </div>
    </div>
  );
};
