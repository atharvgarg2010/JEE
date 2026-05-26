"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewBatchPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          code: form.code.toUpperCase(),
          description: form.description || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create batch");
        return;
      }

      router.push(`/admin/batches/${data.batch.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link
          href="/admin/batches"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" /> Batches
        </Link>
        <h1 className="text-2xl font-bold text-white">Create New Batch</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Add a new teaching batch. Students can be enrolled during signup or moved by admin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 space-y-4">
          <div>
            <label htmlFor="batch-name" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Batch Name <span className="text-red-400">*</span>
            </label>
            <input
              id="batch-name"
              required
              type="text"
              placeholder="e.g. JEE Advanced 2026 — Alpha"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500/60 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="batch-code" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Batch Code <span className="text-red-400">*</span>
            </label>
            <input
              id="batch-code"
              required
              type="text"
              placeholder="e.g. ALPHA2026"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 font-mono text-sm text-white placeholder-zinc-500 focus:border-violet-500/60 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-zinc-600">
              Students use this code during signup. Alphanumeric only. Auto-uppercased.
            </p>
          </div>

          <div>
            <label htmlFor="batch-desc" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Description <span className="text-zinc-600">(optional)</span>
            </label>
            <textarea
              id="batch-desc"
              rows={3}
              placeholder="Brief description of this batch…"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500/60 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/admin/batches"
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-5 py-2.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !form.name.trim() || !form.code.trim()}
            className="flex-1 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Batch"}
          </button>
        </div>
      </form>
    </div>
  );
}
