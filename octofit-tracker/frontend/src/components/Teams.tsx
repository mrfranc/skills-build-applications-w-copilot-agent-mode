import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  name: string;
  mascot: string;
  members: Array<string | { toString?: () => string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getJson<{ teams?: Team[] }>('/api/teams')
      .then((payload) => {
        if (!isMounted) return;
        setTeams(payload.teams ?? []);
        setError(null);
      })
      .catch((loadError: Error) => {
        if (!isMounted) return;
        setError(loadError.message || 'Unable to load teams');
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
          <h2 className="h4">Teams</h2>
          <p>Manage teams and members.</p>
          <p role="status">Loading teams...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p>Manage teams and members.</p>
          <div role="alert">Unable to load teams: {error}</div>
        </div>
      </section>
    );
  }

  if (teams.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p>Manage teams and members.</p>
          <p>No teams</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        <ul className="list-group list-group-flush">
          {teams.map((team, index) => (
            <li key={`${team.name}-${team.mascot}-${index}`} className="list-group-item">
              <strong>{team.name}</strong> — mascot: {team.mascot} ({team.members.length} members)
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
