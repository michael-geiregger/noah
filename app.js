// Noahs Spiele-Werkstatt — Baukasten für mehrere Spiel-Arten
// Alles läuft lokal im Browser, Spiele werden in localStorage gespeichert.

const STORAGE_KEY = "noah_games";

const TYPE_META = {
  maze: { icon: "🌀", label: "Irrgarten" },
  quiz: { icon: "❓", label: "Quiz" },
  memory: { icon: "🧠", label: "Memory" },
  jump: { icon: "🏃", label: "Hüpf-Spiel" },
  blocks: { icon: "🧩", label: "Eigenes Spiel" },
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
  else if (game.type === "blocks") startBlocksPlay(game);
}

function editGame(id) {
  const game = loadGames().find((g) => g.id === id);
  if (!game) return;
  if (game.type === "maze") openMazeEditor(JSON.parse(JSON.stringify(game)));
  else if (game.type === "quiz") openQuizEditor(JSON.parse(JSON.stringify(game)));
  else if (game.type === "memory") openMemoryEditor(JSON.parse(JSON.stringify(game)));
  else if (game.type === "jump") openJumpEditor(JSON.parse(JSON.stringify(game)));
  else if (game.type === "blocks") openBlocksEditor(JSON.parse(JSON.stringify(game)));
}

function stopAllGameLoops() {
  stopJumpLoop();
  stopBlocksLoop();
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
    else if (type === "blocks") openBlocksEditor(null);
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

// ============================================================
// BLOCKS ("Eigenes Spiel" — Baukasten wie MakeCode)
// ============================================================

const SPRITE_SIZE = 10;
const PIXEL_COLORS = ["#e74c3c","#e67e22","#f1c40f","#2ecc71","#1abc9c","#3498db","#9b59b6","#e84393","#795548","#000000","#ffffff","#95a5a6"];
const STAGE_COLS = 10, STAGE_ROWS = 6;
const BLOCKS_CANVAS_W = 320, BLOCKS_CANVAS_H = 200;
const SPRITE_DRAW_PX = 24;
const TOUCH_THRESHOLD_X = (SPRITE_DRAW_PX / BLOCKS_CANVAS_W) * 100;
const TOUCH_THRESHOLD_Y = (SPRITE_DRAW_PX / BLOCKS_CANVAS_H) * 100;
const EDGE_MARGIN_X = TOUCH_THRESHOLD_X / 2;
const EDGE_MARGIN_Y = TOUCH_THRESHOLD_Y / 2;

const BLOCK_CATEGORY_LABELS = {
  bewegen: "🏃 Bewegen", aussehen: "👀 Aussehen", ton: "🔊 Ton",
  punkte: "⭐ Punkte", steuerung: "🔁 Steuerung", spiel: "🏁 Spiel-Ende",
};

const BLOCK_DEFS = {
  move: { cat: "bewegen", label: "Bewege", params: [
    { name: "sprite", type: "sprite" },
    { name: "dx", type: "number", label: "X", default: 5 },
    { name: "dy", type: "number", label: "Y", default: 0 },
  ]},
  setPos: { cat: "bewegen", label: "Setze Position von", params: [
    { name: "sprite", type: "sprite" },
    { name: "x", type: "number", label: "X", default: 50 },
    { name: "y", type: "number", label: "Y", default: 50 },
  ]},
  setVelocity: { cat: "bewegen", label: "Setze Geschwindigkeit von", params: [
    { name: "sprite", type: "sprite" },
    { name: "vx", type: "number", label: "X/Sek", default: 10 },
    { name: "vy", type: "number", label: "Y/Sek", default: 0 },
  ]},
  bounce: { cat: "bewegen", label: "Lasse am Rand abprallen:", params: [
    { name: "sprite", type: "sprite" },
  ]},
  showText: { cat: "aussehen", label: "Zeige Text", params: [
    { name: "text", type: "text", default: "Hallo!" },
    { name: "seconds", type: "number", label: "Sek.", default: 2 },
  ]},
  setVisible: { cat: "aussehen", label: "Figur", params: [
    { name: "sprite", type: "sprite" },
    { name: "visible", type: "select", default: "true", options: [
      { value: "true", label: "zeigen" }, { value: "false", label: "verstecken" },
    ]},
  ]},
  playSound: { cat: "ton", label: "Spiele Ton", params: [
    { name: "tone", type: "select", default: "mid", options: [
      { value: "low", label: "tief" }, { value: "mid", label: "mittel" }, { value: "high", label: "hoch" },
    ]},
  ]},
  changeScore: { cat: "punkte", label: "Ändere Punktzahl um", params: [
    { name: "amount", type: "number", default: 1 },
  ]},
  setScore: { cat: "punkte", label: "Setze Punktzahl auf", params: [
    { name: "amount", type: "number", default: 0 },
  ]},
  wait: { cat: "steuerung", label: "Warte", params: [
    { name: "seconds", type: "number", label: "Sek.", default: 1 },
  ]},
  repeat: { cat: "steuerung", label: "Wiederhole", params: [
    { name: "count", type: "number", default: 5 },
  ], hasBody: true },
  ifBlock: { cat: "steuerung", label: "Falls", params: [
    { name: "condition", type: "condition" },
  ], hasBody: true, hasElse: true },
  endGame: { cat: "spiel", label: "Beende Spiel:", params: [
    { name: "result", type: "select", default: "win", options: [
      { value: "win", label: "🏆 gewonnen" }, { value: "lose", label: "😵 verloren" },
    ]},
    { name: "message", type: "text", default: "Geschafft!" },
  ]},
};

const EVENT_DEFS = {
  start: { label: "🏁 Beim Start", params: [] },
  forever: { label: "🔁 Dauerschleife", params: [] },
  key: { label: "⌨️ Bei Tastendruck", params: [{ name: "key", type: "key", default: "ArrowUp" }] },
  collision: { label: "💥 Bei Berührung", params: [
    { name: "spriteA", type: "sprite", default: "" }, { name: "spriteB", type: "sprite", default: "" },
  ]},
  timer: { label: "⏱️ Alle X Sekunden", params: [{ name: "seconds", type: "number", default: 3 }] },
};

// ---------- Sprite drawing helpers ----------

function makeEmptySpritePixels() {
  return Array.from({ length: SPRITE_SIZE }, () => Array.from({ length: SPRITE_SIZE }, () => null));
}

function drawSpriteOnCanvas(canvas, sprite) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!sprite) return;
  const cell = canvas.width / SPRITE_SIZE;
  for (let r = 0; r < SPRITE_SIZE; r++) {
    for (let c = 0; c < SPRITE_SIZE; c++) {
      const color = sprite.pixels[r][c];
      if (color) { ctx.fillStyle = color; ctx.fillRect(c * cell, r * cell, cell, cell); }
    }
  }
}

function drawSpriteAt(ctx, sprite, px, py, size) {
  if (!sprite) return;
  const cell = size / SPRITE_SIZE;
  const startX = px - size / 2, startY = py - size / 2;
  for (let r = 0; r < SPRITE_SIZE; r++) {
    for (let c = 0; c < SPRITE_SIZE; c++) {
      const color = sprite.pixels[r][c];
      if (color) { ctx.fillStyle = color; ctx.fillRect(startX + c * cell, startY + r * cell, cell, cell); }
    }
  }
}

// ---------- Generic param controls ----------

let listeningBlockKeyCallback = null;

document.addEventListener("keydown", (e) => {
  if (!listeningBlockKeyCallback) return;
  e.preventDefault();
  const cb = listeningBlockKeyCallback;
  listeningBlockKeyCallback = null;
  if (e.key !== "Escape") cb(e.key);
});

function getInstanceOptions() {
  const options = blocksGame.config.instances.map((i) => ({ value: i.id, label: i.name }));
  return options.length ? options : [{ value: "", label: "(keine Figur)" }];
}

function makeParamControl(param, currentValue, onChange) {
  const wrap = document.createElement("span");
  wrap.style.display = "inline-flex";
  wrap.style.alignItems = "center";
  wrap.style.gap = "3px";
  if (param.label) {
    const lbl = document.createElement("span");
    lbl.textContent = param.label + ":";
    wrap.appendChild(lbl);
  }
  if (param.type === "number") {
    const input = document.createElement("input");
    input.type = "number";
    input.value = currentValue;
    input.addEventListener("change", () => onChange(parseFloat(input.value) || 0));
    wrap.appendChild(input);
  } else if (param.type === "text") {
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentValue;
    input.addEventListener("change", () => onChange(input.value));
    wrap.appendChild(input);
  } else if (param.type === "select") {
    const select = document.createElement("select");
    param.options.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value; o.textContent = opt.label;
      if (String(opt.value) === String(currentValue)) o.selected = true;
      select.appendChild(o);
    });
    select.addEventListener("change", () => onChange(select.value));
    wrap.appendChild(select);
  } else if (param.type === "sprite") {
    const select = document.createElement("select");
    const options = getInstanceOptions();
    let value = currentValue;
    if (!options.some((o) => o.value === value) && options.length) value = options[0].value;
    options.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value; o.textContent = opt.label;
      if (opt.value === value) o.selected = true;
      select.appendChild(o);
    });
    if (value !== currentValue) onChange(value);
    select.addEventListener("change", () => onChange(select.value));
    wrap.appendChild(select);
  } else if (param.type === "key") {
    const badge = document.createElement("span");
    badge.className = "key-badge";
    badge.textContent = keyLabel(currentValue);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-change-key";
    btn.textContent = "Taste wählen";
    btn.addEventListener("click", () => {
      badge.textContent = "Drücke...";
      badge.classList.add("listening");
      listeningBlockKeyCallback = (key) => onChange(key);
    });
    wrap.appendChild(badge);
    wrap.appendChild(btn);
  }
  return wrap;
}

function makeConditionControl(condition, rerender) {
  const wrap = document.createElement("span");
  wrap.style.display = "inline-flex";
  wrap.style.alignItems = "center";
  wrap.style.gap = "4px";
  wrap.style.flexWrap = "wrap";

  const typeSelect = document.createElement("select");
  [["touching", "Berührt"], ["keyPressed", "Taste gedrückt"], ["scoreAtLeast", "Punktzahl mind."]].forEach(([val, label]) => {
    const o = document.createElement("option");
    o.value = val; o.textContent = label;
    if (condition.type === val) o.selected = true;
    typeSelect.appendChild(o);
  });
  typeSelect.addEventListener("change", () => { condition.type = typeSelect.value; rerender(); });
  wrap.appendChild(typeSelect);

  if (condition.type === "touching") {
    wrap.appendChild(makeParamControl({ type: "sprite" }, condition.spriteA, (v) => { condition.spriteA = v; rerender(); }));
    const and = document.createElement("span");
    and.textContent = "&";
    wrap.appendChild(and);
    wrap.appendChild(makeParamControl({ type: "sprite" }, condition.spriteB, (v) => { condition.spriteB = v; rerender(); }));
  } else if (condition.type === "keyPressed") {
    wrap.appendChild(makeParamControl({ type: "key" }, condition.key, (v) => { condition.key = v; rerender(); }));
  } else if (condition.type === "scoreAtLeast") {
    wrap.appendChild(makeParamControl({ type: "number" }, condition.amount, (v) => { condition.amount = v; rerender(); }));
  }
  return wrap;
}

function makeDefaultBlock(type) {
  const def = BLOCK_DEFS[type];
  const params = {};
  def.params.forEach((p) => {
    if (p.type === "condition") params.condition = { type: "touching", spriteA: "", spriteB: "", key: "ArrowUp", amount: 0 };
    else params[p.name] = p.default;
  });
  const block = { type, params };
  if (def.hasBody) block.body = [];
  if (def.hasElse) block.elseBody = [];
  return block;
}

function makeAddBlockRow(bodyArray, ownerRerender) {
  const row = document.createElement("div");
  row.className = "block-add-row";
  const select = document.createElement("select");
  Object.entries(BLOCK_CATEGORY_LABELS).forEach(([cat, catLabel]) => {
    const group = document.createElement("optgroup");
    group.label = catLabel;
    Object.entries(BLOCK_DEFS).filter(([, def]) => def.cat === cat).forEach(([type, def]) => {
      const opt = document.createElement("option");
      opt.value = type; opt.textContent = def.label;
      group.appendChild(opt);
    });
    select.appendChild(group);
  });
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "➕ Hinzufügen";
  btn.addEventListener("click", () => { bodyArray.push(makeDefaultBlock(select.value)); ownerRerender(); });
  row.appendChild(select);
  row.appendChild(btn);
  return row;
}

function renderBlockBody(containerEl, bodyArray, ownerRerender) {
  containerEl.innerHTML = "";
  bodyArray.forEach((block, idx) => {
    const def = BLOCK_DEFS[block.type];
    const el = document.createElement("div");
    el.className = "block-piece cat-" + def.cat;

    const row = document.createElement("div");
    row.className = "block-row";
    const labelSpan = document.createElement("span");
    labelSpan.textContent = def.label;
    row.appendChild(labelSpan);

    def.params.forEach((param) => {
      if (param.type === "condition") {
        row.appendChild(makeConditionControl(block.params.condition, ownerRerender));
      } else {
        row.appendChild(makeParamControl(param, block.params[param.name], (v) => { block.params[param.name] = v; ownerRerender(); }));
      }
    });

    const controls = document.createElement("span");
    controls.className = "block-controls";
    if (idx > 0) {
      const up = document.createElement("button");
      up.type = "button"; up.textContent = "▲";
      up.addEventListener("click", () => { [bodyArray[idx - 1], bodyArray[idx]] = [bodyArray[idx], bodyArray[idx - 1]]; ownerRerender(); });
      controls.appendChild(up);
    }
    if (idx < bodyArray.length - 1) {
      const down = document.createElement("button");
      down.type = "button"; down.textContent = "▼";
      down.addEventListener("click", () => { [bodyArray[idx + 1], bodyArray[idx]] = [bodyArray[idx], bodyArray[idx + 1]]; ownerRerender(); });
      controls.appendChild(down);
    }
    const del = document.createElement("button");
    del.type = "button"; del.textContent = "✕";
    del.addEventListener("click", () => { bodyArray.splice(idx, 1); ownerRerender(); });
    controls.appendChild(del);
    row.appendChild(controls);
    el.appendChild(row);

    if (def.hasBody) {
      const bodyContainer = document.createElement("div");
      bodyContainer.className = "block-body-container";
      renderBlockBody(bodyContainer, block.body, ownerRerender);
      el.appendChild(bodyContainer);
      el.appendChild(makeAddBlockRow(block.body, ownerRerender));
    }
    if (def.hasElse) {
      const elseLabel = document.createElement("div");
      elseLabel.textContent = "sonst:";
      elseLabel.style.marginTop = "6px";
      el.appendChild(elseLabel);
      const elseContainer = document.createElement("div");
      elseContainer.className = "block-body-container";
      renderBlockBody(elseContainer, block.elseBody, ownerRerender);
      el.appendChild(elseContainer);
      el.appendChild(makeAddBlockRow(block.elseBody, ownerRerender));
    }

    containerEl.appendChild(el);
  });
}

// ---------- Editor state ----------

let blocksGame = null;
let blocksActiveTab = "sprites";
let editingSpriteDraft = null;
let selectedPixelColor = PIXEL_COLORS[0];
let placingSpriteId = null;

function openBlocksEditor(game) {
  blocksGame = game || { id: "g" + Date.now(), type: "blocks", name: "Mein Spiel", config: { sprites: [], instances: [], scripts: [] } };
  editingSpriteDraft = null;
  placingSpriteId = null;
  blocksActiveTab = "sprites";
  document.getElementById("blocks-name").value = blocksGame.name;
  renderBlocksTabs();
  showScreen("blocks-editor");
}

function renderBlocksTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === blocksActiveTab));
  document.getElementById("blocks-tab-sprites").classList.toggle("hidden", blocksActiveTab !== "sprites");
  document.getElementById("blocks-tab-stage").classList.toggle("hidden", blocksActiveTab !== "stage");
  document.getElementById("blocks-tab-scripts").classList.toggle("hidden", blocksActiveTab !== "scripts");
  renderBlocksSpritesTab();
  renderBlocksStageTab();
  renderBlocksScriptsTab();
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => { blocksActiveTab = btn.dataset.tab; renderBlocksTabs(); });
});

// ---------- Sprites tab ----------

function renderBlocksSpritesTab() {
  const container = document.getElementById("blocks-tab-sprites");
  container.innerHTML = "";

  if (editingSpriteDraft) {
    renderSpritePixelEditor(container);
    return;
  }

  const list = document.createElement("div");
  list.className = "sprite-list";
  blocksGame.config.sprites.forEach((sprite) => {
    const card = document.createElement("div");
    card.className = "sprite-card";
    const canvas = document.createElement("canvas");
    canvas.width = 40; canvas.height = 40;
    drawSpriteOnCanvas(canvas, sprite);
    card.appendChild(canvas);
    const name = document.createElement("div");
    name.className = "sprite-card-name";
    name.textContent = sprite.name;
    card.appendChild(name);
    const actions = document.createElement("div");
    actions.className = "sprite-card-actions";
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.addEventListener("click", () => {
      editingSpriteDraft = { id: sprite.id, name: sprite.name, pixels: sprite.pixels.map((row) => row.slice()) };
      renderBlocksSpritesTab();
    });
    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.addEventListener("click", () => {
      if (!confirm("Diese Figur wirklich löschen?")) return;
      blocksGame.config.sprites = blocksGame.config.sprites.filter((s) => s.id !== sprite.id);
      blocksGame.config.instances = blocksGame.config.instances.filter((i) => i.spriteId !== sprite.id);
      renderBlocksSpritesTab();
    });
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    card.appendChild(actions);
    list.appendChild(card);
  });
  container.appendChild(list);

  const addBtn = document.createElement("button");
  addBtn.className = "big-btn secondary";
  addBtn.textContent = "➕ Neue Figur";
  addBtn.addEventListener("click", () => {
    editingSpriteDraft = { id: "sp" + Date.now(), name: "Figur", pixels: makeEmptySpritePixels() };
    renderBlocksSpritesTab();
  });
  container.appendChild(addBtn);
}

function renderSpritePixelEditor(container) {
  const nameInput = document.createElement("input");
  nameInput.className = "name-input";
  nameInput.value = editingSpriteDraft.name;
  nameInput.placeholder = "Name der Figur";
  nameInput.addEventListener("input", () => { editingSpriteDraft.name = nameInput.value; });
  container.appendChild(nameInput);

  const palette = document.createElement("div");
  palette.className = "color-palette";
  PIXEL_COLORS.forEach((color) => {
    const sw = document.createElement("div");
    sw.className = "color-swatch" + (selectedPixelColor === color ? " selected" : "");
    sw.style.background = color;
    sw.addEventListener("click", () => { selectedPixelColor = color; renderSpritePixelEditor(container); });
    palette.appendChild(sw);
  });
  const eraser = document.createElement("div");
  eraser.className = "color-swatch eraser" + (selectedPixelColor === null ? " selected" : "");
  eraser.title = "Radiergummi";
  eraser.addEventListener("click", () => { selectedPixelColor = null; renderSpritePixelEditor(container); });
  palette.appendChild(eraser);
  container.appendChild(palette);

  const grid = document.createElement("div");
  grid.className = "pixel-grid";
  grid.style.gridTemplateColumns = `repeat(${SPRITE_SIZE}, 22px)`;
  let painting = false;
  const paintPixel = (r, c, cell) => {
    editingSpriteDraft.pixels[r][c] = selectedPixelColor;
    cell.style.background = selectedPixelColor || "white";
  };
  for (let r = 0; r < SPRITE_SIZE; r++) {
    for (let c = 0; c < SPRITE_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "pixel-cell";
      cell.style.background = editingSpriteDraft.pixels[r][c] || "white";
      cell.addEventListener("mousedown", () => { painting = true; paintPixel(r, c, cell); });
      cell.addEventListener("mouseenter", () => { if (painting) paintPixel(r, c, cell); });
      cell.addEventListener("touchstart", (e) => { e.preventDefault(); paintPixel(r, c, cell); });
      grid.appendChild(cell);
    }
  }
  document.addEventListener("mouseup", () => (painting = false));
  container.appendChild(grid);

  const actions = document.createElement("div");
  actions.className = "editor-actions";
  const saveBtn = document.createElement("button");
  saveBtn.className = "big-btn primary";
  saveBtn.textContent = "💾 Figur speichern";
  saveBtn.addEventListener("click", () => {
    if (!editingSpriteDraft.name.trim()) { alert("Gib deiner Figur einen Namen."); return; }
    const idx = blocksGame.config.sprites.findIndex((s) => s.id === editingSpriteDraft.id);
    const sprite = { id: editingSpriteDraft.id, name: editingSpriteDraft.name.trim(), pixels: editingSpriteDraft.pixels };
    if (idx >= 0) blocksGame.config.sprites[idx] = sprite; else blocksGame.config.sprites.push(sprite);
    editingSpriteDraft = null;
    renderBlocksSpritesTab();
  });
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "big-btn secondary";
  cancelBtn.textContent = "Abbrechen";
  cancelBtn.addEventListener("click", () => { editingSpriteDraft = null; renderBlocksSpritesTab(); });
  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  container.appendChild(actions);
}

// ---------- Stage tab ----------

function renderBlocksStageTab() {
  const container = document.getElementById("blocks-tab-stage");
  container.innerHTML = "";

  if (blocksGame.config.sprites.length === 0) {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = 'Erstelle zuerst eine Figur im Tab "Figuren".';
    container.appendChild(hint);
    return;
  }

  const hint = document.createElement("p");
  hint.className = "hint";
  hint.textContent = "Wähle eine Figur und klicke auf die Bühne, um sie zu platzieren. Klicke eine platzierte Figur an, um sie zu entfernen.";
  container.appendChild(hint);

  const palette = document.createElement("div");
  palette.className = "palette";
  blocksGame.config.sprites.forEach((sprite) => {
    const btn = document.createElement("button");
    btn.className = "tool-btn" + (placingSpriteId === sprite.id ? " selected" : "");
    const canvas = document.createElement("canvas");
    canvas.width = 28; canvas.height = 28;
    drawSpriteOnCanvas(canvas, sprite);
    btn.appendChild(canvas);
    btn.addEventListener("click", () => { placingSpriteId = sprite.id; renderBlocksStageTab(); });
    palette.appendChild(btn);
  });
  container.appendChild(palette);

  const grid = document.createElement("div");
  grid.className = "grid";
  grid.style.gridTemplateColumns = `repeat(${STAGE_COLS}, var(--tile-size))`;
  for (let r = 0; r < STAGE_ROWS; r++) {
    for (let c = 0; c < STAGE_COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const instance = blocksGame.config.instances.find((i) => i.gridR === r && i.gridC === c);
      if (instance) {
        const sprite = blocksGame.config.sprites.find((s) => s.id === instance.spriteId);
        const canvas = document.createElement("canvas");
        canvas.width = 30; canvas.height = 30;
        drawSpriteOnCanvas(canvas, sprite);
        cell.appendChild(canvas);
        cell.addEventListener("click", () => {
          if (!confirm(`"${instance.name}" von der Bühne entfernen?`)) return;
          blocksGame.config.instances = blocksGame.config.instances.filter((i) => i.id !== instance.id);
          renderBlocksStageTab();
        });
      } else {
        cell.addEventListener("click", () => {
          if (!placingSpriteId) { alert("Wähle zuerst eine Figur aus."); return; }
          const sprite = blocksGame.config.sprites.find((s) => s.id === placingSpriteId);
          const count = blocksGame.config.instances.filter((i) => i.spriteId === placingSpriteId).length;
          blocksGame.config.instances.push({
            id: "in" + Date.now() + Math.floor(Math.random() * 1000),
            spriteId: placingSpriteId,
            name: sprite.name + (count > 0 ? " " + (count + 1) : ""),
            gridR: r, gridC: c,
          });
          renderBlocksStageTab();
        });
      }
      grid.appendChild(cell);
    }
  }
  container.appendChild(grid);

  if (blocksGame.config.instances.length > 0) {
    const list = document.createElement("div");
    list.className = "instance-list";
    blocksGame.config.instances.forEach((instance) => {
      const row = document.createElement("div");
      row.className = "instance-row";
      const input = document.createElement("input");
      input.value = instance.name;
      input.addEventListener("input", () => { instance.name = input.value; });
      const del = document.createElement("button");
      del.textContent = "✕";
      del.addEventListener("click", () => {
        blocksGame.config.instances = blocksGame.config.instances.filter((i) => i.id !== instance.id);
        renderBlocksStageTab();
      });
      row.appendChild(input);
      row.appendChild(del);
      list.appendChild(row);
    });
    container.appendChild(list);
  }
}

// ---------- Scripts tab ----------

function describeScriptEvent(event) {
  if (event.type === "start") return "🏁 Beim Start";
  if (event.type === "forever") return "🔁 Dauerschleife";
  if (event.type === "key") return `⌨️ Bei Taste ${keyLabel(event.key)}`;
  if (event.type === "collision") {
    const a = blocksGame.config.instances.find((i) => i.id === event.spriteA);
    const b = blocksGame.config.instances.find((i) => i.id === event.spriteB);
    return `💥 Wenn ${a ? a.name : "?"} und ${b ? b.name : "?"} sich berühren`;
  }
  if (event.type === "timer") return `⏱️ Alle ${event.seconds} Sekunden`;
  return event.type;
}

function renderBlocksScriptsTab() {
  const container = document.getElementById("blocks-tab-scripts");
  container.innerHTML = "";

  blocksGame.config.scripts.forEach((script) => {
    const card = document.createElement("div");
    card.className = "script-card";
    const header = document.createElement("div");
    header.className = "script-header";
    const label = document.createElement("span");
    label.textContent = describeScriptEvent(script.event);
    header.appendChild(label);
    const del = document.createElement("button");
    del.textContent = "✕";
    del.className = "btn-change-key";
    del.addEventListener("click", () => {
      blocksGame.config.scripts = blocksGame.config.scripts.filter((s) => s.id !== script.id);
      renderBlocksScriptsTab();
    });
    header.appendChild(del);
    card.appendChild(header);

    const bodyWrap = document.createElement("div");
    bodyWrap.className = "script-body-wrap";
    const bodyContainer = document.createElement("div");
    renderBlockBody(bodyContainer, script.body, renderBlocksScriptsTab);
    bodyWrap.appendChild(bodyContainer);
    bodyWrap.appendChild(makeAddBlockRow(script.body, renderBlocksScriptsTab));
    card.appendChild(bodyWrap);

    container.appendChild(card);
  });

  container.appendChild(makeNewScriptForm());
}

function makeNewScriptForm() {
  const wrap = document.createElement("div");
  wrap.className = "block-add-row";
  wrap.style.flexDirection = "column";
  wrap.style.alignItems = "stretch";
  wrap.style.maxWidth = "460px";
  wrap.style.margin = "14px auto";

  const typeSelect = document.createElement("select");
  Object.entries(EVENT_DEFS).forEach(([type, def]) => {
    const o = document.createElement("option");
    o.value = type; o.textContent = def.label;
    typeSelect.appendChild(o);
  });

  const paramsRow = document.createElement("div");
  paramsRow.className = "block-row";

  let draftEvent = { type: typeSelect.value };
  function resetDraftParams() {
    EVENT_DEFS[draftEvent.type].params.forEach((p) => { draftEvent[p.name] = p.default; });
  }
  resetDraftParams();

  function renderParamsRow() {
    paramsRow.innerHTML = "";
    EVENT_DEFS[draftEvent.type].params.forEach((p) => {
      paramsRow.appendChild(makeParamControl(p, draftEvent[p.name], (v) => { draftEvent[p.name] = v; renderParamsRow(); }));
    });
  }
  renderParamsRow();

  typeSelect.addEventListener("change", () => {
    draftEvent = { type: typeSelect.value };
    resetDraftParams();
    renderParamsRow();
  });

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.textContent = "➕ Neues Skript hinzufügen";
  addBtn.addEventListener("click", () => {
    blocksGame.config.scripts.push({ id: "sc" + Date.now(), event: { ...draftEvent }, body: [] });
    renderBlocksScriptsTab();
  });

  const row1 = document.createElement("div");
  row1.className = "block-add-row";
  row1.appendChild(typeSelect);
  wrap.appendChild(row1);
  wrap.appendChild(paramsRow);
  wrap.appendChild(addBtn);
  return wrap;
}

document.getElementById("btn-cancel-blocks-editor").addEventListener("click", () => showScreen("home"));
document.getElementById("btn-save-blocks").addEventListener("click", () => {
  blocksGame.name = document.getElementById("blocks-name").value.trim() || "Mein Spiel";
  if (blocksGame.config.sprites.length === 0) { alert("Erstelle mindestens eine Figur, bevor du speicherst."); return; }
  if (blocksGame.config.instances.length === 0) { alert("Platziere mindestens eine Figur auf der Bühne."); return; }
  if (blocksGame.config.scripts.length === 0) { alert("Füge mindestens ein Skript hinzu, damit im Spiel etwas passiert."); return; }
  upsertGame(blocksGame);
  renderHome();
  showScreen("home");
});

// ---------- Play / Laufzeit-Engine ----------

let blocksPlayState = null;
let blocksAudioCtx = null;

function startBlocksPlay(game) {
  stopBlocksLoop();
  const canvas = document.getElementById("blocks-canvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const instances = game.config.instances.map((inst) => ({
    id: inst.id,
    name: inst.name,
    spriteId: inst.spriteId,
    x: ((inst.gridC + 0.5) / STAGE_COLS) * 100,
    y: ((inst.gridR + 0.5) / STAGE_ROWS) * 100,
    vx: 0, vy: 0,
    visible: true,
  }));

  blocksPlayState = {
    id: game.id, name: game.name,
    sprites: game.config.sprites,
    instances,
    scripts: game.config.scripts,
    score: 0,
    texts: [],
    keysDown: new Set(),
    keysJustPressed: new Set(),
    wasTouching: {},
    timerAcc: {},
    threads: [],
    gameOver: false,
    lastTime: null,
    ctx, canvas,
  };

  document.getElementById("blocks-play-title").textContent = "🧩 " + game.name;
  document.getElementById("blocks-play-message").textContent = "";
  document.getElementById("blocks-score-display").textContent = "⭐ 0";

  game.config.scripts.forEach((script) => {
    if (script.event.type === "start" || script.event.type === "forever") spawnBlocksThread(script);
  });

  blocksPlayState.rafId = requestAnimationFrame(blocksLoop);
  showScreen("blocks-play");
}

function spawnBlocksThread(script) {
  const gen = script.event.type === "forever" ? blocksForeverRunner(script.body) : blocksRunBody(script.body);
  blocksPlayState.threads.push({ scriptId: script.id, generator: gen, done: false });
}

function* blocksForeverRunner(body) {
  while (true) {
    if (blocksPlayState.gameOver) return;
    yield* blocksRunBody(body);
  }
}

function* blocksRunBody(body) {
  for (const block of body) {
    if (blocksPlayState.gameOver) return;
    yield* blocksRunBlock(block);
  }
}

function getBlocksInstance(id) {
  return blocksPlayState.instances.find((i) => i.id === id);
}

function evalBlocksCondition(condition) {
  if (!condition) return false;
  if (condition.type === "touching") {
    const a = getBlocksInstance(condition.spriteA), b = getBlocksInstance(condition.spriteB);
    if (!a || !b) return false;
    return Math.abs(a.x - b.x) < TOUCH_THRESHOLD_X && Math.abs(a.y - b.y) < TOUCH_THRESHOLD_Y;
  }
  if (condition.type === "keyPressed") return blocksPlayState.keysDown.has(condition.key);
  if (condition.type === "scoreAtLeast") return blocksPlayState.score >= condition.amount;
  return false;
}

function playBlocksTone(tone) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!blocksAudioCtx) blocksAudioCtx = new AudioCtx();
    const freq = tone === "low" ? 220 : tone === "high" ? 880 : 440;
    const osc = blocksAudioCtx.createOscillator();
    const gain = blocksAudioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(blocksAudioCtx.destination);
    gain.gain.setValueAtTime(0.15, blocksAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, blocksAudioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(blocksAudioCtx.currentTime + 0.3);
  } catch (e) { /* Audio evtl. nicht verfügbar */ }
}

function blocksEndGame(result, message) {
  if (!blocksPlayState || blocksPlayState.gameOver) return;
  blocksPlayState.gameOver = true;
  const icon = result === "win" ? "🏆" : "😵";
  document.getElementById("blocks-play-message").textContent = `${icon} ${message}`;
}

function* blocksRunBlock(block) {
  const state = blocksPlayState;
  switch (block.type) {
    case "move": {
      const inst = getBlocksInstance(block.params.sprite);
      if (inst) { inst.x += block.params.dx; inst.y += block.params.dy; }
      break;
    }
    case "setPos": {
      const inst = getBlocksInstance(block.params.sprite);
      if (inst) { inst.x = block.params.x; inst.y = block.params.y; }
      break;
    }
    case "setVelocity": {
      const inst = getBlocksInstance(block.params.sprite);
      if (inst) { inst.vx = block.params.vx; inst.vy = block.params.vy; }
      break;
    }
    case "bounce": {
      const inst = getBlocksInstance(block.params.sprite);
      if (inst) {
        if (inst.x < EDGE_MARGIN_X || inst.x > 100 - EDGE_MARGIN_X) inst.vx = -inst.vx;
        if (inst.y < EDGE_MARGIN_Y || inst.y > 100 - EDGE_MARGIN_Y) inst.vy = -inst.vy;
        inst.x = Math.max(EDGE_MARGIN_X, Math.min(100 - EDGE_MARGIN_X, inst.x));
        inst.y = Math.max(EDGE_MARGIN_Y, Math.min(100 - EDGE_MARGIN_Y, inst.y));
      }
      break;
    }
    case "showText": {
      state.texts.push({ text: block.params.text, until: performance.now() + block.params.seconds * 1000 });
      break;
    }
    case "setVisible": {
      const inst = getBlocksInstance(block.params.sprite);
      if (inst) inst.visible = block.params.visible === "true" || block.params.visible === true;
      break;
    }
    case "playSound": playBlocksTone(block.params.tone); break;
    case "changeScore": {
      state.score += block.params.amount;
      document.getElementById("blocks-score-display").textContent = "⭐ " + state.score;
      break;
    }
    case "setScore": {
      state.score = block.params.amount;
      document.getElementById("blocks-score-display").textContent = "⭐ " + state.score;
      break;
    }
    case "wait": {
      const until = performance.now() + block.params.seconds * 1000;
      while (performance.now() < until) {
        if (state.gameOver) return;
        yield;
      }
      break;
    }
    case "repeat": {
      for (let i = 0; i < block.params.count; i++) {
        if (state.gameOver) return;
        yield* blocksRunBody(block.body);
      }
      break;
    }
    case "ifBlock": {
      if (evalBlocksCondition(block.params.condition)) yield* blocksRunBody(block.body);
      else if (block.elseBody) yield* blocksRunBody(block.elseBody);
      break;
    }
    case "endGame": blocksEndGame(block.params.result, block.params.message); break;
  }
}

function blocksLoop(timestamp) {
  if (!blocksPlayState || blocksPlayState.gameOver) return;
  if (blocksPlayState.lastTime === null) blocksPlayState.lastTime = timestamp;
  const dt = (timestamp - blocksPlayState.lastTime) / 1000;
  blocksPlayState.lastTime = timestamp;

  blocksPlayState.instances.forEach((inst) => {
    inst.x += inst.vx * dt;
    inst.y += inst.vy * dt;
  });

  blocksPlayState.threads.forEach((thread) => {
    if (thread.done) return;
    const res = thread.generator.next();
    if (res.done) thread.done = true;
  });
  blocksPlayState.threads = blocksPlayState.threads.filter((t) => !t.done);

  blocksPlayState.scripts.forEach((script) => {
    if (script.event.type === "key" && blocksPlayState.keysJustPressed.has(script.event.key)) spawnBlocksThread(script);
  });
  blocksPlayState.keysJustPressed.clear();

  blocksPlayState.scripts.forEach((script) => {
    if (script.event.type !== "collision") return;
    const touching = evalBlocksCondition({ type: "touching", spriteA: script.event.spriteA, spriteB: script.event.spriteB });
    const was = blocksPlayState.wasTouching[script.id] || false;
    if (touching && !was) spawnBlocksThread(script);
    blocksPlayState.wasTouching[script.id] = touching;
  });

  blocksPlayState.scripts.forEach((script) => {
    if (script.event.type !== "timer") return;
    blocksPlayState.timerAcc[script.id] = (blocksPlayState.timerAcc[script.id] || 0) + dt;
    if (blocksPlayState.timerAcc[script.id] >= script.event.seconds) {
      blocksPlayState.timerAcc[script.id] -= script.event.seconds;
      spawnBlocksThread(script);
    }
  });

  renderBlocksFrame();

  if (!blocksPlayState.gameOver) blocksPlayState.rafId = requestAnimationFrame(blocksLoop);
}

function renderBlocksFrame() {
  const { ctx, canvas } = blocksPlayState;
  ctx.fillStyle = "#cdeffd";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#b5e8a6";
  ctx.fillRect(0, canvas.height * 0.85, canvas.width, canvas.height * 0.15);

  blocksPlayState.instances.forEach((inst) => {
    if (!inst.visible) return;
    const sprite = blocksPlayState.sprites.find((s) => s.id === inst.spriteId);
    drawSpriteAt(ctx, sprite, (inst.x / 100) * canvas.width, (inst.y / 100) * canvas.height, SPRITE_DRAW_PX);
  });

  const now = performance.now();
  blocksPlayState.texts = blocksPlayState.texts.filter((t) => t.until > now);
  ctx.fillStyle = "rgba(23,44,102,0.85)";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  blocksPlayState.texts.forEach((t, i) => ctx.fillText(t.text, canvas.width / 2, 24 + i * 20));
}

function stopBlocksLoop() {
  if (blocksPlayState) {
    if (blocksPlayState.rafId) cancelAnimationFrame(blocksPlayState.rafId);
    blocksPlayState.gameOver = true;
  }
}

document.addEventListener("keydown", (e) => {
  if (!blocksPlayState || blocksPlayState.gameOver) return;
  if (screens["blocks-play"].classList.contains("hidden")) return;
  if (!blocksPlayState.keysDown.has(e.key)) blocksPlayState.keysJustPressed.add(e.key);
  blocksPlayState.keysDown.add(e.key);
});
document.addEventListener("keyup", (e) => {
  if (!blocksPlayState) return;
  blocksPlayState.keysDown.delete(e.key);
});

document.getElementById("btn-restart-blocks-play").addEventListener("click", () => {
  const game = loadGames().find((g) => g.id === blocksPlayState.id);
  if (game) startBlocksPlay(game);
});
document.getElementById("btn-back-blocks-play").addEventListener("click", () => {
  stopBlocksLoop();
  showScreen("home");
  renderHome();
});

// ---------- Init ----------

renderHome();
