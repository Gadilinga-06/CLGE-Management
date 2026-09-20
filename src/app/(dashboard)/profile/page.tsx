import { getAuthorizationContext } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Shield, Building2 } from "lucide-react";

export default async function ProfilePage() {
  const context = await getAuthorizationContext();

  if (!context) {
    return null;
  }

  const { profile, roles } = context;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Profile</h2>
        <p className="text-muted-foreground">
          View your account details and assigned roles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your basic account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <User className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Full Name</p>
              <p className="text-sm text-muted-foreground">
                {profile.first_name} {profile.last_name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email Address</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">College ID</p>
              <p className="text-sm text-muted-foreground font-mono">{profile.college_id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Roles</CardTitle>
          <CardDescription>Roles assigned to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              {roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <div 
                      key={role} 
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80"
                    >
                      {role.replace("_", " ")}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No roles assigned.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
