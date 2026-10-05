import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, UserPreferences } from '../types';
import { getMyPreferences, saveMyPreferences } from '../services/preferencesService';
import { LoadingState, ErrorState } from '../components/StateViews';

const DEFAULTS: UserPreferences = {
  interests: [], travelMode: 'walking', availableTimeMin: 180, budget: 3, sustainabilityPreference: 0.5,
};

export function PreferencesPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getMyPreferences()
      .then((p) => setPrefs({ ...DEFAULTS, ...p }))
      .catch((e) => setError(e.message || 'Failed to load your preferences.'))
      .finally(() => setLoading(false));
  }, []);

  function toggleInterest(cat: string) {
    setPrefs((p) => ({
      ...p, interests: p.interests.includes(cat) ? p.interests.filter((c) => c !== cat) : [...p.interests, cat],
    }));
  }

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const updated = await saveMyPreferences(prefs);
      setPrefs(updated);
      setSaved(true);
    } catch (e: any) {
      setError(e.message || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading your preferences…" />;

  return (
    <div className="prefs-page">
      <h1>Preferences</h1>
      <p className="small">These are used automatically the next time you load recommendations — you don't need to re-select them each visit.</p>
      {error && <ErrorState message={error} />}
      {saved && <div className="state state-empty">✅ Saved — your next Discover visit will use these.</div>}

      <label>Interests</label>
      <div className="row">
        {CATEGORIES.map((c) => (
          <button key={c} type="button"
            className={`btn pill-btn ${prefs.interests.includes(c) ? 'active' : ''}`}
            onClick={() => toggleInterest(c)}>{c}</button>
        ))}
      </div>

      <div className="prefs-grid">
        <label>Travel mode
          <select value={prefs.travelMode} onChange={(e) => setPrefs({ ...prefs, travelMode: e.target.value as UserPreferences['travelMode'] })}>
            <option value="walking">Walking</option>
            <option value="cycling">Cycling</option>
            <option value="driving">Driving</option>
            <option value="public_transport">Public transport</option>
          </select>
        </label>
        <label>Available time today (minutes)
          <input type="number" min={15} step={15} value={prefs.availableTimeMin}
            onChange={(e) => setPrefs({ ...prefs, availableTimeMin: Number(e.target.value) || 180 })} />
        </label>
        <label>Budget
          <select value={prefs.budget} onChange={(e) => setPrefs({ ...prefs, budget: Number(e.target.value) })}>
            <option value={0}>Free only</option>
            <option value={1}>Low</option>
            <option value={2}>Medium</option>
            <option value={3}>No limit</option>
          </select>
        </label>
        <label>Sustainability preference: {prefs.sustainabilityPreference.toFixed(2)}
          <input type="range" min={0} max={1} step={0.05} value={prefs.sustainabilityPreference}
            onChange={(e) => setPrefs({ ...prefs, sustainabilityPreference: Number(e.target.value) })} />
        </label>
      </div>

      <div className="row" style={{ marginTop: '1rem' }}>
        <button className="btn alt" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save preferences'}</button>
        <button className="btn ghost" onClick={() => navigate('/')}>Back to Discover</button>
      </div>
    </div>
  );
}
