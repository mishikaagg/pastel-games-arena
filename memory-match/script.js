const board = document.getElementById('gameBoard');
const movesDisplay = document.getElementById('moves');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const winOverlay = document.getElementById('winOverlay');
const finalMovesDisplay = document.getElementById('finalMoves');

const emojis = ['🧸', '🍦', '🌈', '🍭', '🦋', '🎈', '🌸', '✨'];
let cards = [...emojis, ...emojis];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let canFlip = true;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createCard(emoji) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.value = emoji;

    card.innerHTML = `
        <div class="card-face card-back"></div>
        <div class="card-face card-front">${emoji}</div>
    `;

    card.addEventListener('click', () => flipCard(card));
    return card;
}

function flipCard(card) {
    if (!canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        canFlip = false;
        moves++;
        movesDisplay.textContent = moves;
        checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.value === card2.dataset.value;

    if (isMatch) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        flippedCards = [];
        canFlip = true;

        if (matchedPairs === emojis.length) {
            setTimeout(showWinOverlay, 800);
        }
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            canFlip = true;
        }, 1000);
    }
}

function showWinOverlay() {
    finalMovesDisplay.textContent = moves;
    winOverlay.classList.remove('hidden');
}

function initGame() {
    board.innerHTML = '';
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    canFlip = true;
    movesDisplay.textContent = moves;
    winOverlay.classList.add('hidden');

    const shuffledCards = shuffle([...cards]);
    shuffledCards.forEach(emoji => {
        board.appendChild(createCard(emoji));
    });
}

restartBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', initGame);

// Start game
initGame();
