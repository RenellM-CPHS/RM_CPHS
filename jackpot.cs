using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Linq;

namespace GoldenFortuneSlotMachine
{
    /// <summary>
    /// Core slot machine game engine with server-side validation and secure RNG
    /// </summary>
    public class SlotMachineEngine
    {
        private const decimal INITIAL_BALANCE = 4000m;
        private const decimal INSURANCE_COST = 650m;
        private const double JACKPOT_PROBABILITY = 0.00001192 / 100; // 0.00001192%
        private const int REELS_COUNT = 5;
        private const int UNIQUE_ITEMS = 10;

        private readonly string[] SYMBOLS = { "BAR", "7", "CHERRY", "LEMON", "ORANGE", "BELL", "PLUM", "GOLD" };
        private const string JACKPOT_SYMBOL = "GOLD";

        private decimal _playerBalance;
        private decimal _currentBet;
        private bool _isBankrupt;
        private readonly RNGCryptoServiceProvider _rng;
        private GameHistory _gameHistory;

        public SlotMachineEngine()
        {
            _playerBalance = INITIAL_BALANCE;
            _currentBet = 1.00m;
            _isBankrupt = false;
            _rng = new RNGCryptoServiceProvider();
            _gameHistory = new GameHistory();
        }

        /// <summary>
        /// Securely generates random reel positions using cryptographic RNG
        /// </summary>
        public int[] GenerateReelPositions(bool forceJackpot = false)
        {
            int[] positions = new int[REELS_COUNT];

            for (int i = 0; i < REELS_COUNT; i++)
            {
                if (forceJackpot)
                {
                    // If forcing jackpot, select random GOLD position
                    positions[i] = GetRandomGoldPosition();
                }
                else
                {
                    // Generate truly random position using cryptographic RNG
                    positions[i] = GenerateSecureRandomInt(0, UNIQUE_ITEMS);
                }
            }

            return positions;
        }

        /// <summary>
        /// Generates a cryptographically secure random integer
        /// </summary>
        private int GenerateSecureRandomInt(int min, int max)
        {
            byte[] randomNumber = new byte[4];
            _rng.GetBytes(randomNumber);
            int value = Math.Abs(BitConverter.ToInt32(randomNumber, 0)) % (max - min) + min;
            return value;
        }

        /// <summary>
        /// Gets a random GOLD symbol position
        /// </summary>
        private int GetRandomGoldPosition()
        {
            // GOLD is at index 7 in the SYMBOLS array
            // Assuming each reel has the same symbol layout
            return 7;
        }

        /// <summary>
        /// Determines if this spin should hit the jackpot
        /// </summary>
        public bool ShouldHitJackpot()
        {
            byte[] randomNumber = new byte[8];
            _rng.GetBytes(randomNumber);
            double randomDouble = Math.Abs(BitConverter.ToDouble(randomNumber, 0)) % 1.0;
            return randomDouble < JACKPOT_PROBABILITY;
        }

        /// <summary>
        /// Validates and processes a spin
        /// </summary>
        public SpinResult ProcessSpin(decimal bet)
        {
            // Validation checks
            if (_isBankrupt)
                return new SpinResult { Success = false, Error = "Player is bankrupt" };

            if (bet < 0.10m || bet > _playerBalance)
                return new SpinResult { Success = false, Error = "Invalid bet amount" };

            if (bet != _currentBet)
                return new SpinResult { Success = false, Error = "Bet mismatch - possible tampering detected" };

            // Deduct bet from balance
            _playerBalance -= bet;

            // Determine if jackpot should hit
            bool isJackpot = ShouldHitJackpot();
            int[] reelPositions = GenerateReelPositions(isJackpot);

            // Calculate win
            WinResult winResult = CalculateWin(reelPositions);

            // Add winnings to balance
            _playerBalance += winResult.WinAmount;

            // Check for bankruptcy
            if (_playerBalance < 0)
            {
                _isBankrupt = true;
            }

            // Log the spin
            _gameHistory.LogSpin(new SpinLog
            {
                Bet = bet,
                ReelPositions = reelPositions,
                WinAmount = winResult.WinAmount,
                BalanceAfter = _playerBalance,
                Timestamp = DateTime.UtcNow,
                WinType = winResult.WinType
            });

            return new SpinResult
            {
                Success = true,
                ReelPositions = reelPositions,
                WinAmount = winResult.WinAmount,
                WinType = winResult.WinType,
                NewBalance = _playerBalance,
                IsJackpot = isJackpot
            };
        }

        /// <summary>
        /// Calculates win based on reel symbols
        /// </summary>
        private WinResult CalculateWin(int[] reelPositions)
        {
            // In a real implementation, you would map positions to actual symbols
            // and count matches. This is a simplified version.
            
            string[] resultSymbols = new string[REELS_COUNT];
            
            // Map positions to symbols (simplified example)
            for (int i = 0; i < REELS_COUNT; i++)
            {
                resultSymbols[i] = SYMBOLS[reelPositions[i] % SYMBOLS.Length];
            }

            // Check for jackpot (all 5 GOLD)
            if (resultSymbols.All(s => s == JACKPOT_SYMBOL))
            {
                decimal jackpotAmount = _currentBet * 10000;
                return new WinResult { WinAmount = jackpotAmount, WinType = "JACKPOT" };
            }

            // Count matching symbols
            var symbolCounts = resultSymbols.GroupBy(s => s)
                                            .OrderByDescending(g => g.Count())
                                            .ToList();

            int maxMatches = symbolCounts.First().Count();

            // Determine win based on match count
            decimal winAmount = 0;
            string winType = "LOSS";

            if (maxMatches == 5)
            {
                winAmount = _currentBet * 500;
                winType = "5_OF_A_KIND";
            }
            else if (maxMatches == 4)
            {
                winAmount = _currentBet * 100;
                winType = "4_OF_A_KIND";
            }
            else if (maxMatches == 3)
            {
                winAmount = _currentBet * 10;
                winType = "3_OF_A_KIND";
            }
            else
            {
                // Check for 3 GOLD anywhere
                int goldCount = resultSymbols.Count(s => s == JACKPOT_SYMBOL);
                if (goldCount == 3)
                {
                    winAmount = _currentBet * 100;
                    winType = "3_GOLD";
                }
            }

            return new WinResult { WinAmount = winAmount, WinType = winType };
        }

        /// <summary>
        /// Processes insurance purchase
        /// </summary>
        public InsuranceResult ProcessInsurance(bool purchase)
        {
            if (purchase)
            {
                if (_playerBalance < INSURANCE_COST)
                {
                    return new InsuranceResult
                    {
                        Success = false,
                        Error = "Insufficient balance for insurance"
                    };
                }

                _playerBalance -= INSURANCE_COST;
                _gameHistory.LogInsurancePurchase(DateTime.UtcNow, INSURANCE_COST);

                return new InsuranceResult
                {
                    Success = true,
                    NewBalance = _playerBalance
                };
            }

            return new InsuranceResult { Success = true };
        }

        /// <summary>
        /// Validates bet change
        /// </summary>
        public BetValidationResult ValidateBetChange(decimal newBet)
        {
            if (newBet < 0.10m)
                return new BetValidationResult { Valid = false, Error = "Minimum bet is $0.10" };

            if (newBet > _playerBalance)
                return new BetValidationResult { Valid = false, Error = "Bet exceeds balance" };

            _currentBet = newBet;
            return new BetValidationResult { Valid = true, NewBet = newBet };
        }

        /// <summary>
        /// Restarts the game after bankruptcy
        /// </summary>
        public void RestartGame()
        {
            _playerBalance = INITIAL_BALANCE;
            _currentBet = 1.00m;
            _isBankrupt = false;
            _gameHistory.LogGameRestart(DateTime.UtcNow);
        }

        // Properties
        public decimal CurrentBalance => _playerBalance;
        public decimal CurrentBet => _currentBet;
        public bool IsBankrupt => _isBankrupt;
        public GameHistory History => _gameHistory;
    }

    /// <summary>
    /// Result of a spin
    /// </summary>
    public class SpinResult
    {
        public bool Success { get; set; }
        public int[] ReelPositions { get; set; }
        public decimal WinAmount { get; set; }
        public string WinType { get; set; }
        public decimal NewBalance { get; set; }
        public bool IsJackpot { get; set; }
        public string Error { get; set; }
    }

    /// <summary>
    /// Win calculation result
    /// </summary>
    public class WinResult
    {
        public decimal WinAmount { get; set; }
        public string WinType { get; set; }
    }

    /// <summary>
    /// Insurance transaction result
    /// </summary>
    public class InsuranceResult
    {
        public bool Success { get; set; }
        public decimal NewBalance { get; set; }
        public string Error { get; set; }
    }

    /// <summary>
    /// Bet validation result
    /// </summary>
    public class BetValidationResult
    {
        public bool Valid { get; set; }
        public decimal NewBet { get; set; }
        public string Error { get; set; }
    }

    /// <summary>
    /// Game history tracker for audit trail
    /// </summary>
    public class GameHistory
    {
        private List<SpinLog> _spinHistory { get; } = new List<SpinLog>();
        private List<GameLog> _gameEvents { get; } = new List<GameLog>();

        public void LogSpin(SpinLog log)
        {
            _spinHistory.Add(log);
        }

        public void LogInsurancePurchase(DateTime timestamp, decimal cost)
        {
            _gameEvents.Add(new GameLog
            {
                EventType = "INSURANCE_PURCHASED",
                Timestamp = timestamp,
                Details = $"Insurance cost: ${cost}"
            });
        }

        public void LogGameRestart(DateTime timestamp)
        {
            _gameEvents.Add(new GameLog
            {
                EventType = "GAME_RESTARTED",
                Timestamp = timestamp,
                Details = "Game balance reset"
            });
        }

        public List<SpinLog> GetSpinHistory() => new List<SpinLog>(_spinHistory);
        public List<GameLog> GetGameEvents() => new List<GameLog>(_gameEvents);
        public decimal TotalWagered => _spinHistory.Sum(s => s.Bet);
        public decimal TotalWon => _spinHistory.Sum(s => s.WinAmount);
        public decimal NetProfit => TotalWon - TotalWagered;
    }

    /// <summary>
    /// Individual spin log
    /// </summary>
    public class SpinLog
    {
        public decimal Bet { get; set; }
        public int[] ReelPositions { get; set; }
        public decimal WinAmount { get; set; }
        public decimal BalanceAfter { get; set; }
        public DateTime Timestamp { get; set; }
        public string WinType { get; set; }
    }

    /// <summary>
    /// Game event log
    /// </summary>
    public class GameLog
    {
        public string EventType { get; set; }
        public DateTime Timestamp { get; set; }
        public string Details { get; set; }
    }

    /// <summary>
    /// Game statistics calculator
    /// </summary>
    public class GameStatistics
    {
        public static decimal CalculateRTP(GameHistory history)
        {
            var spinHistory = history.GetSpinHistory();
            if (spinHistory.Count == 0) return 0;

            decimal totalWagered = spinHistory.Sum(s => s.Bet);
            if (totalWagered == 0) return 0;

            decimal totalWon = spinHistory.Sum(s => s.WinAmount);
            return (totalWon / totalWagered) * 100;
        }

        public static Dictionary<string, int> GetWinDistribution(GameHistory history)
        {
            return history.GetSpinHistory()
                         .GroupBy(s => s.WinType)
                         .ToDictionary(g => g.Key, g => g.Count());
        }

        public static decimal GetAverageBet(GameHistory history)
        {
            var spinHistory = history.GetSpinHistory();
            if (spinHistory.Count == 0) return 0;
            return spinHistory.Average(s => s.Bet);
        }
    }
}
