"use client";

import { useState, useEffect } from "react";
import { Users, GraduationCap, Search } from "lucide-react";
import Link from "next/link";

interface UserRow {
  id: string;
  full_name: string | null;
  username: string;
  roll_number: string | null;
  batch_code: string | null;
  role: string;
  subject: string | null;
  teacher_code: string | null;
  experience: string | null;
  created_at: string;
  batch_id: string | null;
  batch_name: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"student" | "teacher">("student");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/users?role=${tab}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.full_name?.toLowerCase().includes(q) ?? false) ||
      u.username.toLowerCase().includes(q) ||
      (u.roll_number?.toLowerCase().includes(q) ?? false) ||
      (u.batch_code?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Users</h1>
        <p className="mt-1 text-zinc-400">
          {users.length} {tab}s registered
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1 w-fit">
        {(["student", "teacher"] as const).map((role) => (
          <button
            key={role}
            onClick={() => { setTab(role); setSearch(""); }}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              tab === role
                ? "bg-violet-600 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {role === "student" ? <GraduationCap className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            {role.charAt(0).toUpperCase() + role.slice(1)}s
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          id="user-search"
          type="text"
          placeholder={`Search ${tab}s…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-800/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-zinc-700" />
          <p className="text-zinc-400">No {tab}s found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/80">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Name</th>
                {tab === "student" ? (
                  <>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Roll No.</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Batch</th>
                  </>
                ) : (
                  <>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Subject</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Code</th>
                  </>
                )}
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {filtered.map((u) => {
                const isStudent = tab === "student";
                return (
                  <tr
                    key={u.id}
                    className={`transition-colors hover:bg-zinc-800/30 ${isStudent ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (isStudent) {
                        window.location.href = `/admin/users/${u.id}`;
                      }
                    }}
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{u.full_name ?? u.username}</p>
                      <p className="text-xs text-zinc-500">@{u.username}</p>
                    </td>
                    {isStudent ? (
                      <>
                        <td className="px-5 py-3 font-mono text-xs text-zinc-400">{u.roll_number ?? "—"}</td>
                        <td className="px-5 py-3">
                          {u.batch_name ? (
                            <Link
                              href={`/admin/batches/${u.batch_id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300 hover:bg-violet-500/25 transition-colors"
                            >
                              {u.batch_name}
                            </Link>
                          ) : (
                            <span className="text-xs text-zinc-600">Not enrolled</span>
                          )}
                        </td>
                      </>
                    ) : (
                    <>
                      <td className="px-5 py-3">
                        {u.subject ? (
                          <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-xs font-medium text-cyan-300">
                            {u.subject}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-zinc-400">{u.teacher_code ?? "—"}</td>
                    </>
                  )}
                  <td className="px-5 py-3 text-xs text-zinc-500">
                    {new Date(u.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
