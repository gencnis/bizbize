/**
 * Server-side game state and state machine.
 * Single source of truth; no persistence (in-memory only).
 */

const { customAlphabet } = require('nanoid');
const { getCategory, getRandomCategories, selectRolesForPlayerCount } = require('./categories');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const roomCodeGen = customAlphabet(ALPHABET, 5);

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;
const ASSIGN_SECONDS = 30;
const CATEGORY_REVEAL_MS = 5000;
const DRUMROLL_MS = 2000;

const BETWEEN_ROUNDS_MS = 10000;
const PODIUM_MS = 8000;

const STATES = {
  LOBBY: 'LOBBY',
  CATEGORY_REVEAL: 'CATEGORY_REVEAL',
  ASSIGN: 'ASSIGN',
  DRUMROLL: 'DRUMROLL',
  RESULTS_LOOP: 'RESULTS_LOOP',
  SCORING: 'SCORING',
  BETWEEN_ROUNDS: 'BETWEEN_ROUNDS',
  LEADERBOARD: 'LEADERBOARD',
  PODIUM: 'PODIUM',
  FINAL: 'FINAL',
};

const rooms = new Map();
const socketToRoom = new Map();

const roomTimers = new Map();

function clearRoomTimer(roomCode) {
  const ref = roomTimers.get(roomCode);
  if (ref) {
    clearTimeout(ref);
    roomTimers.delete(roomCode);
  }
}

function getState(roomCode) {
  return rooms.get(roomCode) || null;
}

function getRoomCodeBySocketId(socketId) {
  return socketToRoom.get(socketId)?.roomCode ?? null;
}

function getPlayerIdBySocketId(socketId) {
  return socketToRoom.get(socketId)?.playerId ?? null;
}

function createRoom(hostSocketId, creatorName) {
  const roomCode = roomCodeGen();
  const creatorId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const state = {
    roomId: roomCode,
    players: [
      {
        id: creatorId,
        name: (creatorName && String(creatorName).trim()) || 'Host',
        score: 0,
        streak: 0,
        consecutiveCorrect: 0,
        wonRoles: [],
      },
    ],
    hostSocketId,
    state: STATES.LOBBY,
    roundNumber: 1,
    currentRound: 1,
    categoryOptions: [],
    category: null,
    roles: [],
    assignments: {},
    phasePayload: {},
  };
  rooms.set(roomCode, state);
  socketToRoom.set(hostSocketId, { roomCode, playerId: creatorId, isHost: true });
  return { roomCode, playerId: creatorId };
}

function joinRoom(roomCode, playerName, playerSocketId) {
  const state = rooms.get(roomCode);
  if (!state || state.state !== STATES.LOBBY) return { ok: false, error: 'Room not in lobby' };
  if (state.players.length >= MAX_PLAYERS) return { ok: false, error: 'Room full' };
  const playerId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  state.players.push({
    id: playerId,
    name: playerName.trim() || 'Player',
    score: 0,
    streak: 0,
    consecutiveCorrect: 0,
    wonRoles: [],
  });
  socketToRoom.set(playerSocketId, { roomCode, playerId, isHost: false });
  return { ok: true, playerId, state };
}

function broadcastState(io, roomCode) {
  const state = getState(roomCode);
  if (state) io.to(roomCode).emit('state', state);
}

const FALLBACK_TRAIT = 'Gizemli Tip';
const FALLBACK_SUBTEXT = 'Kimseye benzemiyor, grubu şaşırttı';

function buildPodiumPayload(state) {
  const sorted = [...state.players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const top3 = sorted.slice(0, 3);

  /** One trait per won role (up to 3), chosen randomly from that role's traits array. */
  function pickTraits(player) {
    const wonRoles = player.wonRoles || [];
    if (wonRoles.length === 0) {
      return { traits: [FALLBACK_TRAIT], subText: FALLBACK_SUBTEXT };
    }
    const traits = [];
    for (let i = 0; i < Math.min(3, wonRoles.length); i++) {
      const wr = wonRoles[i];
      const list = wr.traits && wr.traits.length ? wr.traits : [];
      if (list.length) {
        const randomIndex = Math.floor(Math.random() * list.length);
        traits.push(list[randomIndex]);
      }
    }
    return { traits: traits.length ? traits : [FALLBACK_TRAIT], subText: null };
  }

  const payload = {};
  if (top3[0]) {
    const t0 = pickTraits(top3[0]);
    payload.first = { name: top3[0].name, score: Math.round(top3[0].score ?? 0), traits: t0.traits, subText: t0.subText };
  }
  if (top3[1]) {
    const t1 = pickTraits(top3[1]);
    payload.second = { name: top3[1].name, score: Math.round(top3[1].score ?? 0), traits: t1.traits, subText: t1.subText };
  }
  if (top3[2]) {
    const t2 = pickTraits(top3[2]);
    payload.third = { name: top3[2].name, score: Math.round(top3[2].score ?? 0), traits: t2.traits, subText: t2.subText };
  }
  return payload;
}

function computeRoundScores(state) {
  const { players, roles, assignments } = state;
  const playerIds = players.map((p) => p.id);
  const BASE = 100;
  const SPEED_MAX = 50;
  const ROUND_MAX = 150;
  const UNANIMOUS_BONUS = 30;
  const STREAK_2 = 20;
  const STREAK_3 = 40;
  const STREAK_4_PLUS = 60;

  const scoreDeltas = Object.fromEntries(players.map((p) => [p.id, 0]));
  const newStreaks = Object.fromEntries(players.map((p) => [p.id, { consecutiveCorrect: 0, lastCorrect: false }]));

  for (const role of roles) {
    const roleAssignments = assignments[role.id] || {};
    const votes = {};
    playerIds.forEach((id) => (votes[id] = 0));
    const timestamps = {};
    for (const pid of Object.keys(roleAssignments)) {
      const { selectedPlayerId, timestamp } = roleAssignments[pid];
      if (selectedPlayerId && playerIds.includes(selectedPlayerId)) {
        votes[selectedPlayerId] = (votes[selectedPlayerId] || 0) + 1;
        timestamps[pid] = timestamp;
      }
    }
    const maxVotes = Math.max(...Object.values(votes), 0);
    const winners = playerIds.filter((id) => votes[id] === maxVotes && maxVotes > 0);
    const totalVoters = Object.keys(roleAssignments).length;
    const unanimous = totalVoters > 0 && winners.length === 1 && votes[winners[0]] === totalVoters;

    for (const playerId of Object.keys(roleAssignments)) {
      const selectedPlayerId = roleAssignments[playerId].selectedPlayerId;
      const timestamp = roleAssignments[playerId].timestamp;
      const isCorrect = winners.length > 0 && winners.includes(selectedPlayerId);
      if (!isCorrect) {
        newStreaks[playerId].consecutiveCorrect = 0;
        newStreaks[playerId].lastCorrect = false;
        continue;
      }
      const timeInSeconds = typeof timestamp === 'number' ? (Date.now() - timestamp) / 1000 : 15;
      const speedBonus = Math.max(0, Math.min(SPEED_MAX, SPEED_MAX - (timeInSeconds * (SPEED_MAX / ASSIGN_SECONDS))));
      let points = BASE + speedBonus;
      if (points > ROUND_MAX) points = ROUND_MAX;
      if (unanimous) points += UNANIMOUS_BONUS;
      scoreDeltas[playerId] = (scoreDeltas[playerId] || 0) + points;
      const prevConsecutive = state.players.find((p) => p.id === playerId)?.consecutiveCorrect ?? 0;
      const nextConsecutive = prevConsecutive + 1;
      newStreaks[playerId].consecutiveCorrect = nextConsecutive;
      newStreaks[playerId].lastCorrect = true;
    }

    for (const p of state.players) {
      if (!newStreaks[p.id].lastCorrect && roleAssignments[p.id]) {
        newStreaks[p.id].consecutiveCorrect = 0;
      }
    }

    for (const winnerId of winners) {
      const player = state.players.find((p) => p.id === winnerId);
      if (player) {
        if (!player.wonRoles) player.wonRoles = [];
        player.wonRoles.push({
          role: role.label,
          traits: role.traits || [],
        });
      }
    }
  }

  for (const p of state.players) {
    p.score = (p.score || 0) + (scoreDeltas[p.id] || 0);
    const consecutive = newStreaks[p.id].consecutiveCorrect;
    p.consecutiveCorrect = consecutive;
    if (consecutive >= 4) p.score += STREAK_4_PLUS;
    else if (consecutive === 3) p.score += STREAK_3;
    else if (consecutive === 2) p.score += STREAK_2;
    p.score = Math.round(p.score);
  }
}

function transition(roomCode, action, payload, io) {
  const state = rooms.get(roomCode);
  if (!state) return false;

  const { state: currentState, players, roles, phasePayload } = state;
  const playerCount = players.length;

  if (action === 'start-game') {
    if (currentState !== STATES.LOBBY) return false;
    if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) return false;
    state.roundNumber = 1;
    const options = getRandomCategories(5);
    if (!options.length) return false;
    state.categoryOptions = options.map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      description: c.description,
    }));
    state.category = null;
    state.roles = [];
    state.assignments = {};
    state.state = STATES.CATEGORY_REVEAL;
    state.phasePayload = { stage: 'vote', categoryVotes: {} };
    clearRoomTimer(roomCode);
    broadcastState(io, roomCode);
    return true;
  }

  if (action === 'podium-end') {
    if (currentState !== STATES.PODIUM) return false;
    clearRoomTimer(roomCode);
    state.state = STATES.FINAL;
    state.phasePayload = {};
    broadcastState(io, roomCode);
    return true;
  }

  if (action === 'next-round') {
    if (currentState !== STATES.BETWEEN_ROUNDS) return false;
    clearRoomTimer(roomCode);
    const options = getRandomCategories(5);
    if (!options.length) return false;
    state.categoryOptions = options.map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      description: c.description,
    }));
    state.category = null;
    state.roles = [];
    state.assignments = {};
    state.state = STATES.CATEGORY_REVEAL;
    state.phasePayload = { stage: 'vote', categoryVotes: {} };
    broadcastState(io, roomCode);
    return true;
  }

  if (action === 'advance') {
    if (currentState === STATES.CATEGORY_REVEAL) {
      // Only advance out of CATEGORY_REVEAL after category has been chosen
      // and roles are ready (stage === 'roles').
      if (!state.category || !state.roles.length) return false;
      clearRoomTimer(roomCode);
      state.state = STATES.ASSIGN;
      state.phasePayload = { assignRoleIndex: 0, timerEndsAt: Date.now() + ASSIGN_SECONDS * 1000 };
      roomTimers.set(roomCode, setTimeout(() => transition(roomCode, 'TIMER_ASSIGN_END', {}, io), ASSIGN_SECONDS * 1000));
      broadcastState(io, roomCode);
      return true;
    }
    if (currentState === STATES.ASSIGN) {
      clearRoomTimer(roomCode);
      const nextIdx = (phasePayload.assignRoleIndex ?? 0) + 1;
      if (nextIdx >= roles.length) {
        state.state = STATES.DRUMROLL;
        state.phasePayload = { readyPlayerIds: {} };
      } else {
        state.phasePayload = { assignRoleIndex: nextIdx, timerEndsAt: Date.now() + ASSIGN_SECONDS * 1000 };
        roomTimers.set(roomCode, setTimeout(() => transition(roomCode, 'TIMER_ASSIGN_END', {}, io), ASSIGN_SECONDS * 1000));
      }
      broadcastState(io, roomCode);
      return true;
    }
    if (currentState === STATES.DRUMROLL) {
      clearRoomTimer(roomCode);
      state.state = STATES.RESULTS_LOOP;
      state.phasePayload = { resultsRoleIndex: 0, readyPlayerIds: {} };
      broadcastState(io, roomCode);
      return true;
    }
    if (currentState === STATES.RESULTS_LOOP) {
      const idx = (phasePayload.resultsRoleIndex ?? 0) + 1;
      if (idx >= roles.length) {
        state.state = STATES.SCORING;
        state.phasePayload = {};
        computeRoundScores(state);
        state.roundNumber = (state.roundNumber || 1) + 1;
        if (state.roundNumber > 3) {
          state.state = STATES.PODIUM;
          state.phasePayload = buildPodiumPayload(state);
          roomTimers.set(
            roomCode,
            setTimeout(() => transition(roomCode, 'podium-end', {}, io), PODIUM_MS)
          );
        } else {
          state.state = STATES.LEADERBOARD;
          state.phasePayload = { readyPlayerIds: {} };
        }
      } else {
        state.phasePayload = { resultsRoleIndex: idx, readyPlayerIds: {} };
      }
      broadcastState(io, roomCode);
      return true;
    }
    if (currentState === STATES.LEADERBOARD) {
      clearRoomTimer(roomCode);
      state.state = STATES.BETWEEN_ROUNDS;
      state.phasePayload = {};
      roomTimers.set(
        roomCode,
        setTimeout(() => transition(roomCode, 'next-round', {}, io), BETWEEN_ROUNDS_MS)
      );
      broadcastState(io, roomCode);
      return true;
    }
    return false;
  }

  if (action === 'TIMER_ASSIGN_END') {
    if (currentState !== STATES.ASSIGN) return false;
    clearRoomTimer(roomCode);
    const nextIdx = (state.phasePayload.assignRoleIndex ?? 0) + 1;
    if (nextIdx >= roles.length) {
      state.state = STATES.DRUMROLL;
      state.phasePayload = { readyPlayerIds: {} };
    } else {
      state.phasePayload = { assignRoleIndex: nextIdx, timerEndsAt: Date.now() + ASSIGN_SECONDS * 1000 };
      roomTimers.set(roomCode, setTimeout(() => transition(roomCode, 'TIMER_ASSIGN_END', {}, io), ASSIGN_SECONDS * 1000));
    }
    broadcastState(io, roomCode);
    return true;
  }

  return false;
}

function assign(roomCode, playerId, roleId, selectedPlayerId, io) {
  const state = rooms.get(roomCode);
  if (!state || state.state !== STATES.ASSIGN) return false;
  const role = state.roles.find((r) => r.id === roleId);
  if (!role) return false;
  if (!state.assignments[roleId]) state.assignments[roleId] = {};
  state.assignments[roleId][playerId] = { selectedPlayerId, timestamp: Date.now() };
  // If everyone has answered for this role, end the role early.
  const answeredCount = Object.keys(state.assignments[roleId]).length;
  if (answeredCount === state.players.length) {
    transition(roomCode, 'TIMER_ASSIGN_END', {}, io);
  }
  return true;
}

const CONSENSUS_STATES = [STATES.CATEGORY_REVEAL, STATES.DRUMROLL, STATES.RESULTS_LOOP, STATES.LEADERBOARD];

function playerReady(roomCode, playerId, io) {
  const state = rooms.get(roomCode);
  if (!state || !CONSENSUS_STATES.includes(state.state)) return false;
  // For CATEGORY_REVEAL, only use consensus after category has been chosen (roles stage).
  if (state.state === STATES.CATEGORY_REVEAL) {
    const stage = state.phasePayload?.stage;
    if (stage !== 'roles') return false;
  }
  const payload = state.phasePayload || {};
  if (!payload.readyPlayerIds) payload.readyPlayerIds = {};
  payload.readyPlayerIds[playerId] = true;
  const count = Object.keys(payload.readyPlayerIds).length;
  if (count === state.players.length) {
    transition(roomCode, 'advance', {}, io);
  } else {
    broadcastState(io, roomCode);
  }
  return true;
}

function voteCategory(roomCode, playerId, categoryId, io) {
  const state = rooms.get(roomCode);
  if (!state || state.state !== STATES.CATEGORY_REVEAL) return false;
  const payload = state.phasePayload || {};
  if (payload.stage !== 'vote') return false;
  const options = state.categoryOptions || [];
  if (!options.some((c) => c.id === categoryId)) return false;
  if (!payload.categoryVotes) payload.categoryVotes = {};
  payload.categoryVotes[playerId] = categoryId;
  state.phasePayload = payload;

  const votes = payload.categoryVotes;
  const totalPlayers = state.players.length;
  const voteCount = Object.keys(votes).length;

  if (voteCount >= totalPlayers) {
    // Tally votes
    const counts = {};
    options.forEach((c) => {
      counts[c.id] = 0;
    });
    Object.values(votes).forEach((id) => {
      if (counts[id] != null) counts[id] += 1;
    });
    const max = Math.max(...Object.values(counts));
    const winners = Object.keys(counts).filter((id) => counts[id] === max && max > 0);
    const chosenId = winners.length
      ? winners[Math.floor(Math.random() * winners.length)]
      : options[0]?.id;

    const chosenCategory = getCategory(chosenId) || options.find((c) => c.id === chosenId);
    if (!chosenCategory) return false;

    const selectedRoles = selectRolesForPlayerCount(chosenCategory, state.players.length);
    state.category = {
      id: chosenCategory.id,
      name: chosenCategory.name,
      emoji: chosenCategory.emoji,
      description: chosenCategory.description,
    };
    state.roles = selectedRoles;
    state.assignments = {};
    selectedRoles.forEach((r) => {
      state.assignments[r.id] = {};
    });
    state.phasePayload = { stage: 'roles', readyPlayerIds: {} };
  }

  broadcastState(io, roomCode);
  return true;
}

function leaveRoom(socketId) {
  const info = socketToRoom.get(socketId);
  if (!info) return;
  socketToRoom.delete(socketId);
  if (info.isHost) {
    clearRoomTimer(info.roomCode);
    rooms.delete(info.roomCode);
    return;
  }
  const state = rooms.get(info.roomCode);
  if (state) {
    state.players = state.players.filter((p) => p.id !== info.playerId);
    if (state.players.length === 0) {
      clearRoomTimer(info.roomCode);
      rooms.delete(info.roomCode);
    }
  }
}

module.exports = {
  STATES,
  MIN_PLAYERS,
  MAX_PLAYERS,
  ASSIGN_SECONDS,
  getState,
  getRoomCodeBySocketId,
  getPlayerIdBySocketId,
  createRoom,
  joinRoom,
  transition,
  assign,
  playerReady,
  voteCategory,
  broadcastState,
  leaveRoom,
};
