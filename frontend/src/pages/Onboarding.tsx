import { useState, useEffect, useCallback } from "react";
import { Plus, MessageSquare, CheckCircle2, Circle, Clock, Loader2, Send, FileText, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { BASE_URL } from "@/config";
import { DataLoader, ErrorState, EmptyState } from "@/components/StateComponents";

export default function Onboarding() {
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/employees/`);
      if (!res.ok) throw new Error("Could not sync employee records for onboarding check");
      const data = await res.json();
      console.log("Onboarding Employees API:", data);
      setEmployees(data);
    } catch (err: any) {
      console.error("Onboarding Sync Error:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMessage("");
    setChatLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/onboarding/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      if (!response.ok) throw new Error("AI Onboarding Buddy is offline");
      const data = await response.json();
      console.log("Onboarding Chat API:", data);
      setChatHistory(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return <DataLoader />;
  if (error) return <ErrorState error={error} retry={fetchData} />;

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader title="Onboarding" subtitle="AI-powered onboarding assistant for new joiners">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="bg-primary/5 hover:bg-primary/10 border-primary/20">
              <MessageSquare className="w-4 h-4 mr-2 text-primary" />
              AI HR Buddy
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-[420px] flex flex-col border-l border-border/50 shadow-2xl p-0">
            <SheetHeader className="p-6 pb-0 border-b border-border/10">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/10">
                    <MessageSquare size={24} />
                 </div>
                 <div>
                    <SheetTitle className="text-xl font-black tracking-tight">ARTH AI Buddy</SheetTitle>
                    <SheetDescription className="text-xs font-bold uppercase tracking-widest text-primary/70">Intelligence v1.0</SheetDescription>
                 </div>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-auto p-6 space-y-6 bg-muted/20">
              {chatHistory.length === 0 && (
                  <div className="h-full flex items-center justify-center text-center p-8">
                     <p className="text-sm text-muted-foreground italic">"Welcome! I am your AI HR Buddy. Ask me about policies, benefits, or your first day."</p>
                  </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-3xl px-5 py-3 text-sm shadow-sm ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card text-foreground rounded-tl-none border border-border/20'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border/20 rounded-3xl rounded-tl-none px-6 py-4 shadow-sm">
                    <div className="flex gap-1.5">
                       <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                       <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce delay-150" />
                       <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce delay-300" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-border/10 bg-card">
              <div className="flex gap-2 p-1 bg-muted/30 rounded-2xl border border-border/20">
                <Input 
                  placeholder="Type a message..." 
                  className="border-0 focus-visible:ring-0 bg-transparent h-10 px-4"
                  value={chatMessage} 
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                />
                <Button size="icon" onClick={handleSendMessage} disabled={chatLoading} className="rounded-xl h-10 w-10">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {employees.length === 0 ? (
          <div className="col-span-3">
            <EmptyState 
                title="No Recent Joiners" 
                message="We haven't detected any new onboarding records recently. Time to hire?"
                icon={UserPlus}
            />
          </div>
        ) : employees.filter(e => e.department).map((joiner) => (
          <Card key={joiner.id} className="relative group overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl">
             <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Active Sync</Badge>
             </div>
            <CardContent className="p-6 pt-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-muted border border-border/50 flex items-center justify-center font-black text-xl text-primary/40 group-hover:bg-primary/5 transition-colors">
                      {joiner.name[0]}
                   </div>
                   <div>
                     <p className="font-bold tracking-tight text-lg">{joiner.name}</p>
                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{joiner.designation}</p>
                   </div>
                </div>
              </div>
              <div className="flex justify-between text-xs font-bold mb-2">
                 <span className="text-muted-foreground">Joining: {joiner.joining_date}</span>
                 <span className="text-primary opacity-80">25% Done</span>
              </div>
              <Progress value={25} className="h-2 rounded-full bg-muted/50" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/10 py-5">
           <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                 <CheckCircle2 className="w-5 h-5 text-success" />
                 Global Onboarding Readiness
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5 transition-colors" onClick={() => toast.info("Knowledge base live at BASE_URL")}>
                 <FileText className="w-4 h-4 mr-2" />
                 Compliance Repo
              </Button>
           </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <div className="flex items-center gap-4 p-4 rounded-2xl border border-success/20 bg-success/5 group hover:bg-success/10 transition-colors cursor-default">
                <div className="p-2.5 bg-success/20 rounded-xl text-success">
                   <CheckCircle2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold tracking-tight">HR Document Sync</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-success/70">Verified · Week 1</p>
                </div>
              </div>
               <div className="flex items-center gap-4 p-4 rounded-2xl border border-warning/20 bg-warning/5 group hover:bg-warning/10 transition-colors cursor-default">
                 <div className="p-2.5 bg-warning/20 rounded-xl text-warning">
                   <Clock size={18} className="animate-spin-slow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold tracking-tight">Culture Orientation</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-warning/70">Scheduled · Day 2</p>
                </div>
              </div>
               <div className="flex items-center gap-4 p-4 rounded-2xl border border-border group hover:bg-muted/10 transition-colors cursor-default">
                <div className="p-2.5 bg-muted rounded-xl text-muted-foreground/60">
                   <Circle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold tracking-tight">Equipment Audit</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">IT Review · Day 3</p>
                </div>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
