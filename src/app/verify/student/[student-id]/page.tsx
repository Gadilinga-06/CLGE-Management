import { verifyStudentQR } from "@/app/(dashboard)/students/actions-qr";
import { VerifyStudentClient } from "./client";

export default async function VerifyStudentPage({
  params,
}: {
  params: Promise<{ "student-id": string }>;
}) {
  const { "student-id": token } = await params;

  const result = await verifyStudentQR(token);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <VerifyStudentClient result={result} token={token} />
    </div>
  );
}
