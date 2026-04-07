import { useState, useEffect, useCallback } from "react";
import { Plus, Sparkles, FileDown, User, Target, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

export default function Performance() {
  const [isCycleDialogOpen, setIsCycleDialogOpen] = useState(false);
  const [newCycle, setNewCycle] = useState({
    title: "",
    period: "",
    deadline: ""
  });

  const [cycles, setCycles] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingCycle, setCreatingCycle] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cyclesRes, reviewsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/performance/cycles`),
        fetch(`${BASE_URL}/api/performance/reviews`)
      ]);

      if (!cyclesRes.ok) throw new Error("Could not sync performance appraisal cycles");
      if (!reviewsRes.ok) throw new Error("Could not sync employee review data");

      const [cyclesData, reviewsData] = await Promise.all([
        cyclesRes.json(),
        reviewsRes.json()
      ]);

      console.log("Performance Cycles API:", cyclesData);
      console.log("Performance Reviews API:", reviewsData);

      setCycles(cyclesData);
      setReviews(reviewsData);
    } catch (err: any) {
      console.error("Performance Sync Error:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCycle(true);
    try {
      const payload = {
        // Backend expects: name, start_date, end_date
        name: newCycle.title,
        start_date: newCycle.deadline,
        end_date: newCycle.deadline,
      };
      const res = await fetch(`${BASE_URL}/api/performance/cycles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to initialize review cycle");
      toast.success("Annual performance cycle launched successfully!");
      setIsCycleDialogOpen(false);
      fetchData();
      setNewCycle({ title: "", period: "", deadline: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingCycle(false);
    }
  };

  if (loading) return <DataLoader />;
  if (error) return <ErrorState error={error} retry={fetchData} />;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader title="Performance Reviews" subtitle="AI-assisted performance review cycles and evaluations">
        <Button variant="outline" size="sm" className="hover:bg-primary/5 transition-colors">
          <FileDown className="w-4 h-4 mr-2" />
          Export Appraisal PDF
        </Button>
        <Dialog open={isCycleDialogOpen} onOpenChange={setIsCycleDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="group">
              <Plus className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
              Start Review Cycle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Launch New Appraisal Cycle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCycle} className="space-y-4 py-4">
               <Input 
                  placeholder="Cycle Title (e.g. Annual Appraisal 2025)" 
                  value={newCycle.title}
                  onChange={e => setNewCycle({...newCycle, title: e.target.value})}
                  required
                />
                <Input 
                  placeholder="Period (e.g. Q1 - Q4)" 
                  value={newCycle.period}
                  onChange={e => setNewCycle({...newCycle, period: e.target.value})}
                  required
                />
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Submission Deadline</label>
                  <Input 
                    type="date"
                    value={newCycle.deadline}
                    onChange={e => setNewCycle({...newCycle, deadline: e.target.value})}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creatingCycle} className="w-full">
                    {creatingCycle ? "Launching..." : "Initialise AI Review Cycle"}
                  </Button>
                </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 mb-8">
        {cycles.length === 0 ? (
          <EmptyState 
            title="No Active Cycles" 
            message="There are no ongoing performance appraisal cycles. Launch one to start gathering feedback."
            icon={Target}
          />
        ) : cycles.map((cycle) => (
          <Card key={cycle.id} className="border-border/50 hover:border-primary/30 transition-all group overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Target className="w-5 h-5" />
                   </div>
                   <div>
                      <h3 className="font-bold tracking-tight">{cycle.title} ({cycle.period})</h3>
                      <Badge variant="secondary" className="bg-success/10 text-success border-0 px-2 h-5 text-[10px] uppercase font-bold mt-0.5 tracking-tighter">Live appraisal</Badge>
                   </div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border border-border/10">Due: {cycle.deadline}</span>
              </div>
              <div className="flex items-center gap-4">
                <Progress value={45} className="flex-1 h-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">45% Completion Sync</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-card border-b border-border/20 py-4 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-primary" />
               Workforce Performance Analytics
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/20">
            {reviews.length === 0 ? (
                <EmptyState 
                    title="No Performance Data" 
                    message="Individual performance review summaries will appear here after sync absolute completed."
                    icon={Sparkles}
                />
            ) : reviews.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 p-5 hover:bg-muted/30 transition-all group cursor-pointer"
                onClick={() => toast.info(`Accessing Review Analysis #${r.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                     <div className="p-1.5 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors">
                        <User className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                     </div>
                     <p className="text-sm font-bold tracking-tight text-foreground">Employee Record #{r.employee_id}</p>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1.5">
                       <div className="w-2 h-2 rounded-full bg-primary" />
                       <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                         Self Score: <span className="text-foreground">{r.self_rating ?? "—"}</span> / 5
                       </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <div className="w-2 h-2 rounded-full bg-info" />
                       <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                         Manager Score: <span className="text-foreground">{r.manager_rating ?? "—"}</span> / 5
                       </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {r.ai_perf_summary && (
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold px-3 py-1.5 h-auto transition-transform hover:scale-105">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                        AI Summary
                    </Badge>
                    )}
                    
                    {r.ai_rating_mismatch && (
                    <Badge variant="secondary" className="bg-destructive/10 text-destructive border-0 font-black px-3 py-1.5 h-auto animate-bounce">
                        Mismatch Detected
                    </Badge>
                    )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
