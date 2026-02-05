'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type PickupResponse = {
  date: string;
  pickups: string[];
  rulesSummary?: Array<{ label: string; value: string }>;
};

type WeatherDay = {
  date: string;
  icon: string;
  pop: number | null;
  tmax: number | null;
  tmin: number | null;
};

type WeatherResponse = {
  today: WeatherDay | null;
  tomorrow: WeatherDay | null;
};

function WeatherLine({ weather }: { weather: WeatherDay }) {
  return (
    <div className="weather-line">
      <span className="weather-icon" aria-hidden="true">
        {weather.icon}
      </span>
      <span className="weather-text">
        <span className="pop">
          降水
          <span className="pop-num">{weather.pop !== null ? weather.pop : '-'}</span>
          <span className="pop-unit">%</span>
        </span>
        <span className="sep">/</span>
        <span className="temp">
          <span className="temp-label">最高</span>
          <span className="temp-num">{weather.tmax !== null ? weather.tmax : '-'}</span>
          <span className="temp-unit">°</span>
        </span>
        <span className="temp">
          <span className="temp-label">最低</span>
          <span className="temp-num">{weather.tmin !== null ? weather.tmin : '-'}</span>
          <span className="temp-unit">°</span>
        </span>
      </span>
    </div>
  );
}

export default function PickupChecker() {
  const [areaInput, setAreaInput] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [recentArea, setRecentArea] = useState<string | null>(null);
  const [recentTown, setRecentTown] = useState<string | null>(null);
  const [areaOptions, setAreaOptions] = useState<
    Array<{ area: string; area_kana: string | null }>
  >([]);
  const [townSearchQuery, setTownSearchQuery] = useState('');
  const [townSearchOptions, setTownSearchOptions] = useState<
    Array<{ area: string; town: string }>
  >([]);
  const [townSearchLoading, setTownSearchLoading] = useState(false);
  const [townSearchError, setTownSearchError] = useState<string | null>(null);
  const [towns, setTowns] = useState<string[]>([]);
  const [town, setTown] = useState('');
  const [today, setToday] = useState<PickupResponse | null>(null);
  const [tomorrow, setTomorrow] = useState<PickupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [areaLoading, setAreaLoading] = useState(false);
  const [townLoading, setTownLoading] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [townError, setTownError] = useState<string | null>(null);
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const townSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const prevHasResultRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const lastArea = window.localStorage.getItem('okayama:lastArea');
    const lastTown = window.localStorage.getItem('okayama:lastTown');
    if (lastArea) {
      setSelectedArea(lastArea);
      setAreaInput(lastArea);
      setRecentArea(lastArea);
    }
    if (lastTown) {
      setRecentTown(lastTown);
    }
  }, []);

  useEffect(() => {
    if (townSearchDebounceRef.current) {
      clearTimeout(townSearchDebounceRef.current);
    }

    if (!townSearchQuery.trim()) {
      setTownSearchOptions([]);
      setTownSearchError(null);
      return;
    }

    townSearchDebounceRef.current = setTimeout(async () => {
      setTownSearchLoading(true);
      setTownSearchError(null);
      try {
        const res = await fetch(
          `/api/town-search?q=${encodeURIComponent(townSearchQuery.trim())}`
        );
        if (!res.ok) {
          throw new Error('町名検索に失敗しました。');
        }
        const data = await res.json();
        setTownSearchOptions(data);
        if (data.length === 1) {
          const hit = data[0];
          setSelectedArea(hit.area);
          setAreaInput(hit.area);
          setTown(hit.town);
          setTownSearchOptions([]);
        }
      } catch (e) {
        setTownSearchError((e as Error).message);
        setTownSearchOptions([]);
      } finally {
        setTownSearchLoading(false);
      }
    }, 250);

    return () => {
      if (townSearchDebounceRef.current) {
        clearTimeout(townSearchDebounceRef.current);
      }
    };
  }, [townSearchQuery]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (areaInput.trim().length < 2) {
      setAreaOptions([]);
      setAreaError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setAreaLoading(true);
      setAreaError(null);
      try {
        const res = await fetch(`/api/areas?q=${encodeURIComponent(areaInput.trim())}`);
        if (!res.ok) {
          throw new Error('エリアの取得に失敗しました。');
        }
        const data = await res.json();
        let options = data;
        if (recentArea) {
          const pinned = options.find((option: { area: string }) => option.area === recentArea);
          options = options.filter((option: { area: string }) => option.area !== recentArea);
          if (pinned) {
            options = [pinned, ...options];
          }
        }
        setAreaOptions(options);
      } catch (e) {
        setAreaError((e as Error).message);
        setAreaOptions([]);
      } finally {
        setAreaLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [areaInput, recentArea]);

  useEffect(() => {
    if (!selectedArea) {
      setTowns([]);
      setTown('');
      setTownError(null);
      return;
    }

    const loadTowns = async () => {
      setTownLoading(true);
      setTownError(null);
      try {
        const res = await fetch(`/api/towns?area=${encodeURIComponent(selectedArea)}`);
        if (!res.ok) {
          throw new Error('町名の取得に失敗しました。');
        }
        const data = await res.json();
        setTowns(data);
        if (recentTown && data.includes(recentTown)) {
          setTown(recentTown);
        } else {
          setTown('');
        }
      } catch (e) {
        setTownError((e as Error).message);
        setTowns([]);
      } finally {
        setTownLoading(false);
      }
    };

    loadTowns();
  }, [selectedArea, recentTown]);

  useEffect(() => {
    if (selectedArea && areaInput !== selectedArea) {
      setSelectedArea('');
      setTowns([]);
      setTown('');
    }
  }, [areaInput, selectedArea]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedArea) {
      window.localStorage.setItem('okayama:lastArea', selectedArea);
      setRecentArea(selectedArea);
    }
  }, [selectedArea]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (town) {
      window.localStorage.setItem('okayama:lastTown', town);
      setRecentTown(town);
    }
  }, [town]);

  const canSearch = useMemo(() => selectedArea && town, [selectedArea, town]);

  useEffect(() => {
    if (!hasResult || prevHasResultRef.current) return;
    prevHasResultRef.current = true;
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hasResult]);

  useEffect(() => {
    if (!hasResult) {
      prevHasResultRef.current = false;
    }
  }, [hasResult]);

  const handleCheck = async () => {
    if (!canSearch) return;
    setLoading(true);
    setPickupError(null);
    setWeather(null);
    try {
      const [todayRes, tomorrowRes, weatherRes] = await Promise.all([
        fetch(
          `/api/pickups?area=${encodeURIComponent(selectedArea)}&town=${encodeURIComponent(
            town
          )}&offset=0`
        ),
        fetch(
          `/api/pickups?area=${encodeURIComponent(selectedArea)}&town=${encodeURIComponent(
            town
          )}&offset=1`
        ),
        fetch('/api/weather/okayama')
      ]);

      if (todayRes.ok) {
        setToday(await todayRes.json());
      }
      if (tomorrowRes.ok) {
        setTomorrow(await tomorrowRes.json());
      }
      if (weatherRes.ok) {
        setWeather(await weatherRes.json());
      } else {
        setWeather(null);
      }
      if (!todayRes.ok || !tomorrowRes.ok) {
        setPickupError('収集情報の取得に失敗しました。');
        setHasResult(false);
        return;
      }
      setHasResult(true);
    } catch (e) {
      setPickupError((e as Error).message);
      setHasResult(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="input-card">
      <div className="field">
        <label htmlFor="town-search">町名から探す</label>
        <input
          id="town-search"
          type="text"
          value={townSearchQuery}
          onChange={(e) => setTownSearchQuery(e.target.value)}
          placeholder="町名の一部を入力"
        />
        {townSearchLoading && <span className="notice">検索中...</span>}
        {townSearchError && <span className="error">{townSearchError}</span>}
        {townSearchQuery.trim() && !townSearchLoading && townSearchOptions.length === 0 && (
          <span className="notice">該当する町名がありません</span>
        )}
        {townSearchOptions.length > 1 && (
          <div className="suggestions">
            {townSearchOptions.map((option) => (
              <button
                key={`${option.area}-${option.town}`}
                type="button"
                className="area-tag"
                onClick={() => {
                  setSelectedArea(option.area);
                  setAreaInput(option.area);
                  setTown(option.town);
                  setTownSearchOptions([]);
                }}
                >
                  <span className="area-name">
                    {option.town}（{option.area}）
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>
      <div className="field">
        <label htmlFor="area">小学校区</label>
        <input
          id="area"
          type="text"
          value={areaInput}
          onChange={(e) => setAreaInput(e.target.value)}
          placeholder="例: 岡南 / こうなん"
        />
        {areaLoading && <span className="notice">検索中...</span>}
        {areaError && <span className="error">{areaError}</span>}
        {areaInput.trim().length >= 2 && !areaLoading && areaOptions.length === 0 && (
          <span className="notice">該当するエリアがありません</span>
        )}
        {areaOptions.length > 0 && (
          <div className="suggestions">
            {areaOptions.map((option) => {
              const isSelected = option.area === selectedArea;
              return (
                <button
                  type="button"
                  key={option.area}
                  className={`area-tag${isSelected ? ' is-selected' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedArea('');
                      setAreaInput('');
                      setAreaOptions([]);
                      setTowns([]);
                      setTown('');
                      return;
                    }
                    setSelectedArea(option.area);
                    setAreaInput(option.area);
                    setAreaOptions([]);
                  }}
                >
                  <span className="area-name">{option.area}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="field">
        <label htmlFor="town">町名</label>
        <select
          id="town"
          value={town}
          onChange={(e) => setTown(e.target.value)}
          disabled={!selectedArea || townLoading}
          size={towns.length > 50 ? 10 : undefined}
        >
          <option value="">-- 町名を選択 --</option>
          {towns.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        {townLoading && <span className="notice">町名を取得中...</span>}
        {townError && <span className="error">{townError}</span>}
      </div>
      {recentArea && (
        <button
          type="button"
          className="clear-history"
          onClick={() => {
            if (typeof window === 'undefined') return;
            window.localStorage.removeItem('okayama:lastArea');
            window.localStorage.removeItem('okayama:lastTown');
            setRecentArea(null);
            setRecentTown(null);
            setSelectedArea('');
            setAreaInput('');
            setAreaOptions([]);
            setTowns([]);
            setTown('');
            setHasResult(false);
          }}
        >
          履歴をクリア
        </button>
      )}
      <button type="button" onClick={handleCheck} disabled={!canSearch || loading}>
        {loading ? '検索中...' : '今日・明日の収集日をチェック'}
      </button>
      {pickupError && <p className="error">{pickupError}</p>}

      <div
        ref={resultRef}
        className={`results-grid${hasResult ? ' is-confirmed' : ''}`}
      >
        {[
          { label: '今日', data: today, weather: weather?.today ?? null },
          { label: '明日', data: tomorrow, weather: weather?.tomorrow ?? null }
        ].map((item) => (
          <div
            className={`result-card${item.label === '今日' ? ' result-card--today' : ''}`}
            key={item.label}
          >
            <h3>
              {item.label} {item.data?.date ? `(${item.data.date})` : ''}
            </h3>
            {item.data ? (
              <div className="tag-list">
                {item.data.pickups.length ? (
                  item.data.pickups.map((pickup) => (
                    <span className="tag" key={pickup}>
                      {pickup}
                    </span>
                  ))
                ) : (
                  <span className="tag tag--none">収集なし</span>
                )}
              </div>
            ) : (
              <span className="notice">地区と町名を選択して確認してください。</span>
            )}
            {item.weather ? <WeatherLine weather={item.weather} /> : null}
          </div>
        ))}
      </div>
      {hasResult && today?.rulesSummary && today.rulesSummary.length > 0 && (
        <div className="rules-card">
          <h3 className="rules-title">この地区の収集ルール</h3>
          <dl className="rules">
            {today.rulesSummary.map((rule) => (
              <div className="rules-row" key={rule.label}>
                <dt>{rule.label}</dt>
                <dd>{rule.value || '-'}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
