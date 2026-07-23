// Public Supabase project config. Safe to expose to the browser: this is the
// anon key, which is only ever allowed to do what Row Level Security permits
// (see supabase/migrations/0001_leads_schema.sql). The service_role key is
// never used by this app — it lives only in the n8n workflows that write leads.
export const SUPABASE_URL = "https://emsxdrwdjbudjetysltt.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtc3hkcndkamJ1ZGpldHlzbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MjkxNTEsImV4cCI6MjEwMDQwNTE1MX0.kgiQHo05pXlIJNlAIJSu7h6lrPlMFXNqqGLpXIyispI";
