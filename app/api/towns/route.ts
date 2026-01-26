import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const area = (searchParams.get('area') ?? '').trim();

  if (!area) {
    return NextResponse.json(
      { error: 'Invalid parameters', message: 'area is required' },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('garbage_rules')
    .select('town')
    .eq('city', 'okayama')
    .eq('source', 'kviewer')
    .eq('area', area)
    .order('town', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message, message: 'Failed to fetch towns' },
      { status: 500 }
    );
  }

  const towns = Array.from(
    new Set((data ?? []).map((row) => row.town).filter(Boolean))
  );

  return NextResponse.json(towns);
}
