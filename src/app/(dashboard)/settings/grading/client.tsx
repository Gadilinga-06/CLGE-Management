/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addGradingRule, deleteGradingRule } from "../../exams/actions";
import { toast } from "sonner";
import { Trash2, AlertCircle } from "lucide-react";

export function GradingClient({ initialRules }: { initialRules: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddRule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // basic val
    const min = parseFloat(formData.get("min_percentage") as string);
    const max = parseFloat(formData.get("max_percentage") as string);
    if (min >= max) {
      toast.error("Min percentage must be less than Max percentage.");
      setIsSubmitting(false);
      return;
    }

    const result = await addGradingRule(formData);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Grade added successfully");
      (e.target as HTMLFormElement).reset();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this grade rule?")) return;
    const result = await deleteGradingRule(id);
    if (result?.error) toast.error(result.error);
    else toast.success("Removed");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Add Grade</CardTitle>
          <CardDescription>e.g. A+, 10.0, 90-100</CardDescription>
        </CardHeader>
        <form onSubmit={handleAddRule}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Grade Letter</Label>
              <Input name="grade" placeholder="A+" required maxLength={5} />
            </div>
            <div className="space-y-2">
              <Label>Grade Point</Label>
              <Input name="grade_point" type="number" step="0.01" placeholder="10.0" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min %</Label>
                <Input name="min_percentage" type="number" step="0.01" placeholder="90" required />
              </div>
              <div className="space-y-2">
                <Label>Max %</Label>
                <Input name="max_percentage" type="number" step="0.01" placeholder="100" required />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>Add Rule</Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Current Grade Scale</CardTitle>
        </CardHeader>
        <CardContent>
          {initialRules.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground border rounded bg-muted/20">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No grading rules configured. Add rules to enable SGPA calculations.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Point</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialRules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-bold text-lg">{rule.grade}</TableCell>
                    <TableCell className="font-mono">{rule.grade_point.toFixed(2)}</TableCell>
                    <TableCell>{rule.min_percentage}% - {rule.max_percentage}%</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
