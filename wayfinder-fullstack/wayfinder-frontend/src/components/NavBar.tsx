import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return <header className="navbar">
    <NavLink to="/" className="brand">🧭 Wayfinder</NavLink>
    <nav><NavLink to="/">Home</NavLink><NavLink to="/explore">Explore</NavLink>
      <NavLink to="/map">Map</NavLink><NavLink to="/ar">AR</NavLink>
      <NavLink to="/hidden-gems">Hidden Gems</NavLink>
      {user ? <><NavLink to="/itinerary">Itinerary</NavLink><NavLink to="/favorites">Favorites</NavLink>
        <NavLink to="/profile">Profile</NavLink>{user.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
        <button className="btn nav-button" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
      </> : <><NavLink to="/login">Login</NavLink><NavLink to="/register">Register</NavLink></>}</nav>
  </header>;
}
