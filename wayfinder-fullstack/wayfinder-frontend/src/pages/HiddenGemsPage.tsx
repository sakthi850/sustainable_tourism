import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGeolocation } from '../hooks/useGeolocation';
import { getRecommendations } from '../services/recommendationsService';
import { Recommendation } from '../types';
import { FavoriteButton } from '../components/FavoriteButton';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';

export function HiddenGemsPage(){
 const geo=useGeolocation();const [items,setItems]=useState<Recommendation[]|null>(null),[error,setError]=useState<string|null>(null);
 useEffect(()=>geo.locate(),[]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{if(geo.latitude!=null&&geo.longitude!=null)getRecommendations({latitude:geo.latitude,longitude:geo.longitude,radius:25000}).then(r=>setItems(r.recommendations)).catch(e=>setError(e.message))},[geo.latitude,geo.longitude]);
 const gems=useMemo(()=>items?.filter((x):x is Recommendation&{rating:number}=>x.source==='platform'&&x.distanceKm<=25&&x.hasRating&&x.rating!==null&&x.rating>=4&&x.sustainability!==null&&x.sustainability>=.6&&(x.popularity??1)<=.6&&(x.localRelevance??0)>=.5)||[],[items]);
 if(['idle','locating'].includes(geo.status)||items===null&&!error)return <LoadingState label="Finding evidence-based hidden gems…"/>;
 if(geo.status!=='granted')return <ErrorState message={geo.errorMessage||'Location unavailable.'} onRetry={geo.locate}/>;if(error)return <ErrorState message={error}/>;
 return <section><h1>Hidden Gems</h1><p>Lower-prominence platform listings selected for strong ratings, sustainability, local relevance, and reasonable distance.</p>{gems.length===0?<EmptyState message="No listings currently meet the hidden-gem criteria near you."/>:<div className="rec-grid">{gems.map(g=><article className="rec-card" key={g.id}><div className="spread"><h3>{g.name}</h3><FavoriteButton kind={g.kind} id={g.id}/></div><div className="rec-card-meta"><span className="pill">{g.distanceKm.toFixed(1)} km</span><span className="pill">★ {g.rating.toFixed(1)}</span><span className="pill eco">🌱 {Math.round((g.sustainability||0)*100)}%</span></div><p><b>Why this is a hidden gem:</b> strong local relevance and sustainability with lower recorded prominence.</p><div className="row"><Link className="btn" to={`/${g.kind==='place'?'places':'businesses'}/${g.id}`}>View details</Link><a className="btn ghost" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${g.latitude},${g.longitude}`}>Navigate</a></div></article>)}</div>}</section>
}
