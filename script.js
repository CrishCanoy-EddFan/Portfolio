// ---------------------------------------------------------------
// Edit this list to set the pictures shown when you hover a skill.
// Each skill cycles through its "frames" in order, then loops.
// ---------------------------------------------------------------
const SKILL_IMAGES = {
  "game-developer": { title: "Game Developer", frames: ["assets/game developer.webp"] },
  "artist":         { title: "Artist",         frames: ["assets/artist.jpg"] },
  "arnis":          { title: "Arnis",          frames: ["assets/arnis.jpg"] },
  "badminton":      { title: "Badminton",      frames: ["assets/badminton.webp"] },
  "graphic-designer": { title: "Graphic Designer", frames: ["assets/graphic designer.jpg"] },
  "video-editing": { title: "Video Editing", frames: ["assets/video editor.jpg"] },
  "basketball": { title: "Basketball", frames: ["assets/basketball.jpg"] },
  "volleyball": { title: "Volleyball", frames: ["assets/volleyball.jpg"] }
};

const FRAME_DELAY = 700; // milliseconds between frames

const skillItems = document.querySelectorAll("#skillList li");
const preview = document.getElementById("preview");
const framesBox = document.getElementById("frames");
const caption = document.getElementById("previewCaption");

let timer = null;

// Draw the 10 level pips for each skill
skillItems.forEach((item) => {
  const level = Number(item.dataset.level) || 0;
  const pips = item.querySelector(".pips");
  for (let i = 0; i < 10; i++) {
    const pip = document.createElement("i");
    if (i < level) pip.className = "on";
    pips.appendChild(pip);
  }
});

function stopCycle() {
  clearInterval(timer);
  timer = null;
  preview.classList.remove("playing");
  skillItems.forEach((li) => li.classList.remove("active"));
}

function startCycle(item) {
  if (item.classList.contains("active")) return;   // already playing, don't restart
  const data = SKILL_IMAGES[item.dataset.skill];
  if (!data) return;

  stopCycle();
  item.classList.add("active");
  caption.textContent = data.title;

  framesBox.innerHTML = "";
  data.frames.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    framesBox.appendChild(img);
  });

  const imgs = framesBox.querySelectorAll("img");
  let index = 0;
  const show = () => {
    imgs.forEach((img) => img.classList.remove("current"));
    // Force reflow so the drift animation restarts on each frame
    void imgs[index].offsetWidth;
    imgs[index].classList.add("current");
    index = (index + 1) % imgs.length;
  };

  show();
  preview.classList.add("playing");
  staticBurst(true);                                   // big burst when the image appears
    timer = setInterval(show, FRAME_DELAY);
}

// Preload the skill pictures so they don't flash in
Object.values(SKILL_IMAGES).forEach((skill) => {
  skill.frames.forEach((src) => { new Image().src = src; });
});

skillItems.forEach((item) => {
  item.addEventListener("mouseenter", () => startCycle(item));
  item.addEventListener("focus", () => startCycle(item));
  item.addEventListener("click", () => startCycle(item)); // for touch screens
});

document.getElementById("skillList")?.addEventListener("mouseleave", stopCycle);
document.getElementById("skillList")?.addEventListener("focusout", (e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) stopCycle();
});

// ---------------------------------------------------------------
// Project preview (item-inspect screen)
// ---------------------------------------------------------------
const lightbox = document.getElementById("lightbox");

if (lightbox) {
  const lbStage = document.getElementById("lbStage");
  const lbItem = document.getElementById("lbItem");
  const lbFront = document.getElementById("lbFront");
  const lbBack = document.getElementById("lbBack");
  const lbTitle = document.getElementById("lbTitle");
  const lbType = document.getElementById("lbType");
  const lbDesc = document.getElementById("lbDesc");
  const lbHint = document.getElementById("lbHint");
  const lbClose = document.getElementById("lbClose");

  let lastCard = null;
  let rotX = 0, rotY = 0;
  let dragging = false, dragX = 0, dragY = 0;

  function applyRot() {
    lbItem.style.setProperty("--rx", rotX + "deg");
    lbItem.style.setProperty("--ry", rotY + "deg");
  }

  // Turns a normal Google Drive share link into an embeddable player link
  function embedUrl(url) {
    const drive = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
    return drive ? "https://drive.google.com/file/d/" + drive[1] + "/preview" : url;
  }

  function makeMedia(card, title) {
    const video = (card.dataset.video || "").trim();
    if (video) {
      if (/\.(mp4|webm|ogv)(\?.*)?$/i.test(video)) {          // a video file in assets/
        const v = document.createElement("video");
        v.src = video; v.controls = true; v.playsInline = true; v.preload = "metadata";
        return { el: v, isVideo: true };
      }
      const f = document.createElement("iframe");              // Drive link
      f.src = embedUrl(video);
      f.title = title;
      f.allow = "autoplay; fullscreen; picture-in-picture";
      f.allowFullscreen = true;
      return { el: f, isVideo: true };
    }
    const src = card.querySelector("img");
    const img = document.createElement("img");
    img.src = src.src; img.alt = src.alt; img.draggable = false;
    return { el: img, isVideo: false };
  }

  function openProject(card) {
    lastCard = card;
    const title = card.querySelector("figcaption").textContent;
    const media = makeMedia(card, title);

    lbFront.replaceChildren(media.el);
    lbBack.textContent = title;
    lbTitle.textContent = title;
    lbType.textContent = card.dataset.type || "";
    lbDesc.textContent = card.dataset.description || "";
    lbHint.textContent = media.isVideo ? "Press Esc to close" : "Drag or use \u2190 \u2192 to rotate  \u00B7  Esc to close";

    lightbox.classList.toggle("is-video", media.isVideo);
    rotX = 0; rotY = 0; applyRot();

    lightbox.showModal();
    document.body.classList.add("no-scroll");
  }

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => openProject(card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openProject(card);
      }
    });
  });

  // Drag to rotate the item
  lbItem.addEventListener("pointerdown", (e) => {
    if (lightbox.classList.contains("is-video") || e.button !== 0) return;
    dragging = true; dragX = e.clientX; dragY = e.clientY;
    lbItem.setPointerCapture(e.pointerId);
    lbItem.classList.add("dragging");
  });
  lbItem.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    rotY += (e.clientX - dragX) * 0.6;
    rotX = Math.max(-40, Math.min(40, rotX - (e.clientY - dragY) * 0.4));
    dragX = e.clientX; dragY = e.clientY;
    applyRot();
  });
  function endDrag() { dragging = false; lbItem.classList.remove("dragging"); }
  lbItem.addEventListener("pointerup", endDrag);
  lbItem.addEventListener("pointercancel", endDrag);

  // Arrow keys also rotate it
  lightbox.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("is-video")) return;
    if (e.key === "ArrowLeft")  { rotY -= 20; applyRot(); }
    if (e.key === "ArrowRight") { rotY += 20; applyRot(); }
  });

  // Close: X button, click on the empty area around the item, or Esc
  lbClose.addEventListener("click", () => lightbox.close());
  lbStage.addEventListener("click", (e) => {
    if (!e.target.closest("#lbItem")) lightbox.close();
  });
  lightbox.addEventListener("close", () => {
    lbFront.replaceChildren();                 // removes the player, so the video stops
    document.body.classList.remove("no-scroll");
    if (lastCard) lastCard.focus();
  });
}


// ---------------------------------------------------------------
// Background music
// ---------------------------------------------------------------
const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
const musicVolume = document.getElementById("musicVolume");

bgMusic.volume = musicVolume.value / 100;

musicToggle.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play()
      .then(() => {
        musicToggle.textContent = "Music: On";
        musicToggle.setAttribute("aria-pressed", "true");
      })
      .catch(() => {
        musicToggle.textContent = "Music not found";
      });
  } else {
    bgMusic.pause();
    musicToggle.textContent = "Music: Off";
    musicToggle.setAttribute("aria-pressed", "false");
  }
});

musicVolume.addEventListener("input", () => {
  bgMusic.volume = musicVolume.value / 100;
});

// ---------------------------------------------------------------
// Effects: rain, flickering light, grime (each can be toggled)
// ---------------------------------------------------------------
const rainCanvas = document.getElementById("rainCanvas");
const rainCtx = rainCanvas.getContext("2d");
const lightOverlay = document.getElementById("lightOverlay");
const bulb = document.getElementById("bulb");
const grime = document.getElementById("grime");

// Rain
let drops = [];
let rainFrame = null;

function resizeRain() {
  rainCanvas.width = window.innerWidth;
  rainCanvas.height = window.innerHeight;
  const count = Math.min(250, Math.floor(rainCanvas.width / 6));
  drops = Array.from({ length: count }, () => newDrop(true));
}

function newDrop(randomY) {
  return {
    x: Math.random() * rainCanvas.width,
    y: randomY ? Math.random() * rainCanvas.height : -30,
    len: 12 + Math.random() * 18,
    speed: 14 + Math.random() * 10
  };
}

function drawRain() {
  rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
  rainCtx.strokeStyle = "rgba(170, 195, 210, 0.35)";
  rainCtx.lineWidth = 1;
  rainCtx.beginPath();
  drops.forEach((d, i) => {
    rainCtx.moveTo(d.x, d.y);
    rainCtx.lineTo(d.x - 3, d.y + d.len);
    d.y += d.speed;
    d.x -= 1.2;
    if (d.y > rainCanvas.height) drops[i] = newDrop(false);
  });
  rainCtx.stroke();
  rainFrame = requestAnimationFrame(drawRain);
}

function startRain() {
  rainCanvas.hidden = false;
  resizeRain();
  cancelAnimationFrame(rainFrame);
  drawRain();
}

function stopRain() {
  cancelAnimationFrame(rainFrame);
  rainCanvas.hidden = true;
  rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
}

window.addEventListener("resize", () => {
  if (!rainCanvas.hidden) resizeRain();
});

// Flickering light
let flickerTimer = null;

function setLit(value) {
  document.documentElement.style.setProperty("--lit", value);
}

function flickerBurst() {
  let steps = 4 + Math.floor(Math.random() * 6);
  const step = () => {
    if (steps-- > 0) {
      const dim = Math.random() < 0.5;
      setLit(dim ? 0.1 + Math.random() * 0.3 : 0.7 + Math.random() * 0.3);
      flickerTimer = setTimeout(step, 40 + Math.random() * 110);
    } else {
      setLit(1);
      flickerTimer = setTimeout(flickerBurst, 2000 + Math.random() * 5000);
    }
  };
  step();
}

function startLight() {
  lightOverlay.hidden = false;
  bulb.hidden = false;
  setLit(1);
  clearTimeout(flickerTimer);
  flickerTimer = setTimeout(flickerBurst, 1500);
}

function stopLight() {
  clearTimeout(flickerTimer);
  setLit(1);
  lightOverlay.hidden = true;
  bulb.hidden = true;
}

// Scope cursor + bullet holes
const SHOT_SOUND = true;        // set to false for no gunshot sound
const HOLE_LIFETIME = 5000;     // milliseconds before a hole disappears

const scope = document.getElementById("scope");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
let audioCtx = null;

function moveScope(e) {
  scope.style.transform = "translate(" + (e.clientX - 30) + "px, " + (e.clientY - 30) + "px)";
}

function playSynthShot() {
  if (!SHOT_SOUND) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const length = audioCtx.sampleRate * 0.18;
    const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    gain.gain.value = 0.25;
    source.buffer = buffer;
    source.connect(gain).connect(audioCtx.destination);
    source.start();
  } catch (err) { /* sound unavailable, ignore */ }
}

// Your own gunshot sound
const SHOT_FILE = "assets/gunshot.mp3";   // change the name or format here
const SHOT_VOLUME = 0.6;                  // 0 to 1

let shotAudio = new Audio(SHOT_FILE);
let shotFileOk = true;
shotAudio.preload = "auto";
shotAudio.addEventListener("error", () => { shotFileOk = false; });

function playShot() {
  if (!SHOT_SOUND) return;

  if (shotFileOk) {
    // A copy per shot, so fast clicks overlap instead of cutting each other off
    const shot = shotAudio.cloneNode();
    shot.volume = SHOT_VOLUME;
    shot.playbackRate = 0.95 + Math.random() * 0.1;   // tiny pitch change so it doesn't sound repetitive
    shot.play().catch(() => {});
    return;
  }

  playSynthShot();   // backup if the file can't be loaded
}

const SHAKE_STRENGTH = 5;   // pixels, set to 0 for no shake

const muzzleFlash = document.getElementById("muzzleFlash");
const shakeTargets = [document.querySelector("main"), document.querySelector(".topbar")];

function fireEffects(e) {
  // Light flash at the click position
  muzzleFlash.style.setProperty("--fx", e.clientX + "px");
  muzzleFlash.style.setProperty("--fy", e.clientY + "px");
  muzzleFlash.classList.remove("fire");
  void muzzleFlash.offsetWidth;
  muzzleFlash.classList.add("fire");

  // Shake in a random direction
  const angle = Math.random() * Math.PI * 2;
  document.documentElement.style.setProperty("--sx", Math.cos(angle) * SHAKE_STRENGTH + "px");
  document.documentElement.style.setProperty("--sy", Math.sin(angle) * SHAKE_STRENGTH + "px");
  shakeTargets.forEach((el) => {
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
  });
}

function shoot(e) {
    if (e.button !== 0 || document.querySelector("dialog[open]")) return;

  const hit = hitZombie(e.clientX, e.clientY);
  if (hit) addScore(hit, e.clientX, e.clientY);

  const mark = document.createElement("div");
  mark.className = hit ? "bullet-hole blood" : "bullet-hole";
  mark.style.left = e.pageX + "px";
  mark.style.top = e.pageY + "px";
  document.body.appendChild(mark);
  setTimeout(() => mark.remove(), HOLE_LIFETIME);

  scope.classList.remove("fire");
  void scope.offsetWidth;
  scope.classList.add("fire");
  playShot();
  fireEffects(e);
}

function startScope() {
  document.addEventListener("pointerdown", shoot);
  if (finePointer) {
    document.documentElement.classList.add("scope-on");
    scope.hidden = false;
    document.addEventListener("pointermove", moveScope);
  }
}

function stopScope() {
  document.removeEventListener("pointerdown", shoot);
  document.removeEventListener("pointermove", moveScope);
  document.documentElement.classList.remove("scope-on");
  scope.hidden = true;
}

// ---------------------------------------------------------------
// Zombie shadows
// ---------------------------------------------------------------
const ZOMBIE_MAX = 100;          // most zombies on screen at once
const ZOMBIE_SPAWN_MIN = 100; // milliseconds between new zombies
const ZOMBIE_SPAWN_MAX = 1000;

const zombieLayer = document.getElementById("zombieLayer");
let zombies = [];
let zombieFrame = null;
let zombieSpawnTimer = null;
let zombieLastTime = 0;

const ZOMBIE_SVG =
  '<div class="z-flip"><svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg">' +
  '<g fill="currentColor">' +
  '<circle cx="52" cy="24" r="14"/>' +
  '<path d="M38 40L68 40L74 100L40 100Z"/>' +
  '<path d="M64 48L112 62L110 72L62 64Z"/>' +
  '<path d="M60 56L108 82L104 90L58 68Z"/>' +
  '<path d="M40 98L56 98L52 196L36 196Z"/>' +
  '<path d="M56 98L74 98L84 196L68 196Z"/>' +
  '</g><circle cx="58" cy="22" r="2.2" fill="#c0392b"/></svg></div>';

function spawnZombie() {
  if (zombies.length >= ZOMBIE_MAX) return;

  const h = 200 + Math.random() * 110;   // taller = closer = darker
  const w = h * 0.6;
  const dir = Math.random() < 0.5 ? 1 : -1;

  const el = document.createElement("div");
  el.className = "zombie" + (dir < 0 ? " flip" : "");
  el.style.width = w + "px";
  el.style.height = h + "px";
  el.style.bottom = (Math.random() * 60 - 20) + "px";
  el.style.opacity = 0.55 + ((h - 130) / 110) * 0.35;
  el.innerHTML = ZOMBIE_SVG;
  zombieLayer.appendChild(el);

  const zombie = {
    el, w, h, dir,
    x: dir > 0 ? -w : window.innerWidth,
    speed: 25 + Math.random() * 25     // pixels per second
  };
  el.style.transform = "translateX(" + zombie.x + "px)";
  zombies.push(zombie);
}

function zombieTick(time) {
  const dt = Math.min((time - zombieLastTime) / 1000, 0.1);
  zombieLastTime = time;

  zombies = zombies.filter((z) => {
    z.x += z.dir * z.speed * dt;
    z.el.style.transform = "translateX(" + z.x + "px)";
    const gone = z.dir > 0 ? z.x > window.innerWidth : z.x + z.w < 0;
    if (gone) z.el.remove();
    return !gone;
  });

  zombieFrame = requestAnimationFrame(zombieTick);
}

function scheduleZombie() {
  clearTimeout(zombieSpawnTimer);
  const wait = ZOMBIE_SPAWN_MIN + Math.random() * (ZOMBIE_SPAWN_MAX - ZOMBIE_SPAWN_MIN);
  zombieSpawnTimer = setTimeout(() => {
    spawnZombie();
    scheduleZombie();
  }, wait);
}

function startZombies() {
  zombieLayer.hidden = false;
  zombieLastTime = performance.now();
  cancelAnimationFrame(zombieFrame);
  zombieFrame = requestAnimationFrame(zombieTick);
  spawnZombie();
  scheduleZombie();
}

function stopZombies() {
  cancelAnimationFrame(zombieFrame);
  clearTimeout(zombieSpawnTimer);
  zombies = [];
  zombieLayer.innerHTML = "";
  zombieLayer.hidden = true;
}

// Returns true if the shot hit a zombie (the closest one wins)
function hitZombie(x, y) {
  let target = null;
  zombies.forEach((z) => {
    const r = z.el.getBoundingClientRect();
    const insetX = r.width * 0.15;
    const hit = x > r.left + insetX && x < r.right - insetX && y > r.top && y < r.bottom;
    if (hit && (!target || z.h > target.h)) target = z;
  });
    if (!target) return null;

  zombies = zombies.filter((z) => z !== target);
  target.el.classList.add("dead");
  setTimeout(() => target.el.remove(), 650);
  return target;
}

// ---------------------------------------------------------------
// Score
// ---------------------------------------------------------------
const scoreValue = document.getElementById("scoreValue");
const bestValue = document.getElementById("bestValue");
const scoreReset = document.getElementById("scoreReset");

let score = 0;
let best = 0;

try { best = Number(localStorage.getItem("portfolioBest")) || 0; } catch (err) { /* ignore */ }
bestValue.textContent = best;

function pointsFor(zombie) {
  // Smaller (farther) zombies are worth more: 50 to 150 points
  const raw = 50 + ((240 - zombie.h) / 110) * 100;
  return Math.max(50, Math.min(150, Math.round(raw / 10) * 10));
}

function addScore(zombie, x, y) {
  const points = pointsFor(zombie);
  score += points;
  scoreValue.textContent = score;
  bump(scoreValue);

  if (score > best) {
    best = score;
    bestValue.textContent = best;
    bump(bestValue);
    try { localStorage.setItem("portfolioBest", best); } catch (err) { /* ignore */ }
  }

  const pop = document.createElement("div");
  pop.className = "score-pop";
  pop.textContent = "+" + points;
  pop.style.left = x + "px";
  pop.style.top = y + "px";
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 900);
}

function bump(el) {
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}

scoreReset.addEventListener("click", () => {
  score = 0;
  scoreValue.textContent = 0;
});

// Toggle buttons
const effects = {
  zombies: { label: "Zombies", start: startZombies, stop: stopZombies },
  rain:  { label: "Rain",  start: startRain,  stop: stopRain },
  light: { label: "Light", start: startLight, stop: stopLight },
  grime: { label: "Grime", start() { grime.hidden = false; }, stop() { grime.hidden = true; } },
  scope: { label: "Scope", start: startScope, stop: stopScope }
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const defaults = { rain: !reduceMotion, light: !reduceMotion, grime: true, scope: true, zombies: !reduceMotion };

function loadEffectState() {
  try {
    const saved = JSON.parse(localStorage.getItem("portfolioEffects"));
    return { ...defaults, ...saved };
  } catch (e) {
    return { ...defaults };
  }
}

function saveEffectState() {
  try {
    localStorage.setItem("portfolioEffects", JSON.stringify(effectState));
  } catch (e) { /* storage unavailable, ignore */ }
}

const effectState = loadEffectState();

function applyEffect(name) {
  const on = effectState[name];
  effects[name][on ? "start" : "stop"]();
  const button = document.querySelector('[data-effect="' + name + '"]');
  button.textContent = effects[name].label + ": " + (on ? "On" : "Off");
  button.setAttribute("aria-pressed", String(on));
}

Object.keys(effects).forEach((name) => {
  applyEffect(name);
  document.querySelector('[data-effect="' + name + '"]').addEventListener("click", () => {
    effectState[name] = !effectState[name];
    applyEffect(name);
    saveEffectState();
  });
});

// ---------------------------------------------------------------
// Heart rate number (home page)
// ---------------------------------------------------------------
const bpmEl = document.getElementById("bpm");
if (bpmEl) {
  setInterval(() => { bpmEl.textContent = 74 + Math.floor(Math.random() * 9); }, 1500);
}

// ---------------------------------------------------------------
// Page transition: forward slides in from the right, "back" from the left
// ---------------------------------------------------------------
document.querySelectorAll("[data-transition]").forEach((link) => {
  link.addEventListener("click", (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (reduceMotion) { location.href = link.href; return; }

    if (link.dataset.transition === "back") {
      document.body.classList.add("back");
      try { sessionStorage.setItem("slideBack", "1"); } catch (err) { /* ignore */ }
    }
    document.body.classList.add("leaving");
    setTimeout(() => { location.href = link.href; }, 450);
  });
});

// Coming back with the browser's Back button
window.addEventListener("pageshow", () => document.body.classList.remove("leaving", "back"));

// ---------------------------------------------------------------
// 3D monitor tilt: the monitor turns to face the cursor
// ---------------------------------------------------------------
const MONITOR_TILT = 14;   // maximum angle in degrees

const monitorWrap = document.getElementById("monitorWrap");
const monitor = document.getElementById("monitor");

if (monitorWrap && !reduceMotion) {
  monitorWrap.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = monitorWrap.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;    // -0.5 (left) to 0.5 (right)
    const y = (e.clientY - r.top) / r.height - 0.5;    // -0.5 (top) to 0.5 (bottom)
    monitor.style.setProperty("--ry", x * 2 * MONITOR_TILT + "deg");
    monitor.style.setProperty("--rx", -y * 2 * MONITOR_TILT + "deg");
    monitor.style.setProperty("--gx", (x + 0.5) * 100 + "%");
    monitor.style.setProperty("--gy", (y + 0.5) * 100 + "%");
  });

  monitorWrap.addEventListener("pointerleave", () => {
    monitor.style.setProperty("--rx", "0deg");
    monitor.style.setProperty("--ry", "0deg");
  });
}

// Paper tilt: the paper turns to face the cursor
const PAPER_TILT = 8;   // maximum angle in degrees

const paperWrap = document.getElementById("paperWrap");
const paper = document.getElementById("paper");

if (paperWrap && !reduceMotion) {
  paperWrap.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = paperWrap.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    paper.style.setProperty("--ry", x * 2 * PAPER_TILT + "deg");
    paper.style.setProperty("--rx", -y * 2 * PAPER_TILT + "deg");
    paper.style.setProperty("--gx", (x + 0.5) * 100 + "%");
    paper.style.setProperty("--gy", (y + 0.5) * 100 + "%");
  });

  paperWrap.addEventListener("pointerleave", () => {
    paper.style.setProperty("--rx", "0deg");
    paper.style.setProperty("--ry", "0deg");
  });
}

// Paper waves: stop the drifting for reduced motion
if (reduceMotion) {
  const waveAnimation = document.querySelector("#paperWave animate");
  if (waveAnimation) waveAnimation.remove();
}

// ---------------------------------------------------------------
// Scene: worn-out town, clouds, and the day / night button
// ---------------------------------------------------------------
const DEFAULT_NIGHT = false;   // true = start at night on the first visit

const SCENE_HTML = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <g id="cloudShape">
      <g class="c-lit"><circle cx="52" cy="58" r="26"/><circle cx="90" cy="40" r="34"/><circle cx="130" cy="46" r="30"/><circle cx="166" cy="58" r="24"/><rect x="30" y="58" width="160" height="26" rx="13"/></g>
      <g class="c-shade"><circle cx="47" cy="63" r="25"/><circle cx="85" cy="46" r="33"/><circle cx="125" cy="52" r="29"/><circle cx="161" cy="63" r="23"/><rect x="26" y="64" width="160" height="22" rx="11"/></g>
    </g>
  </defs>
</svg>
<div class="sky"></div>
<div class="stars"></div>
<div class="orb sun"></div>
<div class="orb moon"></div>
<div class="clouds">
  <svg class="cloud" viewBox="0 0 220 90"><use href="#cloudShape"/></svg>
  <svg class="cloud" viewBox="0 0 220 90"><use href="#cloudShape"/></svg>
  <svg class="cloud" viewBox="0 0 220 90"><use href="#cloudShape"/></svg>
  <svg class="cloud" viewBox="0 0 220 90"><use href="#cloudShape"/></svg>
  <svg class="cloud" viewBox="0 0 220 90"><use href="#cloudShape"/></svg>
</div>
<svg class="town" viewBox="0 0 1600 360" preserveAspectRatio="xMidYMax slice">
  <defs>
    <g id="houseA">
      <path class="home" d="M50 320V200H290V320Z"/>
      <path class="home" d="M30 202L120 140L155 152L178 118L305 202Z"/>
      <path class="home" d="M235 125h26v55h-26z"/>
      <rect class="win wl" x="85" y="232" width="38" height="46"/>
      <path class="plank" d="M82 244h44M82 262h44"/>
      <rect class="win" x="170" y="232" width="38" height="46"/>
      <rect class="dark" x="225" y="262" width="40" height="58"/>
    </g>
  </defs>
  <path class="far" d="M20 320V250L70 215L120 250V320ZM180 320V235H260V320ZM330 320V225L385 190L440 225V320ZM520 320V245H600V320ZM700 320V230L760 195L820 230V320ZM900 320V250H980V320ZM1080 320V225L1140 190L1200 225V320ZM1300 320V240H1380V320ZM1450 320V230L1510 200L1570 230V320Z"/>
  <use href="#houseA"/>
  <g transform="rotate(-2 470 320)">
    <path class="home" d="M385 320V185L470 120L555 185V320Z"/>
    <rect class="win wl" x="415" y="195" width="30" height="38"/>
    <rect class="win" x="495" y="195" width="30" height="38"/>
    <rect class="win" x="415" y="262" width="30" height="38"/>
    <rect class="dark" x="490" y="255" width="38" height="65"/>
  </g>
  <path class="home" d="M640 320V225H905V320Z"/>
  <path class="home" d="M628 227L695 172L755 218L805 188L918 227Z"/>
  <rect class="win wl" x="672" y="250" width="44" height="36"/>
  <rect class="win" x="760" y="250" width="44" height="36"/>
  <rect class="dark" x="840" y="262" width="36" height="58"/>
  <path class="tree" d="M960 320V250L945 225M960 270L985 240L995 215M960 250L938 210"/>
  <path class="home" d="M1020 320V175H1215V320Z"/>
  <path class="home" d="M1020 175V155H1060V170H1110V150H1150V172H1215V175Z"/>
  <rect class="win wl" x="1050" y="205" width="34" height="42"/>
  <rect class="win" x="1110" y="205" width="34" height="42"/>
  <rect class="win" x="1050" y="268" width="34" height="42"/>
  <rect class="win wl" x="1110" y="268" width="34" height="42"/>
  <path class="tree" d="M1262 320V130M1236 150h52"/>
  <path class="plank" style="stroke-width:2" d="M1236 150Q1150 195 1100 160"/>
  <use href="#houseA" transform="translate(1290 0)"/>
  <rect class="ground" y="318" width="1600" height="42"/>
</svg>
<div class="fog"></div>`;

// Replace the old background image with the scene
document.querySelector(".backdrop")?.remove();
const scene = document.createElement("div");
scene.className = "scene";
scene.setAttribute("aria-hidden", "true");
scene.innerHTML = SCENE_HTML;
document.body.prepend(scene);

// Day / night button
const dnToggle = document.createElement("button");
dnToggle.type = "button";
dnToggle.className = "dn-toggle";
dnToggle.setAttribute("role", "switch");
dnToggle.setAttribute("aria-label", "Toggle day and night");
dnToggle.innerHTML = '<span class="dn-knob"></span>';
document.body.appendChild(dnToggle);

const rootEl = document.documentElement;

function setNight(night, save) {
  rootEl.classList.toggle("night", night);
  dnToggle.setAttribute("aria-checked", String(night));
  if (save) {
    try { localStorage.setItem("portfolioNight", night ? "1" : "0"); } catch (err) { /* ignore */ }
  }
}

// Start in the saved mode without playing the fade
let startNight = DEFAULT_NIGHT;
try {
  const saved = localStorage.getItem("portfolioNight");
  if (saved !== null) startNight = saved === "1";
} catch (err) { /* ignore */ }

rootEl.classList.add("theme-instant");
setNight(startNight, false);
requestAnimationFrame(() => requestAnimationFrame(() => rootEl.classList.remove("theme-instant")));

dnToggle.addEventListener("click", () => setNight(!rootEl.classList.contains("night"), true));

// ---------------------------------------------------------------
// Static noise on the skills monitor
// ---------------------------------------------------------------
const staticCanvas = document.getElementById("screenStatic");
let staticCtx = null, staticImg = null, staticRaf = null;

if (staticCanvas) {
  staticCanvas.width = 120;      // small canvas, scaled up, so the noise looks chunky
  staticCanvas.height = 150;
  staticCtx = staticCanvas.getContext("2d");
  staticImg = staticCtx.createImageData(120, 150);
}

function staticBurst(strong) {
  if (!staticCanvas || reduceMotion) return;

  cancelAnimationFrame(staticRaf);
  staticCanvas.classList.remove("burst", "blip");
  void staticCanvas.offsetWidth;                       // restart the animation
  staticCanvas.classList.add(strong ? "burst" : "blip");

  const end = performance.now() + (strong ? 700 : 250);
  const draw = (now) => {
    const d = staticImg.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i + 1] = d[i + 2] = Math.random() * 255;
      d[i + 3] = 255;
    }
    staticCtx.putImageData(staticImg, 0, 0);
    if (now < end) staticRaf = requestAnimationFrame(draw);
  };
  staticRaf = requestAnimationFrame(draw);
}

// ---------------------------------------------------------------
// Introduction: Spiffo changes every few seconds
// ---------------------------------------------------------------
const INTRO_IMAGES = [
  "assets/SpiffoSurvivor.webp",
  "assets/SpiffoSurvivor2.webp",
  "assets/SpiffoBrawler.webp",      // <- replace with your new images
  "assets/SpiffoBuilder.webp",
  "assets/SpiffoPacking.webp"
];
const INTRO_DELAY = 3000;      // milliseconds between changes
const INTRO_FADE = 350;        // fade time, keep in sync with the CSS above

const introSpiffo = document.getElementById("introSpiffo");

if (introSpiffo && INTRO_IMAGES.length > 1 && !reduceMotion) {
  // Preload so each picture is ready before it fades in
  INTRO_IMAGES.forEach((src) => { new Image().src = src; });

  let introIndex = 0;
  setInterval(() => {
    introIndex = (introIndex + 1) % INTRO_IMAGES.length;
    introSpiffo.classList.add("swapping");              // fade out
    setTimeout(() => {
      introSpiffo.src = INTRO_IMAGES[introIndex];       // swap while invisible
      introSpiffo.classList.remove("swapping");         // fade in
    }, INTRO_FADE);
  }, INTRO_DELAY);
}