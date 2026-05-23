import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.ComponentProps<typeof Input> {
  label: string;
  error?: string;
  hint?: string;
}

export function FormField({
  label,
  error,
  hint,
  className,
  id,
  ...props
}: FormFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        className={cn(error && "border-red-500/60 focus-visible:ring-red-500/40", className)}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-zinc-500">{hint}</p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
