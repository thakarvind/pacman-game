// Pac-Man Map Layout (28x36 grid)
// Row 0-2: Space for Score HUD
// Row 3-33: Maze Playfield
// Row 34-35: Lives / Fruits Indicator
const MAZE_MAP = [
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWW", // Row 3
    "W............WW............W", // Row 4
    "W.WWWW.WWWWW.WW.WWWWW.WWWW.W", // Row 5
    "W*WWWW.WWWWW.WW.WWWWW.WWWW*W", // Row 6
    "W.WWWW.WWWWW.WW.WWWWW.WWWW.W", // Row 7
    "W..........................W", // Row 8
    "W.WWWW.WW.WWWWWWWW.WW.WWWW.W", // Row 9
    "W.WWWW.WW.WWWWWWWW.WW.WWWW.W", // Row 10
    "W......WW....WW....WW......W", // Row 11
    "WWWWWW.WWWWW WW WWWWW.WWWWWW", // Row 12
    "     W.WWWWW WW WWWWW.W     ", // Row 13
    "     W.WW          WW.W     ", // Row 14
    "     W.WW WWW-WWW  WW.W     ", // Row 15  (- is the gate)
    "WWWWWW.WW W G G W  WW.WWWWWW", // Row 16  (G is inside ghost house)
    "      .   W G G W   .       ", // Row 17  (Tunnel Wrap Row)
    "WWWWWW.WW W G G W  WW.WWWWWW", // Row 18
    "     W.WW WWWWWWW  WW.W     ", // Row 19
    "     W.WW          WW.W     ", // Row 20
    "     W.WW WWWWWWW  WW.W     ", // Row 21
    "WWWWWW.WW WWWWWWW  WW.WWWWWW", // Row 22
    "W............WW............W", // Row 23
    "W.WWWW.WWWWW.WW.WWWWW.WWWW.W", // Row 24
    "W.WWWW.WWWWW.WW.WWWWW.WWWW.W", // Row 25
    "W*..WW................WW..*W", // Row 26
    "WWW.WW.WW.WWWWWWWW.WW.WW.WWW", // Row 27
    "WWW.WW.WW.WWWWWWWW.WW.WW.WWW", // Row 28
    "W......WW....WW....WW......W", // Row 29
    "W.WWWWWWWWWW.WW.WWWWWWWWWW.W", // Row 30
    "W.WWWWWWWWWW.WW.WWWWWWWWWW.W", // Row 31
    "W..........................W", // Row 32
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWW"  // Row 33
];

// Game State Constants
const STATE_READY = 0;
const STATE_PLAYING = 1;
const STATE_PAUSED = 2;
const STATE_DYING = 3;
const STATE_LEVEL_CLEAR = 4;
const STATE_GAME_OVER = 5;

class Pacman {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.tileX = 0;
        this.tileY = 0;
        this.dir = DIR_LEFT;
        this.nextDir = DIR_LEFT;
        
        this.speed = 1.8;
        this.angle = 0;
        this.animationTimer = 0;
        
        this.reset();
    }

    reset() {
        // Classic starting location (tile 13.5, 26)
        this.x = (13.5 * 16) + 8;
        this.y = (26 * 16) + 8;
        this.tileX = 14;
        this.tileY = 26;
        this.dir = DIR_LEFT;
        this.nextDir = DIR_LEFT;
        this.animationTimer = 0;
    }

    update(game) {
        this.animationTimer += 0.2;

        this.setSpeed(game);

        // Allow instant reversing of direction
        if (this.nextDir === this.getOppositeDirection(this.dir)) {
            this.dir = this.nextDir;
        }

        let remainingDist = this.speed;
        let iterations = 0;

        while (remainingDist > 0 && iterations < 2) {
            iterations++;

            const tileX = Math.floor(this.x / 16);
            const tileY = Math.floor(this.y / 16);
            const tileCenterX = (tileX * 16) + 8;
            const tileCenterY = (tileY * 16) + 8;

            // Determine the coordinate of the next tile center we are moving towards
            let nextCenterX = tileCenterX;
            let nextCenterY = tileCenterY;

            if (this.dir === DIR_RIGHT) {
                nextCenterX = (this.x < tileCenterX) ? tileCenterX : tileCenterX + 16;
            } else if (this.dir === DIR_LEFT) {
                nextCenterX = (this.x > tileCenterX) ? tileCenterX : tileCenterX - 16;
            } else if (this.dir === DIR_DOWN) {
                nextCenterY = (this.y < tileCenterY) ? tileCenterY : tileCenterY + 16;
            } else if (this.dir === DIR_UP) {
                nextCenterY = (this.y > tileCenterY) ? tileCenterY : tileCenterY - 16;
            }

            // Distance to that next center
            let distToCenter = 0;
            if (this.dir === DIR_RIGHT || this.dir === DIR_LEFT) {
                distToCenter = Math.abs(nextCenterX - this.x);
            } else {
                distToCenter = Math.abs(nextCenterY - this.y);
            }

            if (remainingDist < distToCenter) {
                // Check if the next tile is walkable
                const nextTileX = Math.floor(nextCenterX / 16);
                const nextTileY = Math.floor(nextCenterY / 16);

                let canMove = true;
                if (nextTileX !== tileX || nextTileY !== tileY) {
                    canMove = game.isWalkable(nextTileX, nextTileY, false);
                }

                if (canMove) {
                    const offset = DIR_OFFSETS[this.dir];
                    this.x += offset.x * remainingDist;
                    this.y += offset.y * remainingDist;
                    if (game.tickCount % 6 === 0) {
                        gameAudio.playChomp();
                    }
                } else {
                    // Next tile is a wall, snap to current tile center and stop
                    this.x = tileCenterX;
                    this.y = tileCenterY;
                    remainingDist = 0;
                }
                remainingDist = 0; // consumed
            } else {
                // Move exactly to the next center
                this.x = nextCenterX;
                this.y = nextCenterY;
                remainingDist -= distToCenter;

                if (game.tickCount % 6 === 0) {
                    gameAudio.playChomp();
                }

                // Re-evaluate tile coordinates at this center
                const newTileX = Math.floor(this.x / 16);
                const newTileY = Math.floor(this.y / 16);

                // Check if we can turn to nextDir
                const offsetNext = DIR_OFFSETS[this.nextDir];
                const turnTileX = newTileX + offsetNext.x;
                const turnTileY = newTileY + offsetNext.y;

                if (this.nextDir !== this.dir && game.isWalkable(turnTileX, turnTileY, false)) {
                    this.dir = this.nextDir;
                } else {
                    // Check if we can continue straight in current dir
                    const offsetCur = DIR_OFFSETS[this.dir];
                    const straightTileX = newTileX + offsetCur.x;
                    const straightTileY = newTileY + offsetCur.y;

                    if (!game.isWalkable(straightTileX, straightTileY, false)) {
                        remainingDist = 0; // Stopped
                    }
                }
            }
        }

        // Re-evaluate tile index for UI / collisions
        this.tileX = Math.floor(this.x / 16);
        this.tileY = Math.floor(this.y / 16);

        // Wrap tunnels
        if (this.tileX < 0) {
            this.x = (27 * 16) + 8;
            this.tileX = 27;
        } else if (this.tileX > 27) {
            this.x = (0 * 16) + 8;
            this.tileX = 0;
        }
    }

    getOppositeDirection(dir) {
        if (dir === DIR_UP) return DIR_DOWN;
        if (dir === DIR_DOWN) return DIR_UP;
        if (dir === DIR_LEFT) return DIR_RIGHT;
        if (dir === DIR_RIGHT) return DIR_LEFT;
        return dir;
    }

    setSpeed(game) {
        let base = 1.8;
        if (game.difficulty === 'easy') base = 1.4;
        else if (game.difficulty === 'hard') base = 2.2;
        
        // Frightened ghost mode boosts Pacman speed slightly
        const ghostsScared = game.ghosts.some(g => g.state === GHOST_FRIGHTENED);
        if (ghostsScared) {
            this.speed = base * 1.1;
        } else {
            this.speed = base;
        }
    }

    draw(ctx) {
        ctx.fillStyle = "#ffff00";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(255, 255, 0, 0.5)";

        // Mouth waka-waka animation calculation
        const mouthAngle = 0.25 + Math.sin(this.animationTimer) * 0.22;

        let startAngle = 0;
        let endAngle = Math.PI * 2;

        if (this.dir === DIR_RIGHT) {
            startAngle = mouthAngle;
            endAngle = Math.PI * 2 - mouthAngle;
        } else if (this.dir === DIR_DOWN) {
            startAngle = Math.PI * 0.5 + mouthAngle;
            endAngle = Math.PI * 0.5 - mouthAngle + Math.PI * 2;
        } else if (this.dir === DIR_LEFT) {
            startAngle = Math.PI + mouthAngle;
            endAngle = Math.PI - mouthAngle;
        } else if (this.dir === DIR_UP) {
            startAngle = Math.PI * 1.5 + mouthAngle;
            endAngle = Math.PI * 1.5 - mouthAngle;
        }

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, 7.5, startAngle, endAngle, false);
        ctx.lineTo(this.x, this.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0; // reset
    }
}

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        
        this.theme = "classic";
        this.difficulty = "normal";
        this.state = STATE_READY;
        this.score = 0;
        this.highscore = parseInt(localStorage.getItem("pacman_highscore")) || 0;
        this.lives = 3;
        this.level = 1;
        
        this.pacman = new Pacman();
        this.ghosts = [
            new Ghost("Blinky", "#ff0000", { x: 25, y: -3 }, { x: 13.5, y: 14 }, 0, 0),
            new Ghost("Pinky", "#ffb8ff", { x: 2, y: -3 }, { x: 13.5, y: 17 }, 60, 0),
            new Ghost("Inky", "#00ffff", { x: 27, y: 35 }, { x: 11.5, y: 17 }, 180, 30),
            new Ghost("Clyde", "#ffb851", { x: 0, y: 35 }, { x: 15.5, y: 17 }, 300, 60)
        ];
        
        // Map grid setup (we clone the layout array into integers)
        this.map = [];
        this.dotsLeft = 0;
        this.totalDots = 0;
        
        // Timer cycles (Scatter/Chase)
        // Scatter 7s, Chase 20s, Scatter 7s, Chase 20s, Scatter 5s, Chase 20s, Scatter 5s, Chase Permanent
        this.cycleTimers = [420, 1200, 420, 1200, 300, 1200, 300, -1];
        this.cycleIndex = 0;
        this.cycleTimer = 0;
        
        this.frightenedTimer = 0;
        this.frightenedDuration = 480; // 8 seconds at 60fps
        
        this.fruitActive = false;
        this.fruitTimer = 0;
        this.fruitType = "cherry";
        this.fruitScoreVal = 100;
        
        this.tickCount = 0;
        this.dyingTick = 0;
        this.levelClearTick = 0;
        this.ghostsEatenCombo = 0;
        
        this.initMap();
        window.currentGameInstance = this;
    }

    initMap() {
        this.map = [];
        this.dotsLeft = 0;
        this.totalDots = 0;
        
        for (let r = 0; r < 36; r++) {
            this.map[r] = [];
            
            // Score rows (0-2) and bottom status rows (34-35) are empty
            if (r < 3 || r > 33) {
                for (let c = 0; c < 28; c++) {
                    this.map[r][c] = 0;
                }
                continue;
            }
            
            const layoutRow = MAZE_MAP[r - 3];
            for (let c = 0; c < 28; c++) {
                const char = layoutRow.charAt(c);
                if (char === 'W') {
                    this.map[r][c] = 1; // Wall
                } else if (char === '.') {
                    this.map[r][c] = 2; // Pellet
                    this.dotsLeft++;
                } else if (char === '*') {
                    this.map[r][c] = 3; // Power Pellet
                    this.dotsLeft++;
                } else if (char === '-') {
                    this.map[r][c] = 4; // House Gate
                } else if (char === 'G') {
                    this.map[r][c] = 5; // Inside House
                } else {
                    this.map[r][c] = 0; // Empty
                }
            }
        }
        
        this.totalDots = this.dotsLeft;
    }

    isWalkable(tileX, tileY, isGhost = false) {
        // Out of bounds checking (wrap tunnel boundaries are walkable)
        if (tileY === 17 && (tileX < 0 || tileX > 27)) return true;
        if (tileY < 0 || tileY >= 36 || tileX < 0 || tileX >= 28) return false;
        
        const cell = this.map[tileY][tileX];
        if (cell === 1) return false; // Wall
        if (cell === 4) return isGhost; // Gate (ghosts only)
        if (cell === 5) return isGhost; // Ghost House (ghosts only)
        
        return true;
    }

    start() {
        if (this.state === STATE_PAUSED) {
            this.state = STATE_PLAYING;
            return;
        }
        
        this.state = STATE_READY;
        this.pacman.reset();
        this.ghosts.forEach(g => g.reset());
        this.cycleIndex = 0;
        this.cycleTimer = 0;
        this.frightenedTimer = 0;
        this.fruitActive = false;
        
        // Update dashboard score UI labels
        document.getElementById("highscore-val").innerText = String(this.highscore).padStart(6, '0');
        document.getElementById("score-val").innerText = String(this.score).padStart(6, '0');
        document.getElementById("level-val").innerText = String(this.level);
        
        // Render lives indicators
        this.updateLivesUI();

        // Play intro theme music
        gameAudio.playStartTheme(() => {
            if (this.state === STATE_READY) {
                this.state = STATE_PLAYING;
            }
        });
    }

    pause() {
        if (this.state === STATE_PLAYING) {
            this.state = STATE_PAUSED;
            gameAudio.stopSiren();
        }
    }

    resetGame() {
        gameAudio.stopSiren();
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.initMap();
        this.start();
    }

    update() {
        if (this.state === STATE_PLAYING) {
            this.tickCount++;
            this.updateSirenTheme();
            
            // Ghost scatter/chase timing cycles
            if (this.frightenedTimer > 0) {
                this.frightenedTimer--;
                if (this.frightenedTimer === 0) {
                    // Turn ghosts back to chase/scatter
                    this.ghosts.forEach(g => {
                        if (g.state === GHOST_FRIGHTENED) {
                            g.state = this.cycleIndex % 2 === 0 ? GHOST_SCATTER : GHOST_CHASE;
                        }
                    });
                }
            } else {
                const limit = this.cycleTimers[this.cycleIndex];
                if (limit !== -1) {
                    this.cycleTimer++;
                    if (this.cycleTimer >= limit) {
                        this.cycleIndex++;
                        this.cycleTimer = 0;
                        const newState = this.cycleIndex % 2 === 0 ? GHOST_SCATTER : GHOST_CHASE;
                        this.ghosts.forEach(g => {
                            if (g.state !== GHOST_EATEN && !g.inHouse) {
                                g.state = newState;
                                // Reverse direction on state change
                                g.dir = g.getOppositeDirection(g.dir);
                            }
                        });
                    }
                }
            }

            // Update Pacman
            this.pacman.update(this);
            
            // Check Pellet Eating
            this.checkPellets();
            
            // Update Ghosts
            this.ghosts.forEach(g => g.update(this));
            
            // Check Ghost Collisions
            this.checkGhostCollisions();

            // Fruit timer
            if (this.fruitActive) {
                this.fruitTimer--;
                if (this.fruitTimer <= 0) {
                    this.fruitActive = false;
                }
                
                // Eat fruit collision
                if (this.pacman.tileX === 14 && this.pacman.tileY === 20) {
                    this.fruitActive = false;
                    this.score += this.fruitScoreVal;
                    this.updateScoreUI();
                    gameAudio.playEatGhost(); // similar chime
                }
            }
        } 
        else if (this.state === STATE_DYING) {
            this.dyingTick++;
            if (this.dyingTick > 100) { // Wait for animation to finish
                this.lives--;
                this.updateLivesUI();
                
                if (this.lives < 0) {
                    this.state = STATE_GAME_OVER;
                    const name = prompt("GAME OVER! Enter your name for the Leaderboard:", "PLAYER") || "PLAYER";
                    this.saveHighscore(name.substring(0, 8).toUpperCase());
                    document.getElementById("overlay-title").innerText = "GAME OVER";
                    document.getElementById("overlay-subtitle").innerText = "Press RESET to Try Again";
                    document.getElementById("overlay-btn").innerText = "PLAY AGAIN";
                    document.getElementById("screen-overlay").classList.add("active");
                } else {
                    this.state = STATE_READY;
                    this.pacman.reset();
                    this.ghosts.forEach(g => g.reset());
                    this.frightenedTimer = 0;
                    this.fruitActive = false;
                    setTimeout(() => {
                        this.state = STATE_PLAYING;
                    }, 1000);
                }
            }
        } 
        else if (this.state === STATE_LEVEL_CLEAR) {
            this.levelClearTick++;
            if (this.levelClearTick > 150) { // Frictional pause
                this.level++;
                this.initMap();
                this.start();
            }
        }
    }

    updateSirenTheme() {
        if (this.ghosts.some(g => g.state === GHOST_EATEN)) {
            gameAudio.startSiren('eaten');
        } else if (this.frightenedTimer > 0) {
            gameAudio.startSiren('frightened');
        } else {
            // Speed up background audio siren as dot count decreases
            const pct = this.dotsLeft / this.totalDots;
            if (pct > 0.8) gameAudio.startSiren('siren1');
            else if (pct > 0.5) gameAudio.startSiren('siren2');
            else if (pct > 0.3) gameAudio.startSiren('siren3');
            else if (pct > 0.1) gameAudio.startSiren('siren4');
            else gameAudio.startSiren('siren5');
        }
    }

    checkPellets() {
        const px = this.pacman.tileX;
        const py = this.pacman.tileY;
        
        if (this.map[py][px] === 2) { // Dot
            this.map[py][px] = 0;
            this.dotsLeft--;
            this.score += 10;
            this.updateScoreUI();
            
            this.checkFruitSpawn();
        } 
        else if (this.map[py][px] === 3) { // Power Pellet
            this.map[py][px] = 0;
            this.dotsLeft--;
            this.score += 50;
            this.updateScoreUI();
            
            // Frighten ghosts
            this.frightenedTimer = this.frightenedDuration;
            this.ghostsEatenCombo = 0;
            this.ghosts.forEach(g => g.frighten());
            
            this.checkFruitSpawn();
        }

        // Win check
        if (this.dotsLeft === 0) {
            this.state = STATE_LEVEL_CLEAR;
            this.levelClearTick = 0;
            gameAudio.stopSiren();
        }
    }

    checkFruitSpawn() {
        const eaten = this.totalDots - this.dotsLeft;
        if (eaten === 70 || eaten === 170) {
            this.fruitActive = true;
            this.fruitTimer = 600; // 10 seconds at 60fps
            this.setFruitType();
        }
    }

    setFruitType() {
        const fruits = [
            { type: "cherry", val: 100 },
            { type: "strawberry", val: 300 },
            { type: "peach", val: 500 },
            { type: "apple", val: 700 },
            { type: "melon", val: 1000 },
            { type: "galaxian", val: 2000 },
            { type: "bell", val: 3000 },
            { type: "key", val: 5000 }
        ];
        
        let index = Math.min(this.level - 1, fruits.length - 1);
        this.fruitType = fruits[index].type;
        this.fruitScoreVal = fruits[index].val;
    }

    checkGhostCollisions() {
        const px = this.pacman.x;
        const py = this.pacman.y;
        
        this.ghosts.forEach(g => {
            if (g.inHouse) return;
            
            // Pixel-based bounding circle overlap check
            const dx = px - g.x;
            const dy = py - g.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 10) { // Collision threshold
                if (g.state === GHOST_FRIGHTENED) {
                    // Eat ghost
                    g.state = GHOST_EATEN;
                    this.ghostsEatenCombo++;
                    const points = Math.pow(2, this.ghostsEatenCombo) * 100; // 200, 400, 800, 1600
                    this.score += points;
                    this.updateScoreUI();
                    
                    // Render points banner temporarily (can draw floating text)
                    this.spawnPointsEffect(g.x, g.y, points);
                    
                    gameAudio.playEatGhost();
                } 
                else if (g.state === GHOST_CHASE || g.state === GHOST_SCATTER) {
                    // Die
                    this.state = STATE_DYING;
                    this.dyingTick = 0;
                    gameAudio.playDeath();
                }
            }
        });
    }

    spawnPointsEffect(x, y, val) {
        this.floatingPoints = { x, y, val, timer: 30 };
    }

    updateScoreUI() {
        document.getElementById("score-val").innerText = String(this.score).padStart(6, '0');
        if (this.score > this.highscore) {
            this.highscore = this.score;
            document.getElementById("highscore-val").innerText = String(this.highscore).padStart(6, '0');
        }
    }

    updateLivesUI() {
        const container = document.getElementById("lives-container");
        container.innerHTML = "";
        for (let i = 0; i < this.lives; i++) {
            const life = document.createElement("div");
            life.className = "life-icon";
            container.appendChild(life);
        }
    }

    saveHighscore(name) {
        let list = JSON.parse(localStorage.getItem("pacman_leaderboard")) || [
            { name: "BLINKY", score: 10000, level: 3 },
            { name: "PINKY", score: 8000, level: 2 },
            { name: "INKY", score: 5000, level: 2 },
            { name: "CLYDE", score: 3000, level: 1 }
        ];
        
        list.push({ name, score: this.score, level: this.level });
        list.sort((a, b) => b.score - a.score);
        list = list.slice(0, 6); // Top 6
        localStorage.setItem("pacman_leaderboard", JSON.stringify(list));
        localStorage.setItem("pacman_highscore", String(this.highscore));
        
        if (window.updateLeaderboardUI) {
            window.updateLeaderboardUI();
        }
    }

    // Canvas Graphics Painter
    draw() {
        // Clear canvas
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board walls
        this.drawWalls();
        
        // Draw board Pellets
        this.drawPellets();
        
        // Draw Fruit
        if (this.fruitActive) {
            this.drawFruit(14.5 * 16, 20.5 * 16);
        }

        // Draw Pacman (unless dead and fully disappeared)
        if (this.state !== STATE_DYING || this.dyingTick < 40) {
            this.pacman.draw(this.ctx);
        } else if (this.state === STATE_DYING) {
            // Death shrink animation rendering
            const ratio = (this.dyingTick - 40) / 60; // 0 to 1
            if (ratio < 1) {
                this.ctx.fillStyle = "#ffff00";
                this.ctx.beginPath();
                this.ctx.arc(this.pacman.x, this.pacman.y, Math.max(0, 7.5 * (1 - ratio)), ratio * Math.PI, Math.PI * 2 - (ratio * Math.PI));
                this.ctx.lineTo(this.pacman.x, this.pacman.y);
                this.ctx.fill();
            }
        }
        
        // Draw Ghosts
        this.ghosts.forEach(g => g.draw(this.ctx, this.theme));

        // Draw Floating eating scores banner
        if (this.floatingPoints && this.floatingPoints.timer > 0) {
            this.floatingPoints.timer--;
            this.ctx.fillStyle = "#00ffff";
            this.ctx.font = "8px 'Press Start 2P'";
            this.ctx.textAlign = "center";
            this.ctx.fillText(this.floatingPoints.val, this.floatingPoints.x, this.floatingPoints.y - 10);
        }

        // Flash screen for level clears
        if (this.state === STATE_LEVEL_CLEAR) {
            const flash = Math.floor(this.levelClearTick / 10) % 2 === 0;
            if (flash) {
                this.ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }

    drawWalls() {
        this.ctx.lineWidth = 3;
        
        let wallStroke = "#0022cc";
        let wallGlow = "rgba(0, 34, 204, 0.4)";
        
        if (this.theme === "cyberpunk") {
            wallStroke = "#bd00ff";
            wallGlow = "rgba(189, 0, 255, 0.4)";
        } else if (this.theme === "matrix") {
            wallStroke = "#00ff41";
            wallGlow = "rgba(0, 255, 65, 0.4)";
        } else if (this.theme === "monochrome") {
            wallStroke = "#ffffff";
            wallGlow = "rgba(255, 255, 255, 0.2)";
        }
        
        this.ctx.strokeStyle = wallStroke;
        this.ctx.shadowColor = wallGlow;
        this.ctx.shadowBlur = 8;
        
        for (let r = 3; r < 34; r++) {
            for (let c = 0; c < 28; c++) {
                if (this.map[r][c] === 1) {
                    const tx = c * 16;
                    const ty = r * 16;
                    
                    // Draw neon borders on sides that don't border walls
                    // UP
                    if (r === 3 || this.map[r - 1][c] !== 1) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(tx, ty);
                        this.ctx.lineTo(tx + 16, ty);
                        this.ctx.stroke();
                    }
                    // DOWN
                    if (r === 33 || this.map[r + 1][c] !== 1) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(tx, ty + 16);
                        this.ctx.lineTo(tx + 16, ty + 16);
                        this.ctx.stroke();
                    }
                    // LEFT
                    if (c === 0 || this.map[r][c - 1] !== 1) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(tx, ty);
                        this.ctx.lineTo(tx, ty + 16);
                        this.ctx.stroke();
                    }
                    // RIGHT
                    if (c === 27 || this.map[r][c + 1] !== 1) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(tx + 16, ty);
                        this.ctx.lineTo(tx + 16, ty + 16);
                        this.ctx.stroke();
                    }
                }
                else if (this.map[r][c] === 4) { // Gate
                    // Draw a thin pink gate line
                    this.ctx.shadowBlur = 0;
                    this.ctx.strokeStyle = "#ffb8ff";
                    this.ctx.lineWidth = 4;
                    this.ctx.beginPath();
                    this.ctx.moveTo(c * 16, r * 16 + 8);
                    this.ctx.lineTo((c + 2) * 16, r * 16 + 8);
                    this.ctx.stroke();
                    
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeStyle = wallStroke;
                    this.ctx.shadowColor = wallGlow;
                    this.ctx.shadowBlur = 8;
                    c++; // Skip next column since gate is 2 tiles wide
                }
            }
        }
        
        this.ctx.shadowBlur = 0; // reset
    }

    drawPellets() {
        let dotColor = "#ffb8ae";
        if (this.theme === "cyberpunk") dotColor = "#00ffff";
        else if (this.theme === "matrix") dotColor = "#00ff41";
        else if (this.theme === "monochrome") dotColor = "#dddddd";
        
        this.ctx.fillStyle = dotColor;
        
        for (let r = 3; r < 34; r++) {
            for (let c = 0; c < 28; c++) {
                if (this.map[r][c] === 2) { // Dot
                    this.ctx.beginPath();
                    this.ctx.arc(c * 16 + 8, r * 16 + 8, 2.5, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (this.map[r][c] === 3) { // Power Pellet
                    // Flash at 3Hz
                    if (Math.floor(this.tickCount / 12) % 2 === 0) {
                        this.ctx.beginPath();
                        this.ctx.shadowBlur = 10;
                        this.ctx.shadowColor = dotColor;
                        this.ctx.arc(c * 16 + 8, r * 16 + 8, 6, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.shadowBlur = 0;
                    }
                }
            }
        }
    }

    drawFruit(x, y) {
        // Red cherries
        if (this.fruitType === "cherry") {
            this.ctx.fillStyle = "#ff0000";
            
            // Cherry 1
            this.ctx.beginPath();
            this.ctx.arc(x - 3, y + 2, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Cherry 2
            this.ctx.beginPath();
            this.ctx.arc(x + 3, y + 4, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Green stems
            this.ctx.strokeStyle = "#00bb00";
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(x - 3, y + 2);
            this.ctx.quadraticCurveTo(x - 1, y - 4, x + 2, y - 5);
            this.ctx.moveTo(x + 3, y + 4);
            this.ctx.quadraticCurveTo(x + 2, y - 1, x + 2, y - 5);
            this.ctx.stroke();
        } 
        // Strawberry
        else if (this.fruitType === "strawberry") {
            this.ctx.fillStyle = "#ff3333";
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - 5);
            this.ctx.bezierCurveTo(x + 6, y - 5, x + 6, y + 3, x, y + 7);
            this.ctx.bezierCurveTo(x - 6, y + 3, x - 6, y - 5, x, y - 5);
            this.ctx.fill();
            
            // Green leaves
            this.ctx.fillStyle = "#00bb00";
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - 5);
            this.ctx.lineTo(x - 3, y - 7);
            this.ctx.lineTo(x, y - 6);
            this.ctx.lineTo(x + 3, y - 7);
            this.ctx.closePath();
            this.ctx.fill();
        } 
        // Other levels (draw basic colored fruit polygon shapes)
        else {
            this.ctx.fillStyle = "#ffaa00";
            this.ctx.beginPath();
            this.ctx.arc(x, y, 5.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}
