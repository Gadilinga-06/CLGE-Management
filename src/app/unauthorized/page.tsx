import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Shell } from "@/components/layout/shell";

export default function UnauthorizedPage() {
  return (
    <Shell>
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center border rounded-lg border-destructive/20 bg-destructive/5 max-w-md">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-destructive">Access Denied</h3>
            <p className="text-sm text-muted-foreground">
              You do not have the required permissions to view this page. If you believe this is an error, please contact your administrator.
            </p>
          </div>
          {/* @ts-expect-error React 19 type issue with radix-ui */}
          <Button asChild variant="default" className="mt-4">
            <Link href="/">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}
