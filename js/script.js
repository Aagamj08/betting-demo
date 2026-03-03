// Game State
let players = [];
let currentPlayerIndex = 0;
let chancesPerPlayer = 3;
let chancesUsed = 0;
let isGameOver = false;

// DOM Elements
const coin = document.getElementById('coin');
const betBtn = document.getElementById('betBtn');
const resultDiv = document.getElementById('result');
const themeToggle = document.getElementById('themeToggle');
const winOverlay = document.getElementById('winOverlay');
const avatarCelebration = document.getElementById('avatarCelebration');
const setupScreen = document.getElementById('setupScreen');
const finalScreen = document.getElementById('finalScreen');
const statsPanel = document.getElementById('statsPanel');

// Theme Management
const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.innerText = newTheme === 'light' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
};
themeToggle.addEventListener('click', toggleTheme);
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.innerText = savedTheme === 'light' ? '☀️' : '🌙';

// --- Setup Step ---
function addPlayer() {
    const nameInput = document.getElementById('playerNameInput');
    const name = nameInput.value.trim();

    if (name === "") return;

    // Limit to 2 players
    if (players.length >= 2) {
        alert("This is a 1v1 Battle! Only 2 players allowed.");
        return;
    }

    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert("Player already exists!");
        return;
    }

    players.push({
        name: name,
        balance: 1000,
        wins: 0,
        losses: 0
    });

    nameInput.value = "";
    updatePlayerPreview();
    document.getElementById('startBtn').disabled = players.length < 2;
}

function updatePlayerPreview() {
    const preview = document.getElementById('playerListPreview');
    preview.innerHTML = players.map(p => `<span class="player-tag">${p.name}</span>`).join('');
}

function startGame() {
    chancesPerPlayer = parseInt(document.getElementById('chancesInput').value) || 3;
    currentPlayerIndex = 0;
    chancesUsed = 0;
    isGameOver = false;

    setupScreen.classList.remove('active');
    statsPanel.classList.add('active');

    // Clear UI from any previous runs
    resultDiv.innerText = '';
    resultDiv.classList.remove('show');
    betBtn.disabled = false;

    updateTurnDisplay();
    updateStatsTable();
    updateOpponentChoice();
}

// UI Helper for 1v1 Logic
function updateOpponentChoice() {
    const choice = document.getElementById("choice").value;
    const opponentChoice = choice === "Heads" ? "Tails" : "Heads";
    const opponent = players[(currentPlayerIndex + 1) % 2];

    if (opponent) {
        document.getElementById('opponentChoiceLabel').innerText = `${opponent.name} will be: ${opponentChoice}`;
    }
}

// --- Game Logic ---
function updateTurnDisplay() {
    const p = players[currentPlayerIndex];
    document.getElementById('currentPlayerDisplay').innerText = `${p.name}'s Turn`;
    document.getElementById('chancesLeft').innerText = `Chances Left: ${chancesPerPlayer - (Math.floor(chancesUsed / players.length))}`;
}

function placeBet() {
    const betInput = document.getElementById("betAmount");
    const bet = parseInt(betInput.value);
    const choice = document.getElementById("choice").value;

    const p1 = players[currentPlayerIndex];
    const p2 = players[(currentPlayerIndex + 1) % 2];

    if (!bet || bet <= 0) {
        showResult("Enter a valid bet amount.", "loss");
        return;
    }

    // Validation for BOTH players in a duel
    if (bet > p1.balance) {
        showResult(`${p1.name} has insufficient balance.`, "loss");
        return;
    }
    if (bet > p2.balance) {
        showResult(`${p2.name} cannot cover this bet!`, "loss");
        return;
    }

    betBtn.disabled = true;
    resultDiv.classList.remove('show');

    const isHeads = Math.random() < 0.5;
    const result = isHeads ? "Heads" : "Tails";

    coin.style.transition = 'none';
    coin.style.transform = 'rotateY(0)';
    void coin.offsetWidth;

    coin.style.transition = 'transform 3s cubic-bezier(0.4, 0, 0.2, 1)';
    const finalRotation = (5 * 360) + (isHeads ? 0 : 180);
    coin.style.transform = `rotateY(${finalRotation}deg)`;

    setTimeout(() => {
        if (choice === result) {
            // Player 1 wins, Player 2 loses
            p1.balance += bet;
            p2.balance -= bet;
            p1.wins++;
            p2.losses++;
            showResult(`🎉 ${p1.name} Won! ${p2.name} Lost.`, "win");
            triggerResultEffect('win');
        } else {
            // Player 1 loses, Player 2 wins
            p1.balance -= bet;
            p2.balance += bet;
            p1.losses++;
            p2.wins++;
            showResult(`😢 ${p1.name} Lost. ${p2.name} Won!`, "loss");
            triggerResultEffect('loss');
        }

        updateStatsTable();
        nextTurn();
    }, 3000);
}

function nextTurn() {
    chancesUsed++;

    if (chancesUsed >= (players.length * chancesPerPlayer)) {
        setTimeout(showFinalScoreboard, 2000);
        return;
    }

    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;

    setTimeout(() => {
        updateTurnDisplay();
        updateOpponentChoice(); // Update choice label for the next player
        betBtn.disabled = false;
        resultDiv.innerText = '';
        resultDiv.classList.remove('show');
    }, 1500);
}

function updateStatsTable() {
    const tbody = document.getElementById('statsTableBody');
    tbody.innerHTML = players.map((p, idx) => `
        <tr class="${idx === currentPlayerIndex ? 'highlight-row' : ''}">
            <td>${p.name}</td>
            <td style="color: var(--primary);">$${p.balance}</td>
            <td>W:${p.wins} / L:${p.losses}</td>
        </tr>
    `).join('');
}

// --- Effects ---
function triggerResultEffect(type) {
    const body = document.body;
    body.classList.remove('win-effect', 'loss-effect');
    void body.offsetWidth;
    body.classList.add(type === 'win' ? 'win-effect' : 'loss-effect');

    if (type === 'win') {
        winOverlay.classList.add('active');
        avatarCelebration.classList.add('active');
        for (let i = 0; i < 60; i++) createConfetti();
        setTimeout(() => {
            winOverlay.classList.remove('active');
            avatarCelebration.classList.remove('active');
        }, 3000);
    }
}

const victoryLayer = document.getElementById('victoryLayer');
function createConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    const colors = ['#FFD700', '#FFA500', '#00e676', '#ffffff'];
    const duration = 2 + Math.random() * 3;
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.width = 8 + Math.random() * 8 + 'px';
    confetti.style.height = confetti.style.width;
    confetti.style.animation = `fall ${duration}s linear forwards`;
    victoryLayer.appendChild(confetti);
    setTimeout(() => confetti.remove(), duration * 1000);
}

function showResult(text, className) {
    resultDiv.innerText = text;
    resultDiv.className = `result show ${className}`;
}

// --- Final Step ---
function showFinalScoreboard() {
    finalScreen.classList.add('active');

    const sorted = [...players].sort((a, b) => b.balance - a.balance);
    const winner = sorted[0];

    const leaderboard = document.getElementById('leaderboard');
    leaderboard.innerHTML = sorted.map((p, idx) => `
        <div style="padding: 15px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <span style="color: var(--text);">${idx + 1}. <strong>${p.name}</strong> ${p.name === winner.name ? '<span class="winner-badge">Winner 👑</span>' : ''}</span>
            <span style="color: var(--primary); font-weight:700;">$${p.balance}</span>
        </div>
    `).join('');

    for (let i = 0; i < 60; i++) setTimeout(createConfetti, i * 20);
}

function resetToSetup() {
    players = [];
    finalScreen.classList.remove('active');
    setupScreen.classList.add('active');
    statsPanel.classList.remove('active');

    resultDiv.innerText = '';
    resultDiv.classList.remove('show');
    betBtn.disabled = false;
    document.getElementById('betAmount').value = '';
    document.getElementById('playerNameInput').value = '';

    document.getElementById('playerListPreview').innerHTML = '';
    document.getElementById('startBtn').disabled = true;
}
