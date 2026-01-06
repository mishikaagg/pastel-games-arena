const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');
const usernameInput = document.getElementById('usernameInput');
const userDisplayName = document.getElementById('userDisplayName');
const startInstruction = document.getElementById('startInstruction');

// Game Constants
const GRID_SIZE = 20; // 20x20 grid for 400px board
const TILE_COUNT = Math.floor(canvas.width / GRID_SIZE);
const GAME_SPEED = 200; // Slower speed for child-friendly play

// Game State
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let username = localStorage.getItem('snakeUsername') || 'Player';
let lives = 3;
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0; // Start with no movement
let dy = 0;
let gameInterval;
let isGameRunning = false;
let isPaused = false;
let isWaitingForStart = false;

highScoreElement.textContent = highScore;
usernameInput.value = username === 'Player' ? '' : username;
userDisplayName.textContent = username;

const livesContainer = document.getElementById('livesContainer');
const leaderboardList = document.getElementById('leaderboardList');

let leaderboard = JSON.parse(localStorage.getItem('snakeLeaderboard')) || [];

// Audio Context for gentle pastel sounds
let audioCtx;
async function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
    console.log("Audio Status:", audioCtx.state);
}

function playPopSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.6, audioCtx.currentTime); // Louder
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playLifeLostSound() {
    if (!audioCtx) return;

    // "Uh-oh" - Two short pulses
    const playNote = (freq, start, duration, volume) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(volume, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
    };

    playNote(200, 0, 0.15, 0.2); // "Uh"
    playNote(150, 0.1, 0.2, 0.2); // "oh"
}

function playGameOverSound() {
    if (!audioCtx) return;

    // More distinct "Oh no" - Sawtooth wave for buzzier sound
    const playNote = (freq, start, duration, volume, type = 'sawtooth') => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(volume, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
    };

    // Descending "buzz" sound
    playNote(300, 0, 0.2, 0.4); // "Oh"
    playNote(200, 0.15, 0.5, 0.4); // "no"
}

function updateLivesUI() {
    const hearts = livesContainer.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
        if (index >= lives) {
            heart.classList.add('lost');
        } else {
            heart.classList.remove('lost');
        }
    });
}

function updateLeaderboard(name, newScore) {
    leaderboard.push({ name: name || 'Player', score: newScore });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10); // Keep top 10
    localStorage.setItem('snakeLeaderboard', JSON.stringify(leaderboard));
}

function displayLeaderboard() {
    leaderboardList.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const item = document.createElement('li');
        item.classList.add('leaderboard-item');
        item.innerHTML = `
            <span class="rank">#${index + 1}</span>
            <span class="name">${entry.name}</span>
            <span class="score">${entry.score}</span>
        `;
        leaderboardList.appendChild(item);
    });
}

function initGame() {
    initAudio();

    // Save username
    const newUsername = usernameInput.value.trim();
    if (newUsername) {
        username = newUsername;
        localStorage.setItem('snakeUsername', username);
        userDisplayName.textContent = username;
    }

    lives = 3;
    score = 0;
    scoreElement.textContent = score;
    updateLivesUI();
    resetSnake();
    spawnFood();
    isGameRunning = true;
    isWaitingForStart = true;
    startInstruction.classList.remove('hidden');

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, GAME_SPEED);
}

function resetSnake() {
    const centerX = Math.floor(TILE_COUNT / 2);
    const centerY = Math.floor(TILE_COUNT / 2);
    snake = [
        { x: centerX, y: centerY },
        { x: centerX - 1, y: centerY },
        { x: centerX - 2, y: centerY }
    ];
    dx = 0; // No movement until key press
    dy = 0;
    isPaused = false;
    isWaitingForStart = true;
    startInstruction.classList.remove('hidden');
    pauseBtn.textContent = '⏸';
}

function togglePause() {
    if (!isGameRunning) return;
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '▶' : '⏸';
    if (isPaused) {
        clearInterval(gameInterval);
    } else {
        gameInterval = setInterval(gameLoop, GAME_SPEED);
    }
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT)
    };
    for (let part of snake) {
        if (part.x === food.x && part.y === food.y) {
            spawnFood();
        }
    }
}

function gameLoop() {
    if (!isGameRunning || isPaused) return;
    update();
    draw();
}

function pulseScore() {
    scoreElement.classList.add('score-pulse');
    setTimeout(() => scoreElement.classList.remove('score-pulse'), 200);
}

function handleCollision() {
    lives--;
    updateLivesUI();

    if (lives > 0) {
        playLifeLostSound();
        resetSnake();
        spawnFood();
        // Visual indicator for life loss
        canvas.style.borderColor = '#FDA4AF';
        setTimeout(() => canvas.style.borderColor = '#F1F5F9', 300);
    } else {
        gameOver();
    }
}

function update() {
    if (dx === 0 && dy === 0) return; // Wait for first move

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        handleCollision();
        return;
    }

    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            handleCollision();
            return;
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        pulseScore();
        playPopSound();

        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }

        spawnFood();
    } else {
        snake.pop();
    }
}

function draw() {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#E9D5FF';
    ctx.lineWidth = 1;
    for (let i = 0; i <= TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }

    ctx.fillStyle = '#BAE6FD';
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? '#F472B6' : '#FBCFE8';
        ctx.fillRect(
            part.x * GRID_SIZE + 1,
            part.y * GRID_SIZE + 1,
            GRID_SIZE - 2,
            GRID_SIZE - 2
        );
    });

    if (isPaused) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#64748B';
        ctx.font = 'bold 30px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 + 10);
    }
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameInterval);
    finalScoreElement.textContent = score;

    // Update and show leaderboard
    updateLeaderboard(username, score);
    displayLeaderboard();

    gameOverScreen.classList.remove('hidden');
    playGameOverSound();
    draw();
}

document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === ' ') {
        togglePause();
        return;
    }

    if (!isGameRunning || isPaused) return;

    // Start movement if waiting
    if (isWaitingForStart && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        isWaitingForStart = false;
        startInstruction.classList.add('hidden');
    }

    switch (e.key) {
        case 'ArrowUp':
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case 'ArrowDown':
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case 'ArrowLeft':
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case 'ArrowRight':
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
});

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);
pauseBtn.addEventListener('click', togglePause);

draw();

