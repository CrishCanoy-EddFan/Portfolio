const drawer = document.getElementById("gameDrawer");
const gdImage = document.getElementById("gdImage");
const gdName = document.getElementById("gdName");
const gdGenre = document.getElementById("gdGenre");
const gdPlatform = document.getElementById("gdPlatform");
const gdDesc = document.getElementById("gdDesc");
const gdGallery = document.getElementById("gdGallery");

let lastTile = null;

// ---------------------------------------------------------------
// Gameplay gallery: one big picture, two small ones.
// Click a small picture and it becomes the big one; the old big one takes its place.
// ---------------------------------------------------------------
const SHOT_TILT = 14;                 // maximum tilt in degrees on hover
const SLOTS = ["main", "a", "b"];     // main = big picture, a and b = small pictures

function renderGallery(tile, gameName) {
  gdGallery.replaceChildren();
  const list = (tile.dataset.shots || "")
    .split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);

  gdGallery.className = "gallery count-" + list.length;
  if (!list.length) return;

  const shots = list.map((src, i) => {
    const shot = document.createElement("div");      // slot: position and size
    shot.className = "gshot";
    shot.dataset.slot = SLOTS[i];

    const float = document.createElement("div");     // floating animation
    float.className = "gshot-float";

    const paper = document.createElement("div");     // paper look and hover tilt
    paper.className = "shot-paper";

    const img = document.createElement("img");
    img.src = src;
    img.alt = gameName + " gameplay " + (i + 1);
    img.draggable = false;

    paper.appendChild(img);
    float.appendChild(paper);
    shot.appendChild(float);
    gdGallery.appendChild(shot);

    // Tilt toward the mouse
    if (!reduceMotion) {
      paper.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        const r = paper.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        paper.style.setProperty("--ry", x * 2 * SHOT_TILT + "deg");
        paper.style.setProperty("--rx", -y * 2 * SHOT_TILT + "deg");
        paper.style.setProperty("--gx", (x + 0.5) * 100 + "%");
        paper.style.setProperty("--gy", (y + 0.5) * 100 + "%");
      });
      paper.addEventListener("pointerleave", () => {
        paper.style.setProperty("--rx", "0deg");
        paper.style.setProperty("--ry", "0deg");
      });
    }

    shot.addEventListener("click", () => promote(shot));
    shot.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        promote(shot);
      }
    });
    return shot;
  });

  // Make a small picture the big one, and the old big one small
  function promote(shot) {
    if (shot.dataset.slot === "main") return;
    const oldMain = shots.find((s) => s.dataset.slot === "main");
    oldMain.dataset.slot = shot.dataset.slot;   // old big picture takes the small spot
    shot.dataset.slot = "main";                 // clicked picture becomes big
    updateAccess();
  }

  // Small pictures can be reached with the keyboard; the big one cannot be "clicked"
  function updateAccess() {
    shots.forEach((s) => {
      if (s.dataset.slot === "main") {
        s.removeAttribute("tabindex");
        s.removeAttribute("role");
        s.removeAttribute("aria-label");
      } else {
        s.tabIndex = 0;
        s.setAttribute("role", "button");
        s.setAttribute("aria-label", "Enlarge: " + s.querySelector("img").alt);
      }
    });
  }
  updateAccess();

  if (list.length > 1) {
    const hint = document.createElement("p");
    hint.className = "gallery-hint";
    hint.textContent = "Click a small picture to enlarge it";
    gdGallery.appendChild(hint);
  }
}

// ---------------------------------------------------------------
// Game preview window
// ---------------------------------------------------------------
function openGame(tile) {
  const img = tile.querySelector("img");
  lastTile = tile;
  gdImage.src = img.src;
  gdName.textContent = tile.querySelector(".tile-name").textContent;
  gdImage.alt = gdName.textContent;
  gdGenre.textContent = tile.dataset.genre || "";
  gdPlatform.textContent = tile.dataset.platform || "";
  gdDesc.textContent = tile.dataset.description || "";
  renderGallery(tile, gdName.textContent);

  drawer.classList.remove("closing");
  drawer.showModal();
  document.body.classList.add("no-scroll");
}

function closeGame() {
  if (!drawer.open || drawer.classList.contains("closing")) return;
  drawer.classList.add("closing");              // plays the slide-out
  setTimeout(() => {
    drawer.close();
    drawer.classList.remove("closing");
  }, 300);
}

document.querySelectorAll(".tile.game").forEach((tile) => {
  tile.addEventListener("click", () => openGame(tile));
});

document.getElementById("gdClose").addEventListener("click", closeGame);
// Click on the dark empty area (outside the pictures and the panel) to close
drawer.addEventListener("click", (e) => {
  if (e.target === drawer || e.target === gdGallery) closeGame();
});
drawer.addEventListener("cancel", (e) => { e.preventDefault(); closeGame(); });  // Esc key
drawer.addEventListener("close", () => {
  document.body.classList.remove("no-scroll");
  gdGallery.replaceChildren();
  if (lastTile) lastTile.focus();
});

// Tablet clock
const tabletClock = document.getElementById("tabletClock");
function updateClock() {
  tabletClock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
updateClock();
setInterval(updateClock, 10000);

// Tablet tilt: the tablet turns to face the cursor
const TABLET_TILT = 6;   // maximum angle in degrees

const tabletWrap = document.getElementById("tabletWrap");
const tablet = document.querySelector(".tablet");

if (!reduceMotion) {
  tabletWrap.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = tabletWrap.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tablet.style.setProperty("--ry", x * 2 * TABLET_TILT + "deg");
    tablet.style.setProperty("--rx", -y * 2 * TABLET_TILT + "deg");
    tablet.style.setProperty("--gx", (x + 0.5) * 100 + "%");
    tablet.style.setProperty("--gy", (y + 0.5) * 100 + "%");
  });

  tabletWrap.addEventListener("pointerleave", () => {
    tablet.style.setProperty("--rx", "0deg");
    tablet.style.setProperty("--ry", "0deg");
  });
}