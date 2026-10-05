import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Review, PlaceKind } from '../types';
import * as reviewsService from '../services/reviewsService';
import { LoadingState, ErrorState } from './StateViews';

export function ReviewsSection({ targetType, targetId }: { targetType: PlaceKind; targetId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(() => {
    reviewsService.listReviews(targetType, targetId).then(setReviews).catch((e) => setError(e.message || 'Failed to load reviews.'));
  }, [targetType, targetId]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit() {
    if (!comment.trim()) { setError('Write a comment first.'); return; }
    setSubmitting(true); setError(null);
    try {
      if (editingId) await reviewsService.updateReview(editingId, rating, comment.trim());
      else await reviewsService.createReview(targetType, targetId, rating, comment.trim());
      setComment(''); setRating(5); setEditingId(null);
      load();
    } catch (e: any) {
      setError(e.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(reviewId: string, helpful: boolean) {
    try { await reviewsService.voteHelpful(reviewId, helpful); load(); }
    catch (e: any) { setError(e.message || 'Failed to vote.'); }
  }

  async function handleDelete(reviewId: string) {
    try { await reviewsService.deleteReview(reviewId); load(); }
    catch (e: any) { setError(e.message || 'Failed to delete review.'); }
  }

  if (reviews === null && !error) return <LoadingState label="Loading reviews…" />;

  const avg = reviews && reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <section className="reviews-section">
      <h2>Reviews {reviews ? `(${reviews.length}${avg ? `, avg ${avg}★` : ''})` : ''}</h2>
      {error && <ErrorState message={error} />}

      {reviews && reviews.length === 0 && <p className="small">No reviews yet — be the first.</p>}
      {reviews?.map((r) => {
        const authorId = typeof r.user === 'string' ? r.user : r.user._id;
        const authorName = typeof r.user === 'string' ? 'User' : r.user.name;
        const mine = user && authorId === user.id;
        const myUpvote = user ? r.helpfulUpVotes.includes(user.id) : false;
        const myDownvote = user ? r.helpfulDownVotes.includes(user.id) : false;
        return (
          <div key={r._id} className="review">
            <b>{authorName}</b> · {'★'.repeat(r.rating)} <span className="small">{new Date(r.createdAt).toLocaleDateString()}</span>
            <p>{r.comment}</p>
            <div className="row">
              <button className={`btn ghost ${myUpvote ? 'active' : ''}`} onClick={() => handleVote(r._id, true)} disabled={!user}>
                👍 Useful ({r.helpfulUpVotes.length})
              </button>
              <button className={`btn ghost ${myDownvote ? 'active' : ''}`} onClick={() => handleVote(r._id, false)} disabled={!user}>
                👎 Not useful ({r.helpfulDownVotes.length})
              </button>
              {mine && (
                <>
                  <button className="btn ghost" onClick={() => { setEditingId(r._id); setRating(r.rating); setComment(r.comment); }}>Edit</button>
                  <button className="btn ghost" onClick={() => handleDelete(r._id)}>Delete</button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {user ? (
        <div className="review-form">
          <label>{editingId ? 'Edit your review' : 'Add a review'}</label>
          <div className="row">
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}★</option>)}
            </select>
            <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience…" style={{ flex: 1 }} />
            <button className="btn alt" onClick={handleSubmit} disabled={submitting}>{editingId ? 'Update' : 'Post'}</button>
            {editingId && <button className="btn ghost" onClick={() => { setEditingId(null); setComment(''); setRating(5); }}>Cancel</button>}
          </div>
        </div>
      ) : <p className="small">Log in to leave a review.</p>}
    </section>
  );
}
