// script.js
// 100 US Hip Hop / Rap artists. Spaces + hyphens supported.
// Punctuation is auto-revealed; letters and digits are guessable.
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
  
  // On-screen keyboard layout
  const KEY_ROWS = [
    ["A","B","C","D","E","F","G","H","I","J"],
    ["K","L","M","N","O","P","Q","R","S","T"],
    ["U","V","W","X","Y","Z","0","1","2","3","4","5","6","7","8","9"]
  ];
  
  // State
  let answerOriginal = "";
  let answerUpper = "";
  let revealed = [];
  let guessed = new Set();
  let lives = MAX_LIVES;
  let gameOver = false;
  
  // DOM
  const appRootEl = document.getElementById("appRoot");
  const titleLogoEl = document.getElementById("titleLogo");
  const nameBoardEl = document.getElementById("nameBoard");
  const livesLeftEl = document.getElementById("livesLeft");
  const livesMaxEl = document.getElementById("livesMax");
  const meterFillEl = document.getElementById("meterFill");
  const meterTrackEl = document.querySelector(".meter-track");
  const guessedCharsEl = document.getElementById("guessedChars");
  const msgEl = document.getElementById("message");
  const keyboardEl = document.getElementById("keyboard");
  const newGameBtnEl = document.getElementById("newGameBtn");
  const revealBtnEl = document.getElementById("revealBtn");
  
  // Helpers
  function pickRandomArtist() {
    return ARTISTS[Math.floor(Math.random() * ARTISTS.length)];
  }
  
  function isGuessableChar(ch) {
    return /^[A-Z0-9]$/.test(ch);
  }
  
  // Auto-reveal punctuation like $ . , ' etc., plus spaces and hyphens
  function initRevealedForAnswer(ansUpper) {
    return Array.from(ansUpper).map(ch => {
      if (ch === " ") return " ";
      if (ch === "-") return "-";
      if (!isGuessableChar(ch)) return ch; // punctuation shown
      return "_";
    });
  }
  
  function setMessage(text, kind = "") {
    msgEl.textContent = text;
    msgEl.className = "message" + (kind ? ` ${kind}` : "");
  }
  
  function renderBoard() {
    nameBoardEl.innerHTML = "";
    for (let i = 0; i < revealed.length; i++) {
      const ch = revealed[i];
      const tile = document.createElement("div");
      tile.classList.add("tile");
  
      if (ch === " ") {
        tile.classList.add("space");
        tile.textContent = "";
      } else if (ch === "-") {
        tile.classList.add("hyphen");
        tile.textContent = "-";
      } else if (ch === "_") {
        tile.classList.add("blank");
        tile.textContent = "";
      } else {
        tile.textContent = ch;
      }
  
      nameBoardEl.appendChild(tile);
    }
  }
  
  function renderStatus() {
    livesLeftEl.textContent = String(lives);
    livesMaxEl.textContent = String(MAX_LIVES);
  
    const guessedArr = Array.from(guessed).sort((a,b) =>
      a.localeCompare(b, "en", { numeric: true })
    );
    guessedCharsEl.textContent = guessedArr.length ? guessedArr.join(", ") : "—";
  
    const pct = Math.max(0, Math.min(100, (lives / MAX_LIVES) * 100));
    meterFillEl.style.width = `${pct}%`;
  
    const track = meterFillEl.parentElement;
    if (track) track.setAttribute("aria-valuenow", String(lives));
  
    meterTrackEl.classList.toggle("low", lives <= 3);
  }
  
  function setKeyboardEnabled(enabled) {
    const keys = keyboardEl.querySelectorAll("button.key");
    keys.forEach(btn => {
      if (guessed.has(btn.dataset.key)) {
        btn.disabled = true;
        return;
      }
      btn.disabled = !enabled;
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
  
  function clearLogoEffects() {
    if (!titleLogoEl) return;
    titleLogoEl.classList.remove("win-flash", "lose-flicker");
  }
  
  function triggerLogoEffect(className, durationMs) {
    if (!titleLogoEl) return;
    titleLogoEl.classList.remove(className);
    void titleLogoEl.offsetWidth; // restart animation reliably
    titleLogoEl.classList.add(className);
    window.setTimeout(() => titleLogoEl.classList.remove(className), durationMs);
  }
  
  function endGame(win) {
    gameOver = true;
  
    if (win) {
      setMessage(`🔥 You got it! The artist was: ${answerOriginal}`, "ok");
      triggerLogoEffect("win-flash", 520);
    } else {
      setMessage(`💀 Game over! The artist was: ${answerOriginal}`, "bad");
      triggerLogoEffect("lose-flicker", 650);
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
  
  function markKeyResult(ch, hit) {
    const btn = keyboardEl.querySelector(`button.key[data-key="${CSS.escape(ch)}"]`);
    if (!btn) return;
    btn.classList.add(hit ? "hit" : "miss");
    btn.disabled = true;
  }
  
  function clearKeyboardMarks() {
    const keys = keyboardEl.querySelectorAll("button.key");
    keys.forEach(btn => {
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
  
  // "Record scratch" effect: shake app + spin vinyl + jolt needle (CSS handles visuals)
  function triggerScratch() {
    appRootEl.classList.remove("scratch");
    void appRootEl.offsetWidth; // force reflow
    appRootEl.classList.add("scratch");
    window.setTimeout(() => appRootEl.classList.remove("scratch"), 300);
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
    for (let i = 0; i < answerUpper.length; i++) {
      if (answerUpper[i] === chUpper) {
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
    clearLogoEffects();
  
    answerOriginal = pickRandomArtist();
    answerUpper = answerOriginal.toUpperCase();
    revealed = initRevealedForAnswer(answerUpper);
    guessed = new Set();
    lives = MAX_LIVES;
    gameOver = false;
  
    clearKeyboardMarks();
    setMessage("New game started. Tap a letter/number (or type).");
    renderAll();
  }
  
  // Typing support
  document.addEventListener("keydown", (e) => {
    if (gameOver) return;
    const key = (e.key || "").toUpperCase();
    if (isGuessableChar(key)) applyGuess(key);
  });
  
  // Buttons
  newGameBtnEl.addEventListener("click", startNewGame);
  revealBtnEl.addEventListener("click", () => {
    if (!gameOver) revealAnswer();
  });
  
  // Init
  buildKeyboard();
  startNewGame();
  