import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RickTab from './RickTab';
import MortyTab from './MortyTab';
import SummerTab from './SummerTab';
import JerryTab from './JerryTab';
import LeaderboardTab from './LeaderboardTab';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li><Link to="/">Rick</Link></li>
            <li><Link to="/morty">Morty</Link></li>
            <li><Link to="/summer">Summer</Link></li>
            <li><Link to="/jerry">Jerry</Link></li>
            <li><Link to="/leaderboard">Leaderboard</Link></li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<RickTab />} />
          <Route path="/morty" element={<MortyTab />} />
          <Route path="/summer" element={<SummerTab />} />
          <Route path="/jerry" element={<JerryTab />} />
          <Route path="/leaderboard" element={<LeaderboardTab />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;