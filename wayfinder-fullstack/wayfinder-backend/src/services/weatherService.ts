export interface CurrentWeather {
  temperature: number;
  rain: number;
  weatherCode: number;
  timestamp: string;
  rainy: boolean;
}

interface OpenMeteoResponse {
  current?: { temperature_2m?: number; rain?: number; weather_code?: number; time?: string };
}

export async function getCurrentWeather(latitude: number, longitude: number): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    latitude: String(latitude), longitude: String(longitude),
    current: 'temperature_2m,rain,weather_code', timezone: 'auto',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`Weather service returned HTTP ${response.status}.`);
  const data = await response.json() as OpenMeteoResponse;
  const current = data.current;
  if (!current || !Number.isFinite(current.temperature_2m) || !Number.isFinite(current.weather_code)) {
    throw new Error('Weather service returned an invalid response.');
  }
  const rain = Number.isFinite(current.rain) ? current.rain as number : 0;
  const weatherCode = current.weather_code as number;
  return {
    temperature: current.temperature_2m as number, rain, weatherCode,
    timestamp: current.time ?? new Date().toISOString(),
    rainy: rain > 0 || [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode),
  };
}
