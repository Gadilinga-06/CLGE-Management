/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { registerMember, deactivateMember } from "../actions";
import { Users, UserPlus, Search, UserMinus } from "lucide-react";

export function MembersClient({ members, profiles }: { members: any[]; profiles: any[] }) {
  const [search, setSearch] = useState("");
  const [registerDialog, setRegisterDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const result = await registerMember(fd.get("user_id") as string, fd.get("member_type") as string);
    if (result?.error) toast.error(result.error);
    else { toast.success("Member registered!"); setRegisterDialog(false); }
    setIsSubmitting(false);
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Deactivate member "${name}"? They must return all books first.`)) return;
    const result = await deactivateMember(id);
    if (result?.error) toast.error(result.error);
    else toast.success("Member deactivated.");
  };

  const filtered = members.filter(m => {
    if (!search) return true;
    const name = `${m.profiles?.first_name} ${m.profiles?.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || m.profiles?.email?.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-sm flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setRegisterDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Register Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Library Members ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Books Limit</TableHead>
                <TableHead className="text-center">Issued</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(m => {
                const issued = (m.library_transactions || []).filter((t: any) => t.status === "ISSUED" || t.status === "OVERDUE").length;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={m.profiles?.avatar_url} />
                          <AvatarFallback className="text-xs">{m.profiles?.first_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{m.profiles?.first_name} {m.profiles?.last_name}</div>
                          <div className="text-xs text-muted-foreground">{m.profiles?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{m.member_type}</Badge></TableCell>
                    <TableCell className="text-center">{m.max_books}</TableCell>
                    <TableCell className="text-center">
                      <span className={issued > 0 ? "font-semibold text-blue-600" : "text-muted-foreground"}>{issued}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.status === "ACTIVE" ? "default" : "secondary"} className={m.status === "ACTIVE" ? "bg-green-500" : ""}>{m.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {m.status === "ACTIVE" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                          onClick={() => handleDeactivate(m.id, `${m.profiles?.first_name} ${m.profiles?.last_name}`)}
                        >
                          <UserMinus className="w-3 h-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No members found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Register Dialog */}
      <Dialog open={registerDialog} onOpenChange={setRegisterDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Register Library Member</DialogTitle></DialogHeader>
          <form onSubmit={handleRegister}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>User</Label>
                <Select name="user_id" required>
                  <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name} ({p.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Member Type</Label>
                <Select name="member_type" required>
                  <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student (3 books)</SelectItem>
                    <SelectItem value="FACULTY">Faculty (5 books)</SelectItem>
                    <SelectItem value="STAFF">Staff (2 books)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRegisterDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Register</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
