import { RecommendationsResponse } from '../types';
export function WeatherBanner({weather}:{weather:RecommendationsResponse['weather']|null}){
  if(!weather)return null;
  if(!weather.current)return <p className="small discovery-note">Weather context unavailable; recommendations use the remaining S-CADE factors.</p>;
  const w=weather.current;
  return <div className="weather-banner"><span>{w.rainy?'🌧️':'🌤️'}</span><div><b>{w.temperature.toFixed(1)}°C</b><small>{w.rainy?`Rain ${w.rain.toFixed(1)} mm · outdoor places receive a context penalty`:'Dry conditions · outdoor places receive a positive context score'}</small></div></div>
}
