// Initialize Core Game System
let game = null;

document.addEventListener("DOMContentLoaded", () => {
    // Instantiate game engine
    game = new Game("game-canvas");
    
    // Bind Keyboard Listeners
    setupKeyboardControls();
    
    // Bind UI Buttons and Selectors
    setupSidebarControls();
    
    // Bind Virtual Joystick & Swipe Gestures
    setupTouchControls();

    // Render leaderboard initially
    updateLeaderboardUI();
    
    // Start main game visual loops
    requestAnimationFrame(mainGameLoop);
});

// Main Game Rendering Loop
function mainGameLoop() {
    if (game) {
        game.update();
        game.draw();
    }
    requestAnimationFrame(mainGameLoop);
}

// 1. KEYBOARD CONTROLS
function setupKeyboardControls() {
    window.addEventListener("keydown", (e) => {
        // Prevent default scrolling for arrows and space
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
            e.preventDefault();
        }

        if (!game || game.state === STATE_DYING || game.state === STATE_LEVEL_CLEAR) return;

        switch (e.code) {
            case "ArrowUp":
            case "KeyW":
                game.pacman.nextDir = DIR_UP;
                break;
            case "ArrowLeft":
            case "KeyA":
                game.pacman.nextDir = DIR_LEFT;
                break;
            case "ArrowDown":
            case "KeyS":
                game.pacman.nextDir = DIR_DOWN;
                break;
            case "ArrowRight":
            case "KeyD":
                game.pacman.nextDir = DIR_RIGHT;
                break;
            case "Space":
                togglePause();
                break;
        }
    });
}

function togglePause() {
    if (!game) return;
    if (game.state === STATE_PLAYING) {
        game.pause();
        document.getElementById("overlay-title").innerText = "PAUSED";
        document.getElementById("overlay-subtitle").innerText = "Press START or SPACE to Resume";
        document.getElementById("overlay-btn").innerText = "RESUME";
        document.getElementById("screen-overlay").classList.add("active");
    } else if (game.state === STATE_PAUSED) {
        game.start();
        document.getElementById("screen-overlay").classList.remove("active");
    }
}

// 2. SIDEBAR & HUD CONTROLS
function setupSidebarControls() {
    const startBtn = document.getElementById("start-btn");
    const overlayBtn = document.getElementById("overlay-btn");
    const resetBtn = document.getElementById("reset-btn");
    const themeSelect = document.getElementById("theme-select");
    const difficultySelect = document.getElementById("difficulty-select");
    const sfxBtn = document.getElementById("sfx-toggle-btn");
    const sfxStatus = document.getElementById("sfx-status");
    
    const screenOverlay = document.getElementById("screen-overlay");

    // Click handler for Start buttons
    const handleStartClick = () => {
        if (!game) return;
        
        // Audio engine initialization needs user gesture context
        gameAudio.init();

        if (game.state === STATE_READY || game.state === STATE_GAME_OVER) {
            game.resetGame();
            screenOverlay.classList.remove("active");
        } else if (game.state === STATE_PAUSED) {
            game.start();
            screenOverlay.classList.remove("active");
        } else if (game.state === STATE_PLAYING) {
            togglePause();
        } else {
            // Level clears or ready states
            game.start();
            screenOverlay.classList.remove("active");
        }
    };

    startBtn.addEventListener("click", handleStartClick);
    overlayBtn.addEventListener("click", handleStartClick);

    // Reset button click
    resetBtn.addEventListener("click", () => {
        if (!game) return;
        game.resetGame();
        screenOverlay.classList.remove("active");
    });

    // Theme selector click
    themeSelect.addEventListener("change", (e) => {
        const selected = e.target.value;
        game.theme = selected;
        
        // Remove existing theme classes from body
        document.body.className = "";
        
        if (selected !== "classic") {
            document.body.classList.add(`theme-${selected}`);
        }
    });

    // Difficulty selector click
    difficultySelect.addEventListener("change", (e) => {
        if (game) {
            game.difficulty = e.target.value;
        }
    });

    // Sound toggle buttons
    const handleSoundToggle = () => {
        const isMuted = !gameAudio.muted;
        gameAudio.setMute(isMuted);
        
        if (isMuted) {
            sfxStatus.innerText = "OFF";
            sfxStatus.classList.remove("active");
            sfxBtn.querySelector(".btn-icon").innerText = "🔇";
        } else {
            sfxStatus.innerText = "ON";
            sfxStatus.classList.add("active");
            sfxBtn.querySelector(".btn-icon").innerText = "🔊";
        }
    };

    sfxBtn.addEventListener("click", handleSoundToggle);

}

// 3. TOUCH SWIPE CONTROLS
function setupTouchControls() {
    const canvas = document.getElementById("game-canvas");
    
    // --- Touch Swipe Control on Canvas ---
    let touchStartX = 0;
    let touchStartY = 0;
    const swipeThreshold = 30; // Min pixels to register swipe

    canvas.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    canvas.addEventListener("touchmove", (e) => {
        if (!game || game.state !== STATE_PLAYING) return;
        
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        
        if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal Swipe
                game.pacman.nextDir = deltaX > 0 ? DIR_RIGHT : DIR_LEFT;
            } else {
                // Vertical Swipe
                game.pacman.nextDir = deltaY > 0 ? DIR_DOWN : DIR_UP;
            }
            // Reset start coordinates to allow continuous multi-swipes
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: true });
}

// 4. LEADERBOARD RENDERING
function updateLeaderboardUI() {
    const list = JSON.parse(localStorage.getItem("pacman_leaderboard")) || [
        { name: "BLINKY", score: 10000, level: 3 },
        { name: "PINKY", score: 8000, level: 2 },
        { name: "INKY", score: 5000, level: 2 },
        { name: "CLYDE", score: 3000, level: 1 }
    ];

    const body = document.getElementById("leaderboard-body");
    if (!body) return;

    body.innerHTML = "";
    list.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="font-arcade">${item.name}</td>
            <td class="font-arcade">${String(item.score).padStart(6, '0')}</td>
            <td class="font-arcade">${item.level}</td>
        `;
        body.appendChild(row);
    });
}

// Expose interface functions to game scope
window.updateLeaderboardUI = updateLeaderboardUI;
window.togglePause = togglePause;
