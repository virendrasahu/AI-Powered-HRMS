import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Sparkles, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { BASE_URL } from "@/config";
import { DataLoader, ErrorState, EmptyState } from "@/components/StateComponents";

const stages = ["Applied", "Screening", "Interview", "Offer", "Hired"];

const stageColors: Record<string, string> = {
  Applied: "bg-muted",
  Screening: "bg-info/10 text-info",
  Interview: "bg-warning/10 text-warning",
  Offer: "bg-primary/10 text-primary",
  Hired: "bg-success/10 text-success",
};

export default function Recruitment() {
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    role: "",
    description: "",
    skills_required: "",
    experience: ""
  });

  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingJob, setCreatingJob] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsRes, candidatesRes] = await Promise.all([
        fetch(`${BASE_URL}/api/recruitment/jobs`),
        fetch(`${BASE_URL}/api/recruitment/candidates`)
      ]);

      if (!jobsRes.ok) throw new Error("Could not sync job postings");
      if (!candidatesRes.ok) throw new Error("Could not sync candidate pipeline");

      const [jobsData, candidatesData] = await Promise.all([
        jobsRes.json(),
        candidatesRes.json()
      ]);

      console.log("Recruitment Jobs API:", jobsData);
      console.log("Recruitment Candidates API:", candidatesData);

      setJobs(jobsData);
      setCandidates(candidatesData);
    } catch (err: any) {
      console.error("Recruitment Sync Error:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingJob(true);
    try {
      const res = await fetch(`${BASE_URL}/api/recruitment/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob)
      });
      if (!res.ok) throw new Error("Failed to post job");
      toast.success("Job posting live on career portal!");
      setIsJobDialogOpen(false);
      fetchData();
      setNewJob({ role: "", description: "", skills_required: "", experience: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingJob(false);
    }
  };

  const getPipelineCount = (jobId: number, stage: string) => {
    return candidates?.filter(c => c.job_id === jobId && c.stage === stage).length || 0;
  };

  if (loading) return <DataLoader />;
  if (error) return <ErrorState error={error} retry={fetchData} />;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader title="Recruitment & ATS" subtitle="Manage job postings and track candidates through the hiring pipeline">
        <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Job Posting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Job Posting</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateJob} className="space-y-4 py-4">
               <Input 
                  placeholder="Job Role (e.g. Sr. Backend Engineer)" 
                  value={newJob.role}
                  onChange={e => setNewJob({...newJob, role: e.target.value})}
                  required
                />
                <Input 
                  placeholder="Experience Required (e.g. 5+ years)" 
                  value={newJob.experience}
                  onChange={e => setNewJob({...newJob, experience: e.target.value})}
                  required
                />
                <Input 
                  placeholder="Skills (e.g. Python, FastAPI, Docker)" 
                  value={newJob.skills_required}
                  onChange={e => setNewJob({...newJob, skills_required: e.target.value})}
                  required
                />
                <textarea 
                  className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Job Description"
                  value={newJob.description}
                  onChange={e => setNewJob({...newJob, description: e.target.value})}
                  required
                />
                <DialogFooter>
                  <Button type="submit" disabled={creatingJob} className="w-full">
                    {creatingJob ? "Creating..." : "Post Job Opening"}
                  </Button>
                </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search job postings..." className="pl-9" />
        </div>
        <Button variant="outline" size="sm">
          <Sparkles className="w-4 h-4 mr-2 text-primary" />
          AI Resume Screening
        </Button>
      </div>

      <div className="grid gap-6">
        {jobs.length === 0 ? (
          <EmptyState 
            title="No Active Job Postings" 
            message="Your job board is currently empty. Start by creating a new posting to find top talent!"
            icon={Briefcase}
          />
        ) : jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden group">
            <CardHeader className="pb-3 border-b border-border/10 bg-muted/20">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{job.role}</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">
                    {job.experience} · {candidates?.filter(c => c.job_id === job.id).length || 0} applicants synced
                  </p>
                </div>
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  Active Hiring
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                {stages.map((stage) => {
                  const count = getPipelineCount(job.id, stage);
                  return (
                    <div key={stage} className="flex-1">
                      <div className={`rounded-xl px-2 py-3 text-center border border-border/20 transition-all hover:scale-105 ${stageColors[stage]}`}>
                        <p className="text-xl font-black tracking-tight">{count}</p>
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">{stage}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
