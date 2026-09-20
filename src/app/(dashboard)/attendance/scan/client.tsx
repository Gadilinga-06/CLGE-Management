/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { markAttendanceViaQR } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ScanClient({ sessionId, token, sessionData }: { sessionId: string, token: string, sessionData: any }) {
  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    
    const processAttendance = async () => {
      const result = await markAttendanceViaQR(sessionId, token);
      
      if (!mounted) return;

      if (result?.error) {
        setStatus('ERROR');
        setMessage(result.error);
      } else {
        setStatus('SUCCESS');
        setMessage("Your attendance has been recorded successfully.");
      }
    };

    processAttendance();
    
    return () => { mounted = false };
  }, [sessionId, token]);

  return (
    <Card className="text-center shadow-lg">
      <CardHeader>
        <CardTitle>Attendance Submission</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-4 pb-8 flex flex-col items-center">
        
        {status === 'LOADING' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <h3 className="text-xl font-medium">Processing...</h3>
            <p className="text-muted-foreground">Please wait while we verify your QR token.</p>
          </>
        )}

        {status === 'SUCCESS' && (
          <>
            <CheckCircle2 className="h-20 w-20 text-green-500" />
            <h3 className="text-2xl font-bold text-green-600">Present!</h3>
            <p className="text-muted-foreground">{message}</p>
            {sessionData && (
              <div className="bg-muted p-4 rounded-md w-full mt-4 text-left">
                <p className="font-semibold">{sessionData.subjects?.name}</p>
                <p className="text-sm text-muted-foreground">Section {sessionData.sections?.name}</p>
                <p className="text-sm text-muted-foreground">{sessionData.date} • {sessionData.start_time}</p>
              </div>
            )}
            <Link href="/" className="w-full mt-4 block">
              <Button className="w-full">Back to Dashboard</Button>
            </Link>
          </>
        )}

        {status === 'ERROR' && (
          <>
            <XCircle className="h-20 w-20 text-red-500" />
            <h3 className="text-2xl font-bold text-red-600">Failed</h3>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-xs text-muted-foreground mt-2">
              If the code expired, please scan the new code shown on the screen.
            </p>
            <Link href="/" className="w-full mt-4 block">
              <Button variant="outline" className="w-full">Back to Dashboard</Button>
            </Link>
          </>
        )}

      </CardContent>
    </Card>
  );
}
