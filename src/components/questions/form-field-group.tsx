import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldGroupProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormFieldGroup({
  label,
  error,
  hint,
  children,
  className,
}: FormFieldGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
