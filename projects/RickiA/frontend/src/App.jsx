import React from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import RickTab from './RickTab';
import MortyTab from './MortyTab';
import SummerTab from './SummerTab';
import JerryTab from './JerryTab';

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
          </ul>
        </nav>
        <Switch>
          <Route path="/"><RickTab /></Route>
          <Route path="/morty"><MortyTab /></Route>
          <Route path="/summer"><SummerTab /></Route>
          <Route path="/jerry"><JerryTab /></Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;