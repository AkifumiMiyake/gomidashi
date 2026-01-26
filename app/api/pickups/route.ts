import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../lib/supabase/server';
import { formatDateYmd, getJstDateParts } from '../../../lib/date';
import { getPickupsForDate } from '../../../lib/rules';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get('district') ?? searchParams.get('area');
  const town = searchParams.get('town');
  const dateParam = searchParams.get('date');
  const offsetRaw = searchParams.get('offset') ?? '0';
  const offset = Number(offsetRaw);

  if (!district || !town || Number.isNaN(offset)) {
    return NextResponse.json(
      {
        error: 'Invalid parameters',
        message: 'district(or area) and town are required'
      },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('garbage_rules')
    .select('*')
    .eq('city', 'okayama')
    .eq('area', district)
    .eq('town', town)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Not found', message: 'No matching rules for district/town' },
      { status: 404 }
    );
  }

  let date: Date;
  if (dateParam) {
    const match = dateParam.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid parameters', message: 'date must be YYYY-MM-DD' },
        { status: 400 }
      );
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    date = new Date(Date.UTC(year, month - 1, day + offset));
  } else {
    date = getJstDateParts(offset).date;
  }

  const pickups = getPickupsForDate(data, date);
  const rulesSummary = [
    { label: '可燃ごみ', value: data.burnable_rule ?? '' },
    { label: '不燃ごみ', value: data.landfill_rule ?? '' },
    { label: '資源化物', value: data.resource_rule ?? '' },
    { label: 'プラスチック資源', value: data.extra_rule ?? '' },
    { label: '備考', value: data.note ?? '' }
  ].filter((item) => item.label !== '備考' || item.value);

  return NextResponse.json({
    date: formatDateYmd(date),
    pickups,
    rawRules: data,
    rulesSummary
  });
}
