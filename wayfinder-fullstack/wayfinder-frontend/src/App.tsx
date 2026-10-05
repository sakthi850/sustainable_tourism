import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NavBar } from './components/NavBar';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PreferencesPage } from './pages/PreferencesPage';
import { PlaceDetailsPage } from './pages/PlaceDetailsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ExplorePage } from './pages/ExplorePage';
import { MapPage } from './pages/MapPage';
import { ArPage } from './pages/ArPage';
import { ItineraryPage } from './pages/ItineraryPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReviewsPage } from './pages/ReviewsPage';
import { AdminPage } from './pages/AdminPage';
import { HiddenGemsPage } from './pages/HiddenGemsPage';

export default function App() {
  return <AuthProvider><BrowserRouter><NavBar /><main className="app-main"><Routes>
    <Route path="/" element={<HomePage />} /><Route path="/explore" element={<ExplorePage />} />
    <Route path="/businesses" element={<ExplorePage initialKind="business" />} />
    <Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} />
    <Route path="/places/:id" element={<PlaceDetailsPage kind="place" />} />
    <Route path="/businesses/:id" element={<PlaceDetailsPage kind="business" />} />
    <Route path="/map" element={<MapPage />} /><Route path="/ar" element={<ArPage />} />
    <Route path="/hidden-gems" element={<HiddenGemsPage />} />
    <Route path="/preferences" element={<ProtectedRoute><PreferencesPage /></ProtectedRoute>} />
    <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
    <Route path="/itinerary" element={<ProtectedRoute><ItineraryPage /></ProtectedRoute>} />
    <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
    <Route path="/admin/places" element={<AdminRoute><AdminPage section="places" /></AdminRoute>} />
    <Route path="/admin/businesses" element={<AdminRoute><AdminPage section="businesses" /></AdminRoute>} />
    <Route path="/admin/reviews" element={<AdminRoute><AdminPage section="reviews" /></AdminRoute>} />
    <Route path="/admin/feedback" element={<AdminRoute><AdminPage section="feedback" /></AdminRoute>} />
    <Route path="*" element={<p>Page not found.</p>} />
  </Routes></main></BrowserRouter></AuthProvider>;
}
