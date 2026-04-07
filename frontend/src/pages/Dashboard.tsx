import { useState, useEffect, useCallback } from "react";
import { Users, Briefcase, CalendarDays, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BASE_URL } from "@/config";
import { DataLoader, ErrorState } from "@/components/StateComponents";

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel fetching for performance
      const [summaryRes, jobsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/analytics/summary`),
        fetch(`${BASE_URL}/api/recruitment/jobs`)
      ]);

      if (!summaryRes.ok) throw new Error("Could not sync executive summary");
      if (!jobsRes.ok) throw new Error("Could not sync job postings");

      const [summaryJson, jobsJson] = await Promise.all([
        summaryRes.json(),
        jobsRes.json()
      ]);

      console.log("Dashboard - Summary API:", summaryJson);
      console.log("Dashboard - Jobs API:", jobsJson);

      setSummary(summaryJson);
      setJobs(jobsJson);
    } catch (err: any) {
      console.error("Dashboard Sync Error:", err);
      setError(err.message);
      toast.error(`Dashboard Sync Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <DataLoader />;
  if (error) return <ErrorState error={error} retry={fetchData} />;

  const stats = [
    {
      title: "Total Employees",
      value: summary?.headcount ?? 0,
      subtitle: `${Object.keys(summary?.headcount_by_department || {}).length} departments`,
      icon: Users,
    },
    {
      title: "Open Positions",
      value: jobs?.length ?? 0,
      subtitle: "Active job postings",
      icon: Briefcase,
    },
    {
      title: "Leaves Applied",
      value: summary?.total_leaves_applied ?? 0,
      subtitle: "Total records",
      icon: CalendarDays,
    },
    {
      title: "AI Insights",
      value: "Live",
      subtitle: "HR Intelligence active",
      icon: TrendingUp,
    },
  ];

  const departmentData = Object.entries(summary?.headcount_by_department || {}).map(([dept, count]: [string, any]) => ({
    dept,
    count,
    percentage: summary?.headcount ? Math.round((count / summary.headcount) * 100) : 0,
  }));

  return (
    <div className="animate-in fade-in duration-700">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your HR operations"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <StatCard
            key={i}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-primary" />
               AI Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-sm text-foreground leading-relaxed italic">
                    "{summary?.ai_insights_summary || "No insights available at the moment."}"
                </p>
             </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
               <Users className="w-4 h-4 text-primary" />
               Department Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentData.length > 0 ? departmentData.map((d) => (
                <div key={d.dept} className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{d.dept}</span>
                    <span className="text-xs font-bold">{d.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-8">No department data found sync absolute.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
