import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export function ProfilePage() { const {user}=useAuth(); if(!user)return null; return <section><h1>Your profile</h1><div className="panel"><p><b>Name:</b> {user.name}</p><p><b>Email:</b> {user.email}</p><p><b>Role:</b> {user.role}</p></div><div className="action-grid"><Link className="btn" to="/preferences">Preferences</Link><Link className="btn" to="/favorites">Favorites</Link><Link className="btn" to="/reviews">Reviews</Link><Link className="btn" to="/itinerary">My trips</Link></div></section> }
