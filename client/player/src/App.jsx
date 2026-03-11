import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Join from './views/Join';
import Lobby from './views/Lobby';
import CategoryReveal from './views/CategoryReveal';
import Assign from './views/Assign';
import Waiting from './views/Waiting';
import ResultsLoop from './views/ResultsLoop';
import Leaderboard from './views/Leaderboard';
import BetweenRounds from './views/BetweenRounds';
import Podium from './views/Podium';
import Final from './views/Final';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const s = io(SERVER_URL, {
      autoConnect: true,
      // Use WebSocket directly to avoid XHR polling issues on some networks/browsers
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    s.on('connect', () => setConnectionError(null));
    s.on('connect_error', (err) => {
      const msg = err.message || 'Connection failed';
      setConnectionError(
        `Cannot reach server at ${SERVER_URL}. (${msg}) Same Wi‑Fi? If you opened this page via the launcher, use the exact Player link from that page.`
      );
    });
    s.on('room-created', ({ roomCode, playerId: id, isHost: host }) => {
      setPlayerId(id);
      setIsHost(!!host);
      setError(null);
    });
    s.on('joined', ({ playerId: id, state: gameState }) => {
      setPlayerId(id);
      setIsHost(false);
      setState(gameState);
      setError(null);
    });
    s.on('state', (gameState) => setState(gameState));
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (!socket) return;
    setConnected(socket.connected);
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    socket.on('connect', on);
    socket.on('disconnect', off);
    return () => {
      socket.off('connect', on);
      socket.off('disconnect', off);
    };
  }, [socket]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [playerId, state?.state]);

  if (!socket) return <div className="screen">Starting…</div>;

  if (!playerId) {
    return (
      <div className="screen">
        {connectionError && (
          <>
            <p className="error">{connectionError}</p>
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                setConnectionError(null);
                socket.connect();
              }}
            >
              Retry connection
            </button>
          </>
        )}
        {!connectionError && !connected && <p className="hint">Connecting to server…</p>}
        {connected && <p className="hint connected">Connected</p>}
        <Join
          disabled={!connected}
          onCreate={(name) => {
            setError(null);
            socket.emit('create-room', { name });
          }}
          onJoin={(roomCode, name) => {
            setError(null);
            socket.emit('join-room', { roomCode: roomCode.trim().toUpperCase(), name }, (res) => {
              if (res && !res.ok) setError(res.error || 'Join failed');
            });
          }}
          error={error}
        />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="screen">
        <p>Waiting for game…</p>
      </div>
    );
  }

  const gameState = state.state;

  return (
    <div className="screen">
      {gameState === 'LOBBY' && (
        <Lobby state={state} isHost={isHost} onStart={() => socket.emit('start-game')} />
      )}
      {gameState === 'CATEGORY_REVEAL' && (
        <CategoryReveal
          state={state}
          playerId={playerId}
          onVote={(categoryId) => socket.emit('category-vote', { categoryId })}
          onNext={() => socket.emit('player-ready')}
        />
      )}
      {gameState === 'ASSIGN' && (
        <Assign
          state={state}
          playerId={playerId}
          onAssign={(roleId, selectedPlayerId) =>
            socket.emit('assign', { roleId, selectedPlayerId })
          }
        />
      )}
      {gameState === 'DRUMROLL' && (
        <Waiting
          state={state}
          message="Ayy hazır mısın canım? Çok heyecanlı…"
          playerId={playerId}
          onNext={() => socket.emit('player-ready')}
          characterSrc="/assets/saziye-saskin.png"
        />
      )}
      {gameState === 'RESULTS_LOOP' && (
        <ResultsLoop
          state={state}
          playerId={playerId}
          onNext={() => socket.emit('player-ready')}
        />
      )}
      {gameState === 'SCORING' && <Waiting state={state} message="Scoring…" />}
      {gameState === 'BETWEEN_ROUNDS' && <BetweenRounds state={state} />}
      {gameState === 'PODIUM' && <Podium state={state} />}
      {gameState === 'LEADERBOARD' && (
        <Leaderboard
          state={state}
          playerId={playerId}
          onNext={() => socket.emit('player-ready')}
        />
      )}
      {gameState === 'FINAL' && <Final state={state} playerId={playerId} />}
    </div>
  );
}
