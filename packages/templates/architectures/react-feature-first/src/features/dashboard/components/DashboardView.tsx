import { useDashboard } from '../hooks/useDashboard';

export function DashboardView() {
  const { metrics, loading } = useDashboard();

  if (loading) return <div>Loading dashboard telemetry...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      {metrics.map((m) => (
        <div key={m.title} style={{ padding: '1rem', border: '1px solid #27272a', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>{m.title}</span>
          <h3 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{m.value}</h3>
          <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>{m.change}</span>
        </div>
      ))}
    </div>
  );
}
