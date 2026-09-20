/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, getAuthorizationContext } from "@/lib/auth";
import { logAudit } from "@/services/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const VALID_COMPLAINT_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const VALID_VISITOR_STATUSES = ["CHECKED_IN", "CHECKED_OUT"];

// ─────────────────────────────────────────
// HOSTEL CRUD
// ─────────────────────────────────────────

export async function createHostel(formData: FormData) {
  const ctx = await requirePermission("hostel.manage");
  const supabase = createAdminClient();

  const payload = {
    college_id: ctx.profile.college_id,
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    description: formData.get("description") as string || null,
    total_floors: parseInt(formData.get("total_floors") as string) || 1,
    warden_id: formData.get("warden_id") as string || null,
  };

  const { data, error } = await supabase.from("hostels").insert(payload).select().single();
  if (error) return { error: "Failed to create hostel" };
  await logAudit(ctx.user.id, "CREATE", "hostels", data.id, null, payload);
  revalidatePath("/hostel");
  return { success: true };
}

export async function updateHostel(id: string, formData: FormData) {
  const ctx = await requirePermission("hostel.manage");
  const supabase = createAdminClient();

  const updates = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    description: formData.get("description") as string || null,
    total_floors: parseInt(formData.get("total_floors") as string) || 1,
    warden_id: formData.get("warden_id") as string || null,
  };

  const { error } = await supabase.from("hostels").update(updates).eq("id", id).eq("college_id", ctx.profile.college_id);
  if (error) return { error: "Failed to update hostel" };
  revalidatePath("/hostel");
  return { success: true };
}

export async function deleteHostel(id: string) {
  const ctx = await requirePermission("hostel.manage");
  const supabase = createAdminClient();
  const { error } = await supabase.from("hostels").delete().eq("id", id).eq("college_id", ctx.profile.college_id);
  if (error) return { error: "Failed to delete hostel" };
  revalidatePath("/hostel");
  return { success: true };
}

// ─────────────────────────────────────────
// BLOCKS (college_id enforced via hostel ownership)
// ─────────────────────────────────────────

async function verifyBlockCollegeAccess(blockId: string, collegeId: string, supabase: any): Promise<boolean> {
  const { data: block } = await supabase
    .from("hostel_blocks")
    .select("id, hostels!inner(college_id)")
    .eq("id", blockId)
    .single();
  return block?.hostels?.college_id === collegeId;
}

export async function createBlock(formData: FormData) {
  const ctx = await requirePermission("hostel.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  const hostelId = formData.get("hostel_id") as string;
  const { data: hostel } = await supabase.from("hostels").select("id").eq("id", hostelId).eq("college_id", collegeId).single();
  if (!hostel) return { error: "Hostel not found in your college" };

  const payload = {
    hostel_id: hostelId,
    name: formData.get("name") as string,
    floor_number: parseInt(formData.get("floor_number") as string) || 1,
    description: formData.get("description") as string || null,
  };

  const { error } = await supabase.from("hostel_blocks").insert(payload);
  if (error) return { error: "Failed to create block" };
  revalidatePath("/hostel");
  return { success: true };
}

export async function updateBlock(id: string, formData: FormData) {
  const ctx = await requirePermission("hostel.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  if (!await verifyBlockCollegeAccess(id, collegeId, supabase)) {
    return { error: "Block not found in your college" };
  }

  const updates = {
    name: formData.get("name") as string,
    floor_number: parseInt(formData.get("floor_number") as string) || 1,
    description: formData.get("description") as string || null,
  };

  const { error } = await supabase.from("hostel_blocks").update(updates).eq("id", id);
  if (error) return { error: "Failed to update block" };
  revalidatePath("/hostel");
  return { success: true };
}

export async function deleteBlock(id: string) {
  const ctx = await requirePermission("hostel.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  if (!await verifyBlockCollegeAccess(id, collegeId, supabase)) {
    return { error: "Block not found in your college" };
  }

  const { error } = await supabase.from("hostel_blocks").delete().eq("id", id);
  if (error) return { error: "Failed to delete block" };
  revalidatePath("/hostel");
  return { success: true };
}

// ─────────────────────────────────────────
// ROOMS (college_id enforced via block → hostel ownership)
// ─────────────────────────────────────────

async function verifyRoomCollegeAccess(roomId: string, collegeId: string, supabase: any): Promise<boolean> {
  const { data: room } = await supabase
    .from("hostel_rooms")
    .select("id, hostel_blocks!inner(hostels!inner(college_id))")
    .eq("id", roomId)
    .single();
  return (room as any)?.hostel_blocks?.hostels?.college_id === collegeId;
}

export async function createRoom(formData: FormData) {
  const ctx = await requirePermission("hostel.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  const blockId = formData.get("block_id") as string;
  if (!await verifyBlockCollegeAccess(blockId, collegeId, supabase)) {
    return { error: "Block not found in your college" };
  }

  const capacity = parseInt(formData.get("capacity") as string) || 2;

  const { data: room, error } = await supabase.from("hostel_rooms").insert({
    block_id: blockId,
    room_number: formData.get("room_number") as string,
    capacity,
    room_type: formData.get("room_type") as string || "SHARED",
    has_ac: formData.get("has_ac") === "true",
    has_attached_bath: formData.get("has_attached_bath") === "true",
    monthly_rent: parseFloat(formData.get("monthly_rent") as string) || 0,
  }).select().single();

  if (error) return { error: "Failed to create room" };

  const beds = Array.from({ length: capacity }, (_, i) => ({
    room_id: room.id,
    bed_number: `B${i + 1}`,
    status: "AVAILABLE",
  }));

  const { error: bedErr } = await supabase.from("hostel_beds").insert(beds);
  if (bedErr) return { error: "Failed to create beds" };

  revalidatePath("/hostel");
  return { success: true };
}

export async function updateRoom(id: string, formData: FormData) {
  const ctx = await requirePermission("hostel.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  if (!await verifyRoomCollegeAccess(id, collegeId, supabase)) {
    return { error: "Room not found in your college" };
  }

  const updates = {
    room_number: formData.get("room_number") as string,
    room_type: formData.get("room_type") as string || "SHARED",
    has_ac: formData.get("has_ac") === "true",
    has_attached_bath: formData.get("has_attached_bath") === "true",
    monthly_rent: parseFloat(formData.get("monthly_rent") as string) || 0,
  };

  const { error } = await supabase.from("hostel_rooms").update(updates).eq("id", id);
  if (error) return { error: "Failed to update room" };
  revalidatePath("/hostel");
  return { success: true };
}

export async function deleteRoom(id: string) {
  const ctx = await requirePermission("hostel.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  if (!await verifyRoomCollegeAccess(id, collegeId, supabase)) {
    return { error: "Room not found in your college" };
  }

  const { count } = await supabase
    .from("hostel_beds")
    .select("id", { count: "exact", head: true })
    .eq("room_id", id)
    .eq("status", "OCCUPIED");

  if ((count || 0) > 0) return { error: "Cannot delete a room with occupied beds." };

  const { error } = await supabase.from("hostel_rooms").delete().eq("id", id);
  if (error) return { error: "Failed to delete room" };
  revalidatePath("/hostel");
  return { success: true };
}

// ─────────────────────────────────────────
// ALLOCATIONS
// ─────────────────────────────────────────

export async function allocateBed(payload: {
  bed_id: string;
  student_id: string;
  academic_year_id: string;
  notes?: string;
}) {
  const ctx = await requirePermission("hostel.allocate");
  const supabase = createAdminClient();

  const { data: bed } = await supabase.from("hostel_beds").select("status, room_id").eq("id", payload.bed_id).single();
  if (!bed) return { error: "Bed not found." };
  if (bed.status !== "AVAILABLE") return { error: "This bed is not available." };

  const { count } = await supabase
    .from("hostel_allocations")
    .select("id", { count: "exact", head: true })
    .eq("student_id", payload.student_id)
    .eq("status", "ALLOCATED");

  if ((count || 0) > 0) return { error: "Student already has an active hostel allocation. Vacate first." };

  const { data: alloc, error } = await supabase
    .from("hostel_allocations")
    .insert({
      college_id: ctx.profile.college_id,
      bed_id: payload.bed_id,
      student_id: payload.student_id,
      academic_year_id: payload.academic_year_id,
      allocation_date: new Date().toISOString().split("T")[0],
      status: "ALLOCATED",
      notes: payload.notes || null,
      approved_by: ctx.user.id,
    })
    .select()
    .single();

  if (error) return { error: "Failed to create allocation" };

  const { error: bedErr } = await supabase.from("hostel_beds").update({ status: "OCCUPIED" }).eq("id", payload.bed_id);
  if (bedErr) {
    await supabase.from("hostel_allocations").delete().eq("id", alloc.id);
    return { error: "Failed to mark bed as occupied. Allocation rolled back." };
  }

  await logAudit(ctx.user.id, "CREATE", "hostel_allocations", alloc.id, { bed_status: "AVAILABLE" }, { ...payload, bed_status: "OCCUPIED" });
  revalidatePath("/hostel/allocations");
  revalidatePath("/hostel");
  return { success: true };
}

export async function vacateBed(allocationId: string) {
  const ctx = await requirePermission("hostel.allocate");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  const { data: alloc } = await supabase
    .from("hostel_allocations")
    .select("id, bed_id, status, college_id")
    .eq("id", allocationId)
    .single();

  if (!alloc) return { error: "Allocation not found." };
  if (alloc.college_id !== collegeId) return { error: "Allocation not found in your college." };
  if (alloc.status === "VACATED") return { error: "Bed already vacated." };

  const { error: allocErr } = await supabase.from("hostel_allocations").update({
    status: "VACATED",
    vacation_date: new Date().toISOString().split("T")[0],
  }).eq("id", allocationId);

  if (allocErr) return { error: "Failed to vacate allocation" };

  const { error: bedErr } = await supabase.from("hostel_beds").update({ status: "AVAILABLE" }).eq("id", alloc.bed_id);
  if (bedErr) {
    await logAudit(ctx.user.id, "UPDATE", "hostel_allocations", allocationId, { status: "ALLOCATED" }, { status: "VACATED", bed_update_failed: true });
    return { error: "Allocation vacated but bed status update failed. Manual correction needed." };
  }

  await logAudit(ctx.user.id, "UPDATE", "hostel_allocations", allocationId, { status: "ALLOCATED", bed_status: "OCCUPIED" }, { status: "VACATED", bed_status: "AVAILABLE" });
  revalidatePath("/hostel/allocations");
  revalidatePath("/hostel");
  return { success: true };
}

export async function transferBed(payload: { allocationId: string; newBedId: string; notes?: string }) {
  const ctx = await requirePermission("hostel.allocate");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  const { data: alloc } = await supabase
    .from("hostel_allocations")
    .select("id, bed_id, student_id, academic_year_id, college_id")
    .eq("id", payload.allocationId)
    .single();

  if (!alloc) return { error: "Allocation not found." };
  if (alloc.college_id !== collegeId) return { error: "Allocation not found in your college." };

  const { data: newBed } = await supabase
    .from("hostel_beds")
    .select("status")
    .eq("id", payload.newBedId)
    .single();

  if (!newBed || newBed.status !== "AVAILABLE") return { error: "The target bed is not available." };

  const { error: vacateErr } = await supabase.from("hostel_allocations").update({
    status: "VACATED",
    vacation_date: new Date().toISOString().split("T")[0],
  }).eq("id", alloc.id);

  if (vacateErr) return { error: "Failed to vacate old allocation" };

  const { error: oldBedErr } = await supabase.from("hostel_beds").update({ status: "AVAILABLE" }).eq("id", alloc.bed_id);
  if (oldBedErr) {
    await supabase.from("hostel_allocations").update({ status: "ALLOCATED", vacation_date: null }).eq("id", alloc.id);
    return { error: "Failed to free old bed. Transfer cancelled." };
  }

  const { data: newAlloc, error: allocErr } = await supabase.from("hostel_allocations").insert({
    college_id: collegeId,
    bed_id: payload.newBedId,
    student_id: alloc.student_id,
    academic_year_id: alloc.academic_year_id,
    allocation_date: new Date().toISOString().split("T")[0],
    status: "ALLOCATED",
    notes: payload.notes || "Transfer from previous bed",
    approved_by: ctx.user.id,
  }).select().single();

  if (allocErr) {
    await supabase.from("hostel_beds").update({ status: "OCCUPIED" }).eq("id", alloc.bed_id);
    await supabase.from("hostel_allocations").update({ status: "ALLOCATED", vacation_date: null }).eq("id", alloc.id);
    return { error: "Failed to create new allocation. Transfer cancelled." };
  }

  const { error: newBedErr } = await supabase.from("hostel_beds").update({ status: "OCCUPIED" }).eq("id", payload.newBedId);
  if (newBedErr) {
    await supabase.from("hostel_allocations").delete().eq("id", newAlloc.id);
    await supabase.from("hostel_beds").update({ status: "OCCUPIED" }).eq("id", alloc.bed_id);
    await supabase.from("hostel_allocations").update({ status: "ALLOCATED", vacation_date: null }).eq("id", alloc.id);
    return { error: "Failed to mark new bed as occupied. Transfer cancelled." };
  }

  await logAudit(ctx.user.id, "UPDATE", "hostel_allocations", alloc.id, { bed_id: alloc.bed_id, status: "ALLOCATED" }, { bed_id: payload.newBedId, status: "ALLOCATED", transfer: true });
  revalidatePath("/hostel/allocations");
  revalidatePath("/hostel");
  return { success: true };
}

// ─────────────────────────────────────────
// COMPLAINTS
// ─────────────────────────────────────────

export async function submitComplaint(formData: FormData) {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");
  const supabase = createAdminClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", ctx.user.id)
    .single();

  if (!student) return { error: "Student record not found." };

  const { error } = await supabase.from("hostel_complaints").insert({
    college_id: ctx.profile.college_id,
    hostel_id: formData.get("hostel_id") as string,
    student_id: student.id,
    category: formData.get("category") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    status: "OPEN",
  });

  if (error) return { error: "Failed to submit complaint" };
  revalidatePath("/my-hostel");
  return { success: true };
}

export async function updateComplaintStatus(id: string, status: string) {
  const ctx = await requirePermission("hostel.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  if (!VALID_COMPLAINT_STATUSES.includes(status)) {
    return { error: "Invalid status value" };
  }

  // Verify complaint belongs to user's college
  const { data: complaint } = await supabase
    .from("hostel_complaints")
    .select("id")
    .eq("id", id)
    .eq("college_id", collegeId)
    .single();

  if (!complaint) return { error: "Complaint not found in your college" };

  const updates: any = { status };
  if (status === "RESOLVED") updates.resolved_at = new Date().toISOString();

  const { error } = await supabase.from("hostel_complaints").update(updates).eq("id", id).eq("college_id", collegeId);
  if (error) return { error: "Failed to update complaint status" };
  revalidatePath("/hostel/complaints");
  return { success: true };
}

// ─────────────────────────────────────────
// VISITORS
// ─────────────────────────────────────────

export async function logVisitor(formData: FormData) {
  const ctx = await requirePermission("hostel.manage");
  const supabase = createAdminClient();

  const { error } = await supabase.from("hostel_visitors").insert({
    college_id: ctx.profile.college_id,
    hostel_id: formData.get("hostel_id") as string,
    student_id: formData.get("student_id") as string,
    visitor_name: formData.get("visitor_name") as string,
    visitor_phone: formData.get("visitor_phone") as string || null,
    relation: formData.get("relation") as string || null,
    purpose: formData.get("purpose") as string || null,
    approved_by: ctx.user.id,
    status: "CHECKED_IN",
  });

  if (error) return { error: "Failed to log visitor" };
  revalidatePath("/hostel/visitors");
  return { success: true };
}

export async function checkOutVisitor(id: string) {
  const ctx = await requirePermission("hostel.manage");
  const collegeId = ctx.profile.college_id;
  const supabase = createAdminClient();

  // Verify visitor belongs to user's college
  const { data: visitor } = await supabase
    .from("hostel_visitors")
    .select("id")
    .eq("id", id)
    .eq("college_id", collegeId)
    .single();

  if (!visitor) return { error: "Visitor not found in your college" };

  const { error } = await supabase.from("hostel_visitors").update({
    status: "CHECKED_OUT",
    check_out_time: new Date().toISOString(),
  }).eq("id", id).eq("college_id", collegeId);

  if (error) return { error: "Failed to check out visitor" };
  revalidatePath("/hostel/visitors");
  return { success: true };
}
