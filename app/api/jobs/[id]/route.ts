import { NextResponse } from "next/server";
import { db, owner } from "@/lib/server";
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await db().from("jobs").delete().eq("id", params.id).eq("owner", owner());
  return NextResponse.json({ ok: true });
}
