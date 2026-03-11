import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import { LandingPage } from './pages/LandingPage';
import { GamePage } from './pages/GamePage';
import { WaitingRoomPage } from './pages/WaitingRoomPage';
import { MultiplayerGamePage } from './pages/MultiplayerGamePage';
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/play" element={<GamePage />} />
          <Route path="/room/:code" element={<WaitingRoomPage />} />
          <Route path="/room/:code/play" element={<MultiplayerGamePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
