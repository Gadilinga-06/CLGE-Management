import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateCollege } from "./actions";

export default async function CollegeProfilePage() {
  const context = await getAuthorizationContext();
  if (!context) redirect("/auth/login");

  if (!context.permissions.includes("settings.manage") && !context.roles.includes("SUPER_ADMIN")) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();
  const { data: college } = await supabase
    .from("colleges")
    .select("*")
    .eq("id", context.profile.college_id)
    .single();

  if (!college) return <div>College not found.</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">College Profile</h2>
        <p className="text-muted-foreground">Manage global college information and settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>Update your institution&apos;s public profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async (formData) => {
            "use server";
            await updateCollege(formData);
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">College Name</Label>
                <Input id="name" name="name" defaultValue={college.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">College Code</Label>
                <Input id="code" name="code" defaultValue={college.code} disabled />
                <p className="text-xs text-muted-foreground">College code cannot be changed.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={college.email || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={college.phone || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" type="url" defaultValue={college.website || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliation">Affiliation</Label>
                <Input id="affiliation" name="affiliation" defaultValue={college.affiliation || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accreditation">Accreditation</Label>
                <Input id="accreditation" name="accreditation" defaultValue={college.accreditation || ""} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" defaultValue={college.address || ""} />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
