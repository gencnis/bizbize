# Biz Bize — Real-Time Multiplayer Party Game

A Jackbox-style party game: one category (e.g. "Mahalle Düğünü"), N roles. Players assign one person in the group to each role; scoring is based on matching the majority vote, with speed and streak bonuses.

## Tech stack

- **Server**: Node.js, Express, Socket.io
- **Clients**: React (Vite) — Host UI and Player UI in a monorepo

## Project layout

- `server/` — Game server (state machine, scoring, Socket.io)
- `client/host/` — Optional host/TV app (create room, show results; advance with button)
- `client/player/` — **Main app**: create or join room, play on your phone (2–10 players)

## Run the demo locally

1. **Install dependencies** (from repo root):

   ```bash
   npm install
   ```

2. **Start the game server** (terminal 1):

   ```bash
   npm run dev:server
   ```

   Server runs at `http://localhost:3000`.

3. **Start the main game app** (terminal 2):

   ```bash
   npm run dev:player
   ```

   Open **http://localhost:5174** (or your LAN IP, e.g. `http://192.168.1.x:5174`) on every device. No separate host screen needed.

4. **Play**

   - **Create room**: one person enters their name and taps **Create room**. They get a 5-letter code and become the host (can start the game).
   - **Join**: others enter the code and their name, then **Join**.
   - **Start**: when 2–10 players are in the lobby, the host taps **Start game**.
   - **Category**: everyone sees only the category name (roles are chosen in the background).
   - **Assign**: each role is shown one at a time with a 30s timer; everyone picks one person per role on their phone.
   - **Results**: each role’s vote distribution (bar chart) is shown **on everyone’s phone**. When everyone has tapped **Next**, you go to the next role or to scoring.
   - **Leaderboard** and **Final**: same — everyone sees the same screen; when everyone taps **Next**, the game continues or ends.

   Optional: run **Host** (`npm run dev:host`, port 5173) on a TV/laptop for a big-screen view; the host can still advance with the button if you don’t use consensus.

## Game flow (states)

`LOBBY` → `CATEGORY_REVEAL` → `ASSIGN` (one role at a time, 30s each) → `DRUMROLL` → `RESULTS_LOOP` → `SCORING` → `LEADERBOARD` → `FINAL`

All game logic lives in `server/gameLogic.js`; Socket.io handlers are in `server/socketHandlers.js`. Categories and roles are defined in `server/categories.js` so you can add new categories without changing the clients.
