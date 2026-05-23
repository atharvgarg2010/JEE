"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { McqOption } from "@/types/questions";

interface OptionsEditorProps {
  options: McqOption[];
  correctAnswer: string;
  onChange: (options: McqOption[]) => void;
  onCorrectChange: (id: string) => void;
  error?: string;
}

function newOptionId() {
  return `opt_${crypto.randomUUID().slice(0, 8)}`;
}

export function OptionsEditor({
  options,
  correctAnswer,
  onChange,
  onCorrectChange,
  error,
}: OptionsEditorProps) {
  function updateOption(id: string, text: string) {
    onChange(options.map((o) => (o.id === id ? { ...o, text } : o)));
  }

  function removeOption(id: string) {
    const next = options.filter((o) => o.id !== id);
    onChange(next);
    if (correctAnswer === id && next[0]) onCorrectChange(next[0].id);
  }

  function addOption() {
    const id = newOptionId();
    onChange([...options, { id, text: "" }]);
  }

  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <div
          key={option.id}
          className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3"
        >
          <label className="mt-2.5 flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="correctOption"
              checked={correctAnswer === option.id}
              onChange={() => onCorrectChange(option.id)}
              className="accent-violet-500"
            />
            <span className="text-xs font-medium text-zinc-500">
              {String.fromCharCode(65 + index)}
            </span>
          </label>
          <Input
            value={option.text}
            onChange={(e) => updateOption(option.id, e.target.value)}
            placeholder={`Option ${String.fromCharCode(65 + index)}`}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeOption(option.id)}
            disabled={options.length <= 2}
            className="text-zinc-500 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={addOption}>
        <Plus className="h-4 w-4" />
        Add option
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-xs text-zinc-500">
        Select the radio button next to the correct option.
      </p>
    </div>
  );
}

export function defaultMcqOptions(): McqOption[] {
  return [
    { id: newOptionId(), text: "" },
    { id: newOptionId(), text: "" },
    { id: newOptionId(), text: "" },
    { id: newOptionId(), text: "" },
  ];
}
