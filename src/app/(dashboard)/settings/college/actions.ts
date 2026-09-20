"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";

export async function updateCollege(formData: FormData) {
  const context = await requirePermission("settings.manage");
  // HOD must not modify global college settings. The permission "settings.manage" 
  // is assigned to COLLEGE_ADMIN and SUPER_ADMIN. So it's natively protected.
  
  const collegeId = context.profile.college_id;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const website = formData.get("website") as string;
  const address = formData.get("address") as string;
  const affiliation = formData.get("affiliation") as string;
  const accreditation = formData.get("accreditation") as string;

  const supabase = await createClient();

  const { data: oldData } = await supabase
    .from("colleges")
    .select("*")
    .eq("id", collegeId)
    .single();

  const newData = {
    name,
    email,
    phone,
    website,
    address,
    affiliation,
    accreditation,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("colleges")
    .update(newData)
    .eq("id", collegeId);

  if (error) {
    return { error: error.message };
  }

  await logAudit(
    context.user.id,
    "UPDATE",
    "colleges",
    collegeId,
    oldData,
    newData
  );

  revalidatePath("/settings/college");
  return { success: true };
}
