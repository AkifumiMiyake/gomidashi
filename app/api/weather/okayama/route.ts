import { NextResponse } from 'next/server';

const OKAYAMA = { lat: 34.6551, lon: 133.9195 };
const CACHE_TTL_MS = 30 * 60 * 1000;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type WeatherDay = {
  date: string;
  icon: string;
  pop: number | null;
  tmax: number | null;
  tmin: number | null;
};

type Cached = {
  expiresAt: number;
  payload: { today: WeatherDay | null; tomorrow: WeatherDay | null };
};

let cache: Cached | null = null;

function iconFromCode(code: number) {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️';
  if ([61, 63, 65, 66, 67].includes(code)) return '☔️';
  if ([71, 73, 75, 77].includes(code)) return '❄️';
  if ([80, 81, 82].includes(code)) return '🌧️';
  if ([85, 86].includes(code)) return '🌨️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '🌈';
}

export async function GET() {
  if (cache && cache.expiresAt > Date.now()) {
    return NextResponse.json(cache.payload);
  }

  try {
    const params = new URLSearchParams({
      latitude: String(OKAYAMA.lat),
      longitude: String(OKAYAMA.lon),
      daily:
        'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'Asia/Tokyo',
      forecast_days: '2'
    });

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ today: null, tomorrow: null });
    }

    const data = await res.json();
    const daily = data.daily ?? {};
    const dates: string[] = daily.time ?? [];
    const codes: number[] = daily.weathercode ?? [];
    const tmax: number[] = daily.temperature_2m_max ?? [];
    const tmin: number[] = daily.temperature_2m_min ?? [];
    const pop: number[] = daily.precipitation_probability_max ?? [];

    const build = (index: number): WeatherDay | null => {
      if (!dates[index]) return null;
      return {
        date: dates[index],
        icon: iconFromCode(Number(codes[index] ?? 0)),
        pop: pop[index] ?? null,
        tmax: tmax[index] ?? null,
        tmin: tmin[index] ?? null
      };
    };

    const payload = { today: build(0), tomorrow: build(1) };
    cache = { expiresAt: Date.now() + CACHE_TTL_MS, payload };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ today: null, tomorrow: null });
  }
}
