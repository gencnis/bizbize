const {
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
  MIN_PLAYERS,
  MAX_PLAYERS,
} = require('./gameLogic');

function attachSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('create-room', (payload, ack) => {
      const name = (payload && payload.name) ? String(payload.name).trim() : '';
      const result = createRoom(socket.id, name || 'Host');
      const { roomCode, playerId } = result;
      socket.join(roomCode);
      const state = getState(roomCode);
      socket.emit('room-created', { roomCode, playerId, isHost: true });
      if (state) socket.emit('state', state);
      ack?.({ ok: true, roomCode, playerId });
    });

    socket.on('join-room', (payload, ack) => {
      const { roomCode, name } = payload || {};
      if (!roomCode || !name || typeof name !== 'string') {
        ack?.({ ok: false, error: 'Room code and name required' });
        return;
      }
      const roomCodeNorm = String(roomCode).toUpperCase().trim();
      const state = getState(roomCodeNorm);
      if (!state) {
        ack?.({ ok: false, error: 'Room not found' });
        return;
      }
      if (state.players.length >= MAX_PLAYERS) {
        ack?.({ ok: false, error: 'Room full' });
        return;
      }
      const result = joinRoom(roomCodeNorm, name, socket.id);
      if (!result.ok) {
        ack?.(result);
        return;
      }
      socket.join(roomCodeNorm);
      socket.emit('joined', { playerId: result.playerId, state: result.state });
      ack?.({ ok: true, playerId: result.playerId });
      io.to(roomCodeNorm).emit('state', result.state);
    });

    socket.on('start-game', () => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      if (!roomCode) return;
      const state = getState(roomCode);
      if (!state || state.hostSocketId !== socket.id) return;
      if (state.players.length < MIN_PLAYERS || state.players.length > MAX_PLAYERS) return;
      transition(roomCode, 'start-game', {}, io);
    });

    socket.on('advance', () => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      if (!roomCode) return;
      const state = getState(roomCode);
      if (!state || state.hostSocketId !== socket.id) return;
      transition(roomCode, 'advance', {}, io);
    });

    socket.on('player-ready', () => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!roomCode || !playerId) return;
      playerReady(roomCode, playerId, io);
    });

    socket.on('assign', (payload) => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!roomCode || !playerId) return;
      const { roleId, selectedPlayerId } = payload || {};
      if (!roleId || !selectedPlayerId) return;
      if (assign(roomCode, playerId, roleId, selectedPlayerId, io)) {
        broadcastState(io, roomCode);
      }
    });

    socket.on('category-vote', (payload) => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      const playerId = getPlayerIdBySocketId(socket.id);
      if (!roomCode || !playerId) return;
      const { categoryId } = payload || {};
      if (!categoryId) return;
      voteCategory(roomCode, playerId, categoryId, io);
    });

    socket.on('disconnect', () => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      leaveRoom(socket.id);
      if (roomCode) {
        const state = getState(roomCode);
        if (state) io.to(roomCode).emit('state', state);
      }
    });
  });
}

module.exports = { attachSocketHandlers };
