import { NextResponse } from "next/server";
import { db, owner } from "@/lib/server";
import { poll } from "@/lib/provider";
export async function GET() {
  const me = owner(), d = db();
  const { data } = await d.from("jobs").select("*").eq("owner", me).order("created_at", { ascending: false }).limit(100);
  for (const j of data || []) if (j.status === "running") {
    try {
      const p = await poll(j.status_url, j.response_url);
      if (p.status !== "running") { Object.assign(j, { status: p.status, video_url: p.videoUrl, error: p.error });
        await d.from("jobs").update({ status: p.status, video_url: p.videoUrl, error: p.error }).eq("id", j.id); }
    } catch {}
  }
  return NextResponse.json((data || []).map(({ status_url, response_url, owner, ...j }) => j));
}
