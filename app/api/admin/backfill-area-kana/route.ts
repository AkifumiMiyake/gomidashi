// API: POST /api/admin/backfill-area-kana
import { NextResponse } from 'next/server';
import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import { createAdminSupabaseClient } from '../../../../lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const secret = request.headers.get('x-admin-secret');
    if (!secret || secret !== process.env.ADMIN_IMPORT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('garbage_rules')
      .select('area')
      .eq('city', 'okayama')
      .eq('source', 'kviewer')
      .not('area', 'is', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const areas = Array.from(
      new Set((data ?? []).map((row) => row.area).filter((v): v is string => !!v))
    );

    const kuroshiro = new Kuroshiro();
    await kuroshiro.init(new KuromojiAnalyzer());

    let updatedRows = 0;
    const failures: string[] = [];

    for (const area of areas) {
      let converted = '';
      try {
        converted = await kuroshiro.convert(area, { to: 'katakana' });
      } catch (e) {
        failures.push(area);
        continue;
      }

      if (!converted || !converted.trim()) {
        failures.push(area);
        continue;
      }

      const { count, error: updateError } = await supabase
        .from('garbage_rules')
        .update({ area_kana: converted })
        .eq('city', 'okayama')
        .eq('source', 'kviewer')
        .eq('area', area)
        .is('area_kana', null)
        .select('id', { count: 'exact' });

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      updatedRows += count ?? 0;
    }

    return NextResponse.json({
      distinctAreas: areas.length,
      updatedRows,
      failures
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unknown error', stack: e?.stack ?? null },
      { status: 500 }
    );
  }
}
