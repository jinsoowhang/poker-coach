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

  return (
    <BrowserRouter>
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
