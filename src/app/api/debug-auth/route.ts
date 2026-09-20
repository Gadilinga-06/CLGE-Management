import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: userRoles, error: rolesError } = await admin
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id);

  return NextResponse.json({
    auth_user: { id: user.id, email: user.email },
    profile,
    profileError: profileError?.message,
    userRoles,
    rolesError: rolesError?.message,
  });
}
