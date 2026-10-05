import { useEffect, useState } from 'react';
import { myReviews } from '../services/catalogService';
import { deleteReview } from '../services/reviewsService';
import { Review } from '../types';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
export function ReviewsPage(){const [rows,setRows]=useState<Review[]|null>(null);const [error,setError]=useState<string|null>(null);const load=()=>myReviews().then(setRows).catch(e=>setError(e.message));useEffect(()=>{void load()},[]);return <section><h1>My reviews</h1>{error&&<ErrorState message={error} onRetry={load}/>} {!rows?<LoadingState label="Loading your reviews…"/>:rows.length===0?<EmptyState message="You have not reviewed anything yet."/>:rows.map(r=><article className="panel" key={r._id}><div className="spread"><b>{'★'.repeat(r.rating)} · {r.targetType}</b><button className="btn ghost" onClick={async()=>{await deleteReview(r._id);load()}}>Delete</button></div><p>{r.comment}</p><small>{new Date(r.createdAt).toLocaleDateString()}</small></article>)}</section>}
