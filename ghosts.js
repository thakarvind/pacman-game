// Direction Constants
const DIR_UP = 0;
const DIR_LEFT = 1;
const DIR_DOWN = 2;
const DIR_RIGHT = 3;

const DIR_OFFSETS = [
    { x: 0, y: -1 }, // UP
    { x: -1, y: 0 }, // LEFT
    { x: 0, y: 1 },  // DOWN
    { x: 1, y: 0 }   // RIGHT
];

// Ghost State Constants
const GHOST_CHASE = 0;
const GHOST_SCATTER = 1;
const GHOST_FRIGHTENED = 2;
const GHOST_EATEN = 3;

class Ghost {
    constructor(name, color, scatterTile, startTile, spawnDelay, dotThreshold) {
        this.name = name;
        this.color = color;
        this.scatterTile = scatterTile;
        this.startTile = startTile;
        
        this.x = 0;
        this.y = 0;
        this.tileX = 0;
        this.tileY = 0;
        
        this.dir = DIR_UP;
        this.nextDir = DIR_UP;
        this.speed = 1.5;
        this.state = GHOST_SCATTER;
        
        this.spawnDelay = spawnDelay; // delay in game ticks or dot eating
        this.dotThreshold = dotThreshold; // alternative trigger
        this.inHouse = true;
        this.houseTimer = 0;
        
        this.targetTile = { x: 0, y: 0 };
        this.animationTimer = 0;

        this.reset();
    }

    reset() {
        this.x = (this.startTile.x * 16) + 8;
        this.y = (this.startTile.y * 16) + 8;
        this.tileX = this.startTile.x;
        this.tileY = this.startTile.y;
        this.dir = DIR_UP;
        this.nextDir = DIR_UP;
        this.state = GHOST_SCATTER;
        this.inHouse = this.name !== "Blinky";
        this.houseTimer = 0;
        this.speed = 1.5;
    }

    update(game) {
        this.animationTimer += 0.15;
        
        if (this.inHouse) {
            this.updateHouse(game);
            return;
        }

        // Calculate tile position
        const prevTileX = this.tileX;
        const prevTileY = this.tileY;
        
        // Decide target based on state and identity
        this.updateTarget(game);
        
        // Handle moving from tile to tile
        this.move(game);
        
        // Identify tile coordinates
        this.tileX = Math.floor(this.x / 16);
        this.tileY = Math.floor(this.y / 16);

        // Tunnel wrapping
        if (this.tileX < 0) {
            this.x = 27 * 16 + 8;
            this.tileX = 27;
        } else if (this.tileX > 27) {
            this.x = 0 * 16 + 8;
            this.tileX = 0;
        }
    }

    updateHouse(game) {
        // Simple bouncing up and down inside the house
        const houseCenterY = 14 * 16 + 8;
        if (this.y < houseCenterY - 6) {
            this.dir = DIR_DOWN;
        } else if (this.y > houseCenterY + 6) {
            this.dir = DIR_UP;
        }
        
        this.y += (this.dir === DIR_UP ? -0.5 : 0.5);
        this.x = (this.startTile.x * 16) + 8;

        this.houseTimer++;
        
        // Conditions to leave house
        const dotsEaten = game.totalDots - game.dotsLeft;
        let shouldLeave = false;

        if (this.name === "Pinky" && (dotsEaten >= 0 || this.houseTimer > 100)) shouldLeave = true;
        else if (this.name === "Inky" && (dotsEaten >= 30 || this.houseTimer > 300)) shouldLeave = true;
        else if (this.name === "Clyde" && (dotsEaten >= 60 || this.houseTimer > 500)) shouldLeave = true;

        if (shouldLeave && game.state === 1) { // 1 = STATE_PLAYING
            this.exitHouse();
        }
    }

    exitHouse() {
        // Move towards the center gate, then go outside
        this.x = 13.5 * 16 + 8;
        this.y = 11 * 16 + 8;
        this.tileX = 14;
        this.tileY = 11;
        this.dir = DIR_LEFT;
        this.nextDir = DIR_LEFT;
        this.inHouse = false;
    }

    move(game) {
        // Adjust speed based on state and context
        this.setSpeed(game);

        // Determine if we are at the center of the current tile
        const tileCenterX = (this.tileX * 16) + 8;
        const tileCenterY = (this.tileY * 16) + 8;

        // Check if moving would cross the tile center
        const dx = this.x - tileCenterX;
        const dy = this.y - tileCenterY;
        const distToCenter = Math.sqrt(dx * dx + dy * dy);

        // If we are close enough to the tile center, align and check for next turn
        const nextOffset = DIR_OFFSETS[this.dir];
        const nextX = this.x + nextOffset.x * this.speed;
        const nextY = this.y + nextOffset.y * this.speed;

        // Check if we crossed center in the current direction
        let crossedCenter = false;
        if (this.dir === DIR_RIGHT && this.x <= tileCenterX && nextX > tileCenterX) crossedCenter = true;
        else if (this.dir === DIR_LEFT && this.x >= tileCenterX && nextX < tileCenterX) crossedCenter = true;
        else if (this.dir === DIR_DOWN && this.y <= tileCenterY && nextY > tileCenterY) crossedCenter = true;
        else if (this.dir === DIR_UP && this.y >= tileCenterY && nextY < tileCenterY) crossedCenter = true;

        if (crossedCenter || distToCenter < this.speed) {
            // Snap to center exactly to avoid drift
            this.x = tileCenterX;
            this.y = tileCenterY;

            // Choose new direction at this intersection
            this.chooseNextDirection(game);
            this.dir = this.nextDir;
        }

        // Apply movement
        const offset = DIR_OFFSETS[this.dir];
        this.x += offset.x * this.speed;
        this.y += offset.y * this.speed;
    }

    setSpeed(game) {
        let baseSpeed = 1.6;
        
        // Difficulty scaling
        if (game.difficulty === 'easy') baseSpeed = 1.2;
        else if (game.difficulty === 'hard') baseSpeed = 2.0;

        // Adjustments based on state
        if (this.state === GHOST_FRIGHTENED) {
            this.speed = baseSpeed * 0.55;
        } else if (this.state === GHOST_EATEN) {
            this.speed = baseSpeed * 2.5; // fly back to base fast
        } else {
            // Tunnel slowdown
            if (this.tileY === 17 && (this.tileX < 5 || this.tileX > 22)) {
                this.speed = baseSpeed * 0.5;
            } else {
                // "Cruise Elroy" Blinky gets faster
                if (this.name === "Blinky" && game.dotsLeft < 20) {
                    this.speed = baseSpeed * 1.15;
                } else {
                    this.speed = baseSpeed * 0.85;
                }
            }
        }
    }

    chooseNextDirection(game) {
        const possibleDirs = [];
        
        // Loop directions (UP, LEFT, DOWN, RIGHT)
        for (let d = 0; d < 4; d++) {
            // No 180-degree turns allowed
            if (d === this.getOppositeDirection(this.dir)) continue;

            const offset = DIR_OFFSETS[d];
            const targetTileX = this.tileX + offset.x;
            const targetTileY = this.tileY + offset.y;

            // Is the tile walkable?
            if (game.isWalkable(targetTileX, targetTileY, true)) {
                // Special check: cannot turn UP at certain locations (above ghost house)
                if (d === DIR_UP) {
                    if ((targetTileX === 12 || targetTileX === 15) && (targetTileY === 10 || targetTileY === 22)) {
                        // Original Pac-Man restriction
                        continue;
                    }
                }
                possibleDirs.push(d);
            }
        }

        if (possibleDirs.length === 0) {
            // Fallback (allow 180 if trapped)
            this.nextDir = this.getOppositeDirection(this.dir);
            return;
        }

        if (possibleDirs.length === 1) {
            this.nextDir = possibleDirs[0];
            return;
        }

        // Frightened ghosts wander randomly
        if (this.state === GHOST_FRIGHTENED) {
            this.nextDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
            return;
        }

        // Pathfinding: Choose direction that minimizes Euclidean distance to target
        let bestDir = possibleDirs[0];
        let minDist = Infinity;

        possibleDirs.forEach(d => {
            const offset = DIR_OFFSETS[d];
            const nextTileX = this.tileX + offset.x;
            const nextTileY = this.tileY + offset.y;

            const dx = nextTileX - this.targetTile.x;
            const dy = nextTileY - this.targetTile.y;
            const dist = dx * dx + dy * dy; // Distance squared

            // Tied distances priority: UP (0), LEFT (1), DOWN (2), RIGHT (3)
            if (dist < minDist) {
                minDist = dist;
                bestDir = d;
            } else if (dist === minDist) {
                if (d < bestDir) {
                    bestDir = d;
                }
            }
        });

        this.nextDir = bestDir;
    }

    getOppositeDirection(dir) {
        if (dir === DIR_UP) return DIR_DOWN;
        if (dir === DIR_DOWN) return DIR_UP;
        if (dir === DIR_LEFT) return DIR_RIGHT;
        if (dir === DIR_RIGHT) return DIR_LEFT;
        return dir;
    }

    updateTarget(game) {
        if (this.state === GHOST_EATEN) {
            // Target is the ghost house entrance
            this.targetTile = { x: 13, y: 11 };
            if (this.tileX === 13 && this.tileY === 11) {
                // Arrived at house, respawn
                this.state = GHOST_CHASE;
                this.inHouse = true;
                this.houseTimer = 0;
            }
            return;
        }

        if (this.state === GHOST_SCATTER) {
            this.targetTile = this.scatterTile;
            return;
        }

        // State is CHASE: Run custom AI targeting rules
        const pacman = game.pacman;
        
        switch (this.name) {
            case "Blinky":
                // Chases Pac-Man directly
                this.targetTile = { x: pacman.tileX, y: pacman.tileY };
                break;
                
            case "Pinky":
                // Targets 4 tiles ahead of Pac-Man.
                // If Pac-Man is facing UP, target offset is (-4, -4) due to arcade bug.
                let pinkyOffsetX = DIR_OFFSETS[pacman.dir].x * 4;
                let pinkyOffsetY = DIR_OFFSETS[pacman.dir].y * 4;
                if (pacman.dir === DIR_UP) {
                    pinkyOffsetX = -4;
                    pinkyOffsetY = -4;
                }
                this.targetTile = { 
                    x: pacman.tileX + pinkyOffsetX, 
                    y: pacman.tileY + pinkyOffsetY 
                };
                break;
                
            case "Inky":
                // Target: double the vector from Blinky to 2 tiles ahead of Pac-Man.
                let inkyOffsetX = DIR_OFFSETS[pacman.dir].x * 2;
                let inkyOffsetY = DIR_OFFSETS[pacman.dir].y * 2;
                if (pacman.dir === DIR_UP) {
                    inkyOffsetX = -2;
                    inkyOffsetY = -2;
                }
                const pTile = { 
                    x: pacman.tileX + inkyOffsetX, 
                    y: pacman.tileY + inkyOffsetY 
                };
                const blinky = game.ghosts.find(g => g.name === "Blinky");
                const vectorX = pTile.x - blinky.tileX;
                const vectorY = pTile.y - blinky.tileY;
                
                this.targetTile = { 
                    x: blinky.tileX + vectorX * 2, 
                    y: blinky.tileY + vectorY * 2 
                };
                break;
                
            case "Clyde":
                // If distance to Pac-Man >= 8 tiles: chases Pac-Man directly.
                // If distance < 8 tiles: targets scatter corner.
                const distDx = this.tileX - pacman.tileX;
                const distDy = this.tileY - pacman.tileY;
                const distSq = distDx * distDx + distDy * distDy;
                
                if (distSq >= 64) { // 8 * 8 = 64
                    this.targetTile = { x: pacman.tileX, y: pacman.tileY };
                } else {
                    this.targetTile = this.scatterTile;
                }
                break;
        }
    }

    frighten() {
        if (this.state === GHOST_EATEN || this.inHouse) return;
        
        // Reverse direction immediately when frightened
        if (this.state !== GHOST_FRIGHTENED) {
            this.state = GHOST_FRIGHTENED;
            this.dir = this.getOppositeDirection(this.dir);
            this.nextDir = this.dir;
        }
    }

    draw(ctx, theme) {
        // Setup glow styling based on theme
        ctx.shadowBlur = 10;
        
        if (this.state === GHOST_FRIGHTENED) {
            ctx.shadowColor = "rgba(0, 0, 255, 0.4)";
        } else if (this.state === GHOST_EATEN) {
            ctx.shadowColor = "rgba(255, 255, 255, 0.2)";
        } else {
            ctx.shadowColor = this.color;
        }

        // If eaten, draw just the eyes
        if (this.state === GHOST_EATEN) {
            this.drawEyes(ctx);
            ctx.shadowBlur = 0;
            return;
        }

        let ghostColor = this.color;
        
        if (this.state === GHOST_FRIGHTENED) {
            // Flash blue/white when frightened duration is running low
            const flashTick = Math.floor(this.animationTimer * 1.5) % 2;
            const isFlashing = window.currentGameInstance && window.currentGameInstance.frightenedTimer < 120;
            
            if (isFlashing && flashTick === 0) {
                ghostColor = "#ffffff"; // Flashing color
            } else {
                ghostColor = "#1a1aff"; // Blue frightened color
            }
        }

        // Draw Ghost body
        ctx.fillStyle = ghostColor;
        ctx.beginPath();
        
        // Top head semicircle
        ctx.arc(this.x, this.y - 1, 7.5, Math.PI, 0, false);
        
        // Body sides and bottom skirt waves
        ctx.lineTo(this.x + 7.5, this.y + 8);
        
        // Skirt wave rendering (animated wave)
        const waveOffset = Math.sin(this.animationTimer) * 1.5;
        ctx.lineTo(this.x + 5, this.y + 6 + waveOffset);
        ctx.lineTo(this.x + 2.5, this.y + 8);
        ctx.lineTo(this.x, this.y + 6 - waveOffset);
        ctx.lineTo(this.x - 2.5, this.y + 8);
        ctx.lineTo(this.x - 5, this.y + 6 + waveOffset);
        
        ctx.lineTo(this.x - 7.5, this.y + 8);
        ctx.closePath();
        ctx.fill();

        // Draw eyes
        if (this.state === GHOST_FRIGHTENED) {
            // Frightened face (jagged red mouth and small orange eyes)
            ctx.fillStyle = "#ffb8ae";
            
            // Left eye
            ctx.fillRect(this.x - 4, this.y - 3, 2, 2);
            // Right eye
            ctx.fillRect(this.x + 2, this.y - 3, 2, 2);
            
            // Frightened jagged mouth
            ctx.strokeStyle = "#ffb8ae";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x - 5, this.y + 3);
            ctx.lineTo(this.x - 3, this.y + 1);
            ctx.lineTo(this.x - 1, this.y + 3);
            ctx.lineTo(this.x + 1, this.y + 1);
            ctx.lineTo(this.x + 3, this.y + 3);
            ctx.lineTo(this.x + 5, this.y + 1);
            ctx.stroke();
        } else {
            this.drawEyes(ctx);
        }

        ctx.shadowBlur = 0; // Reset canvas shadows
    }

    drawEyes(ctx) {
        ctx.fillStyle = "#ffffff";
        
        // Eye positions relative to center and moving direction
        const eyeOffset = DIR_OFFSETS[this.dir];
        const lookX = eyeOffset.x * 1.5;
        const lookY = eyeOffset.y * 1.5;

        // Left eye base
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 2, 2.5, 0, Math.PI * 2, true);
        ctx.fill();

        // Right eye base
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y - 2, 2.5, 0, Math.PI * 2, true);
        ctx.fill();

        // Pupils (blue)
        ctx.fillStyle = "#0000bb";
        ctx.beginPath();
        ctx.arc(this.x - 3 + lookX, this.y - 2 + lookY, 1.2, 0, Math.PI * 2, true);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x + 3 + lookX, this.y - 2 + lookY, 1.2, 0, Math.PI * 2, true);
        ctx.fill();
    }
}
