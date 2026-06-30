import { db } from "@/lib/db";

/** Fetch the currently-active legal document of a type (Skill 40). */
export async function getActiveDocument(type: string) {
  return db.legalDocument.findFirst({
    where: { type, isActive: true },
    orderBy: { publishedAt: "desc" },
  });
}
