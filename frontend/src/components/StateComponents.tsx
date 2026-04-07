import { AlertCircle, FileQuestion, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const DataLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 animate-in fade-in duration-500">
    <div className="relative">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <div className="absolute inset-0 w-12 h-12 border-4 border-primary/20 rounded-full" />
    </div>
    <div className="text-center">
      <p className="text-lg font-medium text-foreground">Syncing Intelligence...</p>
      <p className="text-sm text-muted-foreground italic">Fetching the latest workforce data from ARTH Engine</p>
    </div>
  </div>
);

interface ErrorStateProps {
  error: string | null;
  retry: () => void;
}

export const ErrorState = ({ error, retry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center animate-in zoom-in-95 duration-300">
    <Alert variant="destructive" className="max-w-md bg-destructive/5 border-destructive/20">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-base font-semibold">Connection Synchronisation Failed</AlertTitle>
      <AlertDescription className="mt-2 text-sm opacity-90">
        {error || "An unexpected error occurred while communicating with the ARTH Backend."}
      </AlertDescription>
    </Alert>
    <div className="mt-6 space-y-4">
      <p className="text-sm text-muted-foreground">This could be due to a network interruption or server downtime.</p>
      <Button onClick={retry} variant="outline" className="gap-2 hover:bg-destructive/5">
        <RefreshCcw className="w-4 h-4" />
        Retry Synchronisation
      </Button>
    </div>
  </div>
);

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: any;
}

export const EmptyState = ({ title, message, icon: Icon = FileQuestion }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="w-20 h-20 bg-muted/30 rounded-3xl flex items-center justify-center mb-6 border border-border/50 shadow-inner">
      <Icon className="w-10 h-10 text-muted-foreground/50" />
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
      {message}
    </p>
  </div>
);
