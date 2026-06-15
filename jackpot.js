// Game Constants and Configuration
const SYMBOLS = ['💰', '🔔', '🍒', '💎', '🍋', '7️⃣', '🍊', '🎰', '👿', '❓'];
const JACKPOT_SYMBOL = '💎';
const DEVIL_SYMBOL = '👿';
const MYSTERY_SYMBOL = '❓';
const JACKPOT_PROBABILITY = 0.00001192 / 100;
const ITEMS_PER_REEL = 13;
const UNIQUE_ITEMS = 10;
const INITIAL_BALANCE = 4000;
const INITIAL_BET = 1.00;
const INSURANCE_COST = 650;
const INSURANCE_INTERVAL = 90000;

// Game State
let balance = INITIAL_BALANCE;
let currentBet = INITIAL_BET;
let isSpinning = false;
let isBankrupt = false;
let insuranceTimer = null;
let hasInsurance = false;
let autoPlayCount = 0;
let isTurboMode = false;
let spinDuration = 2500;
let sessionSpins = 0;
let totalWinnings = 0;
let soundEnabled = true;
let effectsEnabled = true;
let vibrationEnabled = true;
let freeSpins = 1;

// DOM Elements
const spinBtn = document.getElementById('spin-btn');
const resetBtn = document.getElementById('reset-btn');
const plusBtn = document.getElementById('plus-btn');
const minusBtn = document.getElementById('minus-btn');
const betInput = document.getElementById('bet-input');
const balanceDisplay = document.getElementById('balance');
const betDisplay = document.getElementById('bet-display');
const winDisplay = document.getElementById('win-display');
const resultMessage = document.getElementById('result-message');
const comboDisplay = document.getElementById('combo-display');
const multiplierDisplay = document.getElementById('multiplier-display');

const insuranceModal = document.getElementById('insurance-modal');
const insuranceYes = document.getElementById('insurance-yes');
const insuranceNo = document.getElementById('insurance-no');
const bankruptcyModal = document.getElementById('bankruptcy-modal');
const restartBtn = document.getElementById('restart-btn');
const finalBalanceDisplay = document.getElementById('final-balance');
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const soundToggle = document.getElementById('sound-toggle');
const effectsToggle = document.getElementById('effects-toggle');
const vibrationToggle = document.getElementById('vibration-toggle');
const animationSpeedSelect = document.getElementById('animation-speed');
const autoPlayBtn = document.getElementById('auto-play-btn');
const turboBtn = document.getElementById('turbo-btn');
const sessionCountDisplay = document.getElementById('session-count');
const spinCountDisplay = document.getElementById('spin-count');
const totalWinsDisplay = document.getElementById('total-wins');
const freeSpinsDisplay = document.getElementById('free-spins-display');

// Initialize
updateDisplay();
startInsuranceTimer();
loadSettings();

// Load session count
let savedSessionCount = localStorage.getItem('sessionCount') || '1';
sessionCountDisplay.textContent = savedSessionCount;

// Event Listeners - Main Controls
spinBtn.addEventListener('click', spin);
resetBtn.addEventListener('click', resetBalance);
plusBtn.addEventListener('click', increaseBet);
minusBtn.addEventListener('click', decreaseBet);
betInput.addEventListener('change', validateBet);

// Quick Bet Buttons
document.getElementById('bet-min').addEventListener('click', () => {
    currentBet = 0.10;
    updateDisplay();
});

document.getElementById('bet-half').addEventListener('click', () => {
    currentBet = Math.max(0.10, Math.floor((balance / 2) * 20) / 20);
    updateDisplay();
});

document.getElementById('bet-max').addEventListener('click', () => {
    currentBet = Math.min(balance, 500);
    updateDisplay();
});

// Auto Play and Turbo
autoPlayBtn.addEventListener('click', toggleAutoPlay);
turboBtn.addEventListener('click', toggleTurbo);

// Insurance Modal
insuranceYes.addEventListener('click', buyInsurance);
insuranceNo.addEventListener('click', declineInsurance);

// Settings Modal
settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'block';
});

document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
        e.target.closest('.modal').style.display = 'none';
    });
});

document.getElementById('settings-close').addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

soundToggle.addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
    localStorage.setItem('soundEnabled', soundEnabled);
});

effectsToggle.addEventListener('change', (e) => {
    effectsEnabled = e.target.checked;
    localStorage.setItem('effectsEnabled', effectsEnabled);
});

vibrationToggle.addEventListener('change', (e) => {
    vibrationEnabled = e.target.checked;
    localStorage.setItem('vibrationEnabled', vibrationEnabled);
});

animationSpeedSelect.addEventListener('change', (e) => {
    switch(e.target.value) {
        case 'fast': spinDuration = 1500; break;
        case 'normal': spinDuration = 2500; break;
        case 'slow': spinDuration = 3500; break;
    }
    localStorage.setItem('animationSpeed', e.target.value);
});

// Paytable Modal
document.getElementById('paytable-btn').addEventListener('click', () => {
    document.getElementById('paytable-modal').style.display = 'block';
});

// Close modals on outside click
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Restart Game
restartBtn.addEventListener('click', restartGame);

// Settings Management
function loadSettings() {
    const savedSound = localStorage.getItem('soundEnabled');
    const savedEffects = localStorage.getItem('effectsEnabled');
    const savedVibration = localStorage.getItem('vibrationEnabled');
    const savedSpeed = localStorage.getItem('animationSpeed') || 'normal';

    soundEnabled = savedSound !== 'false';
    effectsEnabled = savedEffects !== 'false';
    vibrationEnabled = savedVibration !== 'false';

    soundToggle.checked = soundEnabled;
    effectsToggle.checked = effectsEnabled;
    vibrationToggle.checked = vibrationEnabled;
    animationSpeedSelect.value = savedSpeed;

    switch(savedSpeed) {
        case 'fast': spinDuration = 1500; break;
        case 'normal': spinDuration = 2500; break;
        case 'slow': spinDuration = 3500; break;
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    // Web Audio API for sound effects
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    switch(type) {
        case 'spin':
            // Classic slot machine spinning sound with whirring effect
            createSlotMachineSpin(audioContext);
            break;
        case 'win':
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            oscillator2.frequency.setValueAtTime(523, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
            oscillator2.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
            gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator2.start(audioContext.currentTime);
            oscillator2.stop(audioContext.currentTime + 0.3);
            break;
        case 'loss':
            const oscillator3 = audioContext.createOscillator();
            const gainNode3 = audioContext.createGain();
            oscillator3.connect(gainNode3);
            gainNode3.connect(audioContext.destination);
            oscillator3.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator3.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
            gainNode3.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator3.start(audioContext.currentTime);
            oscillator3.stop(audioContext.currentTime + 0.2);
            break;
        case 'click':
            const oscillator4 = audioContext.createOscillator();
            const gainNode4 = audioContext.createGain();
            oscillator4.connect(gainNode4);
            gainNode4.connect(audioContext.destination);
            oscillator4.frequency.value = 800;
            gainNode4.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode4.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator4.start(audioContext.currentTime);
            oscillator4.stop(audioContext.currentTime + 0.05);
            break;
    }
}

function createSlotMachineSpin(audioContext) {
    // Create a series of rapid ticks that simulate a spinning slot machine
    const now = audioContext.currentTime;
    const totalDuration = 1.2; // Total spin sound duration
    const tickDuration = 0.05; // Duration of each tick
    
    // Create multiple oscillators for richer sound
    const baseGain = audioContext.createGain();
    baseGain.connect(audioContext.destination);
    baseGain.gain.setValueAtTime(0.25, now);
    baseGain.gain.linearRampToValueAtTime(0.35, now + 0.3); // Speed up
    baseGain.gain.linearRampToValueAtTime(0.15, now + totalDuration); // Wind down
    
    // Primary spinning sound - whirring oscillator
    const primaryOsc = audioContext.createOscillator();
    primaryOsc.type = 'sine';
    primaryOsc.frequency.setValueAtTime(150, now);
    primaryOsc.frequency.exponentialRampToValueAtTime(320, now + 0.4); // Pitch up as it speeds
    primaryOsc.frequency.exponentialRampToValueAtTime(180, now + totalDuration); // Pitch down as it slows
    primaryOsc.connect(baseGain);
    primaryOsc.start(now);
    primaryOsc.stop(now + totalDuration);
    
    // Secondary harmonic for depth
    const secondaryOsc = audioContext.createOscillator();
    secondaryOsc.type = 'square';
    secondaryOsc.frequency.setValueAtTime(280, now);
    secondaryOsc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
    secondaryOsc.frequency.exponentialRampToValueAtTime(320, now + totalDuration);
    const secondaryGain = audioContext.createGain();
    secondaryGain.gain.setValueAtTime(0.12, now);
    secondaryOsc.connect(secondaryGain);
    secondaryGain.connect(baseGain);
    secondaryOsc.start(now);
    secondaryOsc.stop(now + totalDuration);
    
    // Create clicking pulses that simulate reel ticks
    for (let i = 0; i < 18; i++) {
        const tickTime = now + (i * tickDuration * 0.6); // Ticks get faster
        const tickOsc = audioContext.createOscillator();
        tickOsc.frequency.value = 1200 + (i * 50); // Slight pitch variation
        const tickGain = audioContext.createGain();
        tickGain.gain.setValueAtTime(0.15, tickTime);
        tickGain.gain.exponentialRampToValueAtTime(0.01, tickTime + 0.03);
        tickOsc.connect(tickGain);
        tickGain.connect(baseGain);
        tickOsc.start(tickTime);
        tickOsc.stop(tickTime + 0.03);
    }
}

function triggerVibration(pattern = 'short') {
    if (!vibrationEnabled || !navigator.vibrate) return;
    
    switch(pattern) {
        case 'short': navigator.vibrate(20); break;
        case 'double': navigator.vibrate([20, 30, 20]); break;
        case 'pulse': navigator.vibrate([10, 20, 10, 20, 10]); break;
        case 'long': navigator.vibrate([50]); break;
    }
}

function toggleAutoPlay() {
    autoPlayCount = autoPlayCount === 0 ? 5 : 0;
    autoPlayBtn.classList.toggle('active');
    autoPlayBtn.textContent = autoPlayCount > 0 ? `🔄 AUTO ×${autoPlayCount}` : '🔄 AUTO ×1';
    
    if (autoPlayCount > 0 && !isSpinning && balance >= currentBet) {
        spin();
    }
}

function toggleTurbo() {
    isTurboMode = !isTurboMode;
    turboBtn.classList.toggle('active');
    spinDuration = isTurboMode ? 1000 : (animationSpeedSelect.value === 'fast' ? 1500 : 
                                         animationSpeedSelect.value === 'slow' ? 3500 : 2500);
}

function startInsuranceTimer() {
    clearTimeout(insuranceTimer);
    if (!isBankrupt && !isSpinning) {
        insuranceTimer = setTimeout(() => {
            if (!isBankrupt && balance >= INSURANCE_COST) {
                showInsurancePrompt();
            } else {
                startInsuranceTimer();
            }
        }, INSURANCE_INTERVAL);
    }
}

function showInsurancePrompt() {
    insuranceModal.style.display = 'block';
}

function buyInsurance() {
    if (balance >= INSURANCE_COST) {
        balance -= INSURANCE_COST;
        hasInsurance = true;
        updateDisplay();
        insuranceModal.style.display = 'none';
        startInsuranceTimer();
    }
}

function declineInsurance() {
    hasInsurance = false;
    insuranceModal.style.display = 'none';
    startInsuranceTimer();
}

function increaseBet() {
    if (!isSpinning && !isBankrupt) {
        currentBet = Math.min(parseFloat((currentBet + 0.50).toFixed(2)), balance);
        updateDisplay();
    }
}

function decreaseBet() {
    if (!isSpinning && !isBankrupt) {
        currentBet = Math.max(parseFloat((currentBet - 0.50).toFixed(2)), 0.10);
        updateDisplay();
    }
}

function validateBet() {
    let value = parseFloat(betInput.value) || INITIAL_BET;
    value = Math.max(0.10, Math.min(value, balance));
    currentBet = parseFloat(value.toFixed(2));
    updateDisplay();
}

function updateDisplay() {
    balanceDisplay.textContent = '$' + balance.toFixed(2);
    betDisplay.textContent = '$' + currentBet.toFixed(2);
    betInput.value = currentBet.toFixed(2);
    spinCountDisplay.textContent = sessionSpins;
    totalWinsDisplay.textContent = '$' + totalWinnings.toFixed(2);
    freeSpinsDisplay.textContent = freeSpins;
    
    // Update free spins box styling
    const freeSpinsBox = document.querySelector('.free-spins-box');
    if (freeSpins > 0) {
        freeSpinsBox.classList.add('active');
    } else {
        freeSpinsBox.classList.remove('active');
    }
    
    // Spin button can be used if we have free spins OR enough balance
    spinBtn.disabled = (balance < currentBet && freeSpins === 0) || isBankrupt;
    resetBtn.disabled = !isBankrupt;
    
    // Check if we need to trigger bankruptcy
    if (balance < 0 && !isBankrupt) {
        triggerBankruptcy();
    }
}

function resetBalance() {
    if (isBankrupt) {
        restartGame();
    }
}

function restartGame() {
    balance = INITIAL_BALANCE;
    currentBet = INITIAL_BET;
    isBankrupt = false;
    hasInsurance = false;
    autoPlayCount = 0;
    isTurboMode = false;
    sessionSpins = 0;
    totalWinnings = 0;
    freeSpins = 1;
    
    resultMessage.textContent = '';
    comboDisplay.textContent = '';
    multiplierDisplay.textContent = '';
    winDisplay.textContent = '$0.00';
    bankruptcyModal.style.display = 'none';
    autoPlayBtn.classList.remove('active');
    autoPlayBtn.textContent = '🔄 AUTO ×1';
    turboBtn.classList.remove('active');
    
    updateDisplay();
    startInsuranceTimer();
    
    // Increment session count
    let sessionCount = parseInt(sessionCountDisplay.textContent) || 0;
    sessionCount++;
    sessionCountDisplay.textContent = sessionCount;
    localStorage.setItem('sessionCount', sessionCount);
}

function triggerBankruptcy() {
    isBankrupt = true;
    clearTimeout(insuranceTimer);
    finalBalanceDisplay.textContent = '$' + balance.toFixed(2);
    bankruptcyModal.style.display = 'block';
    spinBtn.disabled = true;
    resetBtn.disabled = false;
}

function spin() {
    if (isSpinning || (balance < currentBet && freeSpins === 0) || isBankrupt) return;

    isSpinning = true;
    spinBtn.disabled = true;
    clearTimeout(insuranceTimer);
    resultMessage.textContent = '';
    comboDisplay.textContent = '';
    multiplierDisplay.textContent = '';
    winDisplay.textContent = '$0.00';

    playSound('spin');
    triggerVibration('short');

    // Calculate the loss penalty (25% more than original bet)
    const lossPenalty = currentBet * 1.25;

    // Deduct bet from balance only if no free spins available
    if (freeSpins > 0) {
        freeSpins--;
    } else {
        balance -= currentBet;
    }
    sessionSpins++;
    updateDisplay();

    // Determine if this spin will be a jackpot
    const isJackpot = Math.random() < JACKPOT_PROBABILITY;
    const reelPositions = generateReelPositions(isJackpot);

    const reels = document.querySelectorAll('.reel');

    // Start spinning animation on all reels with dramatic effect
    const spinStartTime = Date.now();
    const reelSpinDurations = [];
    
    reels.forEach((reel, index) => {
        reel.classList.add('spinning');
        // Each reel spins for a different duration for cascading effect
        reelSpinDurations[index] = spinDuration - (index * (spinDuration / 6));
    });

    // Continuously update reel positions during spin for wheel effect
    const spinningInterval = setInterval(() => {
        const elapsed = Date.now() - spinStartTime;
        let allReelsStopped = true;

        reels.forEach((reel, index) => {
            const reelDuration = reelSpinDurations[index];
            if (elapsed < reelDuration) {
                allReelsStopped = false;
                // Continue spinning with acceleration effect
                const spinProgress = elapsed / reelDuration;
                const extraSpins = Math.floor(spinProgress * 50); // More rotations
                const baseOffset = (reelPositions[index] * 33.333);
                reel.style.transform = `translateY(calc(-${baseOffset}% - ${extraSpins * 33.333}%))`;
            } else if (elapsed < reelDuration + 300) {
                // Deceleration phase - wobble effect
                allReelsStopped = false;
                const wobbleProgress = (elapsed - reelDuration) / 300;
                const wobble = Math.sin(wobbleProgress * Math.PI * 3) * 5;
                const baseOffset = reelPositions[index] * 33.333;
                reel.style.transform = `translateY(calc(-${baseOffset}% + ${wobble}%))`;
            } else {
                // Final stop position
                reel.classList.remove('spinning');
                stopReel(reel, reelPositions[index]);
            }
        });

        if (allReelsStopped) {
            clearInterval(spinningInterval);
        }
    }, 16); // Update every 16ms for smooth 60fps animation

    // Check for win after all reels have stopped
    setTimeout(() => {
        const result = checkWin(reelPositions);
        
        // Apply 25% loss penalty if no win
        if (result.type === 'loss') {
            balance -= lossPenalty;
        }
        
        displayResult(result);
        isSpinning = false;
        updateDisplay();
        
        // Auto-play continuation
        if (autoPlayCount > 0 && !isBankrupt && (balance >= currentBet || freeSpins > 0)) {
            autoPlayCount--;
            autoPlayBtn.textContent = `🔄 AUTO ×${autoPlayCount}`;
            setTimeout(() => {
                spin();
            }, 500);
        } else if (autoPlayCount === 0) {
            autoPlayBtn.classList.remove('active');
            autoPlayBtn.textContent = '🔄 AUTO ×1';
        }
        
        // Restart insurance timer after spin
        if (!isBankrupt) {
            startInsuranceTimer();
        }
    }, spinDuration + 400);
}

function generateReelPositions(forceJackpot = false) {
    const positions = [];
    for (let i = 0; i < 5; i++) {
        if (forceJackpot) {
            // Find a position where GOLD appears in the 10 unique items
            const goldPositions = [];
            const reelItems = document.querySelectorAll('.reel')[i].querySelectorAll('.reel-item');
            // Check the first 10 items (the unique set)
            for (let j = 0; j < UNIQUE_ITEMS; j++) {
                if (reelItems[j].textContent === JACKPOT_SYMBOL) {
                    goldPositions.push(j);
                }
            }
            if (goldPositions.length > 0) {
                positions.push(goldPositions[Math.floor(Math.random() * goldPositions.length)]);
            } else {
                positions.push(Math.floor(Math.random() * UNIQUE_ITEMS));
            }
        } else {
            // Generate random position within the unique 10 items
            positions.push(Math.floor(Math.random() * UNIQUE_ITEMS));
        }
    }
    return positions;
}

function stopReel(reel, targetPosition) {
    // Normalize position to unique items range for efficient calculation
    const normalizedPos = targetPosition % UNIQUE_ITEMS;
    const itemHeight = 33.333; // Each item is 33.333% of reel height
    const offset = normalizedPos * itemHeight;
    
    // Use requestAnimationFrame for optimal performance
    requestAnimationFrame(() => {
        reel.style.transform = `translateY(-${offset}%) translateZ(0)`;
    });
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
    
    // Get center line symbols (original payline)
    reels.forEach((reel, index) => {
        const items = reel.querySelectorAll('.reel-item');
        symbols.push(items[positions[index]].textContent);
    });

    // Get all visible symbols from each reel (3 symbols visible per reel)
    const allVisibleSymbols = [];
    reels.forEach((reel, reelIndex) => {
        const items = reel.querySelectorAll('.reel-item');
        const centerPos = positions[reelIndex];
        
        // Get top, center, and bottom visible symbols
        const topPos = (centerPos - 1 + ITEMS_PER_REEL) % ITEMS_PER_REEL;
        const bottomPos = (centerPos + 1) % ITEMS_PER_REEL;
        
        allVisibleSymbols.push({
            reel: reelIndex,
            top: items[topPos].textContent,
            center: items[centerPos].textContent,
            bottom: items[bottomPos].textContent
        });
    });

    // Get all visible symbols for special checks
    const allSymbolsFlat = [].concat(symbols);
    allVisibleSymbols.forEach(reel => {
        allSymbolsFlat.push(reel.top, reel.center, reel.bottom);
    });

    // Check for mystery symbols first (2-3 = COINFLIP, 50/50 win/lose)
    const mysteryCount = allSymbolsFlat.filter(s => s === MYSTERY_SYMBOL).length;
    if (mysteryCount >= 2 && mysteryCount <= 3) {
        const isCoinflipWin = Math.random() < 0.5;
        const mysteryWins = isCoinflipWin ? currentBet * 5 : -(currentBet * 3);
        return { type: 'mystery', wins: mysteryWins, matchCount: mysteryCount, symbol: MYSTERY_SYMBOL, line: 'mystery', isCoinflipWin };
    }

    // Check for devil symbols (2-3 = BAD LUCK, lose money)
    const devilCount = allSymbolsFlat.filter(s => s === DEVIL_SYMBOL).length;
    if (devilCount >= 2 && devilCount <= 3) {
        return { type: 'devil', wins: -(currentBet * 2), matchCount: devilCount, symbol: DEVIL_SYMBOL, line: 'devil' };
    }

    // Check for jackpot first (all 5 GOLD/💎 on center line)
    if (symbols.every(s => s === JACKPOT_SYMBOL)) {
        return { type: 'jackpot', wins: currentBet * 10000, matchCount: 5, symbol: JACKPOT_SYMBOL };
    }

    // Check for Lucky 7s (5x7 on center line)
    if (symbols.every(s => s === '7️⃣')) {
        return { type: 'win', wins: currentBet * 2000, matchCount: 5, symbol: '7️⃣' };
    }

    // Check center line for standard matches
    const centerSymbolCounts = {};
    symbols.forEach(symbol => {
        centerSymbolCounts[symbol] = (centerSymbolCounts[symbol] || 0) + 1;
    });

    // Check for 5 of a kind on center line
    for (let symbol in centerSymbolCounts) {
        if (centerSymbolCounts[symbol] === 5) {
            return { type: 'win', wins: currentBet * 250, matchCount: 5, symbol, line: 'center' };
        }
    }

    // Check for 4 of a kind on center line
    for (let symbol in centerSymbolCounts) {
        if (centerSymbolCounts[symbol] === 4) {
            return { type: 'win', wins: currentBet * 50, matchCount: 4, symbol, line: 'center' };
        }
    }

    // Check for 3 of a kind on center line
    for (let symbol in centerSymbolCounts) {
        if (centerSymbolCounts[symbol] === 3) {
            return { type: 'win', wins: currentBet * 10, matchCount: 3, symbol, line: 'center' };
        }
    }

    // Check for scatter wins - same symbol visible anywhere on screen
    const allSymbolCounts = {};
    allVisibleSymbols.forEach(reel => {
        [reel.top, reel.center, reel.bottom].forEach(symbol => {
            allSymbolCounts[symbol] = (allSymbolCounts[symbol] || 0) + 1;
        });
    });

    // Check for 5+ scatter matches
    for (let symbol in allSymbolCounts) {
        if (allSymbolCounts[symbol] >= 5) {
            return { type: 'win', wins: currentBet * 100, matchCount: allSymbolCounts[symbol], symbol, line: 'scatter' };
        }
    }

    // Check for 4 scatter matches
    for (let symbol in allSymbolCounts) {
        if (allSymbolCounts[symbol] >= 4) {
            return { type: 'win', wins: currentBet * 25, matchCount: allSymbolCounts[symbol], symbol, line: 'scatter' };
        }
    }

    // Check for 3 scatter matches
    for (let symbol in allSymbolCounts) {
        if (allSymbolCounts[symbol] >= 3) {
            return { type: 'win', wins: currentBet * 8, matchCount: allSymbolCounts[symbol], symbol, line: 'scatter' };
        }
    }

    // Check for 3 💎 anywhere on the reels
    const diamondCount = symbols.filter(s => s === JACKPOT_SYMBOL).length;
    if (diamondCount === 3) {
        return { type: 'win', wins: currentBet * 75, matchCount: 3, symbol: JACKPOT_SYMBOL, line: 'center' };
    }

    return { type: 'loss', wins: 0, matchCount: 0, symbol: '', line: 'none' };
}

function displayResult(result) {
    if (result.type === 'jackpot') {
        balance += result.wins;
        totalWinnings += result.wins;
        updateDisplay();
        winDisplay.textContent = '$' + result.wins.toFixed(2);
        resultMessage.textContent = '🎉 MEGA JACKPOT! 5 💎 DIAMONDS! 🎉';
        comboDisplay.textContent = '5 of a Kind - JACKPOT!';
        multiplierDisplay.textContent = '10,000x Multiplier!';
        resultMessage.style.color = '#ff0000';
        
        playSound('win');
        triggerVibration('pulse');
        
        const machine = document.querySelector('.slot-machine');
        machine.classList.add('winning', 'pulse-effect');
        setTimeout(() => {
            machine.classList.remove('winning', 'pulse-effect');
        }, 3000);
    } else if (result.type === 'win') {
        balance += result.wins;
        totalWinnings += result.wins;
        updateDisplay();
        winDisplay.textContent = '$' + result.wins.toFixed(2);
        
        playSound('win');
        triggerVibration('double');
        
        // Handle scatter wins (symbols visible anywhere)
        if (result.line === 'scatter') {
            if (result.matchCount >= 5) {
                resultMessage.textContent = '💫 AMAZING SCATTER! 5+ ' + result.symbol + '! 💫';
                comboDisplay.textContent = result.symbol + ' × ' + result.matchCount + ' (Visible Anywhere!)';
                multiplierDisplay.textContent = '150x Multiplier!';
                resultMessage.style.color = '#00d9ff';
            } else if (result.matchCount === 4) {
                resultMessage.textContent = '⭐ GREAT SCATTER! 4 ' + result.symbol + '! ⭐';
                comboDisplay.textContent = result.symbol + ' × 4 (Visible Anywhere!)';
                multiplierDisplay.textContent = '50x Multiplier!';
                resultMessage.style.color = '#00e9ff';
            } else if (result.matchCount === 3) {
                resultMessage.textContent = '✨ SCATTER WIN! 3 ' + result.symbol + '! ✨';
                comboDisplay.textContent = result.symbol + ' × 3 (Visible Anywhere!)';
                multiplierDisplay.textContent = '8x Multiplier!';
                resultMessage.style.color = '#4ecdc4';
            }
        } 
        // Handle payline wins (center line only)
        else if (result.line === 'center') {
            if (result.matchCount === 5) {
                resultMessage.textContent = '🎊 EXCELLENT! 5 of a Kind! 🎊';
                comboDisplay.textContent = result.symbol + ' × 5 (Payline)';
                multiplierDisplay.textContent = '500x Multiplier!';
                resultMessage.style.color = '#FFD700';
            } else if (result.matchCount === 4) {
                resultMessage.textContent = '✨ GREAT WIN! 4 of a Kind! ✨';
                comboDisplay.textContent = result.symbol + ' × 4 (Payline)';
                multiplierDisplay.textContent = '100x Multiplier!';
                resultMessage.style.color = '#FFA500';
            } else if (result.matchCount === 3) {
                resultMessage.textContent = '🎉 WIN! 3 of a Kind! 🎉';
                comboDisplay.textContent = result.symbol + ' × 3 (Payline)';
                multiplierDisplay.textContent = '10x Multiplier!';
                resultMessage.style.color = '#4ecdc4';
            }
        }
        
        const machine = document.querySelector('.slot-machine');
        machine.classList.add('pulse-effect');
        setTimeout(() => {
            machine.classList.remove('pulse-effect');
        }, 1000);
    } else if (result.type === 'mystery') {
        balance += result.wins; // wins can be positive or negative
        updateDisplay();
        winDisplay.textContent = result.wins >= 0 ? '$' + result.wins.toFixed(2) : '-$' + Math.abs(result.wins).toFixed(2);
        
        if (result.isCoinflipWin) {
            resultMessage.textContent = '🎲 MYSTERY WINS! ' + result.matchCount + ' ❓ - YOU WIN! 🎲';
            comboDisplay.textContent = 'LUCKY COINFLIP: ' + MYSTERY_SYMBOL + ' × ' + result.matchCount + ' = WIN!';
            multiplierDisplay.textContent = '+5x Multiplier!';
            resultMessage.style.color = '#FFD700';
            playSound('win');
            triggerVibration('pulse');
        } else {
            resultMessage.textContent = '🎲 MYSTERY LOSES! ' + result.matchCount + ' ❓ - YOU LOSE! 🎲';
            comboDisplay.textContent = 'UNLUCKY COINFLIP: ' + MYSTERY_SYMBOL + ' × ' + result.matchCount + ' = LOSE!';
            multiplierDisplay.textContent = '-3x Multiplier!';
            resultMessage.style.color = '#ff4444';
            playSound('loss');
            triggerVibration('long');
        }
        
        const machine = document.querySelector('.slot-machine');
        machine.classList.add('pulse-effect');
        setTimeout(() => {
            machine.classList.remove('pulse-effect');
        }, 1000);
    } else if (result.type === 'devil') {
        balance += result.wins; // wins is negative for devil
        updateDisplay();
        winDisplay.textContent = '$' + result.wins.toFixed(2);
        resultMessage.textContent = '👿 BAD LUCK! ' + result.matchCount + ' DEVIL(S) - LOSE $' + Math.abs(result.wins).toFixed(2) + '! 👿';
        comboDisplay.textContent = 'PENALTY: ' + DEVIL_SYMBOL + ' × ' + result.matchCount;
        multiplierDisplay.textContent = '-2x Multiplier!';
        resultMessage.style.color = '#ff0000';
        
        playSound('loss');
        triggerVibration('long');
        
        const machine = document.querySelector('.slot-machine');
        machine.classList.add('pulse-effect');
        setTimeout(() => {
            machine.classList.remove('pulse-effect');
        }, 1000);
    } else {
        resultMessage.textContent = '❌ No Match - Try Again!';
        resultMessage.style.color = '#ff6b6b';
        triggerVibration('short');
    }

    // Check for bankruptcy after win
    if (balance < 0 && !isBankrupt) {
        triggerBankruptcy();
    }
}
