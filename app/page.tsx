"use client";
import { useEffect, useRef, useState } from "react";
type Job = { id: string; status: string; prompt: string; duration: number; aspect: string; resolution: string; video_url?: string; error?: string; created_at: string };
const CAM = ["Zoom in", "Zoom out", "Pan left", "Pan right", "Tilt up", "Tilt down", "Camera rotation", "Cinematic tracking", "Static camera", "Smooth camera movement"];
const MOTION = ["Natural movement", "Realistic animation", "Cinematic motion", "Slow motion", "Dynamic movement", "3D camera effect"];
const sel = "rounded-xl bg-[#1a1a22] border border-white/10 px-3 py-2";
export default function Home() {
  const [file, setFile] = useState<File>(), [url, setUrl] = useState(""), [dim, setDim] = useState("");
  const [prompt, setPrompt] = useState(""), [neg, setNeg] = useState("");
  const [duration, setDuration] = useState(5), [res, setRes] = useState("720p"), [aspect, setAspect] = useState("16:9");
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false), [jobs, setJobs] = useState<Job[]>([]);
  const [q, setQ] = useState(""), [oldest, setOldest] = useState(false), [open, setOpen] = useState<Job>();
  const input = useRef<HTMLInputElement>(null);
  const load = async () => { const r = await fetch("/api/jobs"); if (r.ok) setJobs(await r.json()); };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!jobs.some(j => j.status === "running")) return; const t = setInterval(load, 5000); return () => clearInterval(t); }, [jobs]);
  function pick(f?: File) {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return setErr("Only JPG, PNG or WEBP images are supported.");
    if (f.size > 10 * 1024 * 1024) return setErr("Image is over 10 MB.");
    setErr(""); setFile(f); const u = URL.createObjectURL(f); setUrl(u);
    const i = new Image(); i.onload = () => setDim(`${i.width}×${i.height}px · ${(f.size / 1048576).toFixed(1)} MB`); i.src = u;
  }
  const add = (t: string) => setPrompt(p => (p ? p.replace(/\s*$/, ", ") : "") + t.toLowerCase());
  async function go() {
    setErr(""); if (!file) return setErr("Upload an image first."); if (!prompt.trim()) return setErr("Describe how the image should move.");
    setBusy(true);
    const f = new FormData(); f.set("image", file); f.set("prompt", prompt); f.set("negative", neg);
    f.set("duration", String(duration)); f.set("resolution", res); f.set("aspect", aspect);
    const r = await fetch("/api/generate", { method: "POST", body: f }); const j = await r.json();
    setBusy(false); if (!r.ok) return setErr(j.error); await load();
  }
  async function del(id: string) { await fetch(`/api/jobs/${id}`, { method: "DELETE" }); if (open?.id === id) setOpen(undefined); load(); }
  const shown = jobs.filter(j => j.prompt?.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (oldest ? 1 : -1) * (+new Date(a.created_at) - +new Date(b.created_at)));
  const running = jobs.find(j => j.status === "running");
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold">MotionAI Studio</h1>
      <h2 className="mt-8 text-3xl font-bold sm:text-4xl">Turn your images into stunning videos with AI</h2>
      <p className="mt-2 text-white/60">Upload an image, describe your vision, and generate a video up to 10 seconds. Free, with a daily limit per visitor.</p>
      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
          className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-violet-400/40 bg-[#14141b] p-4 text-center">
          {url ? <><img src={url} alt="Your upload" className="max-h-64 rounded-xl" /><p className="text-sm text-white/60">{dim}</p>
            <div className="flex gap-2"><button className={sel} onClick={() => input.current?.click()}>Replace</button><button className={sel} onClick={() => { setFile(undefined); setUrl(""); }}>Remove</button></div></>
            : <><p>Drag an image here</p><button className="rounded-full bg-violet-600 px-5 py-2" onClick={() => input.current?.click()}>Browse files</button><p className="text-xs text-white/50">JPG, PNG or WEBP, up to 10 MB</p></>}
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => pick(e.target.files?.[0])} />
        </div>
        <div className="space-y-3">
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} placeholder="Describe how you want your image to move..." className={sel + " w-full"} />
          <div className="flex flex-wrap gap-2 text-xs">{[...CAM, ...MOTION].map(t => <button key={t} onClick={() => add(t)} className="rounded-full border border-white/10 px-3 py-1 hover:border-violet-400">{t}</button>)}</div>
          <input value={neg} onChange={e => setNeg(e.target.value)} placeholder="Negative prompt (optional)" className={sel + " w-full"} />
          <div className="flex flex-wrap gap-2">
            <select className={sel} value={duration} onChange={e => setDuration(+e.target.value)}><option value={5}>5 seconds</option><option value={10}>10 seconds</option></select>
            <select className={sel} value={res} onChange={e => setRes(e.target.value)}><option>480p</option><option>720p</option></select>
            <select className={sel} value={aspect} onChange={e => setAspect(e.target.value)}>{["16:9", "9:16", "1:1", "4:3", "3:4"].map(a => <option key={a}>{a}</option>)}</select>
          </div>
          {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
          <button disabled={busy || !!running} onClick={go} className="w-full rounded-full bg-gradient-to-r from-violet-600 to-blue-600 py-3 font-semibold disabled:opacity-50">
            {busy ? "Submitting…" : running ? "Generating… (checks every 5s)" : "Generate video"}</button>
        </div>
      </section>
      {open?.video_url && <section className="mt-8"><video src={open.video_url} controls autoPlay className="w-full max-w-2xl rounded-2xl" />
        <a className="mt-2 inline-block rounded-full bg-violet-600 px-5 py-2" href={open.video_url} download="motionai.mp4" target="_blank" rel="noreferrer">Download MP4</a>
        <button className="ml-2 rounded-full border border-white/10 px-5 py-2" onClick={() => { setPrompt(open.prompt); scrollTo({ top: 0 }); }}>Generate again</button></section>}
      <section className="mt-10"><div className="flex flex-wrap items-center gap-2"><h3 className="mr-auto text-lg font-semibold">My creations</h3>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search prompts" className={sel} />
        <button className={sel} onClick={() => setOldest(!oldest)}>{oldest ? "Oldest first" : "Newest first"}</button></div>
        {!shown.length && <p className="mt-4 text-white/50">No videos yet. Upload an image above to make your first one.</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">{shown.map(j => (
          <div key={j.id} className="rounded-2xl bg-[#14141b] p-3">
            {j.video_url ? <video src={j.video_url} muted preload="metadata" className="aspect-video w-full rounded-xl object-cover" onClick={() => setOpen(j)} /> :
              <div className="flex aspect-video items-center justify-center rounded-xl bg-black/30 text-sm">{j.status === "failed" ? j.error || "Failed" : "Generating…"}</div>}
            <p className="mt-2 line-clamp-2 text-sm">{j.prompt}</p>
            <p className="text-xs text-white/50">{new Date(j.created_at).toLocaleDateString()} · {j.duration}s · {j.resolution}</p>
            <div className="mt-2 flex gap-3 text-sm">{j.video_url && <button onClick={() => setOpen(j)}>Preview</button>}<button className="text-red-400" onClick={() => del(j.id)}>Delete</button></div>
          </div>))}</div></section>
      <footer className="mt-12 text-xs text-white/40">Images are sent to the AI provider to generate your video and are not stored by this app. See PRIVACY.md and TERMS.md.</footer>
    </main>);
}
