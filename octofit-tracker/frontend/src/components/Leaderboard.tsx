import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  rank: number;
  teamName: string;
  totalPoints: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getJson<{ leaderboard?: LeaderboardEntry[] }>('/api/leaderboard')
      .then((payload) => {
        if (!isMounted) return;
        setEntries(payload.leaderboard ?? []);
        setError(null);
      })
      .catch((loadError: Error) => {
        if (!isMounted) return;
        setError(loadError.message || 'Unable to load leaderboard');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Leaderboard</h2>
          <p>Compare team point totals.</p>
          <p role="status">Loading leaderboard...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Leaderboard</h2>
          <p>Compare team point totals.</p>
          <div role="alert">Unable to load leaderboard: {error}</div>
        </div>
      </section>
    );
  }

  if (entries.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Leaderboard</h2>
          <p>Compare team point totals.</p>
          <p>No leaderboard</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        <ol className="list-group list-group-numbered">
          {entries.map((entry) => (
            <li key={`${entry.rank}-${entry.teamName}`} className="list-group-item d-flex justify-content-between align-items-center">
              <span>
                <strong>#{entry.rank}</strong> {entry.teamName}
              </span>
              <span>{entry.totalPoints} pts</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
