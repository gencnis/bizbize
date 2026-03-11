const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const { attachSocketHandlers } = require('./socketHandlers');

const PORT = process.env.PORT || 3000;

const app = express();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Biz Bize</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style="font-family: 'Nunito', system-ui, sans-serif; padding: 2rem; max-width: 480px; margin: 0 auto; background: #F6E9D4; color: #3B2A21;">
        <h1 style="font-family: 'Baloo 2', sans-serif; color: #8E5A7B;">Biz Bize</h1>
        <p>This is the game server. Use the links below to open the game:</p>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 1rem 0;"><a id="link-host" href="#" style="display: block; padding: 0.75rem; background: #FFF7EA; color: #3B2A21; text-decoration: none; border-radius: 16px; box-shadow: 0 2px 12px rgba(59,42,33,0.1);"><strong>Host</strong> — Create room, run game (port 5173)</a></li>
          <li style="margin: 1rem 0;"><a id="link-player" href="#" style="display: block; padding: 0.75rem; background: #E2B567; color: #3B2A21; text-decoration: none; border-radius: 999px; font-weight: 700;"><strong>Player</strong> — Join with room code (port 5174)</a></li>
        </ul>
        <p style="color: #3B2A21; opacity: 0.85; font-size: 0.9rem;">Links use the same address you used to open this page. <strong>Share the Player link</strong> with others on your Wi‑Fi.</p>
        <p style="color: #3B2A21; opacity: 0.85; font-size: 0.9rem;">Make sure <code>npm run dev:player</code> is running.</p>
        <script>
          (function() {
            var host = window.location.hostname;
            var base = 'http://' + host;
            document.getElementById('link-host').href = base + ':5173';
            document.getElementById('link-player').href = base + ':5174';
          })();
        </script>
      </body>
    </html>
  `);
});

app.use(cors({ origin: '*' }));

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// Helpful for debugging mobile/LAN connectivity
io.engine.on('connection_error', (err) => {
  // eslint-disable-next-line no-console
  console.log('engine.io connection_error', {
    code: err.code,
    message: err.message,
    context: err.context,
  });
});

attachSocketHandlers(io);

httpServer.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`Game server listening on http://localhost:${PORT} (and on your LAN IP, e.g. http://192.168.1.196:${PORT})`);
});

