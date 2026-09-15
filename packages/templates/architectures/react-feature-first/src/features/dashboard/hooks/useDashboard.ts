import { useState, useEffect } from 'react';

export interface DashboardMetric {
  title: string;
  value: string | number;
  change: string;
}

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMetrics([
      { title: 'Total Requests', value: '124.8k', change: '+12%' },
      { title: 'Response Time', value: '42ms', change: '-5%' },
      { title: 'Uptime', value: '99.98%', change: '+0.01%' },
    ]);
    setLoading(false);
  }, []);

  return { metrics, loading };
}
