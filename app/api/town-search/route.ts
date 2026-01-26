import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

type TownHit = { area: string; town: string; area_kana: string | null };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  noStore();
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();
  if (!q) {
    return NextResponse.json([]);
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('garbage_rules')
    .select('area,town,area_kana')
    .eq('city', 'okayama')
    .eq('source', 'kviewer')
    .ilike('town', `%${q}%`)
    .limit(200);

  if (error) {
    return NextResponse.json(
      { error: error.message, message: 'Failed to search towns' },
      { status: 500 }
    );
  }

  const map = new Map<string, TownHit>();
  for (const row of (data ?? []) as TownHit[]) {
    if (!row.area || !row.town) continue;
    const key = `${row.area}|${row.town}`;
    map.set(key, { area: row.area, town: row.town, area_kana: row.area_kana ?? null });
  }

  const res = NextResponse.json(Array.from(map.values()).slice(0, 20));
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
