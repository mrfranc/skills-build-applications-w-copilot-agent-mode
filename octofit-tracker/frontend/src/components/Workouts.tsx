import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getJson<{ suggestions?: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com')
      .then((payload) => {
        if (!isMounted) return;
        setSuggestions(payload.suggestions ?? []);
        setError(null);
      })
      .catch((loadError: Error) => {
        if (!isMounted) return;
        setError(loadError.message || 'Unable to load workout suggestions');
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
          <h2 className="h4">Workout suggestions</h2>
          <p>Get recommendations based on a user’s trend and goal.</p>
          <p role="status">Loading workout suggestions...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p>Get recommendations based on a user’s trend and goal.</p>
          <div role="alert">Unable to load workout suggestions: {error}</div>
        </div>
      </section>
    );
  }

  if (suggestions.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p>Get recommendations based on a user’s trend and goal.</p>
          <p>No workout suggestions</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Get recommendations based on a user’s trend and goal.</p>
        <ul className="list-group list-group-flush">
          {suggestions.map((workout, index) => (
            <li key={`${workout.title}-${workout.focus}-${index}`} className="list-group-item">
              <div className="fw-semibold">{workout.title}</div>
              <div>Focus: {workout.focus}</div>
              <div>Minutes: {workout.minutes}</div>
              <div>Difficulty: {workout.difficulty}</div>
              <div>Reason: {workout.reason || 'No reason provided.'}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
