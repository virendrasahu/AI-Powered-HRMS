import { useState } from "react";
import { FileText, CreditCard, Download, Loader2, Sparkles, Receipt, ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BASE_URL } from "@/config";
import { EmptyState } from "@/components/StateComponents";

export default function Extra() {
  const [offerData, setOfferData] = useState({
    candidate_name: "",
    role: "",
    salary: "",
    joining_date: ""
  });
  const [loadingOffer, setLoadingOffer] = useState(false);

  const [payrollId, setPayrollId] = useState("");
  const [payrollData, setPayrollData] = useState<any>(null);
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  const handleGenerateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingOffer(true);
    try {
      const response = await fetch(`${BASE_URL}/api/extra/generate-offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offerData)
      });
      if (!response.ok) throw new Error("Could not generate offer PDF via BASE_URL");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${offerData.candidate_name.replace(' ', '_')}_Offer.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Offer Letter Generated Successfully!");
      console.log("Extra - Offer Letter Sync Success");
    } catch (err: any) {
      console.error("Offer Letter Error:", err);
      toast.error(err.message);
    } finally {
      setLoadingOffer(false);
    }
  };

  const handleFetchPayroll = async () => {
    if (!payrollId) return;
    setLoadingPayroll(true);
    setPayrollData(null);
    try {
      const response = await fetch(`${BASE_URL}/api/extra/payroll/${payrollId}?month_year=April 2025`);
      if (!response.ok) throw new Error("Payroll synchronisation failed for this Employee ID");
      const data = await response.json();
      console.log("Extra - Payroll API Response:", data);
      setPayrollData(data);
    } catch (err: any) {
      console.error("Payroll Sync Error:", err);
      toast.error(err.message);
    } finally {
      setLoadingPayroll(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <PageHeader title="Payroll & Documentation" subtitle="Generate offer letters and manage employee payroll summaries" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border/50 shadow-sm group overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/10 py-5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Offer Letter Distribution Console
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleGenerateOffer} className="space-y-6">
              <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Candidate Details</label>
                    <Input 
                        placeholder="Full Legal Name" 
                        className="rounded-xl border-border/40 focus:border-primary/40 bg-muted/20"
                        value={offerData.candidate_name}
                        onChange={e => setOfferData({...offerData, candidate_name: e.target.value})}
                        required
                    />
                  </div>
                  <Input 
                    placeholder="Agreed Designation" 
                    className="rounded-xl border-border/40 focus:border-primary/40 bg-muted/20"
                    value={offerData.role}
                    onChange={e => setOfferData({...offerData, role: e.target.value})}
                    required
                  />
                  <Input 
                    placeholder="Annual Compensation (e.g. $85,000)" 
                    className="rounded-xl border-border/40 focus:border-primary/40 bg-muted/20"
                    value={offerData.salary}
                    onChange={e => setOfferData({...offerData, salary: e.target.value})}
                    required
                  />
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground ml-1">Proposed Joining Date</label>
                    <Input 
                      type="date"
                      className="rounded-xl border-border/40 focus:border-primary/40 bg-muted/20"
                      value={offerData.joining_date}
                      onChange={e => setOfferData({...offerData, joining_date: e.target.value})}
                      required
                    />
                  </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-2xl font-bold tracking-tight shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" disabled={loadingOffer}>
                {loadingOffer ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finalising Document...</> : <><Download className="w-4 h-4 mr-2" /> Generate & Download Offer PDF</>}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-widest opacity-60">PDF Generation via ReportLab Core</p>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-muted/10 border-b border-border/10 py-5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-primary" />
              Real-time Payroll Synchroniser
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 flex-1 space-y-6">
            <div className="flex gap-3 p-1.5 bg-muted/30 rounded-2xl border border-border/20">
              <Input 
                placeholder="Synchronise Employee ID (e.g. 1)" 
                className="border-0 focus-visible:ring-0 bg-transparent h-10 px-4 font-semibold"
                value={payrollId}
                onChange={e => setPayrollId(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleFetchPayroll()}
              />
              <Button onClick={handleFetchPayroll} disabled={loadingPayroll} className="rounded-xl h-10 px-6 font-bold">
                {loadingPayroll ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
              </Button>
            </div>

            {loadingPayroll ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-4 animate-pulse">
                     <div className="p-4 bg-muted/50 rounded-full">
                        <Loader2 className="w-8 h-8 text-primary/40 animate-spin" />
                     </div>
                     <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Analysing Salary Ledger...</p>
                </div>
            ) : payrollData ? (
              <div className="p-6 rounded-3xl border border-primary/20 bg-primary/5 space-y-4 shadow-inner animate-in zoom-in-95 duration-500">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-bold uppercase tracking-widest">Employee Intelligence</span>
                  <span className="font-black text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/10">ID #{payrollData.employee_id}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/10 pb-4">
                  <span className="text-muted-foreground text-sm font-semibold">Accounting Period</span>
                  <span className="font-bold text-foreground text-sm">{payrollData.month_year}</span>
                </div>
                <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-sm items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span className="text-muted-foreground font-medium">Gross Emoluments:</span>
                    </div>
                    <span className="font-bold font-mono tracking-tighter text-lg">${payrollData.base_salary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                    <div className="flex items-center gap-2 text-destructive">
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        <span className="text-muted-foreground font-medium">Statutory Deductions:</span>
                    </div>
                    <span className="font-bold font-mono tracking-tighter text-destructive">-${payrollData.deductions.toLocaleString()}</span>
                    </div>
                </div>
                <div className="h-px bg-primary/10 my-6" />
                <div className="flex justify-between text-lg font-black text-foreground bg-white/50 p-4 rounded-2xl border border-primary/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-primary font-black mb-1">Net Payable Amount</span>
                    <span className="tracking-tighter text-2xl font-black">${payrollData.net_salary.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-2xl flex items-center text-primary">
                     <Sparkles size={24} />
                  </div>
                </div>
              </div>
            ) : (
                <div className="flex-1">
                    <EmptyState 
                        title="Database Standby" 
                        message="Enter a valid Employee ID to synchronise payroll data from the ARTH Engine."
                        icon={Receipt}
                    />
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
