"use server";

import { createClient } from "@/lib/supabase/server";

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();

  // The origin must be passed properly. Next.js server actions do not have easy access
  // to the origin without passing it or configuring it. We'll rely on NEXT_PUBLIC_SUPABASE_URL
  // or a custom site URL if needed, but Supabase automatically uses the configured Site URL.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
