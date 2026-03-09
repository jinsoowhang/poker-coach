import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import { GamePage } from './pages/GamePage';
import DashboardPage from './pages/DashboardPage';
import LeaderboardPage from './pages/LeaderboardPage';
import { usePlayerStore } from './stores/usePlayerStore';

export default function App() {
  useEffect(() => {
    usePlayerStore.getState().initialize();
  }, []);

  // Handle GitHub Pages SPA redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      params.delete('redirect');
      const remainingParams = params.toString();
      const newUrl = redirect + (remainingParams ? '?' + remainingParams : '');
      window.history.replaceState(null, '', newUrl);
    }
  }, []);

  return (
    <BrowserRouter basename="/poker-coach">
      <div className="min-h-screen bg-gray-950">
        <NavBar />
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
