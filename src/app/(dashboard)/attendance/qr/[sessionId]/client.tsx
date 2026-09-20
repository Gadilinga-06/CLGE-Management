/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateQRToken } from "../../actions";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function QRDisplayClient({ sessionId }: { sessionId: string }) {
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  const fetchNewToken = async () => {
    const result = await generateQRToken(sessionId);
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.token && result?.expiresAt) {
      setQrToken(result.token);
      setExpiresAt(new Date(result.expiresAt));
      setTimeLeft(30);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    fetchNewToken();
    const intervalId = setInterval(() => {
      fetchNewToken();
    }, 28000); // refresh every 28 seconds

    return () => clearInterval(intervalId);
  }, [sessionId]);

  useEffect(() => {
    const countdownId = setInterval(() => {
      if (expiresAt) {
        const diff = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
        setTimeLeft(diff > 0 ? diff : 0);
      }
    }, 1000);

    return () => clearInterval(countdownId);
  }, [expiresAt]);

  if (!qrToken) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
        <p>Generating secure QR token...</p>
      </div>
    );
  }

  // Use a fixed domain or window.location.origin for scanning
  const scanUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/attendance/scan?session=${sessionId}&token=${qrToken}`;

  return (
    <Card className="p-8 shadow-lg border-2 border-primary/20 flex flex-col items-center">
      <div className="bg-white p-4 rounded-lg mb-6 shadow-inner">
        <QRCodeSVG value={scanUrl} size={300} />
      </div>
      
      <div className="text-xl font-medium tabular-nums">
        Refreshes in <span className={timeLeft < 5 ? "text-red-500 font-bold" : "text-primary"}>{timeLeft}</span> seconds
      </div>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        Students must scan this code using their registered device to automatically mark attendance. Do not share screenshots.
      </p>
    </Card>
  );
}
