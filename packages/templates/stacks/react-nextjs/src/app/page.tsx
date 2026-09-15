export default function Home() {
  return (
    <main className="container">
      <div className="card">
        <h1>Welcome to {{projectName}}</h1>
        <p className="subtitle">
          Built with <strong>{{stack}}</strong> and <strong>{{framework}}</strong>
        </p>
        <div className="info">
          <p>Status: Ready</p>
          <p>App Shape: {{appShape}}</p>
        </div>
      </div>
    </main>
  );
}
