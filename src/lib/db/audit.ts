import { getPool } from "@/lib/db/postgres";

export async function logAuditAction(input: {
  actorId: string;
  actorRole: "student" | "teacher" | "admin";
  action: string;
  entityType?: string;
  entityId?: string; // Must be UUID
  metadata?: Record<string, unknown>;
}) {
  const pool = getPool();
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        input.actorId,
        input.actorRole,
        input.action,
        input.entityType || null,
        input.entityId || null,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ]
    );
  } catch (error) {
    // We log it but do not throw, to avoid failing the main transaction
    // just because audit logging failed.
    console.error("[Audit Log Failed]", error);
  }
}
