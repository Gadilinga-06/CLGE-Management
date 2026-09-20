import { createClient } from "@/lib/supabase/server";

export async function logAudit(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  oldData?: unknown,
  newData?: unknown,
  collegeId?: string
) {
  try {
    const supabase = await createClient();

    await supabase.from("audit_logs").insert({
      user_id: userId,
      college_id: collegeId || null,
      action,
      entity,
      entity_id: entityId,
      old_data: oldData || null,
      new_data: newData || null,
    });
  } catch {
    // Non-blocking, so we don't throw.
  }
}
