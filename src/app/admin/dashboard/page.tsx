import { Shield, Database, Settings } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard | JEE Tracker",
};

export default function AdminDashboardPage() {
  const cards = [
    { label: "Users", value: "Manage", icon: Database },
    { label: "Security", value: "Active", icon: Shield },
    { label: "Platform", value: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin dashboard</h1>
        <p className="mt-2 text-zinc-400">
          Platform administration and user management.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5"
          >
            <Icon className="mb-3 h-5 w-5 text-violet-400" />
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              {label}
            </p>
            <p className="mt-1 text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-zinc-500">
        Admin accounts are created via database seeding. See README for setup.
      </p>
    </div>
  );
}
