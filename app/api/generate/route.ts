import { NextResponse } from "next/server";
import { db, owner } from "@/lib/server";
import { submit } from "@/lib/provider";
const MAX = 10 * 1024 * 1024;
function sniff(b: Buffer) { // validate real file type from magic bytes, not the client's claim
  if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
  if (b.subarray(1, 4).toString() === "PNG") return "image/png";
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}
export async function POST(req: Request) {
  const me = owner(), f = await req.formData(), file = f.get("image") as File | null;
  const prompt = String(f.get("prompt") || "").trim().slice(0, 1500);
  if (!file) return NextResponse.json({ error: "Upload an image first." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Image is over 10 MB." }, { status: 400 });
  if (!prompt) return NextResponse.json({ error: "Describe how the image should move." }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer()), mime = sniff(buf);
  if (!mime) return NextResponse.json({ error: "Only JPG, PNG or WEBP images are supported." }, { status: 400 });
  const duration = Number(f.get("duration")) === 10 ? 10 : 5;
  const aspect = String(f.get("aspect") || "16:9"), resolution = String(f.get("resolution") || "720p");
  const since = new Date(Date.now() - 864e5).toISOString();
  const { count } = await db().from("jobs").select("id", { count: "exact", head: true }).eq("owner", me).gte("created_at", since);
  const limit = Number(process.env.MAX_JOBS_PER_DAY || 5);
  if ((count ?? 0) >= limit) return NextResponse.json({ error: `Daily limit of ${limit} videos reached. Try again tomorrow.` }, { status: 429 });
  try {
    // The image goes straight to the provider and is never stored by this app.
    const h = await submit({ image: `data:${mime};base64,${buf.toString("base64")}`, prompt, negative: String(f.get("negative") || ""), duration, aspect, resolution });
    const { data, error } = await db().from("jobs").insert({ owner: me, status: "running", prompt, duration, aspect, resolution, status_url: h.statusUrl, response_url: h.responseUrl }).select("id").single();
    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (e: any) { return NextResponse.json({ error: e.message || "Could not start generation." }, { status: 502 }); }
}
