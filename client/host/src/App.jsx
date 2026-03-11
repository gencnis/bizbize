import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Lobby from './views/Lobby';
import CategoryReveal from './views/CategoryReveal';
import Assign from './views/Assign';
import Drumroll from './views/Drumroll';
import ResultsLoop from './views/ResultsLoop';
import Leaderboard from './views/Leaderboard';
import BetweenRounds from './views/BetweenRounds';
import Podium from './views/Podium';
import Final from './views/Final';

function getSocketUrl() {
  if (import.meta.env.PROD) return import.meta.env.VITE_SOCKET_URL || '';
  return `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3000`;
}

export default function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = getSocketUrl();
    const s = io(url, {
      autoConnect: true,
      // Use WebSocket directly to avoid XHR polling issues on some networks/browsers
      transports: ['websocket'],
    });
    s.on('connect', () => {
      setConnected(true);
      setConnectionError(null);
    });
    s.on('disconnect', (reason) => {
      setConnected(false);
      if (reason === 'io server disconnect') setConnectionError('Server disconnected.');
      else if (reason === 'io client disconnect') setConnectionError(null);
      else setConnectionError('Disconnected. Reconnecting…');
    });
    s.on('connect_error', (err) => {
      setConnected(false);
      setConnectionError(
        `Cannot reach server at ${url}. Same Wi‑Fi? Firewall? Try opening this page via localhost if you're on the host machine.`
      );
    });
    s.on('room-created', ({ roomCode: code }) => {
      setRoomCode(code);
      setError(null);
    });
    s.on('state', (gameState) => setState(gameState));
    setSocket(s);
    return () => s.disconnect();
  }, []);

  if (!socket) return <div className="screen">Starting…</div>;

  if (!roomCode) {
    return (
      <div className="screen">
        <h1>Host</h1>
        {connectionError && (
          <p className="error">
            {connectionError}
            <br />
            <strong>Tip:</strong> If you're on the computer running the game, open{' '}
            <a href="http://localhost:5173" className="link">http://localhost:5173</a> instead of the IP.
          </p>
        )}
        {!connectionError && !connected && <p className="hint">Connecting to server…</p>}
        {connected && <p className="hint connected">Connected</p>}
        <button
          disabled={!connected}
          onClick={() => {
            setError(null);
            socket.emit('create-room');
          }}
        >
          Create room
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  if (!state) {
    return (
      <div className="screen">
        <p>Room code: <strong>{roomCode}</strong></p>
        <p>Waiting for state…</p>
      </div>
    );
  }

  const gameState = state.state;

  return (
    <div className="screen">
      <header className="room-header">
        Room: <strong>{roomCode}</strong>
      </header>
      {gameState === 'LOBBY' && (
        <Lobby state={state} onStart={() => socket.emit('start-game')} />
      )}
      {gameState === 'CATEGORY_REVEAL' && <CategoryReveal state={state} />}
      {gameState === 'ASSIGN' && (
        <Assign state={state} onAdvance={() => socket.emit('advance')} />
      )}
      {gameState === 'DRUMROLL' && <Drumroll state={state} />}
      {gameState === 'RESULTS_LOOP' && (
        <ResultsLoop state={state} onNext={() => socket.emit('advance')} />
      )}
      {gameState === 'SCORING' && <div className="view"><h2>Scoring…</h2></div>}
      {gameState === 'BETWEEN_ROUNDS' && <BetweenRounds state={state} />}
      {gameState === 'PODIUM' && <Podium state={state} />}
      {gameState === 'LEADERBOARD' && <Leaderboard state={state} />}
      {gameState === 'FINAL' && <Final state={state} />}
    </div>
  );
}
