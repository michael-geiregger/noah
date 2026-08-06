// Noahs Spiele-Werkstatt — einfacher Level-Baukasten + Spielmodus
// Alles läuft lokal im Browser, Spiele werden in localStorage gespeichert.

const STORAGE_KEY = "noah_games";

const TOOLS = [
  { id: "empty", icon: "⬜", label: "Leer" },
  { id: "wall", icon: "🧱", label: "Wand" },
  { id: "start", icon: "🚩", label: "Start" },
  { id: "goal", icon: "🏁", label: "Ziel" },
  { id: "coin", icon: "🪙", label: "Münze" },
  { id: "enemy", icon: "👾", label: "Gegner" },
];

const TILE_ICON = {
  empty: "",
  wall: "🧱",
  start: "🚩",
  goal: "🏁",
  coin: "🪙",
  enemy: "👾",
};

// ---------- Storage helpers ----------

function loadGames() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveGames(games) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function makeEmptyGrid(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => "empty"));
}

// ---------- Screen management ----------

const screens = {
  home: document.getElementById("screen-home"),
  newgame: document.getElementById("screen-newgame"),
  editor: document.getElementById("screen-editor"),
  play: document.getElementById("screen-play"),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

// ---------- Home screen ----------

function renderHome() {
  const games = loadGames();
  const list = document.getElementById("game-list");
  const emptyHint = document.getElementById("empty-hint");
  list.innerHTML = "";

  if (games.length === 0) {
    emptyHint.classList.remove("hidden");
  } else {
    emptyHint.classList.add("hidden");
  }

  games.forEach((game) => {
    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML = `
      <h3>${escapeHtml(game.name)}</h3>
      <div class="size-label">${game.size}×${game.size}</div>
      <div class="card-actions">
        <button class="btn-play" data-id="${game.id}">▶️ Spielen</button>
        <button class="btn-edit" data-id="${game.id}">✏️ Bearbeiten</button>
        <button class="btn-delete" data-id="${game.id}">🗑️</button>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll(".btn-play").forEach((btn) =>
    btn.addEventListener("click", () => startPlay(btn.dataset.id))
  );
  list.querySelectorAll(".btn-edit").forEach((btn) =>
    btn.addEventListener("click", () => openEditor(btn.dataset.id))
  );
  list.querySelectorAll(".btn-delete").forEach((btn) =>
    btn.addEventListener("click", () => deleteGame(btn.dataset.id))
  );
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function deleteGame(id) {
  if (!confirm("Dieses Spiel wirklich löschen?")) return;
  const games = loadGames().filter((g) => g.id !== id);
  saveGames(games);
  renderHome();
}

// ---------- New game flow ----------

document.getElementById("btn-new-game").addEventListener("click", () => {
  showScreen("newgame");
});

document.getElementById("btn-cancel-new").addEventListener("click", () => {
  showScreen("home");
});

document.querySelectorAll(".size-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const size = parseInt(btn.dataset.size, 10);
    const newGame = {
      id: "g" + Date.now(),
      name: "Mein Spiel",
      size,
      tiles: makeEmptyGrid(size),
    };
    openEditor(null, newGame);
  });
});

// ---------- Editor ----------

let editorGame = null;
let editorIsNew = false;
let selectedTool = "wall";

function openEditor(id, freshGame) {
  if (freshGame) {
    editorGame = freshGame;
    editorIsNew = true;
  } else {
    const games = loadGames();
    const found = games.find((g) => g.id === id);
    if (!found) return;
    editorGame = JSON.parse(JSON.stringify(found));
    editorIsNew = false;
  }
  document.getElementById("game-name").value = editorGame.name;
  renderPalette();
  renderEditorGrid();
  updateEditorStatus();
  showScreen("editor");
}

function renderPalette() {
  const palette = document.getElementById("palette");
  palette.innerHTML = "";
  TOOLS.forEach((tool) => {
    const btn = document.createElement("button");
    btn.className = "tool-btn" + (tool.id === selectedTool ? " selected" : "");
    btn.innerHTML = `${tool.icon}<span class="label">${tool.label}</span>`;
    btn.addEventListener("click", () => {
      selectedTool = tool.id;
      renderPalette();
    });
    palette.appendChild(btn);
  });
}

function renderEditorGrid() {
  const grid = document.getElementById("editor-grid");
  grid.style.gridTemplateColumns = `repeat(${editorGame.size}, var(--tile-size))`;
  grid.innerHTML = "";

  let painting = false;

  for (let r = 0; r < editorGame.size; r++) {
    for (let c = 0; c < editorGame.size; c++) {
      const cell = document.createElement("div");
      const tile = editorGame.tiles[r][c];
      cell.className = "cell " + tile;
      cell.textContent = TILE_ICON[tile];
      cell.dataset.r = r;
      cell.dataset.c = c;

      cell.addEventListener("mousedown", () => {
        painting = true;
        paintCell(r, c);
      });
      cell.addEventListener("mouseenter", () => {
        if (painting) paintCell(r, c);
      });
      cell.addEventListener("touchstart", (e) => {
        e.preventDefault();
        paintCell(r, c);
      });

      grid.appendChild(cell);
    }
  }

  document.addEventListener("mouseup", () => (painting = false));
}

function paintCell(r, c) {
  const size = editorGame.size;
  // Start und Ziel dürfen jeweils nur einmal existieren
  if (selectedTool === "start" || selectedTool === "goal") {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (editorGame.tiles[i][j] === selectedTool) {
          editorGame.tiles[i][j] = "empty";
        }
      }
    }
  }
  editorGame.tiles[r][c] = selectedTool;
  renderEditorGrid();
  updateEditorStatus();
}

function updateEditorStatus() {
  const status = document.getElementById("editor-status");
  const { hasStart, hasGoal } = analyzeGrid(editorGame.tiles);
  if (!hasStart && !hasGoal) {
    status.textContent = "Setze zuerst einen Start 🚩 und ein Ziel 🏁";
  } else if (!hasStart) {
    status.textContent = "Setze noch einen Start 🚩";
  } else if (!hasGoal) {
    status.textContent = "Setze noch ein Ziel 🏁";
  } else {
    status.textContent = "Bereit zum Speichern! 🎉";
  }
}

function analyzeGrid(tiles) {
  let hasStart = false;
  let hasGoal = false;
  let coinCount = 0;
  tiles.forEach((row) =>
    row.forEach((t) => {
      if (t === "start") hasStart = true;
      if (t === "goal") hasGoal = true;
      if (t === "coin") coinCount++;
    })
  );
  return { hasStart, hasGoal, coinCount };
}

document.getElementById("btn-cancel-editor").addEventListener("click", () => {
  showScreen("home");
});

document.getElementById("btn-save-game").addEventListener("click", () => {
  const { hasStart, hasGoal } = analyzeGrid(editorGame.tiles);
  if (!hasStart || !hasGoal) {
    alert("Dein Spiel braucht einen Start 🚩 und ein Ziel 🏁, bevor du es speichern kannst.");
    return;
  }
  const nameInput = document.getElementById("game-name").value.trim();
  editorGame.name = nameInput || "Mein Spiel";

  const games = loadGames();
  const idx = games.findIndex((g) => g.id === editorGame.id);
  if (idx >= 0) {
    games[idx] = editorGame;
  } else {
    games.push(editorGame);
  }
  saveGames(games);
  renderHome();
  showScreen("home");
});

// ---------- Play mode ----------

let playState = null;

function startPlay(id) {
  const games = loadGames();
  const game = games.find((g) => g.id === id);
  if (!game) return;

  const tiles = JSON.parse(JSON.stringify(game.tiles));
  let start = null;
  let totalCoins = 0;
  tiles.forEach((row, r) =>
    row.forEach((t, c) => {
      if (t === "start") start = { r, c };
      if (t === "coin") totalCoins++;
    })
  );

  playState = {
    id: game.id,
    name: game.name,
    size: game.size,
    tiles,
    player: { ...start },
    startPos: { ...start },
    collected: 0,
    totalCoins,
    finished: false,
  };

  document.getElementById("play-title").textContent = "🕹️ " + game.name;
  document.getElementById("play-message").textContent = "";
  renderPlayGrid();
  updateScore();
  showScreen("play");
}

function renderPlayGrid() {
  const grid = document.getElementById("play-grid");
  grid.style.gridTemplateColumns = `repeat(${playState.size}, var(--tile-size))`;
  grid.innerHTML = "";

  for (let r = 0; r < playState.size; r++) {
    for (let c = 0; c < playState.size; c++) {
      const cell = document.createElement("div");
      const tile = playState.tiles[r][c];
      const isPlayer = playState.player.r === r && playState.player.c === c;
      cell.className = "cell " + tile + (isPlayer ? " player" : "");
      cell.textContent = isPlayer ? "🙂" : TILE_ICON[tile];
      grid.appendChild(cell);
    }
  }
}

function updateScore() {
  document.getElementById("score-display").textContent =
    `🪙 ${playState.collected} / ${playState.totalCoins}`;
}

function movePlayer(dr, dc) {
  if (!playState || playState.finished) return;
  const { r, c } = playState.player;
  const nr = r + dr;
  const nc = c + dc;
  if (nr < 0 || nc < 0 || nr >= playState.size || nc >= playState.size) return;

  const targetTile = playState.tiles[nr][nc];
  if (targetTile === "wall") return;

  playState.player = { r: nr, c: nc };

  if (targetTile === "coin") {
    playState.tiles[nr][nc] = "empty";
    playState.collected++;
    updateScore();
  } else if (targetTile === "enemy") {
    document.getElementById("play-message").textContent = "Autsch! Nochmal von vorne 😵";
    playState.player = { ...playState.startPos };
  } else if (targetTile === "goal") {
    playState.finished = true;
    document.getElementById("play-message").textContent =
      playState.collected === playState.totalCoins
        ? "Geschafft! Alle Münzen eingesammelt! 🏆"
        : "Ziel erreicht! 🎉";
  }

  renderPlayGrid();
}

document.getElementById("dpad-up").addEventListener("click", () => movePlayer(-1, 0));
document.getElementById("dpad-down").addEventListener("click", () => movePlayer(1, 0));
document.getElementById("dpad-left").addEventListener("click", () => movePlayer(0, -1));
document.getElementById("dpad-right").addEventListener("click", () => movePlayer(0, 1));

document.addEventListener("keydown", (e) => {
  if (screens.play.classList.contains("hidden")) return;
  switch (e.key) {
    case "ArrowUp":
    case "w":
      movePlayer(-1, 0);
      break;
    case "ArrowDown":
    case "s":
      movePlayer(1, 0);
      break;
    case "ArrowLeft":
    case "a":
      movePlayer(0, -1);
      break;
    case "ArrowRight":
    case "d":
      movePlayer(0, 1);
      break;
  }
});

document.getElementById("btn-restart-play").addEventListener("click", () => {
  startPlay(playState.id);
});

document.getElementById("btn-back-play").addEventListener("click", () => {
  showScreen("home");
  renderHome();
});

// ---------- Init ----------

renderHome();
