// Noahs Spiele-Werkstatt — Baukasten für mehrere Spiel-Arten
// Alles läuft lokal im Browser, Spiele werden in localStorage gespeichert.

const STORAGE_KEY = "noah_games";

const TYPE_META = {
  maze: { icon: "🌀", label: "Irrgarten" },
  quiz: { icon: "❓", label: "Quiz" },
  memory: { icon: "🧠", label: "Memory" },
  jump: { icon: "🏃", label: "Hüpf-Spiel" },
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

function upsertGame(game) {
  const games = loadGames();
  const idx = games.findIndex((g) => g.id === game.id);
  if (idx >= 0) games[idx] = game;
  else games.push(game);
  saveGames(games);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// KEY BINDINGS (konfigurierbare Steuerung)
// ============================================================

const KEYBINDINGS_STORAGE_KEY = "noah_keybindings";

const DEFAULT_KEY_BINDINGS = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  jump: " ",
};

const KEY_ACTION_LABELS = {
  up: "⬆️ Hoch",
  down: "⬇️ Runter",
  left: "⬅️ Links",
  right: "➡️ Rechts",
  jump: "🏃 Springen",
};

function loadKeyBindings() {
  try {
    const raw = localStorage.getItem(KEYBINDINGS_STORAGE_KEY);
    return raw ? { ...DEFAULT_KEY_BINDINGS, ...JSON.parse(raw) } : { ...DEFAULT_KEY_BINDINGS };
  } catch (e) {
    return { ...DEFAULT_KEY_BINDINGS };
  }
}

function saveKeyBindings(bindings) {
  localStorage.setItem(KEYBINDINGS_STORAGE_KEY, JSON.stringify(bindings));
}

let keyBindings = loadKeyBindings();

function keyLabel(key) {
  const map = {
    " ": "Leertaste", "ArrowUp": "⬆️", "ArrowDown": "⬇️", "ArrowLeft": "⬅️", "ArrowRight": "➡️",
    "Enter": "Enter", "Shift": "Shift", "Control": "Strg", "Alt": "Alt", "Tab": "Tab",
  };
  if (map[key]) return map[key];
  if (key.length === 1) return key.toUpperCase();
  return key;
}

let listeningAction = null;

function renderKeySettings() {
  const list = document.getElementById("key-settings-list");
  list.innerHTML = "";
  Object.keys(KEY_ACTION_LABELS).forEach((action) => {
    const row = document.createElement("div");
    row.className = "key-settings-row";
    const isListening = listeningAction === action;
    row.innerHTML = `
      <span class="action-label">${KEY_ACTION_LABELS[action]}</span>
      <span>
        <span class="key-badge${isListening ? " listening" : ""}">${isListening ? "Drücke..." : keyLabel(keyBindings[action])}</span>
        <button class="btn-change-key" data-action="${action}">Ändern</button>
      </span>
    `;
    row.querySelector(".btn-change-key").addEventListener("click", () => {
      listeningAction = action;
      renderKeySettings();
    });
    list.appendChild(row);
  });
}

document.addEventListener("keydown", (e) => {
  if (!listeningAction) return;
  e.preventDefault();
  if (e.key !== "Escape") {
    keyBindings[listeningAction] = e.key;
    saveKeyBindings(keyBindings);
  }
  listeningAction = null;
  renderKeySettings();
});

document.getElementById("btn-open-settings").addEventListener("click", () => {
  listeningAction = null;
  renderKeySettings();
  showScreen("settings");
});
document.getElementById("btn-back-settings").addEventListener("click", () => {
  listeningAction = null;
  showScreen("home");
});
document.getElementById("btn-reset-keys").addEventListener("click", () => {
  keyBindings = { ...DEFAULT_KEY_BINDINGS };
  saveKeyBindings(keyBindings);
  renderKeySettings();
});

// ---------- Screen management ----------

const screens = {};
document.querySelectorAll(".screen").forEach((el) => {
  screens[el.id.replace("screen-", "")] = el;
});

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

// ============================================================
// HOME SCREEN
// ============================================================

function renderHome() {
  stopAllGameLoops();
  const games = loadGames();
  const list = document.getElementById("game-list");
  const emptyHint = document.getElementById("empty-hint");
  list.innerHTML = "";
  emptyHint.classList.toggle("hidden", games.length !== 0);

  games.forEach((game) => {
    const meta = TYPE_META[game.type] || { icon: "🎮", label: "Spiel" };
    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML = `
      <div class="type-badge">${meta.icon} ${meta.label}</div>
      <h3>${escapeHtml(game.name)}</h3>
      <div class="card-actions">
        <button class="btn-play" data-id="${game.id}">▶️ Spielen</button>
        <button class="btn-edit" data-id="${game.id}">✏️ Bearbeiten</button>
        <button class="btn-delete" data-id="${game.id}">🗑️</button>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll(".btn-play").forEach((btn) =>
    btn.addEventListener("click", () => playGame(btn.dataset.id))
  );
  list.querySelectorAll(".btn-edit").forEach((btn) =>
    btn.addEventListener("click", () => editGame(btn.dataset.id))
  );
  list.querySelectorAll(".btn-delete").forEach((btn) =>
    btn.addEventListener("click", () => deleteGame(btn.dataset.id))
  );
}

function deleteGame(id) {
  if (!confirm("Dieses Spiel wirklich löschen?")) return;
  saveGames(loadGames().filter((g) => g.id !== id));
  renderHome();
}

function playGame(id) {
  const game = loadGames().find((g) => g.id === id);
  if (!game) return;
  if (game.type === "maze") startMazePlay(game);
  else if (game.type === "quiz") startQuizPlay(game);
  else if (game.type === "memory") startMemoryPlay(game);
  else if (game.type === "jump") startJumpPlay(game);
}

function editGame(id) {
  const game = loadGames().find((g) => g.id === id);
  if (!game) return;
  if (game.type === "maze") openMazeEditor(JSON.parse(JSON.stringify(game)));
  else if (game.type === "quiz") openQuizEditor(JSON.parse(JSON.stringify(game)));
  else if (game.type === "memory") openMemoryEditor(JSON.parse(JSON.stringify(game)));
  else if (game.type === "jump") openJumpEditor(JSON.parse(JSON.stringify(game)));
}

function stopAllGameLoops() {
  stopJumpLoop();
}

document.getElementById("btn-new-game").addEventListener("click", () => {
  showScreen("typepicker");
});
document.getElementById("btn-cancel-typepicker").addEventListener("click", () => {
  showScreen("home");
});
document.querySelectorAll(".type-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type;
    if (type === "maze") showScreen("maze-size");
    else if (type === "quiz") openQuizEditor(null);
    else if (type === "memory") openMemoryEditor(null);
    else if (type === "jump") openJumpEditor(null);
  });
});

// ============================================================
// MAZE (Irrgarten)
// ============================================================

const MAZE_TOOLS = [
  { id: "empty", icon: "⬜", label: "Leer" },
  { id: "wall", icon: "🧱", label: "Wand" },
  { id: "start", icon: "🚩", label: "Start" },
  { id: "goal", icon: "🏁", label: "Ziel" },
  { id: "coin", icon: "🪙", label: "Münze" },
  { id: "enemy", icon: "👾", label: "Gegner" },
];
const MAZE_TILE_ICON = { empty: "", wall: "🧱", start: "🚩", goal: "🏁", coin: "🪙", enemy: "👾" };

function makeEmptyGrid(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => "empty"));
}

document.querySelectorAll(".size-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const size = parseInt(btn.dataset.size, 10);
    openMazeEditor({
      id: "g" + Date.now(),
      type: "maze",
      name: "Mein Irrgarten",
      config: { size, tiles: makeEmptyGrid(size) },
    });
  });
});
document.getElementById("btn-cancel-maze-size").addEventListener("click", () => showScreen("typepicker"));

let mazeGame = null;
let mazeSelectedTool = "wall";

function openMazeEditor(game) {
  mazeGame = game;
  document.getElementById("maze-name").value = mazeGame.name;
  renderMazePalette();
  renderMazeEditorGrid();
  updateMazeEditorStatus();
  showScreen("maze-editor");
}

function renderMazePalette() {
  const palette = document.getElementById("maze-palette");
  palette.innerHTML = "";
  MAZE_TOOLS.forEach((tool) => {
    const btn = document.createElement("button");
    btn.className = "tool-btn" + (tool.id === mazeSelectedTool ? " selected" : "");
    btn.innerHTML = `${tool.icon}<span class="label">${tool.label}</span>`;
    btn.addEventListener("click", () => {
      mazeSelectedTool = tool.id;
      renderMazePalette();
    });
    palette.appendChild(btn);
  });
}

function renderMazeEditorGrid() {
  const grid = document.getElementById("maze-editor-grid");
  const size = mazeGame.config.size;
  grid.style.gridTemplateColumns = `repeat(${size}, var(--tile-size))`;
  grid.innerHTML = "";
  let painting = false;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement("div");
      const tile = mazeGame.config.tiles[r][c];
      cell.className = "cell " + tile;
      cell.textContent = MAZE_TILE_ICON[tile];
      cell.addEventListener("mousedown", () => { painting = true; paintMazeCell(r, c); });
      cell.addEventListener("mouseenter", () => { if (painting) paintMazeCell(r, c); });
      cell.addEventListener("touchstart", (e) => { e.preventDefault(); paintMazeCell(r, c); });
      grid.appendChild(cell);
    }
  }
  document.addEventListener("mouseup", () => (painting = false));
}

function paintMazeCell(r, c) {
  const size = mazeGame.config.size;
  if (mazeSelectedTool === "start" || mazeSelectedTool === "goal") {
    for (let i = 0; i < size; i++)
      for (let j = 0; j < size; j++)
        if (mazeGame.config.tiles[i][j] === mazeSelectedTool) mazeGame.config.tiles[i][j] = "empty";
  }
  mazeGame.config.tiles[r][c] = mazeSelectedTool;
  renderMazeEditorGrid();
  updateMazeEditorStatus();
}

function analyzeMazeGrid(tiles) {
  let hasStart = false, hasGoal = false;
  tiles.forEach((row) => row.forEach((t) => {
    if (t === "start") hasStart = true;
    if (t === "goal") hasGoal = true;
  }));
  return { hasStart, hasGoal };
}

function updateMazeEditorStatus() {
  const status = document.getElementById("maze-editor-status");
  const { hasStart, hasGoal } = analyzeMazeGrid(mazeGame.config.tiles);
  if (!hasStart && !hasGoal) status.textContent = "Setze zuerst einen Start 🚩 und ein Ziel 🏁";
  else if (!hasStart) status.textContent = "Setze noch einen Start 🚩";
  else if (!hasGoal) status.textContent = "Setze noch ein Ziel 🏁";
  else status.textContent = "Bereit zum Speichern! 🎉";
}

document.getElementById("btn-cancel-maze-editor").addEventListener("click", () => showScreen("home"));
document.getElementById("btn-save-maze").addEventListener("click", () => {
  const { hasStart, hasGoal } = analyzeMazeGrid(mazeGame.config.tiles);
  if (!hasStart || !hasGoal) {
    alert("Dein Irrgarten braucht einen Start 🚩 und ein Ziel 🏁, bevor du ihn speichern kannst.");
    return;
  }
  mazeGame.name = document.getElementById("maze-name").value.trim() || "Mein Irrgarten";
  upsertGame(mazeGame);
  renderHome();
  showScreen("home");
});

let mazePlayState = null;

function startMazePlay(game) {
  const tiles = JSON.parse(JSON.stringify(game.config.tiles));
  let start = null, totalCoins = 0;
  tiles.forEach((row, r) => row.forEach((t, c) => {
    if (t === "start") start = { r, c };
    if (t === "coin") totalCoins++;
  }));

  mazePlayState = {
    id: game.id, name: game.name, size: game.config.size, tiles,
    player: { ...start }, startPos: { ...start },
    collected: 0, totalCoins, finished: false,
  };

  document.getElementById("maze-play-title").textContent = "🕹️ " + game.name;
  document.getElementById("maze-play-message").textContent = "";
  renderMazePlayGrid();
  updateMazeScore();
  showScreen("maze-play");
}

function renderMazePlayGrid() {
  const grid = document.getElementById("maze-play-grid");
  grid.style.gridTemplateColumns = `repeat(${mazePlayState.size}, var(--tile-size))`;
  grid.innerHTML = "";
  for (let r = 0; r < mazePlayState.size; r++) {
    for (let c = 0; c < mazePlayState.size; c++) {
      const cell = document.createElement("div");
      const tile = mazePlayState.tiles[r][c];
      const isPlayer = mazePlayState.player.r === r && mazePlayState.player.c === c;
      cell.className = "cell " + tile + (isPlayer ? " player" : "");
      cell.textContent = isPlayer ? "🙂" : MAZE_TILE_ICON[tile];
      grid.appendChild(cell);
    }
  }
}

function updateMazeScore() {
  document.getElementById("maze-score-display").textContent =
    `🪙 ${mazePlayState.collected} / ${mazePlayState.totalCoins}`;
}

function moveMazePlayer(dr, dc) {
  if (!mazePlayState || mazePlayState.finished) return;
  const { r, c } = mazePlayState.player;
  const nr = r + dr, nc = c + dc;
  if (nr < 0 || nc < 0 || nr >= mazePlayState.size || nc >= mazePlayState.size) return;
  const targetTile = mazePlayState.tiles[nr][nc];
  if (targetTile === "wall") return;

  mazePlayState.player = { r: nr, c: nc };
  if (targetTile === "coin") {
    mazePlayState.tiles[nr][nc] = "empty";
    mazePlayState.collected++;
    updateMazeScore();
  } else if (targetTile === "enemy") {
    document.getElementById("maze-play-message").textContent = "Autsch! Nochmal von vorne 😵";
    mazePlayState.player = { ...mazePlayState.startPos };
  } else if (targetTile === "goal") {
    mazePlayState.finished = true;
    document.getElementById("maze-play-message").textContent =
      mazePlayState.collected === mazePlayState.totalCoins
        ? "Geschafft! Alle Münzen eingesammelt! 🏆" : "Ziel erreicht! 🎉";
  }
  renderMazePlayGrid();
}

document.getElementById("maze-dpad-up").addEventListener("click", () => moveMazePlayer(-1, 0));
document.getElementById("maze-dpad-down").addEventListener("click", () => moveMazePlayer(1, 0));
document.getElementById("maze-dpad-left").addEventListener("click", () => moveMazePlayer(0, -1));
document.getElementById("maze-dpad-right").addEventListener("click", () => moveMazePlayer(0, 1));

document.addEventListener("keydown", (e) => {
  if (listeningAction) return;
  if (!screens["maze-play"].classList.contains("hidden")) {
    if (e.key === keyBindings.up) moveMazePlayer(-1, 0);
    else if (e.key === keyBindings.down) moveMazePlayer(1, 0);
    else if (e.key === keyBindings.left) moveMazePlayer(0, -1);
    else if (e.key === keyBindings.right) moveMazePlayer(0, 1);
  }
});

document.getElementById("btn-restart-maze-play").addEventListener("click", () => {
  const game = loadGames().find((g) => g.id === mazePlayState.id);
  if (game) startMazePlay(game);
});
document.getElementById("btn-back-maze-play").addEventListener("click", () => { showScreen("home"); renderHome(); });

// ============================================================
// QUIZ
// ============================================================

let quizGame = null;

function openQuizEditor(game) {
  quizGame = game || {
    id: "g" + Date.now(), type: "quiz", name: "Mein Quiz",
    config: { questions: [{ text: "", options: ["", "", "", ""], correctIndex: 0 }] },
  };
  document.getElementById("quiz-name").value = quizGame.name;
  renderQuizQuestions();
  showScreen("quiz-editor");
}

function renderQuizQuestions() {
  const container = document.getElementById("quiz-questions");
  container.innerHTML = "";
  quizGame.config.questions.forEach((q, qi) => {
    const card = document.createElement("div");
    card.className = "question-card";

    const header = document.createElement("div");
    header.className = "question-card-header";
    header.innerHTML = `<strong>Frage ${qi + 1}</strong>`;
    const removeBtn = document.createElement("button");
    removeBtn.className = "btn-remove-question";
    removeBtn.textContent = "🗑️";
    removeBtn.addEventListener("click", () => {
      quizGame.config.questions.splice(qi, 1);
      renderQuizQuestions();
      updateQuizStatus();
    });
    header.appendChild(removeBtn);
    card.appendChild(header);

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.placeholder = "Deine Frage";
    textInput.value = q.text;
    textInput.addEventListener("input", () => { q.text = textInput.value; updateQuizStatus(); });
    card.appendChild(textInput);

    q.options.forEach((opt, oi) => {
      const row = document.createElement("div");
      row.className = "answer-row";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "correct-" + qi;
      radio.checked = q.correctIndex === oi;
      radio.addEventListener("change", () => { q.correctIndex = oi; });
      const optInput = document.createElement("input");
      optInput.type = "text";
      optInput.placeholder = "Antwort " + (oi + 1);
      optInput.value = opt;
      optInput.addEventListener("input", () => { q.options[oi] = optInput.value; updateQuizStatus(); });
      row.appendChild(radio);
      row.appendChild(optInput);
      card.appendChild(row);
    });

    container.appendChild(card);
  });
  updateQuizStatus();
}

document.getElementById("btn-add-question").addEventListener("click", () => {
  quizGame.config.questions.push({ text: "", options: ["", "", "", ""], correctIndex: 0 });
  renderQuizQuestions();
});

function validateQuiz() {
  const questions = quizGame.config.questions;
  if (questions.length === 0) return "Füge mindestens eine Frage hinzu.";
  for (const q of questions) {
    if (!q.text.trim()) return "Jede Frage braucht einen Text.";
    const filled = q.options.map((o) => o.trim()).filter((o) => o);
    if (filled.length < 2) return "Jede Frage braucht mindestens 2 Antworten.";
    if (!q.options[q.correctIndex] || !q.options[q.correctIndex].trim())
      return "Wähle bei jeder Frage eine ausgefüllte richtige Antwort.";
  }
  return null;
}

function updateQuizStatus() {
  const status = document.getElementById("quiz-editor-status");
  const error = validateQuiz();
  status.textContent = error || "Bereit zum Speichern! 🎉";
}

document.getElementById("btn-cancel-quiz-editor").addEventListener("click", () => showScreen("home"));
document.getElementById("btn-save-quiz").addEventListener("click", () => {
  const error = validateQuiz();
  if (error) { alert(error); return; }
  quizGame.name = document.getElementById("quiz-name").value.trim() || "Mein Quiz";
  // Leere Antwort-Slots entfernen, correctIndex neu zuordnen
  quizGame.config.questions = quizGame.config.questions.map((q) => {
    const correctText = q.options[q.correctIndex];
    const filtered = q.options.map((o) => o.trim()).filter((o) => o);
    return { text: q.text.trim(), options: filtered, correctIndex: filtered.indexOf(correctText.trim()) };
  });
  upsertGame(quizGame);
  renderHome();
  showScreen("home");
});

let quizPlayState = null;

function startQuizPlay(game) {
  quizPlayState = { id: game.id, name: game.name, questions: game.config.questions, index: 0, score: 0 };
  document.getElementById("quiz-play-title").textContent = "❓ " + game.name;
  renderQuizQuestion();
  showScreen("quiz-play");
}

function renderQuizQuestion() {
  const box = document.getElementById("quiz-question-box");
  const progress = document.getElementById("quiz-progress");
  const total = quizPlayState.questions.length;

  if (quizPlayState.index >= total) {
    progress.textContent = "";
    box.innerHTML = `
      <h3>Fertig! 🎉</h3>
      <p>Du hast ${quizPlayState.score} von ${total} richtig beantwortet!</p>
      <button id="btn-quiz-again" class="big-btn primary">🔄 Nochmal spielen</button>
    `;
    document.getElementById("btn-quiz-again").addEventListener("click", () => {
      const game = loadGames().find((g) => g.id === quizPlayState.id);
      if (game) startQuizPlay(game);
    });
    return;
  }

  progress.textContent = `Frage ${quizPlayState.index + 1} / ${total}`;
  const q = quizPlayState.questions[quizPlayState.index];
  box.innerHTML = `<h3>${escapeHtml(q.text)}</h3>`;
  q.options.forEach((opt, oi) => {
    const btn = document.createElement("button");
    btn.className = "quiz-answer-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => answerQuizQuestion(oi));
    box.appendChild(btn);
  });
}

function answerQuizQuestion(selectedIndex) {
  const q = quizPlayState.questions[quizPlayState.index];
  const buttons = document.querySelectorAll("#quiz-question-box .quiz-answer-btn");
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correctIndex) btn.classList.add("correct");
    else if (i === selectedIndex) btn.classList.add("wrong");
  });
  if (selectedIndex === q.correctIndex) quizPlayState.score++;

  const nextBtn = document.createElement("button");
  nextBtn.className = "big-btn primary";
  nextBtn.textContent = quizPlayState.index + 1 < quizPlayState.questions.length ? "Weiter ➡️" : "Fertig 🏁";
  nextBtn.addEventListener("click", () => {
    quizPlayState.index++;
    renderQuizQuestion();
  });
  document.getElementById("quiz-question-box").appendChild(nextBtn);
}

document.getElementById("btn-back-quiz-play").addEventListener("click", () => { showScreen("home"); renderHome(); });

// ============================================================
// MEMORY
// ============================================================

const MEMORY_EMOJI_SET = ["🐶","🐱","🐭","🦊","🐻","🐼","🦁","🐸","🐵","🐷","🍎","🍌","🍇","🍓","🍉","⚽","🚗","🌟","🌈","🎈"];

let memoryGame = null;

function openMemoryEditor(game) {
  memoryGame = game || { id: "g" + Date.now(), type: "memory", name: "Mein Memory", config: { pairs: [] } };
  document.getElementById("memory-name").value = memoryGame.name;
  renderMemoryPalette();
  showScreen("memory-editor");
}

function renderMemoryPalette() {
  const palette = document.getElementById("memory-palette");
  palette.innerHTML = "";
  MEMORY_EMOJI_SET.forEach((emoji) => {
    const btn = document.createElement("button");
    const selected = memoryGame.config.pairs.includes(emoji);
    btn.className = "tool-btn" + (selected ? " selected" : "");
    btn.textContent = emoji;
    btn.addEventListener("click", () => {
      const idx = memoryGame.config.pairs.indexOf(emoji);
      if (idx >= 0) memoryGame.config.pairs.splice(idx, 1);
      else if (memoryGame.config.pairs.length < 10) memoryGame.config.pairs.push(emoji);
      renderMemoryPalette();
      updateMemoryStatus();
    });
    palette.appendChild(btn);
  });
  updateMemoryStatus();
}

function updateMemoryStatus() {
  const status = document.getElementById("memory-editor-status");
  const count = memoryGame.config.pairs.length;
  if (count < 4) status.textContent = `Wähle noch mindestens ${4 - count} weitere Symbole (${count}/4)`;
  else status.textContent = `${count} Paare ausgewählt — bereit zum Speichern! 🎉`;
}

document.getElementById("btn-cancel-memory-editor").addEventListener("click", () => showScreen("home"));
document.getElementById("btn-save-memory").addEventListener("click", () => {
  if (memoryGame.config.pairs.length < 4) {
    alert("Wähle mindestens 4 Symbole aus, bevor du speicherst.");
    return;
  }
  memoryGame.name = document.getElementById("memory-name").value.trim() || "Mein Memory";
  upsertGame(memoryGame);
  renderHome();
  showScreen("home");
});

let memoryPlayState = null;

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startMemoryPlay(game) {
  const cards = shuffleArray(game.config.pairs.concat(game.config.pairs)).map((emoji, i) => ({
    id: i, emoji, revealed: false, matched: false,
  }));
  memoryPlayState = { id: game.id, name: game.name, cards, revealedIds: [], moves: 0, locked: false };
  document.getElementById("memory-play-title").textContent = "🧠 " + game.name;
  document.getElementById("memory-play-message").textContent = "";
  renderMemoryGrid();
  updateMemoryMoves();
  showScreen("memory-play");
}

function renderMemoryGrid() {
  const grid = document.getElementById("memory-grid");
  const cols = Math.ceil(Math.sqrt(memoryPlayState.cards.length));
  grid.style.gridTemplateColumns = `repeat(${cols}, var(--tile-size))`;
  grid.innerHTML = "";
  memoryPlayState.cards.forEach((card) => {
    const el = document.createElement("div");
    el.className = "memory-card" + (card.revealed || card.matched ? " revealed" : "") + (card.matched ? " matched" : "");
    el.textContent = card.revealed || card.matched ? card.emoji : "❓";
    el.addEventListener("click", () => flipMemoryCard(card.id));
    grid.appendChild(el);
  });
}

function updateMemoryMoves() {
  document.getElementById("memory-move-display").textContent = `🔄 ${memoryPlayState.moves} Züge`;
}

function flipMemoryCard(id) {
  if (memoryPlayState.locked) return;
  const card = memoryPlayState.cards.find((c) => c.id === id);
  if (!card || card.revealed || card.matched) return;

  card.revealed = true;
  memoryPlayState.revealedIds.push(id);
  renderMemoryGrid();

  if (memoryPlayState.revealedIds.length === 2) {
    memoryPlayState.moves++;
    updateMemoryMoves();
    memoryPlayState.locked = true;
    const [id1, id2] = memoryPlayState.revealedIds;
    const c1 = memoryPlayState.cards.find((c) => c.id === id1);
    const c2 = memoryPlayState.cards.find((c) => c.id === id2);

    setTimeout(() => {
      if (c1.emoji === c2.emoji) {
        c1.matched = true; c2.matched = true;
      } else {
        c1.revealed = false; c2.revealed = false;
      }
      memoryPlayState.revealedIds = [];
      memoryPlayState.locked = false;
      renderMemoryGrid();

      if (memoryPlayState.cards.every((c) => c.matched)) {
        document.getElementById("memory-play-message").textContent =
          `Geschafft in ${memoryPlayState.moves} Zügen! 🏆`;
      }
    }, 700);
  }
}

document.getElementById("btn-restart-memory-play").addEventListener("click", () => {
  const game = loadGames().find((g) => g.id === memoryPlayState.id);
  if (game) startMemoryPlay(game);
});
document.getElementById("btn-back-memory-play").addEventListener("click", () => { showScreen("home"); renderHome(); });

// ============================================================
// JUMP (Hüpf-/Ausweich-Spiel)
// ============================================================

const JUMP_PLAYER_EMOJIS = ["🙂","🐸","🐰","🦖","🐵","🚀"];
const JUMP_OBSTACLE_EMOJIS = ["🌵","🪨","👾","🔥","🧱","🕷️"];
const JUMP_SPEED_PARAMS = {
  langsam: { speed: 22, spawnMs: 1900 },
  mittel: { speed: 32, spawnMs: 1450 },
  schnell: { speed: 46, spawnMs: 1050 },
};

let jumpGame = null;
let jumpSelectedSpeed = "mittel";

function openJumpEditor(game) {
  jumpGame = game || {
    id: "g" + Date.now(), type: "jump", name: "Mein Hüpf-Spiel",
    config: { playerEmoji: "🙂", obstacleEmoji: "🌵", speed: "mittel" },
  };
  jumpSelectedSpeed = jumpGame.config.speed;
  document.getElementById("jump-name").value = jumpGame.name;
  renderJumpPalette("jump-player-palette", JUMP_PLAYER_EMOJIS, jumpGame.config.playerEmoji, (emoji) => {
    jumpGame.config.playerEmoji = emoji;
  });
  renderJumpPalette("jump-obstacle-palette", JUMP_OBSTACLE_EMOJIS, jumpGame.config.obstacleEmoji, (emoji) => {
    jumpGame.config.obstacleEmoji = emoji;
  });
  renderJumpSpeedOptions();
  showScreen("jump-editor");
}

function renderJumpPalette(containerId, emojis, selected, onSelect) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  emojis.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.className = "tool-btn" + (emoji === selected ? " selected" : "");
    btn.textContent = emoji;
    btn.addEventListener("click", () => {
      onSelect(emoji);
      renderJumpPalette(containerId, emojis, emoji, onSelect);
    });
    container.appendChild(btn);
  });
}

function renderJumpSpeedOptions() {
  document.querySelectorAll(".speed-btn").forEach((btn) => {
    btn.classList.toggle("primary", btn.dataset.speed === jumpSelectedSpeed);
    btn.classList.toggle("secondary", btn.dataset.speed !== jumpSelectedSpeed);
  });
}

document.querySelectorAll(".speed-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    jumpSelectedSpeed = btn.dataset.speed;
    jumpGame.config.speed = jumpSelectedSpeed;
    renderJumpSpeedOptions();
  });
});

document.getElementById("btn-cancel-jump-editor").addEventListener("click", () => showScreen("home"));
document.getElementById("btn-save-jump").addEventListener("click", () => {
  jumpGame.name = document.getElementById("jump-name").value.trim() || "Mein Hüpf-Spiel";
  upsertGame(jumpGame);
  renderHome();
  showScreen("home");
});

let jumpPlayState = null;

function startJumpPlay(game) {
  stopJumpLoop();
  const track = document.getElementById("jump-track");
  track.querySelectorAll(".jump-obstacle").forEach((el) => el.remove());

  const playerEl = document.getElementById("jump-player");
  playerEl.textContent = game.config.playerEmoji;
  playerEl.classList.remove("jumping");

  document.getElementById("jump-play-title").textContent = "🏃 " + game.name;
  document.getElementById("jump-play-message").textContent = "";
  document.getElementById("jump-score-display").textContent = "⭐ 0";

  jumpPlayState = {
    id: game.id, name: game.name, obstacleEmoji: game.config.obstacleEmoji,
    params: JUMP_SPEED_PARAMS[game.config.speed] || JUMP_SPEED_PARAMS.mittel,
    obstacles: [], score: 0, isJumping: false, gameOver: false, lastTime: null,
  };

  jumpPlayState.spawnInterval = setInterval(spawnJumpObstacle, jumpPlayState.params.spawnMs);
  jumpPlayState.rafId = requestAnimationFrame(jumpLoop);
  showScreen("jump-play");
}

function spawnJumpObstacle() {
  if (!jumpPlayState || jumpPlayState.gameOver) return;
  const track = document.getElementById("jump-track");
  const el = document.createElement("div");
  el.className = "jump-obstacle";
  el.textContent = jumpPlayState.obstacleEmoji;
  el.style.left = "100%";
  track.appendChild(el);
  jumpPlayState.obstacles.push({ el, x: 100, passed: false });
}

function jumpLoop(timestamp) {
  if (!jumpPlayState || jumpPlayState.gameOver) return;
  if (jumpPlayState.lastTime === null) jumpPlayState.lastTime = timestamp;
  const dt = (timestamp - jumpPlayState.lastTime) / 1000;
  jumpPlayState.lastTime = timestamp;

  jumpPlayState.obstacles.forEach((obs) => {
    obs.x -= jumpPlayState.params.speed * dt;
    obs.el.style.left = obs.x + "%";

    if (!obs.passed && obs.x < 8 && obs.x > 6 && !jumpPlayState.isJumping) {
      jumpGameOver();
    }
    if (!obs.passed && obs.x <= 0) {
      obs.passed = true;
      jumpPlayState.score++;
      document.getElementById("jump-score-display").textContent = "⭐ " + jumpPlayState.score;
    }
  });

  jumpPlayState.obstacles = jumpPlayState.obstacles.filter((obs) => {
    if (obs.x < -10) { obs.el.remove(); return false; }
    return true;
  });

  if (!jumpPlayState.gameOver) {
    jumpPlayState.rafId = requestAnimationFrame(jumpLoop);
  }
}

function jumpGameOver() {
  if (!jumpPlayState || jumpPlayState.gameOver) return;
  jumpPlayState.gameOver = true;
  clearInterval(jumpPlayState.spawnInterval);
  document.getElementById("jump-play-message").textContent =
    `Autsch! Game Over — ${jumpPlayState.score} Punkte 😵`;
}

function stopJumpLoop() {
  if (jumpPlayState) {
    clearInterval(jumpPlayState.spawnInterval);
    if (jumpPlayState.rafId) cancelAnimationFrame(jumpPlayState.rafId);
    jumpPlayState.gameOver = true;
  }
}

function doJumpJump() {
  if (!jumpPlayState || jumpPlayState.gameOver || jumpPlayState.isJumping) return;
  jumpPlayState.isJumping = true;
  const playerEl = document.getElementById("jump-player");
  playerEl.classList.add("jumping");
  setTimeout(() => {
    playerEl.classList.remove("jumping");
    if (jumpPlayState) jumpPlayState.isJumping = false;
  }, 500);
}

document.getElementById("btn-jump").addEventListener("click", doJumpJump);
document.addEventListener("keydown", (e) => {
  if (listeningAction) return;
  if (!screens["jump-play"].classList.contains("hidden") && e.key === keyBindings.jump) {
    e.preventDefault();
    doJumpJump();
  }
});

document.getElementById("btn-restart-jump-play").addEventListener("click", () => {
  const game = loadGames().find((g) => g.id === jumpPlayState.id);
  if (game) startJumpPlay(game);
});
document.getElementById("btn-back-jump-play").addEventListener("click", () => {
  stopJumpLoop();
  showScreen("home");
  renderHome();
});

// ---------- Init ----------

renderHome();
