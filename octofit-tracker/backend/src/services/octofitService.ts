import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function parseObjectId(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
    throw badRequest(`${fieldName} is required and must be a valid ObjectId`);
  }
  return new Types.ObjectId(value);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw badRequest('Activity payload is required');
  }

  const payload = input as Record<string, unknown>;
  const userId = parseObjectId(payload.userId ?? payload.user, 'userId');
  const teamId = parseObjectId(payload.teamId ?? payload.team, 'teamId');
  const type = typeof payload.type === 'string' ? payload.type.trim() : '';
  const minutes = Number(payload.minutes);
  const occurredAt = new Date((payload.occurredAt as string | number | Date | undefined) ?? Date.now());

  if (!type) {
    throw badRequest('Activity type is required');
  }

  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('Activity minutes must be a positive number');
  }

  if (Number.isNaN(occurredAt.getTime())) {
    throw badRequest('Activity occurredAt must be a valid date');
  }

  const userExists = await User.exists({ _id: userId });
  const teamExists = await Team.exists({ _id: teamId });

  if (!userExists || !teamExists) {
    throw badRequest('Activity must reference an existing user and team');
  }

  const points = Math.max(1, Math.round(minutes));

  return Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points,
    occurredAt,
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw badRequest('Team payload is required');
  }

  const payload = input as Record<string, unknown>;
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const mascot = typeof payload.mascot === 'string' ? payload.mascot.trim() : '';

  if (!name) {
    throw badRequest('Team name is required');
  }

  if (!mascot) {
    throw badRequest('Team mascot is required');
  }

  const members = Array.isArray(payload.members)
    ? payload.members.map((member) => parseObjectId(member, 'member'))
    : [];

  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = decodeURIComponent(userEmail).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).lean();

  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const preferredFocus = typeof user.fitnessGoal === 'string' && user.fitnessGoal.trim()
    ? user.fitnessGoal.trim().toLowerCase()
    : recentActivities[0]?.type?.toLowerCase() || 'endurance';

  const workouts = await Workout.find({ focus: preferredFocus }).sort({ title: 1 }).lean();
  const fallbackWorkouts = workouts.length > 0 ? workouts : await Workout.find().sort({ title: 1 }).lean();
  const firstWorkout = fallbackWorkouts[0];

  if (!firstWorkout) {
    return [];
  }

  return [{
    ...firstWorkout,
    reason: `This recommendation matches your ${preferredFocus} goal and your recent activity pattern.`,
  }];
}

export { User };
