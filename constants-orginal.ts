import { Chip, WheelNumber } from "./types";

// American Roulette Wheel Order (Double Zero - 38 pockets)
export const WHEEL_ORDER = [
  "0", "28", "9", "26", "30", "11", "7", "20", "32", "17", "5", "22", "34", "15", "3", "24", "36", "13", "1",
  "00", "27", "10", "25", "29", "12", "8", "19", "31", "18", "6", "21", "33", "16", "4", "23", "35", "14", "2"
];

// Racetrack Sector Definitions (adjusted for American wheel)
export const SECTORS = {
  VOISINS: ["22", "18", "29", "7", "28", "12", "35", "3", "26", "0", "32", "15", "19", "4", "21", "2", "25"],
  TIERS: ["27", "13", "36", "11", "30", "8", "23", "10", "5", "24", "16", "33"],
  ORPHELINS: ["1", "20", "14", "31", "9", "17", "34", "6"]
};

export const RED_NUMBERS = ["1", "3", "5", "7", "9", "12", "14", "16", "18", "19", "21", "23", "25", "27", "30", "32", "34", "36"];
export const BLACK_NUMBERS = ["2", "4", "6", "8", "10", "11", "13", "15", "17", "20", "22", "24", "26", "28", "29", "31", "33", "35"];

// ✅ UPDATED: Chips now match your actual image set: 1, 5, 10, 15, 25, 50, 100
export const AVAILABLE_CHIPS: Chip[] = [
  { value: 1, color: 'bg-blue-600', borderColor: 'border-blue-300' },
  { value: 5, color: 'bg-red-600', borderColor: 'border-red-300' },
  { value: 10, color: 'bg-blue-500', borderColor: 'border-blue-200' },    // New
  { value: 15, color: 'bg-orange-500', borderColor: 'border-orange-300' },  // New
  { value: 25, color: 'bg-green-600', borderColor: 'border-green-300' },
  { value: 50, color: 'bg-indigo-600', borderColor: 'border-indigo-300' },  // New
  { value: 100, color: 'bg-gray-900', borderColor: 'border-gray-400' },
];

export const GAME_CONFIG = {
  BETTING_DURATION_SEC: 60,
  SPIN_DURATION_MS: 10000,
  RESULT_DURATION_MS: 5000,
  CURRENCY: 'USD',
  BOT_NAMES: ['HighRoller99', 'CryptoKing', 'VegasDave', 'LuckyLady', 'WhaleWatcher', 'ChipStacker', 'RoulettePro', 'SpeedBet']
};

export const getNumberColor = (num: string): 'red' | 'black' | 'green' => {
  if (num === "0" || num === "00") return 'green';
  return RED_NUMBERS.includes(num) ? 'red' : 'black';
};

// Generate wheel data with angles for 38 pockets (American)
export const WHEEL_DATA: WheelNumber[] = WHEEL_ORDER.map((num, index) => ({
  number: num,
  color: getNumberColor(num),
  angle: (360 / 38) * index,
}));

export const PAYOUTS = {
  STRAIGHT: 35,
  SPLIT: 17,
  STREET: 11,
  CORNER: 8,
  LINE: 5,
  COLUMN: 2,
  DOZEN: 2,
  EVEN_ODD: 1,
  RED_BLACK: 1,
  HIGH_LOW: 1,
  SECTOR: 17 // Generic for now, though technically varies by split/corner coverage
};