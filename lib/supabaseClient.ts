import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 SUPABASE ERROR: Missing environment variables! Check .env.local");
  console.error("URL:", supabaseUrl);
  console.error("KEY:", supabaseAnonKey ? "Found" : "Missing");
}

export const supabase = createBrowserClient(
  supabaseUrl || "",
  supabaseAnonKey || ""
);