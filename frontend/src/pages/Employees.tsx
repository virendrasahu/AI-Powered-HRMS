import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Download, Filter, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { BASE_URL } from "@/config";
import { DataLoader, ErrorState, EmptyState } from "@/components/StateComponents";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedDesignation, setSelectedDesignation] = useState("all");
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    designation: "",
    department: "",
    joining_date: "",
    contact: "",
    skills: "",
    manager: ""
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/employees/`);
      if (!response.ok) throw new Error("Failed to sync employee records");
      const data = await response.json();
      console.log("Employees API:", data);
      setEmployees(data);
    } catch (err: any) {
      console.error("Fetch Employees Error:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const response = await fetch(`${BASE_URL}/api/employees/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmployee)
      });

      const data = await response.json();
      console.log("POST Response:", data);

      if (!response.ok) {
        throw new Error(data.detail || "Validation Error: Duplicate detected");
      }

      toast.success("Employee onboarded successfully!");
      setIsAddDialogOpen(false);
      fetchEmployees(); // 🔥 refresh table
      
      setNewEmployee({
        name: "",
        designation: "",
        department: "",
        joining_date: "",
        contact: "",
        skills: "",
        manager: ""
      });
    } catch (err: any) {
      console.error("POST Error:", err);
      toast.error(err.message);
    } finally {
      setAdding(false); // 🔥 ALWAYS here
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      const response = await fetch(`${BASE_URL}/api/employees/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Deactivation failed");
      toast.success("Employee record removed");
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await fetch(`${BASE_URL}/api/employees/export/csv`);
      if (!response.ok) throw new Error("Failed to export CSV");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "employees_export.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV downloaded successfully");
    } catch (err: any) {
      toast.error(err.message || "CSV export failed");
    } finally {
      setExporting(false);
    }
  };

  const filteredEmployees = employees?.filter(emp => 
    (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedDepartment === "all" || emp.department === selectedDepartment) &&
    (selectedDesignation === "all" || emp.designation === selectedDesignation)
  ) || [];

  const departmentOptions = Array.from(
    new Set(employees.map((emp) => emp.department).filter(Boolean))
  ).sort();
  const designationOptions = Array.from(
    new Set(employees.map((emp) => emp.designation).filter(Boolean))
  ).sort();
  const activeFiltersCount =
    (selectedDepartment !== "all" ? 1 : 0) +
    (selectedDesignation !== "all" ? 1 : 0);

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader title="Employee Directory" subtitle="Manage and view all employee records">
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exporting}>
          <Download className="w-4 h-4 mr-2" />
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Input 
                  placeholder="Full Name" 
                  value={newEmployee.name}
                  onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                  required
                />
                <Input 
                  placeholder="Designation" 
                  value={newEmployee.designation}
                  onChange={e => setNewEmployee({...newEmployee, designation: e.target.value})}
                  required
                />
                <Input 
                  placeholder="Department" 
                  value={newEmployee.department}
                  onChange={e => setNewEmployee({...newEmployee, department: e.target.value})}
                  required
                />
                 <Input 
                  type="date"
                  placeholder="Joining Date" 
                  value={newEmployee.joining_date}
                  onChange={e => setNewEmployee({...newEmployee, joining_date: e.target.value})}
                  required
                />
                 <Input 
                  placeholder="Contact (Email/Phone)" 
                  value={newEmployee.contact}
                  onChange={e => setNewEmployee({...newEmployee, contact: e.target.value})}
                  required
                />
                 <Input 
                  placeholder="Skills (comma separated)" 
                  value={newEmployee.skills}
                  onChange={e => setNewEmployee({...newEmployee, skills: e.target.value})}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={adding}>
                  {adding ? "Adding..." : "Save Employee"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, department, designation..." 
            className="pl-9" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              {activeFiltersCount > 0 ? `Filters (${activeFiltersCount})` : "Filters"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Filter Employees</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Department</label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Designation</label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedDesignation}
                  onChange={(e) => setSelectedDesignation(e.target.value)}
                >
                  <option value="all">All Designations</option>
                  {designationOptions.map((designation) => (
                    <option key={designation} value={designation}>
                      {designation}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedDepartment("all");
                  setSelectedDesignation("all");
                }}
              >
                Clear Filters
              </Button>
              <Button type="button" onClick={() => setIsFilterDialogOpen(false)}>
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {loading ? (
          <DataLoader />
        ) : error ? (
          <ErrorState error={error} retry={fetchEmployees} />
        ) : filteredEmployees.length === 0 ? (
          <EmptyState 
            title="No Employees Found" 
            message={searchTerm ? `No results match your search: "${searchTerm}"` : "You haven't onboarded any employees yet. Start by adding one!"}
            icon={Users}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {emp.name.split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.contact}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{emp.department}</TableCell>
                  <TableCell className="text-sm">{emp.designation}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{emp.joining_date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
