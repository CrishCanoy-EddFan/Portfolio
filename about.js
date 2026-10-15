const drawer = document.getElementById("gameDrawer");
const gdImage = document.getElementById("gdImage");
const gdName = document.getElementById("gdName");
const gdGenre = document.getElementById("gdGenre");
const gdPlatform = document.getElementById("gdPlatform");
const gdDesc = document.getElementById("gdDesc");

let lastTile = null;

function openGame(tile) {
  const img = tile.querySelector("img");
  lastTile = tile;
  gdImage.src = img.src;
  gdName.textContent = tile.querySelector(".tile-name").textContent;
  gdImage.alt = gdName.textContent;
  gdGenre.textContent = tile.dataset.genre || "";
  gdPlatform.textContent = tile.dataset.platform || "";
  gdDesc.textContent = tile.dataset.description || "";

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
drawer.addEventListener("click", (e) => { if (e.target === drawer) closeGame(); });
drawer.addEventListener("cancel", (e) => { e.preventDefault(); closeGame(); });  // Esc key
drawer.addEventListener("close", () => {
  document.body.classList.remove("no-scroll");
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