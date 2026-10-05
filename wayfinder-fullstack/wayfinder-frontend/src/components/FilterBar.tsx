import { CATEGORIES } from '../types';

export interface FilterState {
  category: string;
  ecoFriendly: boolean;
}

export function FilterBar({ value, onChange }: { value: FilterState; onChange: (v: FilterState) => void }) {
  return (
    <div className="filter-bar">
      <div className="row">
        <button
          className={`btn pill-btn ${value.category === '' ? 'active' : ''}`}
          onClick={() => onChange({ ...value, category: '' })}
        >All</button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`btn pill-btn ${value.category === c ? 'active' : ''}`}
            onClick={() => onChange({ ...value, category: c })}
          >{c}</button>
        ))}
      </div>
      <label className="eco-toggle">
        <input
          type="checkbox"
          checked={value.ecoFriendly}
          onChange={(e) => onChange({ ...value, ecoFriendly: e.target.checked })}
        />
        🌱 Eco-friendly only
      </label>
    </div>
  );
}
