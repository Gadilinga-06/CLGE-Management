import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import { redirect } from "next/navigation";
import { Database } from "@/types/database";

export type AuthUser = {
  id: string;
  email?: string;
};

export type UserProfile = Database['public']['Tables']['profiles']['Row'];

export interface AuthorizationContext {
  user: AuthUser;
  profile: UserProfile;
  roles: string[];
  permissions: string[];
}

/**
 * Ensures the user is authenticated, otherwise redirects to login.
 */
export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  return user;
}

/**
 * Gets the current authenticated user without redirecting.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email } : null;
}

/**
 * Gets the current authenticated user's profile from the database.
 */
export async function getCurrentProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  // Use admin client to bypass RLS — profile must be readable before
  // we know the user's role, so RLS cannot be applied here.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

/**
 * Gets the roles assigned to the current user.
 */
export async function getCurrentUserRoles(userId: string): Promise<string[]> {
  // Use admin client — role lookup must bypass RLS (chicken-and-egg problem)
  const admin = createAdminClient();
  const { data: userRoles } = await admin
    .from("user_roles")
    .select("roles ( name )")
    .eq("user_id", userId);

  if (!userRoles) return [];
  
  return userRoles
    // @ts-expect-error Types are not fully resolved from Supabase join
    .map((ur) => ur.roles?.name)
    .filter(Boolean) as string[];
}

/**
 * Gets all unique permissions assigned to the current user through their roles.
 */
export async function getCurrentUserPermissions(userId: string): Promise<string[]> {
  // Use admin client — permissions lookup must bypass RLS
  const admin = createAdminClient();
  
  // 1. Get user roles
  const { data: userRoles } = await admin
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId);

  if (!userRoles || userRoles.length === 0) return [];

  const roleIds = userRoles.map(ur => ur.role_id);

  // 2. Get permissions for those roles
  const { data: rolePermissions } = await admin
    .from("role_permissions")
    .select("permissions ( name )")
    .in("role_id", roleIds);

  if (!rolePermissions) return [];

  // 3. Extract unique permissions
  const permissions = new Set<string>();
  rolePermissions.forEach(rp => {
    // @ts-expect-error Types are not fully resolved from Supabase join
    if (rp.permissions?.name) {
      // @ts-expect-error Types are not fully resolved from Supabase join
      permissions.add(rp.permissions.name);
    }
  });

  return Array.from(permissions);
}

/**
 * Gets the complete authorization context for the current user.
 */
export async function getAuthorizationContext(): Promise<AuthorizationContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) return null; // Inactive accounts are blocked

  const [roles, permissions] = await Promise.all([
    getCurrentUserRoles(user.id),
    getCurrentUserPermissions(user.id)
  ]);

  return {
    user,
    profile,
    roles,
    permissions
  };
}

/**
 * Ensures the user has a specific permission. Redirects if unauthorized.
 */
export async function requirePermission(permission: string) {
  const context = await getAuthorizationContext();
  
  if (!context) {
    redirect("/auth/login");
  }

  if (!context.permissions.includes(permission) && !context.roles.includes('SUPER_ADMIN')) {
    redirect("/unauthorized");
  }

  return context;
}

/**
 * Ensures the user has a specific role. Redirects if unauthorized.
 */
export async function requireRole(role: string) {
  const context = await getAuthorizationContext();
  
  if (!context) {
    redirect("/auth/login");
  }

  if (!context.roles.includes(role) && !context.roles.includes('SUPER_ADMIN')) {
    redirect("/unauthorized");
  }

  return context;
}

/**
 * Validates that the requested college ID matches the user's assigned college.
 * Super Admins bypass this check.
 */
export async function requireCollegeAccess(targetCollegeId: string) {
  const context = await getAuthorizationContext();
  
  if (!context) {
    redirect("/auth/login");
  }

  if (context.roles.includes('SUPER_ADMIN')) {
    return context;
  }

  if (context.profile.college_id !== targetCollegeId) {
    redirect("/unauthorized");
  }

  return context;
}

/**
 * Validates that the user has access to a specific department.
 * (HOD/Faculty level security).
 */
export async function requireDepartmentAccess(targetDepartmentId: string) {
  const context = await getAuthorizationContext();
  
  if (!context) {
    redirect("/auth/login");
  }

  // Super Admins and College Admins bypass department checks
  if (context.roles.includes('SUPER_ADMIN') || context.roles.includes('COLLEGE_ADMIN') || context.roles.includes('PRINCIPAL')) {
    return context;
  }

  const supabase = await createClient();
  
  // Check if they are Faculty in this department
  const { data: faculty } = await supabase
    .from("faculty")
    .select("department_id")
    .eq("user_id", context.user.id)
    .single();

  if (!faculty || faculty.department_id !== targetDepartmentId) {
    redirect("/unauthorized");
  }

  return context;
}
