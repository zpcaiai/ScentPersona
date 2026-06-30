import { NextResponse } from "next/server";
import { getActiveDocument } from "@/lib/legal/getActiveDocument";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const doc = await getActiveDocument(params.slug);
  return NextResponse.json(doc ? { title: doc.title, version: doc.version, content: doc.content, publishedAt: doc.publishedAt } : { title: null, content: null });
}
