import { OfflineModuleDoubtsPanel } from "@/components/dashboard/offline-module-doubts-panel";

export const metadata = {
  title: "Module Doubts | JEE Tracker",
  description: "Review and resolve student module doubt notifications",
};

export default function TeacherModuleDoubtsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Module Doubts</h1>
        <p className="mt-0.5 text-sm text-zinc-400">
          Student notifications from offline module tracking
        </p>
      </div>
      <OfflineModuleDoubtsPanel />
    </div>
  );
}
