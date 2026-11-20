// Swap this file to change AI provider. Interface: submit() -> handles, poll() -> status/video.
export type Params = { image: string; prompt: string; negative?: string; duration: number; aspect: string; resolution: string };
export type Poll = { status: "running" | "done" | "failed"; videoUrl?: string; error?: string };
const H = () => ({ Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" });

export async function submit(p: Params) {
  const r = await fetch(`https://queue.fal.run/${process.env.FAL_MODEL}`, {
    method: "POST", headers: H(),
    body: JSON.stringify({ image_url: p.image, prompt: p.prompt, negative_prompt: p.negative || undefined,
      duration: p.duration, aspect_ratio: p.aspect, resolution: p.resolution }),
  });
  if (!r.ok) throw new Error(`Provider rejected the request (${r.status}): ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return { statusUrl: j.status_url as string, responseUrl: j.response_url as string };
}

export async function poll(statusUrl: string, responseUrl: string): Promise<Poll> {
  const s = await (await fetch(statusUrl, { headers: H() })).json();
  if (s.status !== "COMPLETED") return { status: "running" };
  const r = await fetch(responseUrl, { headers: H() });
  const j = await r.json();
  const url = j?.video?.url;
  return r.ok && url ? { status: "done", videoUrl: url } : { status: "failed", error: "Generation failed at the provider." };
}
