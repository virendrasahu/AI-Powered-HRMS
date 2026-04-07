import { useState, useEffect, useCallback } from "react";
import { Plus, CalendarDays, AlertTriangle, Check, X, User } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BASE_URL } from "@/config";
import { DataLoader, ErrorState, EmptyState } from "@/components/StateComponents";

const statusStyles: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};

export default function Leave() {
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({
    employee_id: 1, 
    leave_type: "Casual",
    start_date: "",
    end_date: "",
    reason: ""
  });

  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/leave/`);
      if (!response.ok) throw new Error("Failed to sync leave & attendance records");
      const data = await response.json();
      console.log("Leave API:", data);
      setLeaves(data);
    } catch (err: any) {
      console.error("Fetch Leaves Error:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    try {
      const response = await fetch(`${BASE_URL}/api/leave/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLeave)
      });
      if (!response.ok) throw new Error("Could not submit leave application");
      toast.success("Leave application submitted for approval!");
      setIsApplyDialogOpen(false);
      fetchLeaves();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setApplying(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/leave/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("Action failed");
      toast.success(`Leave request ${status.toLowerCase()}`);
      fetchLeaves();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <DataLoader />;
  if (error) return <ErrorState error={error} retry={fetchLeaves} />;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader title="Leave & Attendance" subtitle="Manage leaves, attendance, and team calendar">
        <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Apply Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleApply} className="space-y-4 py-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input type="date" value={newLeave.start_date} onChange={e => setNewLeave({...newLeave, start_date: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input type="date" value={newLeave.end_date} onChange={e => setNewLeave({...newLeave, end_date: e.target.value})} required />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium">Leave Type</label>
                  <select 
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newLeave.leave_type}
                    onChange={e => setNewLeave({...newLeave, leave_type: e.target.value})}
                  >
                    <option>Casual</option>
                    <option>Sick</option>
                    <option>Earned</option>
                    <option>WFH</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium">Reason</label>
                  <textarea 
                    className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                    placeholder="Briefly explain the reason..."
                    value={newLeave.reason}
                    onChange={e => setNewLeave({...newLeave, reason: e.target.value})}
                    required
                  />
               </div>
               <DialogFooter>
                  <Button type="submit" disabled={applying} className="w-full">
                    {applying ? "Submitting Request..." : "Apply"}
                  </Button>
               </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-primary/5 border-primary/20 hover:shadow-md transition-all">
            <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/10">
                    <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Annual Quota</p>
                   <p className="text-2xl font-black">20 Days</p>
                </div>
            </CardContent>
          </Card>
           <Card className="bg-success/5 border-success/20 hover:shadow-md transition-all">
            <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-2xl text-success border border-success/10">
                    <Check className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Used Leaves</p>
                   <p className="text-2xl font-black">{leaves?.filter(l => l.status === "Approved").length || 0}</p>
                </div>
            </CardContent>
          </Card>
           <Card className="bg-warning/5 border-warning/20 hover:shadow-md transition-all">
            <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-2xl text-warning border border-warning/10">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                   <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Pending Action</p>
                   <p className="text-2xl font-black">{leaves?.filter(l => l.status === "Pending").length || 0}</p>
                </div>
            </CardContent>
          </Card>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-4 h-auto">
          <TabsTrigger value="requests" className="px-6 py-2 pb-2.5">Leave Requests</TabsTrigger>
          <TabsTrigger value="attendance" className="px-6 py-2 pb-2.5">Attendance Tracker</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-0">
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            {leaves.length === 0 ? (
                <EmptyState 
                    title="No Leave Requests Found" 
                    message="The team hasn't synchronized any leave applications yet. Absolute fetch sync completed."
                    icon={CalendarDays}
                />
            ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-bold">Team Member</TableHead>
                      <TableHead className="font-bold">Category</TableHead>
                      <TableHead className="font-bold">Duration</TableHead>
                      <TableHead className="font-bold">Reason</TableHead>
                      <TableHead className="font-bold text-center">Status</TableHead>
                      <TableHead className="text-right font-bold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.map((lr) => (
                      <TableRow key={lr.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-semibold text-sm flex items-center gap-2">
                           <User className="w-4 h-4 text-primary opacity-70" />
                           Emp #{lr.employee_id}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{lr.leave_type}</TableCell>
                        <TableCell className="text-xs font-semibold text-muted-foreground">
                          {lr.start_date} <span className="mx-1 opacity-50">→</span> {lr.end_date}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[200px] italic">"{lr.reason}"</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={`border-0 font-bold ${statusStyles[lr.status] || "bg-muted"}`}>
                            {lr.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                           {lr.status === "Pending" && (
                             <>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:bg-success/20 rounded-full" onClick={() => updateStatus(lr.id, "Approved")}>
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/20 rounded-full" onClick={() => updateStatus(lr.id, "Rejected")}>
                                    <X className="w-4 h-4" />
                                </Button>
                             </>
                           )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-0">
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
                <EmptyState 
                    title="Attendance System Standby" 
                    message="Daily attendance logs will be visualised here after next DB flush. Absolute paths active."
                    icon={Check}
                />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
