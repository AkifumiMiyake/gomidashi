// API: POST /api/admin/import-kviewer
import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '../../../../lib/supabase/server';

const BASE_URL =
  'https://f5d44204.viewer.kintoneapp.com/public/internal/api/records/bba750ccc0622ed0ea1ee9803b60537753367b11af275de1ad0d1507c414d779';

export async function GET() {
  return NextResponse.json({ ok: true, route: '/api/admin/import-kviewer' });
}

export async function POST(request: Request) {
  try {
    console.error('import-kviewer start');
    const secret = request.headers.get('x-admin-secret');
    if (!secret || secret !== process.env.ADMIN_IMPORT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('import-kviewer create supabase client');
    const supabase = createAdminSupabaseClient();
    let totalImported = 0;

    for (let page = 1; page <= 43; page += 1) {
      console.error('import-kviewer fetch page', page);
      const res = await fetch(`${BASE_URL}/${page}?`, { cache: 'no-store' });
      if (!res.ok) {
        return NextResponse.json(
          { error: `Failed to fetch page ${page}`, status: res.status },
          { status: 502 }
        );
      }

      const data = await res.json();
      const records = data.records ?? [];

      const now = new Date().toISOString();
      const rows = records.map((record: any) => ({
        city: 'okayama',
        area: record['ドロップダウン_1']?.value ?? '',
        town: record['文字列__1行__0']?.value ?? '',
        burnable_rule: record['ドロップダウン_3']?.value ?? '',
        resource_rule: record['ドロップダウン_4']?.value ?? '',
        landfill_rule: record['ドロップダウン_6']?.value ?? '',
        extra_rule: record['ドロップダウン_7']?.value ?? '',
        note: record['文字列__1行__1']?.value ?? '',
        source: 'kviewer',
        source_id: record['$id']?.value ?? '',
        updated_at: now
      }));

      const cleaned = rows.filter((row) => row.area.trim() && row.town.trim());
      const skippedEmptyCount = rows.length - cleaned.length;

      const map = new Map<string, (typeof cleaned)[number]>();
      for (const row of cleaned) {
        const key = `${row.city}|${row.area}|${row.town}|${row.source}`;
        map.set(key, row);
      }
      const dedupedRows = Array.from(map.values());

      console.log('import-kviewer counts', {
        page,
        rows: rows.length,
        dedupedRows: dedupedRows.length,
        skippedEmptyCount
      });

      if (dedupedRows.length) {
        console.error('import-kviewer upsert rows', dedupedRows.length);
        const { error } = await supabase
          .from('garbage_rules')
          .upsert(dedupedRows, { onConflict: 'city,area,town,source' });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }

      totalImported += dedupedRows.length;
    }

    console.error('import-kviewer done', totalImported);
    return NextResponse.json({ imported: totalImported });
  } catch (e: any) {
    console.error('import-kviewer error', e);
    return NextResponse.json(
      { error: e?.message ?? 'Unknown error', stack: e?.stack ?? null },
      { status: 500 }
    );
  }
}