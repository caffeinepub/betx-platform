import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
}

// Minimal QR code generator using Google Charts API (no external package needed)
function QRCodeImage({ value, size }: { value: string; size: number }) {
  const encodedValue = encodeURIComponent(value);
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&bgcolor=ffffff&color=0a0a0f&margin=10`;
  return (
    <img
      id="betx-qr-img"
      src={src}
      alt="BetX QR Code"
      width={size}
      height={size}
      style={{ display: "block" }}
    />
  );
}

export function QRCodeModal({ open, onClose }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const siteUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const img = document.getElementById(
      "betx-qr-img",
    ) as HTMLImageElement | null;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 300, 300);
    ctx.drawImage(img, 0, 0, 300, 300);
    const link = document.createElement("a");
    link.download = "betx-qrcode.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-panel-dark border-border max-w-xs w-full rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-foreground font-display text-lg">
            <span className="text-neon">BetX</span> QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-2">
          {/* QR Code */}
          <div className="p-4 bg-white rounded-xl shadow-lg">
            <QRCodeImage value={siteUrl} size={200} />
          </div>

          <p className="text-xs text-muted-foreground text-center px-2">
            Is QR code ko scan karke BetX platform directly kholein
          </p>

          {/* URL display */}
          <div className="w-full bg-secondary border border-border rounded-sm px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground truncate flex-1">
              {siteUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-shrink-0 p-1 hover:bg-neon/10 rounded-sm transition-colors"
              title="Copy link"
            >
              {copied ? (
                <Check className="w-4 h-4 text-neon" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground hover:text-neon" />
              )}
            </button>
          </div>

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-neon/10 hover:bg-neon/20 border border-neon/40 text-neon text-sm font-semibold rounded-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            QR Code Download Karein
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
