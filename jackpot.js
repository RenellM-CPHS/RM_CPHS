const SYMBOLS = ['🍒', '7️⃣', '🎰', '💎', '⭐'];
const ITEMS_PER_REEL = 8;

let balance = 1000;
let currentBet = 10;
let isSpinning = false;

const spinBtn = document.getElementById('spin-btn');
const resetBtn = document.getElementById('reset-btn');
const plusBtn = document.getElementById('plus-btn');
const minusBtn = document.getElementById('minus-btn');
const betInput = document.getElementById('bet-input');
const balanceDisplay = document.getElementById('balance');
const betDisplay = document.getElementById('bet-display');
const winDisplay = document.getElementById('win-display');
const resultMessage = document.getElementById('result-message');

// Initialize
updateDisplay();

// Event Listeners
spinBtn.addEventListener('click', spin);
resetBtn.addEventListener('click', resetBalance);
plusBtn.addEventListener('click', increaseBet);
minusBtn.addEventListener('click', decreaseBet);
betInput.addEventListener('change', validateBet);

function increaseBet() {
    if (!isSpinning) {
        currentBet = Math.min(currentBet + 10, balance);
        updateDisplay();
    }
}

function decreaseBet() {
    if (!isSpinning) {
        currentBet = Math.max(currentBet - 10, 10);
        updateDisplay();
    }
}

function validateBet() {
    let value = parseInt(betInput.value) || 10;
    value = Math.max(10, Math.min(value, balance));
    currentBet = value;
    updateDisplay();
}

function updateDisplay() {
    balanceDisplay.textContent = '$' + balance;
    betDisplay.textContent = '$' + currentBet;
    betInput.value = currentBet;
    spinBtn.disabled = balance < currentBet;
}

function resetBalance() {
    balance = 1000;
    currentBet = 10;
    resultMessage.textContent = '';
    winDisplay.textContent = '$0';
    updateDisplay();
}

function spin() {
    if (isSpinning || balance < currentBet) return;

    isSpinning = true;
    spinBtn.disabled = true;
    resultMessage.textContent = '';
    winDisplay.textContent = '$0';

    // Deduct bet from balance
    balance -= currentBet;
    updateDisplay();

    // Get random positions for each reel
    const reelPositions = [];
    for (let i = 0; i < 5; i++) {
        reelPositions.push(Math.floor(Math.random() * ITEMS_PER_REEL));
    }

    // Animate each reel with different duration
    const spinDuration = 3000; // 3 seconds total
    const reels = document.querySelectorAll('.reel');

    reels.forEach((reel, index) => {
        reel.classList.add('spinning');
    });

    // Stop reels one by one
    reels.forEach((reel, index) => {
        setTimeout(() => {
            reel.classList.remove('spinning');
            stopReel(reel, reelPositions[index]);
        }, spinDuration - (index * 150)); // Stagger the stop
    });

    // Check for win after all reels have stopped
    setTimeout(() => {
        const result = checkWin(reelPositions);
        displayResult(result);
        isSpinning = false;
        spinBtn.disabled = balance < currentBet;
    }, spinDuration);
}

function stopReel(reel, targetPosition) {
    const itemHeight = 33.33; // Each item is 33.33% of reel height
    const offset = (targetPosition % ITEMS_PER_REEL) * itemHeight;
    // Force a reflow to ensure animation is stopped before applying final position
    reel.offsetHeight; // Trigger reflow
    reel.style.transform = `translateY(-${offset}%)`;
}

function getReelSymbols() {
    const reels = document.querySelectorAll('.reel');
    const symbols = [];

    reels.forEach((reel) => {
        const offset = reel.style.transform;
        const match = offset.match(/-?(\d+)/);
        const percentage = match ? parseInt(match[1]) : 0;
        const itemIndex = Math.round(percentage / 100) % ITEMS_PER_REEL;
        const items = reel.querySelectorAll('.reel-item');
        symbols.push(items[itemIndex].textContent);
    });

    return symbols;
}

function checkWin(positions) {
    const reels = document.querySelectorAll('.reel');
    const symbols = [];

    reels.forEach((reel, index) => {
        const items = reel.querySelectorAll('.reel-item');
        symbols.push(items[positions[index]].textContent);
    });

    // Count matches
    const symbolCounts = {};
    symbols.forEach(symbol => {
        symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    });

    // Find the highest match count
    const matchCounts = Object.values(symbolCounts);
    const maxMatches = Math.max(...matchCounts);

    if (maxMatches === 1) {
        return { type: 'loss', wins: 0, matchCount: 0 };
    }

    let multiplier = 0;
    if (maxMatches === 5) multiplier = 50;
    else if (maxMatches === 4) multiplier = 20;
    else if (maxMatches === 3) multiplier = 5;

    const winAmount = currentBet * multiplier;
    return { type: 'win', wins: winAmount, matchCount: maxMatches };
}

function displayResult(result) {
    if (result.type === 'win') {
        balance += result.wins;
        updateDisplay();
        winDisplay.textContent = '$' + result.wins;

        if (result.matchCount === 5) {
            resultMessage.textContent = '🎉 JACKPOT! ALL 5 REELS! 🎉';
            resultMessage.style.color = '#ff6b6b';
            document.querySelector('.slot-machine').classList.add('winning');
            setTimeout(() => {
                document.querySelector('.slot-machine').classList.remove('winning');
            }, 1500);
        } else if (result.matchCount === 4) {
            resultMessage.textContent = '✨ GREAT WIN! 4 of a Kind! ✨';
            resultMessage.style.color = '#ffd700';
        } else if (result.matchCount === 3) {
            resultMessage.textContent = '🎊 WIN! 3 of a Kind! 🎊';
            resultMessage.style.color = '#4ecdc4';
        }
    } else {
        resultMessage.textContent = '❌ No Match - Try Again!';
        resultMessage.style.color = '#ff6b6b';
    }
}
