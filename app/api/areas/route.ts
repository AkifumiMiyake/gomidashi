import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AreaResult = {
  area: string;
  area_kana: string | null;
};

function toKatakana(input: string) {
  return input.replace(/[\u3041-\u3096]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0x60)
  );
}

function toHiragana(input: string) {
  return input.replace(/[\u30a1-\u30f6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60)
  );
}

function normalizeQuery(input: string) {
  return input.normalize('NFKC');
}

export async function GET(request: Request) {
  noStore();
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();
  const normalized = normalizeQuery(q);
  const qKata = toKatakana(normalized);
  const qHira = toHiragana(normalized);

  if (normalized.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('garbage_rules')
    .select('area, area_kana')
    .eq('city', 'okayama')
    .eq('source', 'kviewer')
    .not('area', 'is', null)
    .or(
      `area.ilike.%${normalized}%,area.ilike.%${qKata}%,area.ilike.%${qHira}%,` +
        `area_kana.ilike.%${normalized}%,area_kana.ilike.%${qKata}%,area_kana.ilike.%${qHira}%`
    )
    .order('area', { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { error: error.message, message: 'Failed to fetch areas' },
      { status: 500 }
    );
  }

  const map = new Map<string, AreaResult>();
  for (const row of (data ?? []) as AreaResult[]) {
    if (!row.area) continue;
    map.set(row.area, row);
  }

  const res = NextResponse.json(Array.from(map.values()).slice(0, 50));
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
