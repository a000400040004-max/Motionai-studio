import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
export const db = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export function owner() {  // anonymous httpOnly per-browser id; swap for Supabase Auth to sync across devices
  const c = cookies(); let id = c.get("mid")?.value;
  if (!id) { id = crypto.randomUUID(); c.set("mid", id, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 31536000, path: "/" }); }
  return id;
}
