"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  loading: boolean;
  children: React.ReactNode;
}

export function SubmitButton({ loading, children }: SubmitButtonProps) {
  return (
    <Button type="submit" className="w-full" size="lg" disabled={loading}>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
