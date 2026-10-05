import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters — matches the backend\'s own rule.'); return; }

    setSubmitting(true);
    try {
      await register(name.trim(), email, password);
      navigate('/');
    } catch (err: any) {
      // 409 from the backend specifically means the email is already registered.
      setError(err.status === 409 ? 'An account with that email already exists.' : (err.message || 'Registration failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create an account</h2>
        {error && <div className="state state-error" role="alert">⚠️ {error}</div>}
        <label>Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </label>
        <button className="btn alt" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Register'}</button>
        <p className="small">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
