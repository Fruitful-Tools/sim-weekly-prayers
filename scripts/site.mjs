// Shared build-time helpers for static generation (sitemap + prerender).
// Enumerates every public route by reading the same public Supabase data the
// app reads at runtime. The anon key is public by design (RLS is the real
// protection) and mirrors src/integrations/supabase/client.ts.
import { createClient } from '@supabase/supabase-js';

// Canonical production origin (custom domain at root). Override per-environment
// with SITE_ORIGIN. Trailing slash is normalized off.
export const SITE_ORIGIN = (
  process.env.SITE_ORIGIN || 'https://prayer.simtaiwan.org'
).replace(/\/+$/, '');

const SUPABASE_URL = 'https://qunrljxtjzdrxkzbbkbx.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1bnJsanh0anpkcnhremJia2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODc3ODUsImV4cCI6MjA2ODY2Mzc4NX0.hb2_zFdhemVFGkj0HerpghcKefMpnK8AU7Q-3bSHkHo';

// Routes that always exist regardless of data.
export const STATIC_ROUTES = ['/', '/prayers', '/family-prayers'];

// URLs use the compact YYYYMMDD form (dashes stripped from week_date), matching
// PrayerCard/FamilyPrayer link generation.
const toUrlDate = (weekDate) => String(weekDate).replace(/-/g, '');

// Returns the full, de-duplicated list of public routes to statically generate.
export async function getRoutes() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const routes = [...STATIC_ROUTES];

  // Weekly prayers -> /prayer/:date
  const { data: prayers, error: prayersError } = await supabase
    .from('prayers')
    .select('week_date')
    .order('week_date', { ascending: false });
  if (prayersError) throw prayersError;
  for (const row of prayers ?? []) {
    if (row.week_date) routes.push(`/prayer/${toUrlDate(row.week_date)}`);
  }

  // Family prayers (world_kids_news) -> /family-prayer/:date
  const { data: family, error: familyError } = await supabase
    .from('world_kids_news')
    .select('week_date')
    .order('week_date', { ascending: false });
  if (familyError) throw familyError;
  for (const row of family ?? []) {
    if (row.week_date) {
      routes.push(`/family-prayer/${toUrlDate(row.week_date)}`);
    }
  }

  return [...new Set(routes)];
}
