import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
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
    const svg = document.getElementById("betx-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      const link = document.createElement("a");
      link.download = "betx-qrcode.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
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
            <QRCodeSVG
              id="betx-qr-svg"
              value={siteUrl}
              size={200}
              bgColor="#ffffff"
              fgColor="#0a0a0f"
              level="H"
              includeMargin={false}
            />
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
