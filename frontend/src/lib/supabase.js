"use client";

import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(url) {
  const trimmed = (url || "").trim();
  if (!trimmed) return "https://placeholder.supabase.co";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key").trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
