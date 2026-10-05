import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGeolocation } from '../hooks/useGeolocation';
import { getRecommendations } from '../services/recommendationsService';
import { Recommendation } from '../types';
import { ErrorState, LoadingState } from '../components/StateViews';

export function ArPage(){
 const geo=useGeolocation(),videoRef=useRef<HTMLVideoElement>(null);const [items,setItems]=useState<Recommendation[]>([]),[target,setTarget]=useState<Recommendation|null>(null),[heading,setHeading]=useState<number|null>(null),[camera,setCamera]=useState<'loading'|'ready'|'unavailable'>('loading');
 useEffect(()=>geo.locate(),[]);// eslint-disable-line
 useEffect(()=>{let stream:MediaStream|undefined;navigator.mediaDevices?.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false}).then(s=>{stream=s;if(videoRef.current){videoRef.current.srcObject=s;void videoRef.current.play()}setCamera('ready')}).catch(()=>setCamera('unavailable'));return()=>stream?.getTracks().forEach(t=>t.stop())},[]);
 useEffect(()=>{if(geo.latitude!=null&&geo.longitude!=null)getRecommendations({latitude:geo.latitude,longitude:geo.longitude}).then(r=>{setItems(r.recommendations);setTarget(r.recommendations[0]||null)})},[geo.latitude,geo.longitude]);
 useEffect(()=>{const fn=(e:DeviceOrientationEvent)=>setHeading(e.alpha==null?null:360-e.alpha);window.addEventListener('deviceorientation',fn);return()=>window.removeEventListener('deviceorientation',fn)},[]);
 if(geo.status==='idle'||geo.status==='locating')return <LoadingState label="Preparing AR navigation…"/>;if(geo.status!=='granted')return <ErrorState message={geo.errorMessage||'AR needs location access.'} onRetry={geo.locate}/>;
 const bearing=target?getBearing(geo.latitude!,geo.longitude!,target.latitude,target.longitude):0,turn=heading==null?0:bearing-heading;
 return <section><h1>AR Navigation</h1><p className="small">Camera and orientation support vary by browser and usually require HTTPS on a physical device.</p><div className="ar-view"><video ref={videoRef} className="ar-camera" muted playsInline/><div className="ar-sky"/><div className="ar-arrow" style={{transform:`rotate(${turn}deg)`}}>↑</div>{target?<div className="ar-card"><b>{target.name}</b><span>{target.distanceKm.toFixed(1)} km · bearing {Math.round(bearing)}°</span></div>:<p>No destination available.</p>}</div><label>Destination<select value={target?.id||''} onChange={e=>setTarget(items.find(x=>x.id===e.target.value)||null)}>{items.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>{(camera==='unavailable'||heading===null)&&<div className="state state-empty">Camera or device orientation is unavailable. Continue with the 2D map fallback.</div>}<p><Link className="btn" to="/map">2D Map Fallback</Link></p></section>
}
function getBearing(a:number,b:number,c:number,d:number){const y=Math.sin((d-b)*Math.PI/180)*Math.cos(c*Math.PI/180),x=Math.cos(a*Math.PI/180)*Math.sin(c*Math.PI/180)-Math.sin(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.cos((d-b)*Math.PI/180);return(Math.atan2(y,x)*180/Math.PI+360)%360}
