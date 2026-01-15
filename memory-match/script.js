// Audio Context for gentle pastel sounds
let audioCtx;

async function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
}

function playWrongMatchSound() {
    if (!audioCtx) return;
    
    // "Oh oh" - Two short descending notes
    const playNote = (freq, start, duration, volume) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(volume, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
    };

    playNote(250, 0, 0.15, 0.3); // "Oh"
    playNote(200, 0.1, 0.2, 0.3); // "oh"
}

function playMatchSound() {
    if (!audioCtx) return;
    
    // "Yes" - Upward, cheerful sound
    const playNote = (freq, start, duration, volume, type = 'sine') => {
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

    // Cheerful ascending "Yes" sound
    playNote(330, 0, 0.15, 0.4); // "Ye"
    playNote(440, 0.1, 0.2, 0.4); // "s"
}

function playWinSound() {
    if (!audioCtx) return;
    
    // "You win" - Ascending celebratory notes
    const playNote = (freq, start, duration, volume, type = 'sine') => {
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

    // Cheerful ascending melody
    playNote(330, 0, 0.2, 0.4); // "You"
    playNote(392, 0.15, 0.2, 0.4); // "win"
    playNote(523, 0.3, 0.3, 0.5); // High note
    playNote(659, 0.5, 0.4, 0.5); // Higher note
}

function createConfetti() {
    const colors = ['#FFB3D9', '#B3E5FC', '#E1BEE7', '#C5E1A5', '#FFD9B3', '#FFB3E6'];
    const confettiCount = 150;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Random size for variety
            const size = Math.random() * 8 + 6;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            
            // Random shape (circle or square)
            if (Math.random() > 0.5) {
                confetti.style.borderRadius = '50%';
            } else {
                confetti.style.borderRadius = '2px';
            }
            
            // Random drift direction
            const drift = (Math.random() * 2 - 1) * 100;
            confetti.style.setProperty('--drift', drift + 'px');
            
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.remove();
                }
            }, 4000);
        }, i * 10);
    }
}

// Game State
let cards = [];
let selectedCards = [];
let matchedPairs = 0;
let moves = 0;
let timerInterval = null;
let startTime = null;
let pausedTime = 0; // Track paused time offset
let totalElapsedTime = 0; // Track total elapsed time for scoring
let canSelect = false;
let memorizing = true;
let isPaused = false;

// Card emojis - extended list for different difficulty levels
// All emojis must be unique - we need at least 18 for hard level (18 pairs)
const allEmojisList = [
    '🎨', '🎭', '🎪', '🎸', '🎯', '🎲', '🎮', '🎹', '🎺', '🎻',
    '🥁', '🎤', '🎧', '🎬', '🎷', '🧩', '🧸', '🪁', '🚀', '🌈',
    '🍎', '🍩', '🧁', '🦄'
];

// Remove duplicates to get unique emojis only
let finalUniqueEmojis = [...new Set(allEmojisList)];

// The pair creation logic (forEach loop below) ensures each emoji appears exactly twice
// This fixes the bug where some emojis had 3+ duplicates or none

// Difficulty settings
const difficultySettings = {
    easy: { gridCols: 4, gridRows: 4, pairs: 8 },
    medium: { gridCols: 5, gridRows: 5, pairs: 12 }, // 24 cards in 5x5 grid (1 empty cell)
    hard: { gridCols: 6, gridRows: 6, pairs: 18 }
};

// Current difficulty
let currentDifficulty = 'easy';

// DOM Elements
const cardGrid = document.getElementById('cardGrid');
const timerEl = document.getElementById('timer');
const movesEl = document.getElementById('moves');
const pairsEl = document.getElementById('pairs');
const statusMessage = document.getElementById('statusMessage');
const winModal = document.getElementById('winModal');
const playAgainBtn = document.getElementById('playAgainBtn');
const finalTimeEl = document.getElementById('finalTime');
const finalMovesEl = document.getElementById('finalMoves');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const pauseCloud = document.getElementById('pauseCloud');
const pauseCloudText = document.getElementById('pauseCloudText');
const playerNameInput = document.getElementById('playerName');
const scoreboard = document.getElementById('scoreboard');

// Initialize Game
function initGame() {
    // Get current difficulty from active button, default to easy
    const activeButton = document.querySelector('.difficulty-btn.active');
    currentDifficulty = activeButton ? activeButton.dataset.difficulty : 'easy';
    const settings = difficultySettings[currentDifficulty];

    // Reset state
    cards = [];
    selectedCards = [];
    matchedPairs = 0;
    moves = 0;
    canSelect = false;
    memorizing = true;
    isPaused = false;
    pausedTime = 0;
    totalElapsedTime = 0;
    pauseCloudText.textContent = '☁️ Press spacebar to stop the timer';
    pauseCloud.classList.add('hidden');

    // Update UI
    movesEl.textContent = '0';
    pairsEl.textContent = `0/${settings.pairs}`;
    timerEl.textContent = '0:00';
    statusMessage.textContent = 'Memorize the cards!';
    winModal.classList.add('hidden');

    // Update grid CSS
    cardGrid.style.gridTemplateColumns = `repeat(${settings.gridCols}, 1fr)`;
    
    // Adjust max-width for larger grids
    if (currentDifficulty === 'medium') {
        cardGrid.style.maxWidth = '450px';
    } else if (currentDifficulty === 'hard') {
        cardGrid.style.maxWidth = '550px';
    } else {
        cardGrid.style.maxWidth = '380px';
    }

    // Clear timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Get unique emojis for this difficulty (ensure we have enough unique emojis)
    const emojisForDifficulty = finalUniqueEmojis.slice(0, settings.pairs);
    
    // Create card deck (exactly 2 of each emoji - one pair per emoji)
    const cardDeck = [];
    emojisForDifficulty.forEach(emoji => {
        cardDeck.push(emoji); // First card
        cardDeck.push(emoji); // Second card (pair)
    });

    // Shuffle cards
    cardDeck.sort(() => Math.random() - 0.5);

    // Create card elements
    cardGrid.innerHTML = '';
    cardDeck.forEach((emoji, index) => {
        const card = createCard(emoji, index);
        cards.push(card);
        cardGrid.appendChild(card.element);
    });

    // For medium difficulty (5x5 grid), add empty cells to fill the grid
    // We have 24 cards (12 pairs), so we need 1 empty cell in the 5th row
    if (currentDifficulty === 'medium') {
        const totalCells = settings.gridCols * settings.gridRows; // 25
        const emptyCells = totalCells - cardDeck.length; // 1 empty cell
        for (let i = 0; i < emptyCells; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'card-empty';
            cardGrid.appendChild(emptyCell);
        }
    }

    // Show all cards for 10 seconds
    showAllCards();

    // Start countdown
    let countdown = 10;
    statusMessage.textContent = `Memorize the cards! ${countdown}s`;

    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            statusMessage.textContent = `Memorize the cards! ${countdown}s`;
        } else {
            clearInterval(countdownInterval);
            hideAllCards();
            startGame();
        }
    }, 1000);
}

// Create Card Element
function createCard(emoji, index) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card flipped'; // Start flipped for memorization
    cardEl.dataset.index = index;

    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';

    const cardFace = document.createElement('div');
    cardFace.className = 'card-face';

    const cardBack = document.createElement('div');
    cardBack.className = 'card-back';
    cardBack.textContent = emoji;

    cardInner.appendChild(cardFace);
    cardInner.appendChild(cardBack);
    cardEl.appendChild(cardInner);

    cardEl.addEventListener('click', () => handleCardClick(index));

    return {
        element: cardEl,
        emoji: emoji,
        flipped: true, // Start flipped for memorization
        matched: false,
        selected: false
    };
}

// Show All Cards (for memorization)
function showAllCards() {
    cards.forEach(card => {
        card.element.classList.add('flipped');
        card.flipped = true;
    });
}

// Hide All Cards (after memorization)
function hideAllCards() {
    cards.forEach(card => {
        card.element.classList.remove('flipped');
        card.element.classList.remove('selected');
        card.flipped = false;
        card.selected = false;
    });
    selectedCards = [];
}

// Start Game
function startGame() {
    memorizing = false;
    canSelect = true;
    statusMessage.textContent = 'Find all matching pairs!';
    isPaused = false;
    pausedTime = 0;
    totalElapsedTime = 0;
    pauseCloudText.textContent = '☁️ Press spacebar to stop the timer';
    pauseCloud.classList.remove('hidden'); // Show cloud when game starts

    // Start timer
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 100);
}

// Pause Game
function pauseGame() {
    if (isPaused || memorizing || !canSelect) return; // Don't pause during memorization or if game hasn't started
    
    isPaused = true;
    pausedTime += Date.now() - startTime; // Accumulate paused time
    clearInterval(timerInterval);
    pauseCloudText.textContent = '☁️ Press spacebar to resume the game';
    pauseCloud.classList.remove('hidden'); // Show cloud only when paused
    canSelect = false;
}

// Resume Game
function resumeGame() {
    if (!isPaused || memorizing) return;
    
    isPaused = false;
    startTime = Date.now(); // Reset start time
    timerInterval = setInterval(updateTimer, 100);
    pauseCloudText.textContent = '☁️ Press spacebar to stop the timer';
    pauseCloud.classList.remove('hidden'); // Keep cloud visible when resumed
    canSelect = true;
}

// Toggle Pause
function togglePause() {
    if (memorizing) return;
    if (isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// Update Timer
function updateTimer() {
    if (isPaused) return;
    const totalElapsed = pausedTime + (Date.now() - startTime);
    const elapsed = Math.floor(totalElapsed / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Handle Card Click
async function handleCardClick(index) {
    if (!canSelect || memorizing) return;

    // Initialize audio on first interaction
    await initAudio();

    const card = cards[index];

    // Ignore if already selected, flipped, or matched
    if (card.selected || card.flipped || card.matched) return;

    // Ignore if already 2 cards selected
    if (selectedCards.length >= 2) return;

    // Select card (show border)
    selectCard(card);
    selectedCards.push(card);

    // Check for match when 2 cards are selected
    if (selectedCards.length === 2) {
        canSelect = false;
        moves++;
        movesEl.textContent = moves;

        setTimeout(() => {
            checkMatch();
        }, 500);
    }
}

// Select Card (show border)
function selectCard(card) {
    card.selected = true;
    card.element.classList.add('selected');
    revealCard(card);
}

// Deselect Card
function deselectCard(card) {
    card.selected = false;
    card.element.classList.remove('selected');
}

// Reveal Card (show emoji)
function revealCard(card) {
    card.flipped = true;
    card.element.classList.add('flipped');
}

// Hide Card (hide emoji)
function hideCard(card) {
    card.flipped = false;
    card.element.classList.remove('flipped');
}

// Check Match
function checkMatch() {
    const [card1, card2] = selectedCards;

    if (card1.emoji === card2.emoji) {
        // Match! Reveal both cards and mark as matched
        playMatchSound(); // Play "yes" sound
        deselectCard(card1);
        deselectCard(card2);
        revealCard(card1);
        revealCard(card2);
        
        card1.matched = true;
        card2.matched = true;
        card1.element.classList.add('matched');
        card2.element.classList.add('matched');

        matchedPairs++;
        const settings = difficultySettings[currentDifficulty];
        pairsEl.textContent = `${matchedPairs}/${settings.pairs}`;
        statusMessage.textContent = '✨ Match! ✨';

        // Check for win
        if (matchedPairs === settings.pairs) {
            setTimeout(showWinModal, 500);
        }
        selectedCards = [];
        canSelect = true;
    } else {
        // No match - briefly show, then hide both
        playWrongMatchSound();
        statusMessage.textContent = 'Try again!';
        setTimeout(() => {
            hideCard(card1);
            hideCard(card2);
            deselectCard(card1);
            deselectCard(card2);
            selectedCards = [];
            canSelect = true;
        }, 600);
    }
}

// Show Win Modal
function showWinModal() {
    clearInterval(timerInterval);

    const totalElapsed = pausedTime + (Date.now() - startTime);
    totalElapsedTime = Math.floor(totalElapsed / 1000);
    const minutes = Math.floor(totalElapsedTime / 60);
    const seconds = totalElapsedTime % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    finalTimeEl.textContent = timeString;
    finalMovesEl.textContent = moves;

    // Save score
    saveScore();

    // Play win sound and create confetti
    playWinSound();
    createConfetti();

    winModal.classList.remove('hidden');
}

// Save Score
function saveScore() {
    const playerName = playerNameInput.value.trim() || 'Anonymous';
    const settings = difficultySettings[currentDifficulty];
    
    // Calculate score (lower time and moves = higher score)
    // Score formula: (pairs * 1000) - (time * 10) - (moves * 5)
    const score = (settings.pairs * 1000) - (totalElapsedTime * 10) - (moves * 5);
    
    const scoreData = {
        name: playerName,
        difficulty: currentDifficulty,
        time: totalElapsedTime,
        moves: moves,
        pairs: settings.pairs,
        score: score,
        date: new Date().toISOString()
    };

    // Get existing scores from localStorage
    let scores = JSON.parse(localStorage.getItem('memoryMatchScores') || '[]');
    
    // Add new score
    scores.push(scoreData);
    
    // Sort by score (highest to lowest)
    scores.sort((a, b) => b.score - a.score);
    
    // Keep only top 50 scores
    scores = scores.slice(0, 50);
    
    // Save back to localStorage
    localStorage.setItem('memoryMatchScores', JSON.stringify(scores));
    
    // Update scoreboard display
    displayScoreboard();
}

// Display Scoreboard
function displayScoreboard() {
    const scores = JSON.parse(localStorage.getItem('memoryMatchScores') || '[]');
    
    if (scores.length === 0) {
        scoreboard.innerHTML = '<p class="no-scores">No scores yet. Be the first!</p>';
        return;
    }

    // Group scores by difficulty
    const easyScores = scores.filter(s => s.difficulty === 'easy').slice(0, 10);
    const mediumScores = scores.filter(s => s.difficulty === 'medium').slice(0, 10);
    const hardScores = scores.filter(s => s.difficulty === 'hard').slice(0, 10);

    let html = '';

    if (easyScores.length > 0) {
        html += '<div class="scoreboard-category"><strong>Easy</strong></div>';
        easyScores.forEach((score, index) => {
            const minutes = Math.floor(score.time / 60);
            const seconds = score.time % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            html += `<div class="scoreboard-item">
                <span class="score-rank">${index + 1}.</span>
                <span class="score-name">${score.name}</span>
                <span class="score-details">${timeStr} • ${score.moves} moves</span>
            </div>`;
        });
    }

    if (mediumScores.length > 0) {
        html += '<div class="scoreboard-category"><strong>Medium</strong></div>';
        mediumScores.forEach((score, index) => {
            const minutes = Math.floor(score.time / 60);
            const seconds = score.time % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            html += `<div class="scoreboard-item">
                <span class="score-rank">${index + 1}.</span>
                <span class="score-name">${score.name}</span>
                <span class="score-details">${timeStr} • ${score.moves} moves</span>
            </div>`;
        });
    }

    if (hardScores.length > 0) {
        html += '<div class="scoreboard-category"><strong>Hard</strong></div>';
        hardScores.forEach((score, index) => {
            const minutes = Math.floor(score.time / 60);
            const seconds = score.time % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            html += `<div class="scoreboard-item">
                <span class="score-rank">${index + 1}.</span>
                <span class="score-name">${score.name}</span>
                <span class="score-details">${timeStr} • ${score.moves} moves</span>
            </div>`;
        });
    }

    scoreboard.innerHTML = html;
}

// Event Listeners
playAgainBtn.addEventListener('click', initGame);

// Difficulty button listeners
difficultyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        difficultyButtons.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        // Start new game with selected difficulty
        initGame();
    });
});

// Spacebar to pause/resume
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !memorizing) {
        e.preventDefault();
        togglePause();
    }
});

// Initialize audio and start the game
initAudio();

// Load player name from localStorage
const savedName = localStorage.getItem('memoryMatchPlayerName');
if (savedName) {
    playerNameInput.value = savedName;
}

// Save player name when changed
playerNameInput.addEventListener('input', () => {
    localStorage.setItem('memoryMatchPlayerName', playerNameInput.value);
});

// Set default difficulty (easy) as active
if (difficultyButtons.length > 0) {
    difficultyButtons[0].classList.add('active');
}

// Display scoreboard on load
displayScoreboard();

initGame();
