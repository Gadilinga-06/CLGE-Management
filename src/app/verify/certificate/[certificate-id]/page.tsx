import { verifyCertificate } from "@/app/(dashboard)/certificates/actions";
import { VerifyCertificateClient } from "./client";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ "certificate-id": string }>;
}) {
  const { "certificate-id": certificateId } = await params;

  const result = await verifyCertificate(certificateId);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <VerifyCertificateClient result={result} certificateId={certificateId} />
    </div>
  );
}
