/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, getAuthorizationContext } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─────────────────────────────────────────
// BUSES
// ─────────────────────────────────────────

export async function createBus(formData: FormData) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  const payload = {
    college_id: ctx.profile.college_id,
    registration_number: formData.get("registration_number") as string,
    capacity: parseInt(formData.get("capacity") as string) || 40,
    model: formData.get("model") as string || null,
    status: formData.get("status") as string || "ACTIVE",
  };

  const { data, error } = await supabase.from("buses").insert(payload).select().single();
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "CREATE", "buses", data.id, null, payload);
  revalidatePath("/transport");
  return { success: true };
}

export async function updateBus(id: string, formData: FormData) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  const updates = {
    registration_number: formData.get("registration_number") as string,
    capacity: parseInt(formData.get("capacity") as string) || 40,
    model: formData.get("model") as string || null,
    status: formData.get("status") as string || "ACTIVE",
  };

  const { error } = await supabase.from("buses").update(updates).eq("id", id).eq("college_id", ctx.profile.college_id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "buses", id, null, updates);
  revalidatePath("/transport");
  return { success: true };
}

export async function deleteBus(id: string) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  const { error } = await supabase.from("buses").delete().eq("id", id).eq("college_id", ctx.profile.college_id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "DELETE", "buses", id, null, null);
  revalidatePath("/transport");
  return { success: true };
}

// ─────────────────────────────────────────
// DRIVERS
// ─────────────────────────────────────────

export async function createDriver(formData: FormData) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  const payload = {
    college_id: ctx.profile.college_id,
    name: formData.get("name") as string,
    license_number: formData.get("license_number") as string,
    phone: formData.get("phone") as string || null,
    status: formData.get("status") as string || "ACTIVE",
  };

  const { data, error } = await supabase.from("drivers").insert(payload).select().single();
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "CREATE", "drivers", data.id, null, payload);
  revalidatePath("/transport");
  return { success: true };
}

export async function updateDriver(id: string, formData: FormData) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  const updates = {
    name: formData.get("name") as string,
    license_number: formData.get("license_number") as string,
    phone: formData.get("phone") as string || null,
    status: formData.get("status") as string || "ACTIVE",
  };

  const { error } = await supabase.from("drivers").update(updates).eq("id", id).eq("college_id", ctx.profile.college_id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "drivers", id, null, updates);
  revalidatePath("/transport");
  return { success: true };
}

export async function deleteDriver(id: string) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  const { error } = await supabase.from("drivers").delete().eq("id", id).eq("college_id", ctx.profile.college_id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "DELETE", "drivers", id, null, null);
  revalidatePath("/transport");
  return { success: true };
}

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

export async function createRoute(formData: FormData) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  const payload = {
    college_id: ctx.profile.college_id,
    name: formData.get("name") as string,
    bus_id: formData.get("bus_id") as string || null,
    driver_id: formData.get("driver_id") as string || null,
    start_point: formData.get("start_point") as string || null,
    end_point: formData.get("end_point") as string || null,
  };

  const { data, error } = await supabase.from("routes").insert(payload).select().single();
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "CREATE", "routes", data.id, null, payload);
  revalidatePath("/transport");
  return { success: true };
}

export async function updateRoute(id: string, formData: FormData) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  const updates = {
    name: formData.get("name") as string,
    bus_id: formData.get("bus_id") as string || null,
    driver_id: formData.get("driver_id") as string || null,
    start_point: formData.get("start_point") as string || null,
    end_point: formData.get("end_point") as string || null,
  };

  const { error } = await supabase.from("routes").update(updates).eq("id", id).eq("college_id", ctx.profile.college_id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "UPDATE", "routes", id, null, updates);
  revalidatePath("/transport");
  return { success: true };
}

export async function deleteRoute(id: string) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  const { error } = await supabase.from("routes").delete().eq("id", id).eq("college_id", ctx.profile.college_id);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "DELETE", "routes", id, null, null);
  revalidatePath("/transport");
  return { success: true };
}

// ─────────────────────────────────────────
// BUS STOPS
// ─────────────────────────────────────────

export async function createStop(formData: FormData) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  const payload = {
    route_id: formData.get("route_id") as string,
    name: formData.get("name") as string,
    pickup_time: formData.get("pickup_time") as string,
    drop_time: formData.get("drop_time") as string,
    stop_order: parseInt(formData.get("stop_order") as string) || 0,
  };

  const { error } = await supabase.from("bus_stops").insert(payload);
  if (error) return { error: error.message };
  revalidatePath("/transport");
  return { success: true };
}

export async function updateStop(id: string, formData: FormData) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  const updates = {
    name: formData.get("name") as string,
    pickup_time: formData.get("pickup_time") as string,
    drop_time: formData.get("drop_time") as string,
    stop_order: parseInt(formData.get("stop_order") as string) || 0,
  };

  const { error } = await supabase.from("bus_stops").update(updates).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/transport");
  return { success: true };
}

export async function deleteStop(id: string) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  const { error } = await supabase.from("bus_stops").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/transport");
  return { success: true };
}

// ─────────────────────────────────────────
// TRANSPORT ASSIGNMENTS
// ─────────────────────────────────────────

export async function assignStudent(payload: {
  student_id: string;
  route_id: string;
  stop_id: string;
  academic_year_id: string;
}) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  // Check student is not already assigned to this route
  const { count } = await supabase
    .from("transport_assignments")
    .select("id", { count: "exact", head: true })
    .eq("student_id", payload.student_id)
    .eq("academic_year_id", payload.academic_year_id)
    .eq("status", "ACTIVE");

  if ((count || 0) > 0) return { error: "Student already has an active transport assignment. Remove it first." };

  // Check bus capacity
  const { data: route } = await supabase
    .from("routes")
    .select("bus_id, buses(capacity)")
    .eq("id", payload.route_id)
    .single();

  if (route?.bus_id && route.buses) {
    const busCapacity = (route.buses as any).capacity || 0;
    const { count: assigned } = await supabase
      .from("transport_assignments")
      .select("id", { count: "exact", head: true })
      .eq("route_id", payload.route_id)
      .eq("academic_year_id", payload.academic_year_id)
      .eq("status", "ACTIVE");

    if ((assigned || 0) >= busCapacity) return { error: `Bus is at full capacity (${busCapacity} seats).` };
  }

  const { data, error } = await supabase
    .from("transport_assignments")
    .insert({
      student_id: payload.student_id,
      route_id: payload.route_id,
      stop_id: payload.stop_id,
      academic_year_id: payload.academic_year_id,
      status: "ACTIVE",
    })
    .select()
    .single();

  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "CREATE", "transport_assignments", data.id, null, payload);
  revalidatePath("/transport");
  return { success: true };
}

export async function removeAssignment(assignmentId: string) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  const { error } = await supabase.from("transport_assignments").delete().eq("id", assignmentId);
  if (error) return { error: error.message };
  await logAudit(ctx.user.id, "DELETE", "transport_assignments", assignmentId, null, null);
  revalidatePath("/transport");
  return { success: true };
}

// ─────────────────────────────────────────
// TRANSPORT FEES
// ─────────────────────────────────────────

export async function generateTransportFees(academicYearId: string, feeAmount: number) {
  const ctx = await requirePermission("transport.manage");
  const supabase = createAdminClient();

  // Get active transport assignments
  const { data: assignments, error: assignErr } = await supabase
    .from("transport_assignments")
    .select("id, student_id, college_id")
    .eq("academic_year_id", academicYearId)
    .eq("status", "ACTIVE");

  if (assignErr) return { error: assignErr.message };
  if (!assignments || assignments.length === 0) return { error: "No active transport assignments found." };

  // Get any course_id (fee_structures requires it)
  const { data: anyCourse } = await supabase
    .from("departments")
    .select("id, courses!inner(id)")
    .eq("college_id", ctx.profile.college_id)
    .limit(1)
    .single();

  const courseId = (anyCourse as any)?.courses?.id;
  if (!courseId) return { error: "No courses found for fee structure." };

  // Find or create TRANSPORT fee structure
  const { data: existing } = await supabase
    .from("fee_structures")
    .select("id")
    .eq("college_id", ctx.profile.college_id)
    .eq("academic_year_id", academicYearId)
    .eq("category", "TRANSPORT")
    .eq("amount", feeAmount)
    .maybeSingle();

  let feeStructureId = existing?.id;

  if (!feeStructureId) {
    const { data: fs, error: fsErr } = await supabase
      .from("fee_structures")
      .insert({
        college_id: ctx.profile.college_id,
        academic_year_id: academicYearId,
        course_id: courseId,
        category: "TRANSPORT",
        amount: feeAmount,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      })
      .select("id")
      .single();

    if (fsErr || !fs) return { error: "Failed to create transport fee structure." };
    feeStructureId = fs.id;
  }

  // Assign fees to students
  const inserts = (assignments as any[]).map(a => ({
    college_id: ctx.profile.college_id,
    student_id: a.student_id,
    fee_structure_id: feeStructureId!,
    amount_due: feeAmount,
    paid_amount: 0,
    scholarship_amount: 0,
    discount_amount: 0,
    late_fee_amount: 0,
    status: "PENDING",
    remarks: `Transport assignment: ${a.id}`,
    transport_assignment_id: a.id,
  }));

  const { error: insertErr } = await supabase
    .from("student_fees")
    .upsert(inserts, { onConflict: "student_id,fee_structure_id" });

  if (insertErr) return { error: insertErr.message };

  await logAudit(ctx.user.id, "CREATE", "student_fees", "transport", null, { count: inserts.length, academic_year_id: academicYearId });
  revalidatePath("/finance/fees");
  revalidatePath("/transport");
  return { success: true, count: inserts.length };
}

// ─────────────────────────────────────────
// MY TRANSPORT (student portal)
// ─────────────────────────────────────────

export async function getMyTransport() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", ctx.user.id)
    .single();

  if (!student) return { assignment: null };

  const { data: assignment } = await supabase
    .from("transport_assignments")
    .select(`
      id, status, created_at,
      routes!inner(
        id, name, start_point, end_point,
        buses(registration_number, capacity, model),
        drivers(name, phone)
      ),
      bus_stops!inner(id, name, pickup_time, drop_time, stop_order)
    `)
    .eq("student_id", student.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  return { assignment };
}
