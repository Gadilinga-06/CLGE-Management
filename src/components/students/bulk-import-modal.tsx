/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { bulkImportStudents } from "@/app/(dashboard)/students/actions";
import { toast } from "sonner";
import Papa from "papaparse";
import { UploadCloud, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BulkImportModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number, failed: number, errors: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        if (data.length === 0) {
          toast.error("No valid data found in CSV");
          setIsProcessing(false);
          return;
        }

        try {
          const res = await bulkImportStudents(data);
          setResults(res);
          toast.success("Import completed");
        } catch (error: any) {
          toast.error(error.message || "Failed to process import");
        }
        setIsProcessing(false);
      },
      error: (error) => {
        toast.error("Error parsing CSV: " + error.message);
        setIsProcessing(false);
      }
    });
  };

  const reset = () => {
    setFile(null);
    setResults(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isProcessing) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Import Students</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing student records. Required columns: email, admission_number, first_name
          </DialogDescription>
        </DialogHeader>
        
        {!results ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="border-2 border-dashed border-muted rounded-lg p-8 w-full flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
              <div className="text-sm font-medium mb-1">
                {file ? file.name : "Drag and drop or click to upload CSV"}
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
            </div>
            
            <div className="flex w-full justify-between">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancel</Button>
              <Button onClick={handleImport} disabled={!file || isProcessing}>
                {isProcessing ? "Processing..." : "Import Data"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-2xl font-bold text-green-700">{results.success}</span>
                <span className="text-sm text-green-600 font-medium">Successfully Imported</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg border border-red-100">
                <XCircle className="h-8 w-8 text-red-600 mb-2" />
                <span className="text-2xl font-bold text-red-700">{results.failed}</span>
                <span className="text-sm text-red-600 font-medium">Failed to Import</span>
              </div>
            </div>

            {results.errors.length > 0 && (
              <Alert variant="destructive" className="max-h-48 overflow-y-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-2 text-xs space-y-1">
                    {results.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={reset} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

