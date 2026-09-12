import { useState } from 'react';
import './App.css';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <header className="header">
        <h1>{{projectName}}</h1>
        <p className="badge">{{stack}} + {{framework}}</p>
      </header>
      <main className="card">
        <h2>Interactive Counter</h2>
        <button
          className="counter-btn"
          onClick={() => setCount((prev) => prev + 1)}
        >
          Count is {count}
        </button>
        <p className="description">
          Scaffolded with <strong>Universal Project Scaffolder</strong>.
        </p>
      </main>
    </div>
  );
}

export default App;
