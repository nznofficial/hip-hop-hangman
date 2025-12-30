const ARTISTS = [
  "2Pac","50 Cent","A$AP Rocky","Andre 3000","Beastie Boys","Big Boi","Big Pun","Big Sean","Biz Markie","Busta Rhymes",
  "Cardi B","Chance the Rapper","Common","Cordae","DaBaby","Danny Brown","De La Soul","DMX","Dr. Dre","E-40",
  "Eazy-E","Eminem","Eric B","Future","Ghostface Killah","GZA","Ice Cube","Ice-T","J. Cole","JAY-Z",
  "JID","Joey Bada$$","Juice WRLD","Kanye West","Kendrick Lamar","Kid Cudi","Kodak Black","Lauryn Hill","Lil Baby","Lil Durk",
  "Lil Uzi Vert","Lil Wayne","LL Cool J","Logic","Ludacris","Mac Miller","Megan Thee Stallion","Method Man","MF DOOM","Missy Elliott",
  "Mobb Deep","Mos Def","Nas","Nicki Minaj","Nipsey Hussle","Notorious B.I.G.","Offset","OutKast","Polo G","Post Malone",
  "Pusha T","Q-Tip","Queen Latifah","Rakim","Rapsody","Rick Ross","Roddy Ricch","Run-DMC","Snoop Dogg","Swae Lee",
  "Tech N9ne","The Game","The Roots","Travis Scott","Tyler, The Creator","Tyga","UGK","Vince Staples","Wale","Wiz Khalifa",
  "Wu-Tang Clan","XXXTentacion","Young Thug","YoungBoy Never Broke Again","21 Savage","A Tribe Called Quest","Akon","Chief Keef","Childish Gambino","Clipse",
  "Desiigner","Denzel Curry","DJ Khaled","Doja Cat","Fetty Wap","Gucci Mane","Lil Jon","Macklemore","Playboi Carti","Saweetie",
  "Schoolboy Q","T-Pain"
];

const MAX_LIVES = 10;

const KEY_ROWS = [
  ["A","B","C","D","E","F","G","H","I","J"],
  ["K","L","M","N","O","P","Q","R","S","T"],
  ["U","V","W","X","Y","Z","0","1","2","3","4","5","6","7","8","9"]
];

let answerOriginal = "";
let answerUpper = "";
let revealed = [];
let guessed = new Set();
let lives = MAX_LIVES;
let gameOver = false;
let lastRevealIndexes = [];

const appRootEl = document.getElementById("appRoot");
const nameBoardEl = document.getElementById("nameBoard");
const guessedCharsEl = document.getElementById("guessedChars");
const msgEl = document.getElementById("message");
const keyboardEl = document.getElementById("keyboard");
const newGameBtnEl = document.getElementById("newGameBtn");
const revealBtnEl = document.getElementById("revealBtn");

const livesLeftEl = document.getElementById("livesLeft");
const livesMaxEl = document.getElementById("livesMax");
const meterFillEl = document.getElementById("meterFill");
const meterTrackElMobile = document.querySelector(".meter-track-mobile");

const livesLeftDesktopEl = document.getElementById("livesLeftDesktop");
const livesMaxDesktopEl = document.getElementById("livesMaxDesktop");
const meterFillDesktopEl = document.getElementById("meterFillDesktop");
const meterTrackElDesktop = document.querySelector(".top-bar-desktop .meter-track");

const logoOverlayEl = document.getElementById("logoOverlay");
const overlayLogoEl = document.getElementById("overlayLogo");

function pickRandomArtist() {
  return ARTISTS[Math.floor(Math.random() * ARTISTS.length)];
}

function isGuessableChar(ch) {
  return /^[A-Z0-9]$/.test(ch);
}

function initRevealedForAnswer(ansUpper) {
  return Array.from(ansUpper).map(ch => {
    if (ch === " ") return " ";
    if (ch === "-") return "-";
    if (!isGuessableChar(ch)) return ch;
    return "_";
  });
}

function setMessage(text, kind = "") {
  msgEl.textContent = text;
  msgEl.className = "message" + (kind ? ` ${kind}` : "");
}

function renderBoard() {
  nameBoardEl.innerHTML = "";

  const words = [];
  let currentWord = [];

  for (let i = 0; i < revealed.length; i++) {
    const ch = revealed[i];
    if (ch === " ") {
      if (currentWord.length) {
        words.push(currentWord);
        currentWord = [];
      }
    } else {
      currentWord.push({ ch, idx: i });
    }
  }
  if (currentWord.length) words.push(currentWord);

  words.forEach(wordObjs => {
    const row = document.createElement("div");
    row.className = "name-row";

    const letterCount = wordObjs.filter(o => o.ch !== "-").length;
    if (letterCount >= 11) row.classList.add("ultra-compact");
    else if (letterCount >= 9) row.classList.add("compact");

    if (wordObjs.some(o => lastRevealIndexes.includes(o.idx))) row.classList.add("shine");

    wordObjs.forEach(o => {
      const tile = document.createElement("div");
      tile.classList.add("tile");

      if (o.ch === "-") {
        tile.classList.add("hyphen");
        tile.textContent = "-";
      } else if (o.ch === "_") {
        tile.classList.add("blank");
        tile.textContent = "";
      } else {
        tile.textContent = o.ch;
        if (lastRevealIndexes.includes(o.idx)) tile.classList.add("revealed-anim");
      }

      row.appendChild(tile);
    });

    nameBoardEl.appendChild(row);
  });

  lastRevealIndexes = [];
}

function renderStatus() {
  if (livesLeftEl) livesLeftEl.textContent = String(lives);
  if (livesMaxEl) livesMaxEl.textContent = String(MAX_LIVES);
  if (meterFillEl) meterFillEl.style.width = `${Math.max(0, (lives / MAX_LIVES) * 100)}%`;

  if (meterTrackElMobile) {
    meterTrackElMobile.setAttribute("aria-valuenow", String(lives));
    meterTrackElMobile.classList.toggle("low", lives <= 3);
  }

  if (livesLeftDesktopEl) livesLeftDesktopEl.textContent = String(lives);
  if (livesMaxDesktopEl) livesMaxDesktopEl.textContent = String(MAX_LIVES);
  if (meterFillDesktopEl) meterFillDesktopEl.style.width = `${Math.max(0, (lives / MAX_LIVES) * 100)}%`;

  if (meterTrackElDesktop) {
    meterTrackElDesktop.setAttribute("aria-valuenow", String(lives));
    meterTrackElDesktop.classList.toggle("low", lives <= 3);
  }

  const guessedArr = Array.from(guessed).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  guessedCharsEl.textContent = guessedArr.length ? guessedArr.join(", ") : "—";
}

function setKeyboardEnabled(enabled) {
  keyboardEl.querySelectorAll("button.key").forEach(btn => {
    btn.disabled = guessed.has(btn.dataset.key) ? true : !enabled;
  });
}

function renderAll() {
  renderBoard();
  renderStatus();
  setKeyboardEnabled(!gameOver);
}

function checkWin() {
  return !revealed.includes("_");
}

function markKeyResult(ch, hit) {
  const btn = keyboardEl.querySelector(`button.key[data-key="${CSS.escape(ch)}"]`);
  if (!btn) return;
  btn.classList.add(hit ? "hit" : "miss");
  btn.disabled = true;
}

function clearKeyboardMarks() {
  keyboardEl.querySelectorAll("button.key").forEach(btn => {
    btn.classList.remove("hit", "miss");
    btn.disabled = false;
  });
}

function buildKeyboard() {
  keyboardEl.innerHTML = "";
  KEY_ROWS.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "keyboard-row";

    row.forEach(ch => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "key";
      btn.textContent = ch;
      btn.dataset.key = ch;
      btn.addEventListener("click", () => applyGuess(ch));
      rowEl.appendChild(btn);
    });

    keyboardEl.appendChild(rowEl);
  });
}

function triggerScratch() {
  appRootEl.classList.remove("scratch");
  void appRootEl.offsetWidth;
  appRootEl.classList.add("scratch");
  window.setTimeout(() => appRootEl.classList.remove("scratch"), 300);
}

function showOverlay(effectClass) {
  if (!logoOverlayEl || !overlayLogoEl) return;

  overlayLogoEl.classList.remove("win-flash", "lose-flicker");
  void overlayLogoEl.offsetWidth;

  logoOverlayEl.classList.add("show");
  overlayLogoEl.classList.add(effectClass);

  window.setTimeout(() => {
    logoOverlayEl.classList.remove("show");
    overlayLogoEl.classList.remove(effectClass);
  }, 1100);
}

function endGame(win) {
  gameOver = true;

  if (win) {
    setMessage(`🔥 You got it! The artist was: ${answerOriginal}`, "ok");
    showOverlay("win-flash");
  } else {
    setMessage(`💀 Game over! The artist was: ${answerOriginal}`, "bad");
    showOverlay("lose-flicker");
  }

  setKeyboardEnabled(false);
  renderAll();
}

function revealAnswer() {
  revealed = Array.from(answerUpper);
  gameOver = true;
  setMessage(`Answer revealed: ${answerOriginal}`, "");
  setKeyboardEnabled(false);
  renderAll();
}

function applyGuess(chUpper) {
  if (gameOver) return;

  if (!isGuessableChar(chUpper)) {
    setMessage("Use A–Z or 0–9. Hyphens/spaces/punctuation are already shown.");
    return;
  }

  if (guessed.has(chUpper)) {
    setMessage(`Already guessed "${chUpper}". No penalty — try another.`, "");
    return;
  }

  guessed.add(chUpper);

  let hit = false;
  lastRevealIndexes = [];

  for (let i = 0; i < answerUpper.length; i++) {
    if (answerUpper[i] === chUpper) {
      if (revealed[i] === "_") lastRevealIndexes.push(i);
      revealed[i] = chUpper;
      hit = true;
    }
  }

  markKeyResult(chUpper, hit);

  if (hit) {
    setMessage(`✅ Nice! "${chUpper}" is in the name.`, "ok");
    renderAll();
    if (checkWin()) endGame(true);
  } else {
    lives -= 1;
    triggerScratch();

    if (lives <= 0) {
      lives = 0;
      renderAll();
      endGame(false);
    } else {
      setMessage(`❌ Nope. "${chUpper}" isn't in the name. -1 life.`, "bad");
      renderAll();
    }
  }
}

function startNewGame() {
  answerOriginal = pickRandomArtist();
  answerUpper = answerOriginal.toUpperCase();
  revealed = initRevealedForAnswer(answerUpper);

  guessed = new Set();
  lives = MAX_LIVES;
  gameOver = false;
  lastRevealIndexes = [];

  clearKeyboardMarks();
  setMessage("New game started. Tap a letter/number (or type).");
  renderAll();
}

document.addEventListener("keydown", (e) => {
  if (gameOver) return;
  const key = (e.key || "").toUpperCase();
  if (isGuessableChar(key)) applyGuess(key);
});

newGameBtnEl.addEventListener("click", startNewGame);
revealBtnEl.addEventListener("click", () => {
  if (!gameOver) revealAnswer();
});

buildKeyboard();
startNewGame();
