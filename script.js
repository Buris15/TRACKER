'use strict';

/* ==========================================================================
   FORM — Fitness & Nutrition Tracker
   Vanilla JS single-page app. All data lives in localStorage under
   STORAGE_KEY (unchanged from v2). Loading never writes: existing data is
   only ever replaced by an explicit user action.
   ========================================================================== */

const STORAGE_KEY = 'formFitnessTracker_v2';
const PAGES = ['dashboard', 'workouts', 'nutrition', 'progress', 'habits', 'settings'];
const PAGE_TITLES = { dashboard: 'Dashboard', workouts: 'Workouts', nutrition: 'Nutrition', progress: 'Progress', habits: 'Habits & recovery', settings: 'Settings' };
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
const THEMES = ['amber', 'emerald', 'cyan', 'purple'];
const THEME_NAMES = { amber: 'Amber', emerald: 'Emerald', cyan: 'Cyan', purple: 'Violet' };
const FOOD_CATEGORIES = ['Rice & grains', 'Protein', 'Fruit', 'Vegetables', 'Dairy & alternatives', 'Snacks & other'];
const LB_PER_KG = 2.20462;
/* Copies FORM keeps beside the main record, stored as `${STORAGE_KEY}__<kind>_<timestamp>`: one is made before an import replaces your data, or when saved data cannot be read. */
const SAFETY_COPY_RE = /__(unreadable|before_import)_(\d+)$/;
const SAFETY_COPY_LABELS = { unreadable: 'Saved data that could not be read', before_import: 'Your data before an import' };

const HABITS = [
  { id: 'workout', title: 'Follow today’s movement plan', description: 'Workout, mobility, or planned rest.' },
  { id: 'protein', title: 'Include protein with meals', description: 'Choose protein foods across the day.' },
  { id: 'water', title: 'Check in with hydration', description: 'Drink regularly and adjust for activity.' },
  { id: 'sleep', title: 'Protect your sleep routine', description: 'Aim for a consistent bedtime.' },
  { id: 'mobility', title: 'Take a recovery break', description: 'Stretch gently or relax.' }
];

const DEFAULT_WORKOUTS = [
  { type: 'UPPER BODY', duration: '30–40 min', description: 'Steady upper-body session.', exercises: [
    { name: 'Dumbbell floor press', dose: '3 sets × 8–12 reps', sets: 3, reps: '8–12', note: 'Press smoothly.' },
    { name: 'One-arm dumbbell row', dose: '3 sets × 10 each side', sets: 3, reps: '10 each side', note: 'Support on chair.' }
  ]},
  { type: 'LOWER BODY', duration: '30–40 min', description: 'Legs and core session.', exercises: [
    { name: 'Goblet squat', dose: '3 sets × 8–12 reps', sets: 3, reps: '8–12', note: 'Keep feet flat.' },
    { name: 'Glute bridge', dose: '3 sets × 12–15 reps', sets: 3, reps: '12–15', note: 'Pause at top.' }
  ]},
  { type: 'ACTIVE RECOVERY', duration: '20–30 min', description: 'Lighter mobility session.', exercises: [
    { name: 'March in place', dose: '5–8 minutes', sets: 1, reps: '5–8 min', note: 'Comfortable pace.' }
  ]},
  { type: 'UPPER BODY', duration: '30–40 min', description: 'Upper body variations.', exercises: [
    { name: 'Dumbbell row', dose: '3 sets × 10–12 reps', sets: 3, reps: '10–12', note: 'Controlled movement.' }
  ]},
  { type: 'LOWER BODY', duration: '30–40 min', description: 'Lower body patterns.', exercises: [
    { name: 'Reverse lunge', dose: '2 sets × 8 each side', sets: 2, reps: '8 each side', note: 'Balance support if needed.' }
  ]},
  { type: 'FULL BODY', duration: '25–35 min', description: 'Full body session.', exercises: [
    { name: 'Goblet squat', dose: '2 sets × 10 reps', sets: 2, reps: '10', note: 'Controlled tempo.' }
  ]},
  { type: 'REST DAY', duration: 'Rest', description: 'Full recovery day.', exercises: [
    { name: 'Rest and recover', dose: 'Optional', sets: 1, reps: 'Rest', note: 'Prioritize sleep and meals.' }
  ]}
];

/* Food database: [name, category, serving, kcal, protein g, carbs g, fat g]. Approximate values. */
const FOOD_DATABASE = [
  ['Cooked white rice', 'Rice & grains', '1 cup (158g)', 205, 4.3, 44.5, 0.4],
  ['Cooked brown rice', 'Rice & grains', '1 cup (195g)', 216, 5, 44.8, 1.8],
  ['Oatmeal, cooked', 'Rice & grains', '1 cup (234g)', 166, 5.9, 28, 3.6],
  ['Whole wheat bread', 'Rice & grains', '1 slice (28g)', 69, 3.6, 11.6, 0.9],
  ['Pandesal', 'Rice & grains', '1 piece (about 30g)', 90, 3, 17, 1],
  ['Cooked pasta', 'Rice & grains', '1 cup (140g)', 220, 8.1, 43.2, 1.3],
  ['Sweet potato, baked', 'Rice & grains', '1 medium (114g)', 103, 2.3, 23.6, 0.2],
  ['Chicken breast, cooked', 'Protein', '100g', 165, 31, 0, 3.6],
  ['Boiled egg', 'Protein', '1 large (50g)', 78, 6.3, 0.6, 5.3],
  ['Canned tuna in water', 'Protein', '100g drained', 116, 25.5, 0, 0.8],
  ['Tilapia, cooked', 'Protein', '100g', 128, 26.2, 0, 2.7],
  ['Tofu, regular', 'Protein', '100g', 76, 8.1, 1.9, 4.8],
  ['Mung beans (monggo), boiled', 'Protein', '1 cup (202g)', 212, 14.2, 38.7, 0.8],
  ['Banana', 'Fruit', '1 medium (118g)', 105, 1.3, 27, 0.4],
  ['Apple', 'Fruit', '1 medium (182g)', 95, 0.5, 25.1, 0.3],
  ['Orange', 'Fruit', '1 medium (131g)', 62, 1.2, 15.4, 0.2],
  ['Mango, sliced', 'Fruit', '1 cup (165g)', 99, 1.4, 24.8, 0.6],
  ['Papaya, cubed', 'Fruit', '1 cup (145g)', 62, 0.7, 15.7, 0.4],
  ['Broccoli, cooked', 'Vegetables', '1 cup (156g)', 55, 3.7, 11.2, 0.6],
  ['Spinach, cooked', 'Vegetables', '1 cup (180g)', 41, 5.3, 6.8, 0.5],
  ['Green beans, cooked', 'Vegetables', '1 cup (125g)', 44, 2.4, 9.9, 0.4],
  ['Carrot, raw', 'Vegetables', '1 medium (61g)', 25, 0.6, 5.8, 0.1],
  ['Tomato', 'Vegetables', '1 medium (123g)', 22, 1.1, 4.8, 0.2],
  ['Cucumber, sliced', 'Vegetables', '1 cup (119g)', 16, 0.8, 3.8, 0.2],
  ['Fresh milk', 'Dairy & alternatives', '1 cup (240ml)', 122, 8, 12, 5],
  ['Greek yogurt, plain nonfat', 'Dairy & alternatives', '170g', 100, 17, 6, 0.7],
  ['Soy milk, unsweetened', 'Dairy & alternatives', '1 cup (243ml)', 80, 7, 4, 4],
  ['Cheddar cheese', 'Dairy & alternatives', '1 slice (28g)', 113, 7, 0.4, 9.3],
  ['Peanut butter', 'Snacks & other', '1 tbsp (16g)', 95, 3.5, 3.5, 8],
  ['Almonds', 'Snacks & other', '1 oz (28g)', 164, 6, 6.1, 14.2],
  ['Olive oil', 'Snacks & other', '1 tbsp (14g)', 119, 0, 0, 13.5],
  ['Whey protein powder', 'Snacks & other', '1 scoop (30g)', 120, 24, 3, 1.5],
  ['Dark chocolate (70%)', 'Snacks & other', '1 oz (28g)', 170, 2.2, 13, 12],
  ['Popcorn, air-popped', 'Snacks & other', '3 cups (24g)', 93, 3, 18.6, 1.1]
].map(r => ({ name: r[0], category: r[1], serving: r[2], calories: r[3], protein: r[4], carbs: r[5], fat: r[6] }));

/* Meal plan. Ingredient table: key -> [display name, aisle]. */
const INGREDIENTS = {
  oats: ['Rolled oats', 'Pantry'], banana: ['Banana', 'Produce'], eggs: ['Eggs', 'Dairy & eggs'], rice: ['Rice (uncooked)', 'Pantry'],
  tomato: ['Tomato', 'Produce'], yogurt: ['Greek yogurt', 'Dairy & eggs'], mango: ['Mango', 'Produce'], pandesal: ['Pandesal', 'Pantry'],
  tuna: ['Canned tuna', 'Pantry'], chicken: ['Chicken breast', 'Protein'], beans: ['Green beans', 'Produce'], soy: ['Soy sauce', 'Pantry'],
  vinegar: ['Vinegar', 'Pantry'], garlic: ['Garlic', 'Produce'], monggo: ['Mung beans (monggo)', 'Pantry'], greens: ['Leafy greens', 'Produce'],
  cucumber: ['Cucumber', 'Produce'], carrot: ['Carrot', 'Produce'], oil: ['Cooking oil', 'Pantry'], tofu: ['Tofu', 'Protein'],
  broccoli: ['Broccoli', 'Produce'], pb: ['Peanut butter', 'Pantry'], bread: ['Whole wheat bread', 'Pantry'], orange: ['Orange', 'Produce'],
  apple: ['Apple', 'Produce'], almonds: ['Almonds', 'Pantry'], tilapia: ['Tilapia fillet', 'Protein'], sweetpotato: ['Sweet potato', 'Produce'],
  ginger: ['Ginger', 'Produce'], onion: ['Onion', 'Produce'], pasta: ['Pasta (dry)', 'Pantry']
};
const GROCERY_AISLES = ['Produce', 'Protein', 'Dairy & eggs', 'Pantry'];

/* [id, slot, name, kcal, protein, carbs, fat, [[ingredient, quantity, unit], ...]] */
const MEAL_LIBRARY = [
  ['oats-banana-eggs', 'Breakfast', 'Oatmeal, banana & eggs', 427, 20, 56, 15, [['oats', 40, 'g'], ['banana', 1, 'pc'], ['eggs', 2, 'pc']]],
  ['garlic-rice-egg', 'Breakfast', 'Rice, eggs & tomato', 383, 18, 51, 11, [['rice', 65, 'g'], ['eggs', 2, 'pc'], ['tomato', 1, 'pc'], ['garlic', 1, 'clove']]],
  ['yogurt-oats-mango', 'Breakfast', 'Greek yogurt, oats & mango', 312, 22, 51, 3, [['yogurt', 170, 'g'], ['oats', 30, 'g'], ['mango', 1, 'pc']]],
  ['pandesal-tuna-egg', 'Breakfast', 'Pandesal with tuna & egg', 374, 38, 35, 8, [['pandesal', 2, 'pc'], ['tuna', 1, 'can'], ['eggs', 1, 'pc']]],
  ['chicken-adobo-bowl', 'Lunch', 'Chicken adobo, rice & green beans', 487, 44, 54, 10, [['chicken', 160, 'g'], ['rice', 65, 'g'], ['beans', 125, 'g'], ['soy', 1, 'tbsp'], ['vinegar', 1, 'tbsp'], ['garlic', 3, 'clove'], ['oil', 1, 'tsp']]],
  ['monggo-rice-greens', 'Lunch', 'Monggo with rice & greens', 396, 22, 68, 6, [['monggo', 70, 'g'], ['rice', 35, 'g'], ['greens', 150, 'g'], ['garlic', 2, 'clove'], ['oil', 1, 'tsp']]],
  ['tuna-rice-bowl', 'Lunch', 'Tuna rice bowl', 402, 31, 54, 6, [['rice', 65, 'g'], ['tuna', 1, 'can'], ['cucumber', 120, 'g'], ['carrot', 1, 'pc'], ['oil', 1, 'tsp']]],
  ['tofu-stir-fry', 'Lunch', 'Tofu & vegetable stir-fry with rice', 439, 21, 64, 13, [['tofu', 150, 'g'], ['broccoli', 150, 'g'], ['carrot', 1, 'pc'], ['rice', 65, 'g'], ['oil', 1, 'tsp']]],
  ['yogurt-banana', 'Snack', 'Greek yogurt & banana', 205, 18, 33, 1, [['yogurt', 170, 'g'], ['banana', 1, 'pc']]],
  ['pb-banana-toast', 'Snack', 'Peanut butter banana toast', 338, 12, 54, 10, [['bread', 2, 'slice'], ['pb', 1, 'tbsp'], ['banana', 1, 'pc']]],
  ['eggs-orange', 'Snack', 'Boiled eggs & orange', 218, 14, 17, 11, [['eggs', 2, 'pc'], ['orange', 1, 'pc']]],
  ['apple-almonds', 'Snack', 'Apple & almonds', 259, 7, 31, 15, [['apple', 1, 'pc'], ['almonds', 28, 'g']]],
  ['fish-rice-greens', 'Dinner', 'Grilled fish, rice & greens', 478, 49, 51, 10, [['tilapia', 200, 'g'], ['rice', 65, 'g'], ['greens', 150, 'g'], ['oil', 1, 'tsp']]],
  ['chicken-sweet-potato', 'Dinner', 'Chicken, sweet potato & broccoli', 413, 46, 35, 10, [['chicken', 175, 'g'], ['sweetpotato', 1, 'pc'], ['broccoli', 150, 'g'], ['oil', 1, 'tsp']]],
  ['chicken-greens-soup', 'Dinner', 'Chicken & greens soup with rice', 444, 47, 51, 5, [['chicken', 160, 'g'], ['rice', 65, 'g'], ['greens', 150, 'g'], ['ginger', 10, 'g'], ['onion', 0.5, 'pc']]],
  ['tuna-pasta-veg', 'Dinner', 'Tuna pasta with vegetables', 465, 37, 54, 12, [['pasta', 70, 'g'], ['tuna', 1, 'can'], ['tomato', 1, 'pc'], ['broccoli', 75, 'g'], ['oil', 2, 'tsp']]]
].map(r => ({ id: r[0], slot: r[1], name: r[2], calories: r[3], protein: r[4], carbs: r[5], fat: r[6], ingredients: r[7] }));

/* Suggested week: day index -> slot -> meal id. Used until the user changes a slot. */
const DEFAULT_MEAL_PLAN = [
  { Breakfast: 'oats-banana-eggs', Lunch: 'chicken-adobo-bowl', Snack: 'yogurt-banana', Dinner: 'fish-rice-greens' },
  { Breakfast: 'garlic-rice-egg', Lunch: 'monggo-rice-greens', Snack: 'pb-banana-toast', Dinner: 'chicken-sweet-potato' },
  { Breakfast: 'yogurt-oats-mango', Lunch: 'tuna-rice-bowl', Snack: 'eggs-orange', Dinner: 'chicken-greens-soup' },
  { Breakfast: 'pandesal-tuna-egg', Lunch: 'tofu-stir-fry', Snack: 'apple-almonds', Dinner: 'tuna-pasta-veg' },
  { Breakfast: 'yogurt-oats-mango', Lunch: 'tofu-stir-fry', Snack: 'pb-banana-toast', Dinner: 'chicken-greens-soup' },
  { Breakfast: 'oats-banana-eggs', Lunch: 'monggo-rice-greens', Snack: 'apple-almonds', Dinner: 'chicken-sweet-potato' },
  { Breakfast: 'pandesal-tuna-egg', Lunch: 'chicken-adobo-bowl', Snack: 'yogurt-banana', Dinner: 'fish-rice-greens' }
];

const DEFAULT_STATE = {
  goals: { calories: 2000, protein: 100, carbs: 250, fat: 65, water: 2 },
  food: {}, water: {}, weights: {}, workouts: {}, workoutPlan: null, habits: {}, measurements: {}, photos: [],
  preferences: { weightUnit: 'kg', theme: 'amber', autoRest: false, restSeconds: 60 },
  favorites: [], mealPlan: null, groceryChecked: {}
};

/* ---------- small helpers ---------- */
const clone = o => JSON.parse(JSON.stringify(o));
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC_MAP[c]);
const $ = (id) => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const makeId = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const safeNumber = v => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };
const fmt = (v, d = 0) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: 0 });
/* Sentence-cases ALL-CAPS labels (the default plan stores them that way); leaves mixed-case text alone. */
const cap = s => { const v = String(s || '').trim(); if (v !== v.toUpperCase()) return v; const t = v.toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); };
const icon = (name, cls = '') => `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function parseLocalDate(key) { const [y, m, d] = String(key).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); }
function isDateKey(key) { return /^\d{4}-\d{2}-\d{2}$/.test(String(key)) && !Number.isNaN(parseLocalDate(key).getTime()); }
function mondayIndex(date) { return (date.getDay() + 6) % 7; }
function addDays(key, n) { const d = parseLocalDate(key); d.setDate(d.getDate() + n); return todayKey(d); }
function dateLabel(key, options = { weekday: 'short', month: 'short', day: 'numeric' }) { return parseLocalDate(key).toLocaleDateString(undefined, options); }
function weekDateKeys(refKey) {
  const start = parseLocalDate(refKey);
  start.setDate(start.getDate() - mondayIndex(start));
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return todayKey(d); });
}

/* ---------- state ---------- */
let storageBlocked = false;
let storageFailed = false;
let lastSaveErrorAt = 0;
let startupNotice = '';
let state = loadState();
let selectedDate = todayKey();
let selectedDayIndex = mondayIndex(new Date());

/* Fills in anything missing and fixes container types, but never discards existing records. */
function normalizeState(raw) {
  const base = clone(DEFAULT_STATE);
  if (!isObj(raw)) return base;
  const s = { ...raw };
  s.goals = { ...base.goals, ...(isObj(raw.goals) ? raw.goals : {}) };
  Object.keys(base.goals).forEach(k => { const n = Number(s.goals[k]); s.goals[k] = Number.isFinite(n) && n >= 0 ? n : base.goals[k]; });
  ['food', 'water', 'weights', 'workouts', 'habits', 'measurements', 'groceryChecked'].forEach(k => { if (!isObj(s[k])) s[k] = {}; });
  if (!Array.isArray(s.photos)) s.photos = [];
  if (!Array.isArray(s.favorites)) s.favorites = [];
  if (!(s.workoutPlan === null || Array.isArray(s.workoutPlan))) s.workoutPlan = null;
  if (!(s.mealPlan === null || isObj(s.mealPlan))) s.mealPlan = null;
  s.preferences = { ...base.preferences, ...(isObj(raw.preferences) ? raw.preferences : {}) };
  if (s.preferences.weightUnit !== 'lb') s.preferences.weightUnit = 'kg';
  if (!THEMES.includes(s.preferences.theme)) s.preferences.theme = 'amber';
  s.preferences.autoRest = Boolean(s.preferences.autoRest);
  const rs = Number(s.preferences.restSeconds);
  s.preferences.restSeconds = [30, 60, 90, 120].includes(rs) ? rs : 60;
  return s;
}

/* Stores a copy of `text` under a safety-copy key. Returns the key, or null when there was no room (or storage is blocked). */
function keepSafetyCopy(kind, text) {
  const key = `${STORAGE_KEY}__${kind}_${Date.now()}`;
  try { localStorage.setItem(key, text); return key; } catch (e) { return null; }
}
function removeSafetyCopy(key) { try { localStorage.removeItem(key); return true; } catch (e) { return false; } }
const isSafetyCopyKey = k => typeof k === 'string' && k.startsWith(`${STORAGE_KEY}__`) && SAFETY_COPY_RE.test(k);
function safetyCopies() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i), m = isSafetyCopyKey(key) && SAFETY_COPY_RE.exec(key);
      if (m) out.push({ key, kind: m[1], ts: Number(m[2]) });
    }
  } catch (e) { /* storage unavailable: nothing to list */ }
  return out.sort((a, b) => b.ts - a.ts);
}

function loadState() {
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { storageBlocked = true; }
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!isObj(parsed)) throw new Error('Saved data is not an object');
      return normalizeState(parsed);
    } catch (e) {
      /* Unreadable data is never overwritten silently: keep a copy under another key first, and only say so if that worked. */
      startupNotice = keepSafetyCopy('unreadable', raw)
        ? 'Your saved data could not be read. A copy was kept in this browser (Settings, Data) and you are starting fresh.'
        : 'Your saved data could not be read and there was no room to keep a copy. You are starting fresh.';
    }
  }
  if (storageBlocked) startupNotice = 'Storage is blocked in this browser, so changes will not be saved after you close the page.';
  return normalizeState(null);
}

/* One place decides when a failed save is reported, so every caller (set ticks, imports, photos, quick log...) is covered. */
function writeState() {
  if (storageBlocked) return false;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
}
function reportSaveFailure() {
  storageFailed = true; updateStorageStatus();
  const now = Date.now();
  if (now - lastSaveErrorAt < 3000) return; /* several writes can fail together; say it once */
  lastSaveErrorAt = now;
  /* Safety copies share the same ~5 MB; when they exist, say so, because deleting one is the fastest way to make room. */
  const copies = storageBlocked ? 0 : safetyCopies().length;
  showToast(storageBlocked
    ? 'Changes cannot be saved because storage is blocked in this browser. Export a backup to keep your data.'
    : copies
      ? 'Could not save: browser storage is full. Delete a safety copy in Settings, Data to free up space, and export a backup to keep your data.'
      : 'Could not save: browser storage is full or unavailable. Export a backup to keep your data.', 'error');
}
function saveState() {
  if (writeState()) {
    if (storageFailed) { storageFailed = false; updateStorageStatus(); }
    return true;
  }
  reportSaveFailure();
  return false;
}

/* ---------- unit + data getters (read-only: reading never creates records) ---------- */
const unit = () => state.preferences.weightUnit === 'lb' ? 'lb' : 'kg';
const displayWeight = kg => unit() === 'lb' ? Number(kg) * LB_PER_KG : Number(kg);
const storeWeight = val => unit() === 'lb' ? Number(val) / LB_PER_KG : Number(val);
const fmtWeight = (kg, d = 1) => fmt(displayWeight(kg), d);
const inputWeight = kg => kg === '' || kg == null || !Number.isFinite(Number(kg)) ? '' : String(Math.round(displayWeight(kg) * 100) / 100);

const getFoodEntries = (k = selectedDate) => Array.isArray(state.food[k]) ? state.food[k].filter(isObj) : [];
function getFoodTotals(k = selectedDate) {
  return getFoodEntries(k).reduce((a, e) => {
    a.calories += safeNumber(e.calories); a.protein += safeNumber(e.protein); a.carbs += safeNumber(e.carbs); a.fat += safeNumber(e.fat);
    return a;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}
const getWater = (k = selectedDate) => safeNumber(state.water[k]);
const getWorkout = (k = selectedDate) => isObj(state.workouts[k]) ? state.workouts[k] : { completed: false, exercises: {} };
const getHabit = (k = selectedDate) => {
  const h = isObj(state.habits[k]) ? state.habits[k] : {};
  return { checks: isObj(h.checks) ? h.checks : {}, sleepHours: h.sleepHours ?? '', energy: h.energy ?? '', soreness: h.soreness ?? '', notes: h.notes ?? '' };
};
const habitCount = (k = selectedDate) => HABITS.filter(h => getHabit(k).checks[h.id]).length;
const sortedWeightKeys = () => Object.keys(state.weights).filter(k => isDateKey(k) && Number.isFinite(Number(state.weights[k])) && Number(state.weights[k]) > 0).sort();

function planForDay(idx = selectedDayIndex) {
  const p = state.workoutPlan && state.workoutPlan[idx];
  return (isObj(p) && Array.isArray(p.exercises) && p.exercises.length) ? p : DEFAULT_WORKOUTS[idx];
}
const setsOf = ex => Math.max(1, Math.min(12, Math.round(Number(ex.sets)) || 3));
function sessionCounts(k = selectedDate, idx = mondayIndex(parseLocalDate(k))) {
  const plan = planForDay(idx), rec = getWorkout(k);
  let total = 0, done = 0;
  plan.exercises.forEach((ex, i) => {
    const n = setsOf(ex); total += n;
    const sets = rec.exercises && rec.exercises[i] && Array.isArray(rec.exercises[i].sets) ? rec.exercises[i].sets : [];
    for (let s = 0; s < n; s++) if (sets[s] && sets[s].done) done++;
  });
  return { total, done };
}

function effectiveMealPlan() {
  const out = [];
  for (let d = 0; d < 7; d++) {
    const custom = state.mealPlan && isObj(state.mealPlan[d]) ? state.mealPlan[d] : {};
    out.push(MEAL_SLOTS.reduce((acc, slot) => { acc[slot] = slot in custom ? custom[slot] : DEFAULT_MEAL_PLAN[d][slot]; return acc; }, {}));
  }
  return out;
}
const mealById = id => MEAL_LIBRARY.find(m => m.id === id) || null;

function calculateStreak() {
  let streak = 0; const d = new Date();
  for (let i = 0; i < 4000; i++) {
    const k = todayKey(d), w = getWorkout(k), h = getHabit(k);
    const active = w.completed || Object.values(h.checks).some(Boolean);
    if (active) streak++;
    else if (k !== todayKey()) break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/* ==========================================================================
   UI primitives: toast, modals, confirm, tabs, numbers, bars, fields
   ========================================================================== */

/* ---------- toast ---------- */
let toastTimer = null;
/* Fade the current toast out (transition, so it can be interrupted by the next one). */
function dismissToast() {
  clearTimeout(toastTimer);
  const host = $('toast'); if (!host) return;
  host.querySelectorAll('.toast-item').forEach(el => {
    el.classList.remove('is-in');
    setTimeout(() => { if (el.parentNode) el.remove(); }, 260);
  });
}
function showToast(message, kind = 'success') {
  const host = $('toast'); if (!host) return;
  clearTimeout(toastTimer);
  host.innerHTML = '';
  const el = document.createElement('div');
  el.className = `toast-item toast-${kind}`;
  if (kind === 'error') el.setAttribute('role', 'alert');
  el.innerHTML = `${icon(kind === 'error' ? 'alert' : kind === 'info' ? 'info' : 'check')}<span>${esc(message)}</span>`;
  host.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
  toastTimer = setTimeout(dismissToast, kind === 'error' ? 6500 : 3200);
}

function updateStorageStatus() {
  const bad = storageBlocked || storageFailed;
  const el = document.querySelector('.storage-status');
  if (el) { el.classList.toggle('is-error', bad); el.lastChild.textContent = bad ? 'Not saving: storage unavailable' : 'Saved on this device'; }
  /* the sidebar chip is hidden on phones, so a banner and the footer note say the same thing at every size */
  const banner = $('storage-banner'); if (banner) banner.hidden = !bad;
  const note = document.querySelector('.footer-note'); if (note) note.textContent = bad ? 'Not saving on this device right now.' : 'Saved locally on this device.';
}

/* ---------- modals (one manager for every dialog) ---------- */
const modalStack = [];
const dismissers = {};
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const visibleFocusables = root => $$(FOCUSABLE, root).filter(el => !el.closest('[hidden]') && el.getClientRects().length);

function syncModalInert() {
  const open = modalStack.length > 0;
  const app = $('app'), fab = $('quick-action-fab');
  if (app) app.inert = open;
  if (fab) fab.inert = open;
  modalStack.forEach((id, i) => { const m = $(id); if (m) m.inert = i < modalStack.length - 1; });
  document.documentElement.classList.toggle('modal-open', open);
}

function openModal(id, { focus } = {}) {
  const m = $(id); if (!m || modalStack.includes(id)) return;
  const trigger = document.activeElement;
  m._returnFocus = trigger && trigger !== document.body ? trigger : null;
  dismissToast(); /* a leftover toast must not sit on top of the dialog */
  m.hidden = false;
  modalStack.push(id);
  syncModalInert();
  void m.offsetWidth; /* commit the hidden→visible change so the transition runs */
  m.classList.add('is-open');
  const dlg = m.querySelector('.modal');
  const target = (focus && $(focus)) || dlg.querySelector('[data-autofocus]') || visibleFocusables(dlg)[0] || dlg;
  if (!target.hasAttribute('tabindex') && target === dlg) dlg.setAttribute('tabindex', '-1');
  requestAnimationFrame(() => target.focus({ preventScroll: true }));
}

function closeModal(id, { restoreFocus = true } = {}) {
  const m = $(id), i = modalStack.indexOf(id);
  if (!m || i < 0) return;
  modalStack.splice(i, 1);
  m.classList.remove('is-open');
  m.inert = true; /* nothing inside a closing dialog can be clicked or focused while it slides away */
  setTimeout(() => { if (!m.classList.contains('is-open')) m.hidden = true; }, reducedMotion() ? 0 : 320);
  syncModalInert();
  if (restoreFocus) {
    const back = m._returnFocus;
    const target = back && document.contains(back) && !back.closest('[hidden]') ? back : $('main');
    if (target) target.focus({ preventScroll: true });
  }
}

function dismissTop() {
  const id = modalStack[modalStack.length - 1]; if (!id) return;
  (dismissers[id] || (() => closeModal(id)))();
}

function initModals() {
  document.addEventListener('keydown', e => {
    if (!modalStack.length) return;
    if (e.key === 'Escape') { e.preventDefault(); dismissTop(); return; }
    if (e.key !== 'Tab') return;
    const dlg = $(modalStack[modalStack.length - 1]).querySelector('.modal');
    const items = visibleFocusables(dlg);
    if (!items.length) { e.preventDefault(); return; }
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || !dlg.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !dlg.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
  $$('.modal-backdrop').forEach(m => {
    let downOnBackdrop = false;
    m.addEventListener('pointerdown', e => { downOnBackdrop = e.target === m; });
    m.addEventListener('click', e => { if (e.target === m && downOnBackdrop) dismissTop(); downOnBackdrop = false; });
  });
}

/* Promise-based confirmation. Resolves true only on an explicit confirm. */
function confirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = true, phrase = '', offerBackup = false }) {
  return new Promise(resolve => {
    const ok = $('confirm-ok'), cancel = $('confirm-cancel'), input = $('confirm-phrase'), extra = $('confirm-extra'), backup = $('confirm-backup');
    $('confirm-title').textContent = title;
    $('confirm-message').textContent = message;
    ok.textContent = confirmLabel; cancel.textContent = cancelLabel;
    ok.className = `button ${danger ? 'button-danger' : 'button-primary'}`;
    extra.hidden = !(phrase || offerBackup);
    input.closest('.field').hidden = !phrase;
    backup.hidden = !offerBackup;
    $('confirm-phrase-word').textContent = phrase;
    input.value = '';
    ok.disabled = Boolean(phrase);

    const done = value => {
      ok.removeEventListener('click', onOk); cancel.removeEventListener('click', onCancel);
      input.removeEventListener('input', onInput); input.removeEventListener('keydown', onKey);
      backup.removeEventListener('click', onBackup);
      delete dismissers['confirm-modal'];
      closeModal('confirm-modal');
      resolve(value);
    };
    const onOk = () => { if (!ok.disabled) done(true); };
    const onCancel = () => done(false);
    const onInput = () => { ok.disabled = input.value.trim().toUpperCase() !== phrase.toUpperCase(); };
    const onKey = e => { if (e.key === 'Enter') { e.preventDefault(); onOk(); } };
    const onBackup = () => exportBackup();
    ok.addEventListener('click', onOk); cancel.addEventListener('click', onCancel);
    input.addEventListener('input', onInput); input.addEventListener('keydown', onKey);
    backup.addEventListener('click', onBackup);
    dismissers['confirm-modal'] = onCancel;
    openModal('confirm-modal', { focus: phrase ? 'confirm-phrase' : 'confirm-cancel' });
  });
}

/* ---------- tabs (roving tabindex, arrow keys) ---------- */
function activateTab(tab, { focus = false } = {}) {
  const list = tab.closest('[role="tablist"]'); if (!list) return;
  $$('[role="tab"]', list).forEach(t => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = $(t.getAttribute('aria-controls'));
    if (panel) panel.hidden = !on;
  });
  if (focus) tab.focus();
  list.dispatchEvent(new CustomEvent('tabchange', { bubbles: true, detail: { tab } }));
}

function initTabs() {
  document.addEventListener('click', e => {
    const tab = e.target.closest('[role="tab"]');
    if (tab && tab.getAttribute('aria-selected') !== 'true') activateTab(tab);
  });
  document.addEventListener('keydown', e => {
    const tab = e.target.closest && e.target.closest('[role="tab"]'); if (!tab) return;
    const tabs = $$('[role="tab"]', tab.closest('[role="tablist"]'));
    const i = tabs.indexOf(tab);
    let n = -1;
    if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = tabs.length - 1;
    if (n >= 0) { e.preventDefault(); activateTab(tabs[n], { focus: true }); }
  });
}

/* Focus an element by id, opening its tab first when it sits in a hidden panel. */
function focusTarget(id) {
  const el = $(id); if (!el) return;
  const panel = el.closest('[role="tabpanel"]');
  if (panel && panel.hidden) { const tab = $(panel.getAttribute('aria-labelledby')); if (tab) activateTab(tab); }
  if (!el.matches('input,select,textarea,button,a[href],[tabindex]')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
}

/* ---------- numbers and progress ---------- */
/* Counts toward a new value only when it actually changed. First paint and hidden elements set instantly.
   `fixed` keeps trailing zeros (2.0 L, not 2 L). */
const numState = new WeakMap();
function setNum(target, value, decimals = 0, fixed = false) {
  const el = typeof target === 'string' ? $(target) : target; if (!el) return;
  const f = v => fixed ? Number(v).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : fmt(v, decimals);
  const to = Number(value) || 0, text = f(to), prev = numState.get(el);
  if (prev && prev.raf) cancelAnimationFrame(prev.raf);
  if (!prev || reducedMotion() || document.hidden || !el.offsetParent || prev.value === to) {
    el.textContent = text; numState.set(el, { value: to, raf: 0 }); return;
  }
  const from = prev.value, t0 = performance.now(), dur = 480, st = { value: to, raf: 0 };
  numState.set(el, st);
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = f(from + (to - from) * e);
    if (p < 1) st.raf = requestAnimationFrame(step); else el.textContent = text;
  };
  st.raf = requestAnimationFrame(step);
}
function setText(target, text) {
  const el = typeof target === 'string' ? $(target) : target;
  if (el && el.textContent !== String(text)) el.textContent = text;
  if (el) numState.delete(el);
}
/* Bars and rings read --p (0 to 1); CSS transitions do the motion. */
function setBar(target, value, goal) {
  const el = typeof target === 'string' ? $(target) : target; if (!el) return;
  const over = goal > 0 && value > goal;
  el.style.setProperty('--p', (goal > 0 ? clamp(value / goal, 0, 1) : 0).toFixed(4));
  el.classList.toggle('is-over', over);
}

/* Segmented "spine": one segment per set. */
function renderSpine(target, done, total) {
  const el = typeof target === 'string' ? $(target) : target; if (!el) return;
  const count = total > 0 ? Math.min(total, 30) : 1;
  if (el.children.length !== count) el.innerHTML = '<i class="spine-seg"></i>'.repeat(count);
  Array.from(el.children).forEach((seg, i) => {
    const f = total > 0 ? clamp(done * count / total - i, 0, 1) : 0;
    seg.style.setProperty('--f', f.toFixed(3));
  });
  el.classList.toggle('is-complete', total > 0 && done >= total);
  el.setAttribute('aria-valuenow', String(total > 0 ? Math.round(done / total * 100) : 0));
  el.setAttribute('aria-valuetext', total > 0 ? `${done} of ${total} ${total === 1 ? 'set' : 'sets'} done` : 'No sets planned');
}

/* ---------- templates ---------- */
function emptyState({ art = 'food', title, text = '', action = '' }) {
  return `<div class="empty"><svg class="empty-art" aria-hidden="true"><use href="#i-empty-${art}"/></svg><p class="empty-title">${esc(title)}</p>${text ? `<p class="empty-text">${esc(text)}</p>` : ''}${action}</div>`;
}

/* ---------- form fields ---------- */
function fieldError(input, message) {
  const field = input.closest('.field') || input.parentElement;
  let err = field.querySelector(':scope > .field-error');
  if (!message) {
    input.removeAttribute('aria-invalid');
    if (err) { err.hidden = true; err.textContent = ''; }
    return;
  }
  if (!err) {
    err = document.createElement('p'); err.className = 'field-error'; err.id = `${input.id || makeId()}-error`;
    err.setAttribute('role', 'alert'); field.appendChild(err);
  }
  err.textContent = message; err.hidden = false;
  input.setAttribute('aria-invalid', 'true');
  const ids = new Set((input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)); ids.add(err.id);
  input.setAttribute('aria-describedby', Array.from(ids).join(' '));
}
function clearFieldErrors(form) { $$('[aria-invalid="true"]', form).forEach(i => fieldError(i, '')); }
/* Returns the first invalid field (after marking every invalid one) or null. */
function validateFields(rules) {
  let first = null;
  rules.forEach(([input, msg]) => { fieldError(input, msg || ''); if (msg && !first) first = input; });
  if (first) first.focus();
  return first;
}
function numberIn(input, { min = -Infinity, max = Infinity, required = true, label = 'This field' } = {}) {
  const raw = input.value.trim();
  if (raw === '') return required ? `${label} is required.` : '';
  const n = Number(raw);
  if (!Number.isFinite(n)) return `${label} must be a number.`;
  if (n < min) return `${label} must be at least ${min}.`;
  if (n > max) return `${label} must be ${max} or less.`;
  return '';
}

/* ---------- files ---------- */
function downloadFile(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
    const ctx = new Ctx(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = 587.33;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.8);
    osc.onended = () => ctx.close && ctx.close();
  } catch (e) { /* audio is optional */ }
}

/* ==========================================================================
   App chrome: routing, topbar, nav indicator, render dispatch
   ========================================================================== */

let currentPage = 'dashboard';
let pendingFocus = null;
let lastStreak = null;
const ui = { foodCat: 'all', foodQuery: '', range: 0, mealDay: null };

const pageFromHash = () => { const h = location.hash.replace('#', ''); return PAGES.includes(h) ? h : null; };

/* Navigate. The hash is the source of truth so back/forward and links work. */
function go(page, { focus = null } = {}) {
  if (!PAGES.includes(page)) return;
  pendingFocus = focus;
  if (location.hash !== `#${page}`) location.hash = page;
  else { showPage(page, { focus }); pendingFocus = null; }
}

function showPage(page, { focus = null, initial = false } = {}) {
  if (!PAGES.includes(page)) page = 'dashboard';
  const changed = page !== currentPage;
  currentPage = page;
  $$('.page-section').forEach(s => s.classList.toggle('active', s.dataset.pageSection === page));
  $$('.nav-link').forEach(l => {
    const on = l.dataset.page === page;
    l.classList.toggle('active', on);
    if (on) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
  });
  document.title = `${PAGE_TITLES[page]} · FORM`;
  renderCurrent();
  positionNavIndicator();
  if (changed && !initial) window.scrollTo(0, 0);
  if (focus) requestAnimationFrame(() => focusTarget(focus));
  else if (changed && !initial) $('main').focus({ preventScroll: true });
}

function positionNavIndicator() {
  const nav = $('main-nav'); if (!nav) return;
  const active = nav.querySelector('.nav-link.active');
  const visible = active && active.offsetParent !== null;
  nav.classList.toggle('no-active', !visible);
  if (!visible) return;
  nav.style.setProperty('--ind-x', `${active.offsetLeft}px`);
  nav.style.setProperty('--ind-y', `${active.offsetTop}px`);
  nav.style.setProperty('--ind-w', `${active.offsetWidth}px`);
  nav.style.setProperty('--ind-h', `${active.offsetHeight}px`);
  if (!nav.classList.contains('is-ready')) requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add('is-ready')));
}

function setSelectedDate(key) {
  if (!isDateKey(key)) return;
  selectedDate = key;
  selectedDayIndex = mondayIndex(parseLocalDate(key));
  ui.mealDay = null;
  renderCurrent();
}

function renderChrome() {
  const isToday = selectedDate === todayKey();
  setText('today-label', isToday ? 'Today' : 'Selected day');
  const titleText = currentPage === 'dashboard'
    ? (isToday ? greeting() : dateLabel(selectedDate, { weekday: 'long' }))
    : PAGE_TITLES[currentPage];
  const titleEl = $('greeting-title');
  if (titleEl.dataset.text !== titleText) {
    titleEl.dataset.text = titleText;
    /* "Habits & recovery" keeps its tail in a span so phones can show just "Habits" */
    const split = /^([^&]+?)(\s*&\s*.+)$/.exec(titleText);
    titleEl.innerHTML = split ? `${esc(split[1])}<span class="t-long">${esc(split[2])}</span>` : esc(titleText);
  }
  /* Long date on wide screens, short date on phones (CSS shows one of the two spans) */
  const subEl = $('topbar-sub'), subKey = `${selectedDate}|${isToday}`;
  if (subEl && subEl.dataset.key !== subKey) {
    subEl.dataset.key = subKey;
    const tail = isToday ? '' : ' · not today';
    subEl.innerHTML = `<span class="d-long">${esc(dateLabel(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' }) + tail)}</span><span class="d-short">${esc(dateLabel(selectedDate, { weekday: 'short', month: 'short', day: 'numeric' }) + tail)}</span>`;
  }
  const streak = calculateStreak();
  setNum('topbar-streak-count', streak);
  setText('sidebar-streak-count', `${streak} ${streak === 1 ? 'day' : 'days'}`);
  const chip = document.querySelector('.streak-chip');
  if (chip && lastStreak !== null && streak > lastStreak) { chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump'); }
  lastStreak = streak;
  const input = $('selected-date'); if (input.value !== selectedDate) input.value = selectedDate;
  $('date-today').setAttribute('aria-disabled', String(isToday));
  document.documentElement.setAttribute('data-theme', state.preferences.theme);
}

function renderPage(page) {
  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'workouts': renderWorkouts(); break;
    case 'nutrition': renderNutrition(); break;
    case 'progress': renderProgress(); break;
    case 'habits': renderHabits(); break;
    case 'settings': renderSettings(); break;
  }
}

/* Re-render the visible page. Keeps keyboard focus on the same element when it has an id. */
function renderCurrent() {
  const had = document.activeElement;
  const id = had && had !== document.body && $('main').contains(had) ? had.id : '';
  const sel = id ? null : (had && had.dataset && had.dataset.focusKey) || '';
  renderChrome();
  renderPage(currentPage);
  if ((id || sel) && !document.contains(had)) {
    const next = id ? $(id) : document.querySelector(`[data-focus-key="${sel}"]`);
    if (next) next.focus({ preventScroll: true });
  }
}

/* Save, repaint, and (only when saving worked) confirm with a toast. */
function commit(message, kind) {
  const ok = saveState();
  renderCurrent();
  if (ok && message) showToast(message, kind);
  return ok;
}

/* ---------- ensure-creating writers (reads elsewhere never create records) ---------- */
function ensureWorkout(k = selectedDate) {
  if (!isObj(state.workouts[k])) state.workouts[k] = { completed: false, exercises: {} };
  const w = state.workouts[k];
  if (!isObj(w.exercises)) w.exercises = {};
  return w;
}
function ensureHabit(k = selectedDate) {
  if (!isObj(state.habits[k])) state.habits[k] = { checks: {}, sleepHours: '', energy: '', soreness: '', notes: '' };
  const h = state.habits[k];
  if (!isObj(h.checks)) h.checks = {};
  return h;
}
function ensureSet(exIdx, setIdx, k = selectedDate) {
  const w = ensureWorkout(k), plan = planForDay(mondayIndex(parseLocalDate(k)));
  if (!isObj(w.exercises[exIdx])) w.exercises[exIdx] = { sets: [] };
  const e = w.exercises[exIdx];
  if (!Array.isArray(e.sets)) e.sets = [];
  if (plan.exercises[exIdx] && !e.name) e.name = plan.exercises[exIdx].name; /* stamped once, so strength history stays stable if the plan is edited later (and an old log is never re-labelled) */
  for (let i = 0; i <= setIdx; i++) if (!isObj(e.sets[i])) e.sets[i] = { done: false, reps: '', weight: '' };
  return e.sets[setIdx];
}

/* ---------- shared mutations ---------- */
function addWater(ml) {
  state.water[selectedDate] = getWater() + ml;
  commit(`Added ${ml} ml of water`);
}
function undoWater() {
  if (getWater() <= 0) { showToast('No water logged for this day yet.', 'info'); return; }
  state.water[selectedDate] = Math.max(0, getWater() - 250);
  commit('Removed 250 ml');
}
function setHabit(id, on) {
  ensureHabit().checks[id] = on;
  if (id === 'workout') ensureWorkout().completed = on;
  commit();
}
function setWorkoutComplete(on) {
  ensureWorkout().completed = on;
  ensureHabit().checks.workout = on;
  const ok = saveState();
  renderCurrent();
  if (ok) {
    const streak = calculateStreak();
    showToast(on ? `Workout logged${streak > 1 ? ` · ${streak}-day streak` : ''}` : 'Workout marked as not done');
  }
}
function logMeal(mealId, slot) {
  const meal = mealById(mealId); if (!meal) return;
  if (getFoodEntries().some(e => e.planId === meal.id && e.type === slot)) { showToast(`${meal.name} is already in the log.`, 'info'); return; }
  if (!Array.isArray(state.food[selectedDate])) state.food[selectedDate] = [];
  state.food[selectedDate].push({ id: makeId(), name: meal.name, type: slot, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, source: 'plan', planId: meal.id });
  commit(`${slot} logged`);
}
function addFoodEntry(entry) {
  if (!Array.isArray(state.food[selectedDate])) state.food[selectedDate] = [];
  state.food[selectedDate].push({ id: makeId(), ...entry });
  return commit(`${entry.name} added to ${entry.type.toLowerCase()}`);
}

/* ---------- week strip (workouts + meal planner share one builder) ---------- */
function dayScore(k) {
  const h = getHabit(k).checks;
  return HABITS.filter(x => x.id === 'workout' ? (h.workout || getWorkout(k).completed) : h[x.id]).length;
}
function renderWeekStrip(id, { onlyDay = false } = {}) {
  const host = $(id); if (!host) return;
  const today = todayKey();
  host.innerHTML = weekDateKeys(selectedDate).map((k, i) => {
    const plan = planForDay(i), done = getWorkout(k).completed;
    const sel = onlyDay ? (ui.mealDay === null ? selectedDayIndex : ui.mealDay) === i : k === selectedDate;
    const label = cap(plan.type).split(' ')[0];
    const attrs = onlyDay ? `data-act="meal-day" data-day="${i}"` : `data-act="day-pick" data-date="${k}"`;
    return `<button type="button" class="day-chip${sel ? ' is-selected' : ''}${k === today ? ' is-today' : ''}${done && !onlyDay ? ' is-done' : ''}" ${attrs} aria-pressed="${sel}" data-focus-key="${id}-${i}" aria-label="${DAY_NAMES[i]} ${parseLocalDate(k).getDate()}${k === today ? ', today' : ''}${onlyDay ? '' : `, ${esc(cap(plan.type))}${done ? ', completed' : ''}`}">
      <span class="day-short">${DAY_SHORT[i]}</span><span class="day-date num">${parseLocalDate(k).getDate()}</span>
      <span class="day-activity">${onlyDay ? '' : (done ? `${icon('check')}Done` : esc(label))}</span></button>`;
  }).join('');
}

/* Bar columns that update in place so transitions run instead of restarting. */
function patchBars(host, rows) {
  if (!host) return;
  const sig = rows.map(r => r.key).join('|');
  const build = () => {
    host.dataset.sig = sig;
    host.innerHTML = rows.map(r => `<button type="button" class="wbar" data-act="day-pick" data-date="${r.key}" data-focus-key="${host.id}-${r.key}">
      <span class="wbar-pct num"></span><span class="wbar-track"><i class="wbar-fill"></i></span><span class="wbar-day">${r.label}</span></button>`).join('');
  };
  const fresh = host.dataset.sig !== sig;
  if (fresh) build();
  const apply = withFill => Array.from(host.children).forEach((el, i) => {
    const r = rows[i], fill = el.querySelector('.wbar-fill');
    el.classList.toggle('is-selected', r.selected); el.classList.toggle('is-today', r.today);
    el.setAttribute('aria-label', r.aria); el.setAttribute('aria-pressed', String(r.selected));
    el.querySelector('.wbar-pct').textContent = r.pct;
    if (withFill) fill.style.setProperty('--p', r.value.toFixed(3)); else fill.style.setProperty('--p', '0');
  });
  /* A freshly built set of bars grows in from zero; later updates just move. */
  if (fresh) { apply(false); requestAnimationFrame(() => requestAnimationFrame(() => apply(true))); }
  else apply(true);
}

/* ==========================================================================
   Dashboard
   ========================================================================== */

function celebrate(el) { if (!el) return; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }

function checkRowHtml(h, checked, prefix) {
  return `<label class="check-row${checked ? ' is-checked' : ''}" for="${prefix}-${h.id}">
    <input type="checkbox" id="${prefix}-${h.id}" data-act="habit" data-habit="${h.id}"${checked ? ' checked' : ''}>
    <span class="check-box" aria-hidden="true">${icon('check')}</span>
    <span class="check-copy"><b>${esc(h.title)}</b><small>${esc(h.description)}</small></span></label>`;
}

function renderDashboard() {
  const t = getFoodTotals(), g = state.goals, entries = getFoodEntries(), date = selectedDate, isToday = date === todayKey();
  setText('dashboard-date-caption', dateLabel(date, { weekday: 'long', month: 'long', day: 'numeric' }));

  /* Energy balance ring */
  const left = g.calories - t.calories;
  setNum('calories-left', Math.abs(left));
  setText('calories-left-label', left >= 0 ? 'kcal left' : 'kcal over');
  setNum('calories-total', t.calories);
  setNum('calories-goal-label', g.calories);
  setNum('dash-meals-count', entries.length);
  setText('dash-meals-noun', entries.length === 1 ? 'item' : 'items');
  setBar('calories-progress', t.calories, g.calories);
  const ring = document.querySelector('#page-dashboard .ring-wrap');
  ring.classList.toggle('is-over', left < 0);
  ring.setAttribute('aria-valuenow', String(g.calories > 0 ? Math.round(clamp(t.calories / g.calories, 0, 1) * 100) : 0));
  ring.setAttribute('aria-valuetext', `${fmt(t.calories)} of ${fmt(g.calories)} kilocalories`);

  [['protein', 'protein-total', 'protein-goal-label', 'protein-progress', 'protein-left'],
   ['carbs', 'dash-carbs-total', 'dash-carbs-goal', 'dash-carbs-progress', 'dash-carbs-left'],
   ['fat', 'dash-fat-total', 'dash-fat-goal', 'dash-fat-progress', 'dash-fat-left']].forEach(([k, a, b, c, d]) => {
    setNum(a, t[k], 1); setNum(b, g[k]); setBar(c, t[k], g[k]); setNum(d, Math.max(0, g[k] - t[k]), 1);
  });

  /* Water + weight */
  const ml = getWater(), goalMl = g.water * 1000;
  setNum('water-total', ml / 1000, 1, true);
  setNum('water-left', Math.max(0, goalMl - ml) / 1000, 1, true);
  setNum('water-goal-label', g.water, 1, true);
  setBar('water-progress', ml, goalMl);
  const wk = sortedWeightKeys(), latest = wk[wk.length - 1];
  if (latest) setNum('latest-weight', displayWeight(state.weights[latest]), 1, true); else setText('latest-weight', '—');
  setText('weight-unit', unit());
  setText('weight-caption', latest ? `Logged ${dateLabel(latest, { month: 'short', day: 'numeric' })}` : 'No weigh-ins yet.');

  /* Weekly consistency */
  const keys = weekDateKeys(date), today = todayKey();
  const scores = keys.map(dayScore), sum = scores.reduce((a, b) => a + b, 0);
  setText('weekly-summary-label', `Week of ${dateLabel(keys[0], { month: 'short', day: 'numeric' })} · ${sum} of ${HABITS.length * 7} daily basics done`);
  patchBars($('dashboard-weekly-consistency'), keys.map((k, i) => ({
    key: k, label: DAY_SHORT[i], value: scores[i] / HABITS.length, pct: `${Math.round(scores[i] / HABITS.length * 100)}%`,
    selected: k === date, today: k === today, aria: `${DAY_NAMES[i]}: ${scores[i]} of ${HABITS.length} daily basics done`
  })));

  /* Workout session */
  const plan = planForDay(), rec = getWorkout(), c = sessionCounts(date, selectedDayIndex);
  setText('dash-workout-title', cap(plan.type));
  setText('dash-workout-tag', isToday ? 'Today' : DAY_NAMES[selectedDayIndex]);
  setText('dash-workout-description', plan.description || '');
  setNum('dash-session-done', c.done); setNum('dash-session-total', c.total); setText('dash-session-noun', c.total === 1 ? 'set' : 'sets');
  setText('dash-session-duration', plan.duration || '');
  renderSpine('dash-session-bar', c.done, c.total);
  $('dash-exercise-preview').innerHTML = plan.exercises.slice(0, 3).map((ex, i) => {
    const sets = rec.exercises && rec.exercises[i] && Array.isArray(rec.exercises[i].sets) ? rec.exercises[i].sets : [];
    const n = setsOf(ex), d = sets.slice(0, n).filter(s => s && s.done).length;
    return `<div class="preview-row${d >= n ? ' is-done' : ''}"><span class="preview-idx">${d >= n ? icon('check') : i + 1}</span>
      <div class="preview-copy"><b>${esc(ex.name)}</b><small>${esc(ex.dose || '')}</small></div><span class="preview-sets num">${d}/${n}</span></div>`;
  }).join('') + (plan.exercises.length > 3 ? `<p class="preview-more">+${plan.exercises.length - 3} more exercise${plan.exercises.length - 3 === 1 ? '' : 's'}</p>` : '');
  const btn = $('dash-complete-workout');
  btn.setAttribute('aria-pressed', String(Boolean(rec.completed)));
  btn.classList.toggle('is-on', Boolean(rec.completed));
  btn.innerHTML = rec.completed ? `${icon('check')}Completed` : 'Mark complete';

  /* Daily basics */
  const checks = getHabit().checks;
  $('dashboard-habit-checklist').innerHTML = HABITS.map(h => checkRowHtml(h, Boolean(checks[h.id]), 'dash-habit')).join('');
  setText('daily-completion', `${habitCount()} / ${HABITS.length}`);

  /* Meals from the weekly plan */
  const day = effectiveMealPlan()[selectedDayIndex];
  setText('dash-meals-sub', `From your weekly meal plan · ${DAY_NAMES[selectedDayIndex]}`);
  $('dashboard-meals').innerHTML = MEAL_SLOTS.map(slot => {
    const meal = mealById(day[slot]);
    if (!meal) return `<article class="meal-card is-empty"><span class="meal-slot">${slot}</span><h3 class="meal-name">Nothing planned</h3>
      <p class="meal-meta">Pick a meal in the planner.</p><button class="button button-quiet button-sm" type="button" data-go-page="nutrition" data-focus="meal-planner-grid">Open planner</button></article>`;
    const logged = entries.some(e => e.planId === meal.id && e.type === slot);
    return `<article class="meal-card${logged ? ' is-logged' : ''}"><span class="meal-slot">${slot}</span><h3 class="meal-name">${esc(meal.name)}</h3>
      <p class="meal-meta"><span class="num">${meal.calories}</span> kcal · P <span class="num">${meal.protein}</span> g</p>
      ${logged ? `<span class="tag tag-ok">${icon('check')}Logged</span>` : `<button class="button button-outline button-sm" type="button" data-act="log-meal" data-meal="${meal.id}" data-slot="${slot}">${icon('plus')}Log meal</button>`}</article>`;
  }).join('');
}

/* ==========================================================================
   Workouts
   ========================================================================== */

function targetReps(ex) {
  const m = String(ex.reps || '').match(/^\s*(\d+(?:\s*[–-]\s*\d+)?)/);
  return m ? m[1].replace(/\s+/g, '') : '';
}

function exerciseCardHtml(ex, i, recEx) {
  const n = setsOf(ex), sets = recEx && Array.isArray(recEx.sets) ? recEx.sets : [];
  const rows = Array.from({ length: n }, (_, s) => {
    const sd = isObj(sets[s]) ? sets[s] : {}, done = Boolean(sd.done);
    const reps = sd.reps !== '' && sd.reps != null && Number.isFinite(Number(sd.reps)) ? String(sd.reps) : '';
    return `<div class="set-row" data-ex="${i}" data-set="${s}" data-done="${done}">
      <span class="set-num num">${s + 1}</span>
      <input class="set-input" type="number" inputmode="numeric" min="0" max="999" step="1" placeholder="${esc(targetReps(ex) || '–')}" value="${esc(reps)}" data-field="reps" data-ex="${i}" data-set="${s}" aria-label="${esc(ex.name)}, set ${s + 1}, reps">
      <input class="set-input" type="number" inputmode="decimal" min="0" max="2000" step="0.5" placeholder="–" value="${esc(inputWeight(sd.weight))}" data-field="weight" data-ex="${i}" data-set="${s}" aria-label="${esc(ex.name)}, set ${s + 1}, load in ${unit()}">
      <button class="set-check" type="button" data-act="set-toggle" data-ex="${i}" data-set="${s}" aria-pressed="${done}" aria-label="${esc(ex.name)}, set ${s + 1} done">${icon('check')}</button></div>`;
  }).join('');
  return `<article class="exercise-card" data-ex="${i}">
    <header class="exercise-head">
      <span class="exercise-idx"><span class="exercise-idx-num num">${i + 1}</span>${icon('check')}</span>
      <div class="exercise-main"><h3 class="exercise-name">${esc(ex.name)}</h3>${ex.note ? `<p class="exercise-note">${esc(ex.note)}</p>` : ''}${ex.alt ? `<p class="exercise-alt"><span>Alternative</span> ${esc(ex.alt)}</p>` : ''}${recEx && recEx.name && recEx.name !== ex.name ? `<p class="exercise-alt"><span>Logged as</span> ${esc(recEx.name)}</p>` : ''}</div>
      <div class="exercise-side"><span class="exercise-dose">${esc(ex.dose || `${n} ${n === 1 ? 'set' : 'sets'}`)}</span><span class="exercise-progress num"></span></div>
    </header>
    <div class="set-grid"><span class="set-head">Set</span><span class="set-head">Reps</span><span class="set-head">Load (${unit()})</span><span class="set-head set-head-done">Done</span>${rows}</div></article>`;
}

function renderWorkoutList() {
  const plan = planForDay(), rec = getWorkout();
  $('workout-list').innerHTML = plan.exercises.map((ex, i) => exerciseCardHtml(ex, i, rec.exercises && rec.exercises[i])).join('');
}

/* Updates counts, spine and card states without rebuilding the inputs (keeps focus and typing intact). */
function updateWorkoutMeta() {
  const plan = planForDay(), rec = getWorkout(), c = sessionCounts(selectedDate, selectedDayIndex);
  setNum('workout-done-sets', c.done); setNum('workout-total-sets', c.total); setText('workout-sets-noun', c.total === 1 ? 'set' : 'sets');
  renderSpine('workout-progress-fill', c.done, c.total);
  setText('workout-progress-text', `${c.done} / ${c.total} ${c.total === 1 ? 'set' : 'sets'}`);
  $$('#workout-list .exercise-card').forEach(card => {
    const i = Number(card.dataset.ex), ex = plan.exercises[i]; if (!ex) return;
    const n = setsOf(ex), sets = rec.exercises && rec.exercises[i] && Array.isArray(rec.exercises[i].sets) ? rec.exercises[i].sets : [];
    const d = sets.slice(0, n).filter(s => s && s.done).length;
    card.classList.toggle('is-complete', d >= n);
    card.querySelector('.exercise-progress').textContent = `${d}/${n} ${n === 1 ? 'set' : 'sets'}`;
  });
  const btn = $('complete-workout'), all = c.total > 0 && c.done >= c.total;
  btn.setAttribute('aria-pressed', String(Boolean(rec.completed)));
  btn.classList.toggle('is-on', Boolean(rec.completed));
  btn.innerHTML = rec.completed ? `${icon('check')}Workout completed` : 'Mark workout done';
  setText('workout-footer-note', rec.completed ? 'Logged for this day. Tap again if you need to undo it.'
    : all ? 'Every set is ticked. Mark the workout done to add it to your streak.' : 'Tick each set as you finish it. Reps and load save as you type.');
}

function renderWorkouts() {
  const plan = planForDay();
  renderWeekStrip('week-strip');
  setText('workout-day-title', `${DAY_NAMES[selectedDayIndex]} workout`);
  setText('workout-type-tag', cap(plan.type));
  setText('workout-description', plan.description || '');
  setText('workout-duration', plan.duration || '');
  renderWorkoutList();
  updateWorkoutMeta();
  renderTimer();
  $('strength-history-list').innerHTML = strengthListHtml('workouts');
}

function toggleSet(ex, s) {
  const before = sessionCounts(selectedDate, selectedDayIndex);
  const set = ensureSet(ex, s); set.done = !set.done;
  if (!saveState()) { set.done = !set.done; return; }
  const row = document.querySelector(`#workout-list .set-row[data-ex="${ex}"][data-set="${s}"]`);
  if (row) { row.dataset.done = String(set.done); row.querySelector('.set-check').setAttribute('aria-pressed', String(set.done)); }
  updateWorkoutMeta();
  const after = sessionCounts(selectedDate, selectedDayIndex);
  if (set.done && state.preferences.autoRest) { timerReset(); timerStart(); }
  if (set.done && after.total > 0 && after.done === after.total && before.done < after.total) {
    celebrate($('workout-progress-fill'));
    showToast('Every set is done. Mark the workout complete when you are ready.');
  }
}

let setSaveTimer = null;
function setSetField(ex, s, field, raw, { immediate = false } = {}) {
  const set = ensureSet(ex, s);
  if (field === 'weight') set.weight = raw === '' || !Number.isFinite(Number(raw)) ? '' : storeWeight(Number(raw));
  else set.reps = raw === '' || !Number.isFinite(Number(raw)) ? '' : String(Math.max(0, Math.round(Number(raw))));
  clearTimeout(setSaveTimer);
  if (immediate) { setSaveTimer = null; saveState(); }
  else setSaveTimer = setTimeout(() => { setSaveTimer = null; saveState(); }, 350);
}
/* Typing in a set field saves after a short pause; make sure a pending save is never lost when the page is hidden or closed. */
function flushPendingSave() {
  if (setSaveTimer === null) return;
  clearTimeout(setSaveTimer); setSaveTimer = null; saveState();
}

/* ---------- strength log (built from ticked sets that have a load) ---------- */
function strengthHistory() {
  const map = new Map();
  Object.keys(state.workouts).filter(isDateKey).sort().forEach(k => {
    const rec = state.workouts[k]; if (!isObj(rec) || !isObj(rec.exercises)) return;
    const plan = planForDay(mondayIndex(parseLocalDate(k)));
    Object.keys(rec.exercises).forEach(i => {
      const e = rec.exercises[i]; if (!isObj(e) || !Array.isArray(e.sets)) return;
      const name = e.name || (plan.exercises[i] && plan.exercises[i].name); if (!name) return;
      let best = null;
      e.sets.forEach(s => {
        if (!isObj(s) || !s.done) return;
        const w = Number(s.weight), r = Number(s.reps);
        if (!(w > 0)) return;
        const reps = Number.isFinite(r) && r > 0 ? r : 0;
        if (!best || w > best.weight || (w === best.weight && reps > best.reps)) best = { date: k, weight: w, reps };
      });
      if (best) { if (!map.has(name)) map.set(name, []); map.get(name).push(best); }
    });
  });
  return Array.from(map, ([name, sessions]) => ({ name, sessions })).sort((a, b) => b.sessions[b.sessions.length - 1].date.localeCompare(a.sessions[a.sessions.length - 1].date));
}

function strengthListHtml(from) {
  const list = strengthHistory();
  if (!list.length) {
    return emptyState({ art: 'lift', title: 'No loads logged yet', text: 'Enter a load and tick a set on the Workouts page. Your best set for each lift shows up here.',
      action: from === 'progress' ? '<button class="button button-outline button-sm" type="button" data-go-page="workouts">Open workouts</button>' : '' });
  }
  return `<ul class="strength-list-rows">${list.map(item => {
    const last = item.sessions[item.sessions.length - 1], prev = item.sessions[item.sessions.length - 2];
    const diff = prev ? last.weight - prev.weight : 0;
    const delta = !prev ? '<span class="delta">First session</span>'
      : diff === 0 ? '<span class="delta">Same load</span>'
      : `<span class="delta ${diff > 0 ? 'delta-up' : 'delta-down'}">${diff > 0 ? '+' : '−'}${fmtWeight(Math.abs(diff), 1)} ${unit()}</span>`;
    return `<li class="strength-row"><div class="strength-name"><b>${esc(item.name)}</b><small>${item.sessions.length} session${item.sessions.length === 1 ? '' : 's'} · last ${dateLabel(last.date, { month: 'short', day: 'numeric' })}</small></div>
      <div class="strength-best"><span class="num">${fmtWeight(last.weight, 1)}</span> ${unit()}${last.reps ? ` × <span class="num">${last.reps}</span>` : ''}</div>${delta}</li>`;
  }).join('')}</ul>`;
}

/* ==========================================================================
   Rest timer
   ========================================================================== */

const timer = { total: state.preferences.restSeconds, remaining: state.preferences.restSeconds, running: false, finished: false, endAt: 0, tick: null };
const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function renderTimer() {
  const secs = Math.ceil(timer.remaining - 0.0001);
  setText('timer-display', mmss(Math.max(0, secs)));
  $('timer-ring').style.setProperty('--p', clamp(timer.total > 0 ? timer.remaining / timer.total : 0, 0, 1).toFixed(4));
  $('timer-ring-wrap').classList.toggle('is-running', timer.running);
  $('timer-ring-wrap').classList.toggle('is-done', timer.finished);
  const paused = !timer.running && !timer.finished && timer.remaining < timer.total;
  setText('timer-state', timer.finished ? 'Done' : timer.running ? 'Resting' : paused ? 'Paused' : 'Ready');
  setText('timer-start-label', timer.running ? 'Pause' : paused ? 'Resume' : timer.finished ? 'Restart' : 'Start');
  const use = $('timer-start').querySelector('use'); if (use) use.setAttribute('href', timer.running ? '#i-pause' : '#i-play');
  $$('[data-timer]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.timer) === timer.total)));
  $('timer-auto').checked = Boolean(state.preferences.autoRest);
  $('timer-display').setAttribute('aria-label', `${mmss(Math.max(0, secs))} remaining`);
}

function timerStart() {
  if (timer.running) { timerPause(); return; }
  if (timer.remaining <= 0) timer.remaining = timer.total;
  timer.finished = false; timer.running = true;
  timer.endAt = Date.now() + timer.remaining * 1000;
  clearInterval(timer.tick);
  timer.tick = setInterval(() => {
    timer.remaining = Math.max(0, (timer.endAt - Date.now()) / 1000);
    if (timer.remaining <= 0) timerFinish(); else renderTimer();
  }, 200);
  renderTimer();
}
function timerPause() {
  clearInterval(timer.tick); timer.running = false;
  timer.remaining = Math.max(0, (timer.endAt - Date.now()) / 1000);
  renderTimer();
}
function timerReset() {
  clearInterval(timer.tick); timer.running = false; timer.finished = false; timer.remaining = timer.total;
  renderTimer();
}
function timerFinish() {
  clearInterval(timer.tick); timer.running = false; timer.finished = true; timer.remaining = 0;
  renderTimer(); playBeep();
  if (navigator.vibrate) { try { navigator.vibrate([180, 90, 180]); } catch (e) { /* optional */ } }
  showToast('Rest is over. Ready for the next set.', 'info');
}
function timerSetPreset(secs) {
  clearInterval(timer.tick); timer.running = false; timer.finished = false;
  timer.total = secs; timer.remaining = secs;
  state.preferences.restSeconds = secs; saveState();
  renderTimer();
}

/* ==========================================================================
   Nutrition
   ========================================================================== */

function foodRowHtml(e) {
  const detail = `P ${fmt(safeNumber(e.protein), 1)} g · C ${fmt(safeNumber(e.carbs), 1)} g · F ${fmt(safeNumber(e.fat), 1)} g`;
  return `<li class="log-row"><div class="log-copy"><b>${esc(e.name)}</b><small>${detail}</small></div>
    <span class="log-kcal"><span class="num">${fmt(safeNumber(e.calories))}</span> kcal</span>
    <button class="icon-button icon-button-sm" type="button" data-act="food-del" data-id="${esc(e.id)}" aria-label="Remove ${esc(e.name)} from the log">${icon('trash')}</button></li>`;
}

function renderFoodLog(entries) {
  setText('food-log-count', `${entries.length} ${entries.length === 1 ? 'item' : 'items'}`);
  const host = $('food-log-list');
  if (!entries.length) {
    host.innerHTML = emptyState({ art: 'food', title: 'Nothing logged yet', text: 'Search a food or add your own meal. Totals update as you go.' });
    return;
  }
  const groups = MEAL_SLOTS.concat(['Other']).map(slot => ({
    slot, items: entries.filter(e => (MEAL_SLOTS.includes(e.type) ? e.type : 'Other') === slot)
  })).filter(g => g.items.length);
  host.innerHTML = groups.map(g => `<section class="log-group"><h3 class="log-group-head"><span>${g.slot}</span><span><span class="num">${fmt(g.items.reduce((a, e) => a + safeNumber(e.calories), 0))}</span> kcal</span></h3>
    <ul class="log-list">${g.items.map(foodRowHtml).join('')}</ul></section>`).join('');
}

function renderFoodChips() {
  const host = $('food-category-filter');
  const cats = [['all', 'All'], ['favorites', 'Starred']].concat(FOOD_CATEGORIES.map(c => [c, c]));
  if (host.children.length !== cats.length) {
    host.innerHTML = cats.map(([v, label], i) => `<button class="chip" type="button" id="food-chip-${i}" data-act="food-cat" data-cat="${esc(v)}" aria-pressed="false">${v === 'favorites' ? icon('star') : ''}${esc(label)}</button>`).join('');
  }
  Array.from(host.children).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === ui.foodCat)));
}

function renderFoodResults() {
  const q = ui.foodQuery.trim().toLowerCase(), favs = state.favorites;
  const rows = FOOD_DATABASE.map((f, i) => ({ f, i })).filter(({ f }) => {
    if (q && !f.name.toLowerCase().includes(q)) return false;
    if (ui.foodCat === 'favorites') return favs.includes(f.name);
    return ui.foodCat === 'all' || f.category === ui.foodCat;
  }).sort((a, b) => (favs.includes(b.f.name) ? 1 : 0) - (favs.includes(a.f.name) ? 1 : 0) || a.i - b.i);
  const host = $('food-database-results');
  if (!rows.length) {
    host.innerHTML = emptyState({ art: 'food',
      title: ui.foodCat === 'favorites' && !q ? 'No starred foods yet' : q ? `No foods match “${q}”` : 'No foods in this category',
      text: ui.foodCat === 'favorites' && !q ? 'Tap the star beside a food to keep it here.' : 'Try another word, or add it as a custom entry.',
      action: '<button class="button button-outline button-sm" type="button" data-act="open-custom">Add a custom entry</button>' });
    return;
  }
  host.innerHTML = `<ul class="food-list">${rows.map(({ f, i }) => {
    const fav = favs.includes(f.name);
    return `<li class="food-item"><button class="star-btn${fav ? ' is-starred' : ''}" type="button" data-act="food-fav" data-name="${esc(f.name)}" aria-pressed="${fav}" aria-label="Star ${esc(f.name)}">${icon('star')}</button>
      <div class="food-copy"><b>${esc(f.name)}</b><small>${esc(f.serving)} · <span class="num">${f.calories}</span> kcal · P ${f.protein} g · C ${f.carbs} g · F ${f.fat} g</small></div>
      <button class="button button-outline button-sm" type="button" data-act="food-add" data-i="${i}" aria-label="Add ${esc(f.name)} to the log">${icon('plus')}Add</button></li>`;
  }).join('')}</ul>`;
}

/* ---------- meal planner + grocery list ---------- */
function plannerDay() { return ui.mealDay === null ? selectedDayIndex : ui.mealDay; }

function renderMealPlanner() {
  const day = plannerDay(), slots = effectiveMealPlan()[day];
  renderWeekStrip('meal-week-strip', { onlyDay: true });
  const meals = MEAL_SLOTS.map(s => mealById(slots[s])).filter(Boolean);
  const kcal = meals.reduce((a, m) => a + m.calories, 0), prot = meals.reduce((a, m) => a + m.protein, 0);
  setText('meal-plan-summary', meals.length ? `${DAY_NAMES[day]} · ${fmt(kcal)} kcal and ${fmt(prot)} g protein planned` : `${DAY_NAMES[day]} · no meals planned yet`);
  $('meal-planner-grid').innerHTML = MEAL_SLOTS.map(slot => {
    const cur = slots[slot], meal = mealById(cur);
    const options = MEAL_LIBRARY.filter(m => m.slot === slot).map(m => `<option value="${m.id}"${m.id === cur ? ' selected' : ''}>${esc(m.name)}</option>`).join('');
    const logged = meal && getFoodEntries().some(e => e.planId === meal.id && e.type === slot);
    return `<article class="planner-card"><div class="planner-head"><span class="meal-slot">${slot}</span></div>
      <label class="sr-only" for="plan-${slot}">${slot} meal for ${DAY_NAMES[day]}</label>
      <select id="plan-${slot}" data-act="plan-select" data-day="${day}" data-slot="${slot}"><option value="">None</option>${options}</select>
      ${meal ? `<p class="planner-macros"><span class="num">${meal.calories}</span> kcal · P <span class="num">${meal.protein}</span> · C <span class="num">${meal.carbs}</span> · F <span class="num">${meal.fat}</span></p>
        <p class="planner-ings">${esc(meal.ingredients.map(([k]) => INGREDIENTS[k][0]).join(', '))}</p>
        ${logged ? `<span class="tag tag-ok">${icon('check')}Logged for ${esc(dateLabel(selectedDate, { month: 'short', day: 'numeric' }))}</span>`
          : `<button class="button button-outline button-sm" type="button" data-act="log-meal" data-meal="${meal.id}" data-slot="${slot}">${icon('plus')}Log for ${esc(dateLabel(selectedDate, { month: 'short', day: 'numeric' }))}</button>`}`
        : '<p class="planner-empty">No meal planned for this slot.</p>'}</article>`;
  }).join('');
}

function groceryItems() {
  const map = new Map();
  effectiveMealPlan().forEach(day => MEAL_SLOTS.forEach(slot => {
    const m = mealById(day[slot]); if (!m) return;
    m.ingredients.forEach(([k, q, u]) => {
      const key = `${k}|${u}`, cur = map.get(key) || { key, ing: k, unit: u, qty: 0, meals: 0 };
      cur.qty += q; cur.meals += 1; map.set(key, cur);
    });
  }));
  return Array.from(map.values()).map(it => ({ ...it, name: INGREDIENTS[it.ing][0], aisle: INGREDIENTS[it.ing][1] }))
    .sort((a, b) => GROCERY_AISLES.indexOf(a.aisle) - GROCERY_AISLES.indexOf(b.aisle) || a.name.localeCompare(b.name));
}
const UNIT_LABELS = { g: ['g', 'g'], pc: ['pc', 'pcs'], can: ['can', 'cans'], tbsp: ['tbsp', 'tbsp'], tsp: ['tsp', 'tsp'], clove: ['clove', 'cloves'], slice: ['slice', 'slices'] };
function qtyLabel(q, u) {
  if (u === 'g') return q >= 1000 ? `${fmt(q / 1000, 2)} kg` : `${fmt(Math.round(q))} g`;
  const n = ['pc', 'can', 'clove', 'slice'].includes(u) ? Math.ceil(q - 1e-9) : Math.round(q * 10) / 10;
  return `${fmt(n, 1)} ${UNIT_LABELS[u][n === 1 ? 0 : 1]}`;
}

function renderGrocery() {
  const items = groceryItems(), checked = items.filter(i => state.groceryChecked[i.key]).length;
  setText('grocery-count', `${checked} of ${items.length} done`);
  $('grocery-uncheck').disabled = checked === 0;
  const host = $('grocery-list');
  if (!items.length) { host.innerHTML = emptyState({ art: 'food', title: 'Your list is empty', text: 'Plan at least one meal above and its ingredients will appear here.' }); return; }
  let idx = 0;
  host.innerHTML = GROCERY_AISLES.map(aisle => {
    const rows = items.filter(i => i.aisle === aisle); if (!rows.length) return '';
    return `<section class="grocery-group"><h3 class="grocery-aisle"><span>${aisle}</span><span class="num">${rows.length}</span></h3><ul class="grocery-rows">${rows.map(it => {
      const on = Boolean(state.groceryChecked[it.key]), id = `gro-${idx++}`;
      return `<li class="grocery-row${on ? ' is-checked' : ''}"><label class="check-row check-row-sm${on ? ' is-checked' : ''}" for="${id}">
        <input type="checkbox" id="${id}" data-act="grocery" data-key="${esc(it.key)}"${on ? ' checked' : ''}>
        <span class="check-box" aria-hidden="true">${icon('check')}</span>
        <span class="check-copy"><b>${esc(it.name)}</b><small>Used in ${it.meals} meal${it.meals === 1 ? '' : 's'}</small></span></label>
        <span class="grocery-qty num">${esc(qtyLabel(it.qty, it.unit))}</span></li>`;
    }).join('')}</ul></section>`;
  }).join('');
}

function renderNutrition() {
  const t = getFoodTotals(), g = state.goals, entries = getFoodEntries(), left = g.calories - t.calories;
  setText('nutrition-date-label', dateLabel(selectedDate, { weekday: 'long', month: 'short', day: 'numeric' }));
  setNum('nutrition-calorie-total', t.calories); setNum('nutrition-calorie-goal', g.calories);
  setText('nutrition-calorie-note', left >= 0 ? `${fmt(left)} left` : `${fmt(-left)} over`);
  setBar('nutrition-calorie-progress', t.calories, g.calories);
  setNum('nutrition-protein-total', t.protein, 1); setNum('nutrition-protein-goal', g.protein); setBar('nutrition-protein-progress', t.protein, g.protein);
  setNum('carbs-total', t.carbs, 1); setNum('carbs-goal', g.carbs); setBar('carbs-progress', t.carbs, g.carbs);
  setNum('fat-total', t.fat, 1); setNum('fat-goal', g.fat); setBar('fat-progress', t.fat, g.fat);

  const ml = getWater(), goalMl = g.water * 1000, toGo = Math.max(0, goalMl - ml) / 1000;
  setNum('nutrition-water-total', ml / 1000, 1, true); setNum('nutrition-water-goal', g.water, 1, true);
  setText('nutrition-water-note', toGo > 0 ? `${toGo.toFixed(1)} L to go` : 'Goal reached');
  setBar('nutrition-water-progress', ml, goalMl); setBar('water-bottle-fill', ml, goalMl);
  $('remove-water').disabled = ml <= 0;

  renderFoodLog(entries);
  renderFoodChips();
  renderFoodResults();
  renderMealPlanner();
  renderGrocery();
}

function exportGrocery() {
  const items = groceryItems();
  if (!items.length) { showToast('Plan a meal first so there is something to export.', 'info'); return; }
  const lines = ['FORM grocery list', `Built from your weekly meal plan · ${dateLabel(todayKey(), { year: 'numeric', month: 'long', day: 'numeric' })}`, ''];
  GROCERY_AISLES.forEach(aisle => {
    const rows = items.filter(i => i.aisle === aisle); if (!rows.length) return;
    lines.push(aisle.toUpperCase());
    rows.forEach(it => lines.push(`[${state.groceryChecked[it.key] ? 'x' : ' '}] ${it.name} — ${qtyLabel(it.qty, it.unit)}`));
    lines.push('');
  });
  downloadFile(`form-grocery-list-${todayKey()}.txt`, lines.join('\n'), 'text/plain;charset=utf-8');
  showToast('Grocery list exported');
}

/* ==========================================================================
   Progress
   ========================================================================== */

function renderProgress() {
  const keys = sortedWeightKeys(), latest = keys[keys.length - 1], first = keys[0], u = unit();
  if (latest) setNum('progress-latest-weight', displayWeight(state.weights[latest]), 1, true); else setText('progress-latest-weight', '—');
  setText('progress-weight-unit', u); setText('weight-change-unit', u); setText('weight-average-unit', u);
  setText('progress-weight-caption', latest ? `Logged ${dateLabel(latest)}` : 'Add your first check-in.');
  if (keys.length > 1) {
    const change = displayWeight(state.weights[latest]) - displayWeight(state.weights[first]);
    setText('weight-total-change', `${change > 0 ? '+' : change < 0 ? '−' : ''}${fmt(Math.abs(change), 1)}`);
    setText('weight-change-caption', `Since ${dateLabel(first, { month: 'short', day: 'numeric' })}`);
  } else { setText('weight-total-change', '—'); setText('weight-change-caption', 'Needs two check-ins.'); }
  const from = addDays(todayKey(), -6), recent = keys.filter(k => k >= from && k <= todayKey());
  if (recent.length) {
    setText('weight-average', fmt(displayWeight(recent.reduce((a, k) => a + Number(state.weights[k]), 0) / recent.length), 1));
    setText('weight-average-caption', `${recent.length} check-in${recent.length === 1 ? '' : 's'} this week`);
  } else { setText('weight-average', '—'); setText('weight-average-caption', 'No entries in the last 7 days.'); }
  const doneWorkouts = Object.values(state.workouts).filter(w => isObj(w) && w.completed).length;
  setNum('workout-total-count', doneWorkouts); setText('workout-total-noun', doneWorkouts === 1 ? 'session' : 'sessions');

  setText('weight-input-unit', u);
  const existing = state.weights[selectedDate];
  setText('weight-input-date', selectedDate === todayKey() ? 'today' : dateLabel(selectedDate, { month: 'short', day: 'numeric' }));
  $('weight-input').placeholder = existing ? `Currently ${inputWeight(existing)}` : (u === 'lb' ? 'e.g. 145.0' : 'e.g. 66.0');
  $('weight-form').querySelector('button[type="submit"]').textContent = existing ? 'Update weight' : 'Save weight';

  renderWeightHistory(keys);
  renderWeightChart(true);
  renderMeasurements();
  renderPhotos();
  $('progress-strength-history').innerHTML = strengthListHtml('progress');
}

function renderWeightHistory(keys) {
  setText('weight-log-count', `${keys.length} ${keys.length === 1 ? 'entry' : 'entries'}`);
  const host = $('weight-history-list');
  if (!keys.length) { host.innerHTML = emptyState({ art: 'chart', title: 'No check-ins yet', text: 'Your weigh-ins are listed here, newest first.' }); return; }
  host.innerHTML = `<ul class="history-list">${keys.slice().reverse().map(k => {
    const i = keys.indexOf(k), prev = i > 0 ? displayWeight(state.weights[keys[i - 1]]) : null, diff = prev === null ? null : displayWeight(state.weights[k]) - prev;
    const d = diff === null ? '' : Math.abs(diff) < 0.05 ? '<span class="delta">no change</span>' : `<span class="delta ${diff > 0 ? 'delta-up-neutral' : 'delta-down-neutral'}">${diff > 0 ? '+' : '−'}${fmt(Math.abs(diff), 1)}</span>`;
    return `<li class="history-row"><span class="history-date">${esc(dateLabel(k, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }))}</span>
      <b class="history-value"><span class="num">${fmtWeight(state.weights[k], 1)}</span> ${unit()}</b>${d}
      <button class="icon-button icon-button-sm" type="button" data-act="weight-del" data-date="${k}" aria-label="Delete the weight entry for ${esc(dateLabel(k))}">${icon('trash')}</button></li>`;
  }).join('')}</ul>`;
}

/* ---------- weight chart: time-scaled, nice ticks, tooltip, keyboard ---------- */
function niceTicks(min, max, target = 4) {
  if (min === max) { min -= 1; max += 1; }
  const raw = (max - min) / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const lo = Math.floor(min / step + 1e-9) * step, hi = Math.ceil(max / step - 1e-9) * step, ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v / step) * step);
  return { ticks, lo, hi };
}

let chartModel = null, chartActive = -1;

function renderWeightChart(animate) {
  const host = $('weight-chart'); if (!host) return;
  $$('#weight-range .seg-btn').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.range) === ui.range)));
  host.setAttribute('role', 'group');
  let keys = sortedWeightKeys();
  const total = keys.length;
  if (ui.range > 0) { const from = addDays(todayKey(), -(ui.range - 1)); keys = keys.filter(k => k >= from); }
  chartModel = null; chartActive = -1;
  if (!total) {
    setText('weight-chart-sub', 'Daily fluctuations are normal.');
    host.innerHTML = emptyState({ art: 'chart', title: 'No weigh-ins yet', text: 'Log your first weight and your trend will appear here.',
      action: '<button class="button button-outline button-sm" type="button" data-go-page="progress" data-focus="weight-input">Log weight</button>' });
    return;
  }
  if (!keys.length) {
    setText('weight-chart-sub', 'Nothing logged in this range.');
    host.innerHTML = emptyState({ art: 'chart', title: `No check-ins in the last ${ui.range} days`, text: 'Choose a longer range to see earlier entries.' });
    return;
  }
  const W = Math.max(280, host.clientWidth || 640), H = W < 480 ? 220 : 260, m = { l: 46, r: 18, t: 16, b: 30 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const vals = keys.map(k => displayWeight(state.weights[k]));
  const vmin = Math.min(...vals), vmax = Math.max(...vals), padV = Math.max((vmax - vmin) * 0.12, 0.4);
  const { ticks, lo, hi } = niceTicks(vmin - padV, vmax + padV, W < 480 ? 3 : 4);
  const t0 = parseLocalDate(keys[0]).getTime(), t1 = parseLocalDate(keys[keys.length - 1]).getTime(), span = t1 - t0;
  const X = k => m.l + (span > 0 ? (parseLocalDate(k).getTime() - t0) / span * pw : pw / 2);
  const Y = v => m.t + ph - (v - lo) / (hi - lo || 1) * ph;
  const pts = keys.map((k, i) => ({ k, v: vals[i], x: X(k), y: Y(vals[i]) }));
  chartModel = { pts, W, H, m, pw, ph };
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)} ${m.t + ph} L${pts[0].x.toFixed(1)} ${m.t + ph} Z`;
  const xCount = Math.max(2, Math.min(6, Math.floor(pw / 92))), xl = [];
  for (let i = 0; i < xCount && span > 0; i++) { const tt = t0 + span * (i / (xCount - 1)); xl.push({ x: m.l + pw * (i / (xCount - 1)), label: new Date(tt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }); }
  if (span === 0) xl.push({ x: m.l + pw / 2, label: dateLabel(keys[0], { month: 'short', day: 'numeric' }) });
  const sum = `Weight from ${fmt(vals[0], 1)} ${unit()} on ${dateLabel(keys[0], { month: 'short', day: 'numeric' })} to ${fmt(vals[vals.length - 1], 1)} ${unit()} on ${dateLabel(keys[keys.length - 1], { month: 'short', day: 'numeric' })}`;
  setText('weight-chart-sub', keys.length === 1 ? 'Add another check-in to see a trend.' : `${keys.length} check-ins · ${dateLabel(keys[0], { month: 'short', day: 'numeric' })} to ${dateLabel(keys[keys.length - 1], { month: 'short', day: 'numeric' })}`);
  host.innerHTML = `<svg class="chart-svg${animate ? ' chart-enter' : ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(sum)}">
    <g class="chart-grid">${ticks.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/>`).join('')}</g>
    <g class="chart-axis chart-y">${ticks.map(v => `<text x="${m.l - 10}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${fmt(v, 1)}</text>`).join('')}</g>
    <g class="chart-axis chart-x">${xl.map((l, i) => `<text x="${l.x.toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 && xl.length > 1 ? 'start' : i === xl.length - 1 && xl.length > 1 ? 'end' : 'middle'}">${l.label}</text>`).join('')}</g>
    <g class="chart-plot">${pts.length > 1 ? `<path class="chart-area" d="${area}"/><path class="chart-line" d="${line}"/>` : ''}
      <g class="chart-dots">${pts.map((p, i) => `<circle class="chart-dot${i === pts.length - 1 ? ' is-last' : ''}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${pts.length > 40 ? 2.5 : 4}" style="--d:${Math.min(i * 18, 600)}ms"/>`).join('')}</g></g>
    <line class="chart-cursor" x1="0" x2="0" y1="${m.t}" y2="${m.t + ph}" opacity="0"/>
    <rect class="chart-hit" x="${m.l}" y="${m.t}" width="${pw}" height="${ph}" fill="transparent"/></svg>
    <div class="chart-tip" role="presentation" hidden></div><p class="sr-only" id="weight-chart-live" aria-live="polite"></p>`;
}

function chartShow(i, { speak = false } = {}) {
  const host = $('weight-chart'), M = chartModel; if (!M || !host) return;
  i = clamp(i, 0, M.pts.length - 1); chartActive = i;
  const p = M.pts[i], tip = host.querySelector('.chart-tip'), cursor = host.querySelector('.chart-cursor');
  const prev = M.pts[i - 1], diff = prev ? p.v - prev.v : null;
  tip.hidden = false;
  tip.innerHTML = `<b class="num">${fmt(p.v, 1)} ${unit()}</b><span>${esc(dateLabel(p.k, { weekday: 'short', month: 'short', day: 'numeric' }))}</span>${diff === null ? '' : `<span class="tip-delta">${Math.abs(diff) < 0.05 ? 'No change' : `${diff > 0 ? '+' : '−'}${fmt(Math.abs(diff), 1)} ${unit()} since previous`}</span>`}`;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  const tx = clamp(p.x - w / 2, 4, M.W - w - 4), ty = p.y - h - 14 < 0 ? p.y + 14 : p.y - h - 14;
  tip.style.transform = `translate(${tx.toFixed(0)}px, ${ty.toFixed(0)}px)`;
  cursor.setAttribute('x1', p.x); cursor.setAttribute('x2', p.x); cursor.setAttribute('opacity', '1');
  $$('.chart-dot', host).forEach((d, n) => d.classList.toggle('is-active', n === i));
  if (speak) setText('weight-chart-live', `${dateLabel(p.k, { weekday: 'long', month: 'long', day: 'numeric' })}: ${fmt(p.v, 1)} ${unit()}`);
}
function chartHide() {
  const host = $('weight-chart'); if (!host || !chartModel) return;
  const tip = host.querySelector('.chart-tip'), cursor = host.querySelector('.chart-cursor');
  if (tip) tip.hidden = true; if (cursor) cursor.setAttribute('opacity', '0');
  $$('.chart-dot.is-active', host).forEach(d => d.classList.remove('is-active')); chartActive = -1;
}
function initChart() {
  const host = $('weight-chart');
  const nearest = e => {
    const r = host.querySelector('.chart-svg').getBoundingClientRect(), x = (e.clientX - r.left) * (chartModel.W / r.width);
    let best = 0, d = Infinity; chartModel.pts.forEach((p, i) => { const dd = Math.abs(p.x - x); if (dd < d) { d = dd; best = i; } }); return best;
  };
  host.addEventListener('pointermove', e => { if (chartModel && e.target.closest('.chart-hit')) chartShow(nearest(e)); });
  host.addEventListener('pointerdown', e => { if (chartModel && e.target.closest('.chart-hit')) chartShow(nearest(e)); });
  host.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && document.activeElement !== host) chartHide(); });
  host.addEventListener('blur', chartHide);
  host.addEventListener('keydown', e => {
    if (!chartModel) return;
    const n = chartModel.pts.length, i = chartActive < 0 ? n - 1 : chartActive;
    if (e.key === 'ArrowLeft') { e.preventDefault(); chartShow(chartActive < 0 ? n - 1 : i - 1, { speak: true }); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); chartShow(chartActive < 0 ? n - 1 : i + 1, { speak: true }); }
    else if (e.key === 'Home') { e.preventDefault(); chartShow(0, { speak: true }); }
    else if (e.key === 'End') { e.preventDefault(); chartShow(n - 1, { speak: true }); }
    else if (e.key === 'Escape') chartHide();
  });
  let lastW = 0;
  if (window.ResizeObserver) new ResizeObserver(() => {
    const w = host.clientWidth; if (!w || Math.abs(w - lastW) < 2) return; const first = lastW === 0; lastW = w;
    if (!first && currentPage === 'progress') renderWeightChart(false);
  }).observe(host);
}

/* ---------- measurements + photos ---------- */
const MEASURES = [['waist', 'Waist'], ['chest', 'Chest'], ['arm', 'Upper arm'], ['thigh', 'Thigh']];
function renderMeasurements() {
  const keys = Object.keys(state.measurements).filter(k => isDateKey(k) && isObj(state.measurements[k])).sort();
  const host = $('measurement-history');
  if (!keys.length) { host.innerHTML = `<p class="muted-note">No measurements saved yet. Add one or more values above.</p>`; return; }
  host.innerHTML = `<ul class="history-list">${keys.slice().reverse().slice(0, 8).map(k => {
    const idx = keys.indexOf(k), rec = state.measurements[k];
    const cells = MEASURES.filter(([id]) => Number.isFinite(Number(rec[id])) && rec[id] !== '').map(([id, label]) => {
      let prev = null; for (let j = idx - 1; j >= 0 && prev === null; j--) { const v = state.measurements[keys[j]][id]; if (Number.isFinite(Number(v)) && v !== '' && v != null) prev = Number(v); }
      const diff = prev === null ? '' : Number(rec[id]) - prev, d = diff === '' || Math.abs(diff) < 0.05 ? '' : ` <i class="meas-delta">${diff > 0 ? '+' : '−'}${fmt(Math.abs(diff), 1)}</i>`;
      return `<span class="meas-cell"><small>${label}</small><b><span class="num">${fmt(Number(rec[id]), 1)}</span> cm${d}</b></span>`;
    }).join('');
    return `<li class="history-row history-row-wrap"><span class="history-date">${esc(dateLabel(k, { month: 'short', day: 'numeric', year: 'numeric' }))}</span><div class="meas-cells">${cells || '<small>No values</small>'}</div>
      <button class="icon-button icon-button-sm" type="button" data-act="measure-del" data-date="${k}" aria-label="Delete measurements from ${esc(dateLabel(k))}">${icon('trash')}</button></li>`;
  }).join('')}</ul>`;
}

/* Any image data URL the original app could have stored (it accepted image/*). Only ever used as an <img> source, so nothing in it can run. */
const SAFE_IMG = /^data:image\/[a-z0-9.+-]{1,40};base64,[A-Za-z0-9+/=]+$/i;
function renderPhotos() {
  const host = $('photo-gallery'), photos = state.photos.filter(p => isObj(p) && SAFE_IMG.test(String(p.dataUrl)));
  if (!photos.length) {
    host.innerHTML = emptyState({ art: 'photo', title: 'No progress photos yet', text: 'Add one to compare how you look over time. Photos never leave this browser.' });
    return;
  }
  host.innerHTML = photos.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).map(p =>
    `<button class="photo-card" type="button" data-act="photo-open" data-id="${esc(p.id)}" aria-label="Open photo${p.title ? `: ${esc(p.title)}` : ''}, ${esc(dateLabel(p.date, { month: 'short', day: 'numeric', year: 'numeric' }))}">
      <img src="${p.dataUrl}" alt="" loading="lazy" decoding="async"><span class="photo-meta"><b>${esc(p.title || 'Progress photo')}</b><small>${esc(dateLabel(p.date, { month: 'short', day: 'numeric', year: 'numeric' }))}</small></span></button>`).join('');
}

/* Downscale before saving so a few photos do not fill the 5 MB localStorage budget. */
function shrinkImage(file, maxSide = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as an image.')); };
    img.src = url;
  });
}

/* ==========================================================================
   Habits & recovery
   ========================================================================== */

const ENERGY_LABELS = ['', 'Very low', 'Low', 'Okay', 'Good', 'Great'];
const SORENESS_LABELS = ['None', 'Mild', 'Moderate', 'High'];
let recoveryFormDate = null;

function renderHabits() {
  const rec = getHabit(), n = habitCount(), ml = getWater();
  setText('habit-date-label', dateLabel(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' }));
  setNum('habit-done-count', n); setBar('habit-progress-fill', n, HABITS.length);
  setText('habit-progress-note', n === HABITS.length ? 'All five done. Nice work.' : `${HABITS.length - n} left for this day.`);
  const hasSleep = rec.sleepHours !== '' && Number.isFinite(Number(rec.sleepHours));
  if (hasSleep) setNum('sleep-summary', Number(rec.sleepHours), 2); else setText('sleep-summary', '—');
  setText('sleep-note', !hasSleep ? 'Log last night below.' : Number(rec.sleepHours) >= 7 ? 'A solid night.' : 'Under 7 hours. Go easy if you can.');
  setNum('habit-water-summary', ml / 1000, 1, true);
  setText('habit-water-note', state.goals.water > 0 ? `${Math.round(clamp(ml / (state.goals.water * 1000), 0, 9.99) * 100)}% of your ${state.goals.water} L goal` : 'Daily hydration level.');
  setText('habit-checklist-count', `${n} / ${HABITS.length}`);
  $('habit-checklist').innerHTML = HABITS.map(h => checkRowHtml(h, Boolean(rec.checks[h.id]), 'habit')).join('');

  /* Recovery form: prefill once per date so typing is never overwritten by a repaint */
  setText('recovery-sub', `How are you feeling on ${dateLabel(selectedDate, { weekday: 'short', month: 'short', day: 'numeric' })}?`);
  if (recoveryFormDate !== selectedDate) {
    recoveryFormDate = selectedDate;
    $('sleep-hours').value = hasSleep ? String(rec.sleepHours) : '';
    $$('input[name="energy"]').forEach(r => { r.checked = String(rec.energy) === r.value; });
    $$('input[name="soreness"]').forEach(r => { r.checked = String(rec.soreness) === r.value; });
    $('recovery-notes').value = rec.notes || '';
    updateNotesCount();
    clearFieldErrors($('recovery-form'));
  }

  const keys = weekDateKeys(selectedDate), today = todayKey();
  if (!$('habit-week-bars')) $('habit-week-chart').innerHTML = '<div class="week-bars" id="habit-week-bars"></div>';
  patchBars($('habit-week-bars'), keys.map((k, i) => {
    const s = dayScore(k);
    return { key: k, label: DAY_SHORT[i], value: s / HABITS.length, pct: `${s}/${HABITS.length}`, selected: k === selectedDate, today: k === today, aria: `${DAY_NAMES[i]}: ${s} of ${HABITS.length} daily basics done` };
  }));

  const logged = Object.keys(state.habits).filter(isDateKey).filter(k => { const h = getHabit(k); return h.sleepHours !== '' || h.energy !== '' || h.soreness !== '' || h.notes; }).sort().reverse().slice(0, 7);
  $('recovery-history').innerHTML = !logged.length
    ? emptyState({ art: 'rest', title: 'No recovery check-ins yet', text: 'Log sleep, energy and soreness above to build your recovery log.' })
    : `<ul class="history-list">${logged.map(k => {
      const h = getHabit(k), chips = [];
      if (h.sleepHours !== '' && Number.isFinite(Number(h.sleepHours))) chips.push(`<span class="chip-static">Sleep <b class="num">${fmt(Number(h.sleepHours), 2)}</b> h</span>`);
      if (h.energy !== '' && ENERGY_LABELS[Number(h.energy)]) chips.push(`<span class="chip-static">Energy <b>${h.energy}/5</b> ${ENERGY_LABELS[Number(h.energy)]}</span>`);
      if (h.soreness !== '' && SORENESS_LABELS[Number(h.soreness)]) chips.push(`<span class="chip-static">Soreness <b>${h.soreness}/3</b> ${SORENESS_LABELS[Number(h.soreness)]}</span>`);
      return `<li class="history-row history-row-wrap"><span class="history-date">${esc(dateLabel(k, { weekday: 'short', month: 'short', day: 'numeric' }))}</span>
        <div class="recovery-cells">${chips.join('')}${h.notes ? `<p class="recovery-note">${esc(h.notes)}</p>` : ''}</div>
        <button class="text-link" type="button" data-act="day-pick" data-date="${k}" aria-label="Edit the check-in for ${esc(dateLabel(k))}">${k === selectedDate ? 'Selected' : 'Edit'}</button></li>`;
    }).join('')}</ul>`;
}
function updateNotesCount() { setText('recovery-notes-count', `${$('recovery-notes').value.length} / 600`); }

/* ==========================================================================
   Settings
   ========================================================================== */

let editorDay = null;
const dirtyForms = new Set();

function fillPlanEditor(day) {
  editorDay = day;
  const p = planForDay(day);
  $('edit-workout-day').value = String(day);
  $('edit-workout-type').value = cap(p.type);
  $('edit-workout-duration').value = p.duration || '';
  $('edit-workout-description').value = p.description || '';
  $('edit-workout-exercises').value = p.exercises.map(exerciseToLine).join('\n');
  fieldError($('edit-workout-exercises'), '');
  const err = $('edit-workout-error'); err.hidden = true; err.textContent = '';
  dirtyForms.delete('workout-editor-form');
}

function exerciseToLine(ex) {
  const parts = [ex.name, String(ex.dose || `${setsOf(ex)} sets`).replace(/\s*×\s*/g, ' x '), ex.note || '', ex.alt || ''];
  while (parts.length > 2 && !parts[parts.length - 1]) parts.pop();
  return parts.join(' | ');
}

function parseExercises(text) {
  const exercises = [], errors = [];
  text.split('\n').map(l => l.trim()).filter(Boolean).forEach((line, i) => {
    const [name, dose, note, alt] = line.split('|').map(s => s.trim());
    if (!name) { errors.push(`Line ${i + 1}: start with the exercise name.`); return; }
    if (!dose) { errors.push(`Line ${i + 1}: add the sets after the name, for example “${name} | 3 sets x 8–12”.`); return; }
    const m = dose.match(/(\d+)\s*sets?/i);
    const sets = m ? clamp(parseInt(m[1], 10), 1, 12) : /^\d+$/.test(dose) ? clamp(parseInt(dose, 10), 1, 12) : 1;
    const r = dose.match(/[x×]\s*(.+)$/i);
    const reps = (r ? r[1] : m ? '' : dose).replace(/\s*reps?\s*$/i, '').trim();
    const ex = { name, dose: dose.replace(/(\d)\s*[xX]\s*(\d)/g, '$1 × $2').replace(/\s+[xX]\s+/g, ' × '), sets, reps, note: note || '' };
    if (alt) ex.alt = alt;
    exercises.push(ex);
  });
  if (exercises.length > 20) errors.push('Keep each day to 20 exercises or fewer.');
  return { exercises, errors };
}

function renderSettings() {
  const g = state.goals;
  if (!dirtyForms.has('targets-form')) {
    $('target-calories').value = g.calories; $('target-protein').value = g.protein; $('target-carbs').value = g.carbs; $('target-fat').value = g.fat; $('target-water').value = g.water;
  }
  $$('input[name="theme"]').forEach(r => { r.checked = r.value === state.preferences.theme; });
  $$('input[name="weight-unit"]').forEach(r => { r.checked = r.value === unit(); });
  if (editorDay === null || !dirtyForms.has('workout-editor-form')) { if (editorDay === null) editorDay = selectedDayIndex; if (!dirtyForms.has('workout-editor-form')) fillPlanEditor(editorDay); }
  const size = b => b < 1024 * 1024 ? `${fmt(b / 1024, 1)} KB` : `${fmt(b / 1048576, 2)} MB`;
  const copies = safetyCopies();
  const copyBytes = copies.reduce((n, c) => { try { return n + (localStorage.getItem(c.key) || '').length; } catch (e) { return n; } }, 0);
  const bytes = JSON.stringify(state).length + copyBytes;
  setText('storage-usage', `About ${size(bytes)} stored in this browser${copyBytes ? `, including ${size(copyBytes)} in safety copies` : ''}. The limit is usually around 5 MB, and progress photos take the most room.`);
  renderSafetyCopies(copies);
}

function renderSafetyCopies(copies = safetyCopies()) {
  const panel = $('copies-panel'), list = $('copies-list'); if (!panel || !list) return;
  panel.hidden = !copies.length;
  list.innerHTML = copies.map(({ key, kind, ts }) => {
    let chars = 0; try { chars = (localStorage.getItem(key) || '').length; } catch (e) { /* unreadable size: show 0 */ }
    const when = new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    return `<li class="history-row copy-row"><span class="history-date"><b>${esc(SAFETY_COPY_LABELS[kind])}</b><small>${esc(when)} · ${fmt(chars / 1024, 1)} KB</small></span>
      <button class="button button-outline button-sm" type="button" data-act="copy-download" data-key="${esc(key)}" aria-label="Download safety copy from ${esc(when)}">${icon('download')}Download</button>
      <button class="icon-button icon-button-sm" type="button" data-act="copy-delete" data-key="${esc(key)}" aria-label="Delete safety copy from ${esc(when)}">${icon('trash')}</button></li>`;
  }).join('');
}

function downloadSafetyCopy(key) {
  if (!isSafetyCopyKey(key)) return;
  let text = null; try { text = localStorage.getItem(key); } catch (e) { /* handled below */ }
  if (text === null) { showToast('That safety copy is no longer there.', 'error'); renderSafetyCopies(); return; }
  const [, kind, ts] = SAFETY_COPY_RE.exec(key);
  downloadFile(`form-safety-copy-${kind.replace('_', '-')}-${new Date(Number(ts)).toISOString().slice(0, 10)}.json`, text, 'application/json');
  showToast(kind === 'unreadable' ? 'Downloaded. FORM could not read this data, so it may need repairing before it can be imported.' : 'Safety copy downloaded. Use Import backup to restore it.', 'info');
}

async function deleteSafetyCopy(key) {
  if (!isSafetyCopyKey(key)) return;
  const ok = await confirmDialog({ title: 'Delete this safety copy?', confirmLabel: 'Delete copy', message: 'This copy will be removed from this browser. It cannot be undone.' });
  if (!ok) return;
  if (!removeSafetyCopy(key)) { showToast('Could not delete that copy.', 'error'); return; }
  renderSettings();
  ($('copies-list').querySelector('[data-act="copy-download"]') || $('import-trigger')).focus({ preventScroll: true });
  showToast('Safety copy deleted');
}

/* ==========================================================================
   Backup, restore and CSV
   ========================================================================== */

function exportBackup() {
  const text = JSON.stringify(state, null, 2);
  downloadFile(`form-backup-${todayKey()}.json`, text, 'application/json');
  showToast(`Backup exported (${fmt(text.length / 1024, 1)} KB)`);
}

const csvCell = (v, text = false) => {
  let s = v === null || v === undefined ? '' : String(v);
  if (text && /^[=+\-@\t\r]/.test(s)) s = `'${s}`; /* stop spreadsheet formula injection from user-typed text */
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function buildCsv() {
  const rows = [], add = (date, type, name, value, unitName, cal, p, c, f, notes) => rows.push({ date, type, name, value, unitName, cal, p, c, f, notes });
  Object.keys(state.weights).filter(isDateKey).forEach(k => { if (Number(state.weights[k]) > 0) add(k, 'weight', 'Body weight', Number(Number(state.weights[k]).toFixed(2)), 'kg'); });
  Object.keys(state.water).filter(isDateKey).forEach(k => { if (getWater(k) > 0) add(k, 'water', 'Water', getWater(k), 'ml'); });
  Object.keys(state.food).filter(isDateKey).forEach(k => getFoodEntries(k).forEach(e => add(k, 'food', e.name, '', '', safeNumber(e.calories), safeNumber(e.protein), safeNumber(e.carbs), safeNumber(e.fat), e.type || '')));
  Object.keys(state.workouts).filter(isDateKey).forEach(k => {
    const rec = state.workouts[k]; if (!isObj(rec)) return;
    const plan = planForDay(mondayIndex(parseLocalDate(k))), c = sessionCounts(k);
    add(k, 'workout', cap(plan.type), rec.completed ? 1 : 0, 'completed', '', '', '', '', `${c.done}/${c.total} sets done`);
    Object.keys(isObj(rec.exercises) ? rec.exercises : {}).forEach(i => {
      const e = rec.exercises[i]; if (!isObj(e) || !Array.isArray(e.sets)) return;
      const name = e.name || (plan.exercises[i] && plan.exercises[i].name) || `Exercise ${Number(i) + 1}`;
      e.sets.forEach((s, n) => { if (isObj(s) && (s.done || s.weight !== '' || s.reps !== '')) add(k, 'set', `${name} set ${n + 1}`, s.weight === '' || s.weight == null ? '' : Number(Number(s.weight).toFixed(2)), 'kg', '', '', '', '', `reps ${s.reps === '' || s.reps == null ? '-' : s.reps}; ${s.done ? 'done' : 'not done'}`); });
    });
  });
  Object.keys(state.habits).filter(isDateKey).forEach(k => {
    const h = getHabit(k), n = HABITS.filter(x => h.checks[x.id]).length;
    if (n) add(k, 'habits', 'Daily basics', n, `of ${HABITS.length}`, '', '', '', '', HABITS.filter(x => h.checks[x.id]).map(x => x.id).join(' '));
    if (h.sleepHours !== '' || h.energy !== '' || h.soreness !== '' || h.notes) add(k, 'recovery', 'Recovery check-in', h.sleepHours, 'h sleep', '', '', '', '', [h.energy !== '' ? `energy ${h.energy}/5` : '', h.soreness !== '' ? `soreness ${h.soreness}/3` : '', h.notes].filter(Boolean).join('; '));
  });
  Object.keys(state.measurements).filter(isDateKey).forEach(k => { const m = state.measurements[k]; if (isObj(m)) MEASURES.forEach(([id, label]) => { if (m[id] !== '' && Number.isFinite(Number(m[id]))) add(k, 'measurement', label, Number(m[id]), 'cm'); }); });
  const order = ['weight', 'measurement', 'food', 'water', 'workout', 'set', 'habits', 'recovery'];
  rows.sort((a, b) => a.date.localeCompare(b.date) || order.indexOf(a.type) - order.indexOf(b.type));
  const head = ['date', 'type', 'name', 'value', 'unit', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'notes'];
  const lines = rows.map(r => [csvCell(r.date), csvCell(r.type), csvCell(r.name, true), csvCell(r.value), csvCell(r.unitName), csvCell(r.cal), csvCell(r.p), csvCell(r.c), csvCell(r.f), csvCell(r.notes, true)].join(','));
  return { text: `﻿${[head.join(',')].concat(lines).join('\r\n')}\r\n`, count: rows.length };
}
function exportCsv() {
  const { text, count } = buildCsv();
  if (!count) { showToast('There are no records to export yet.', 'info'); return; }
  downloadFile(`form-records-${todayKey()}.csv`, text, 'text/csv;charset=utf-8');
  showToast(`Exported ${fmt(count)} records to CSV`);
}

function resetTransientUi() {
  recoveryFormDate = null; editorDay = null; dirtyForms.clear(); ui.mealDay = null;
  timer.total = state.preferences.restSeconds; timerReset();
}

async function importBackup(file) {
  if (!file) return;
  if (file.size > 25 * 1024 * 1024) { showToast('That file is too large to be a FORM backup.', 'error'); return; }
  let parsed;
  try { parsed = JSON.parse(await file.text()); } catch (e) { showToast('That file is not valid JSON, so nothing was changed.', 'error'); return; }
  const incoming = isObj(parsed) && isObj(parsed.data) && ('app' in parsed || 'version' in parsed) ? parsed.data : parsed;
  const known = ['goals', 'food', 'water', 'weights', 'workouts', 'habits', 'measurements', 'photos', 'workoutPlan', 'preferences'];
  if (!isObj(incoming) || !known.some(k => k in incoming)) { showToast('That file does not look like a FORM backup, so nothing was changed.', 'error'); return; }
  const next = normalizeState(incoming);
  const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const describe = st => [
    count(Object.keys(st.weights).length, 'weigh-in', 'weigh-ins'),
    count(Object.keys(st.food).length, 'day of food logs', 'days of food logs'),
    count(Object.values(st.workouts).filter(w => isObj(w) && w.completed).length, 'completed workout', 'completed workouts'),
    count(st.photos.length, 'photo', 'photos')].join(', ');
  const ok = await confirmDialog({ title: 'Replace your data with this backup?', danger: true, offerBackup: true, confirmLabel: 'Replace data',
    message: `“${file.name}” contains ${describe(next)}. You currently have ${describe(state)}. Importing replaces everything currently stored on this device. A safety copy of your current data is kept in this browser when there is room (Settings, Data), and you can download a backup first.` });
  if (!ok) { showToast('Import cancelled. Nothing was changed.', 'info'); return; }
  const result = replaceState(next, 'before_import');
  if (!result.ok) return;
  resetTransientUi(); renderCurrent();
  showToast(result.kept ? 'Backup restored. Your previous data is kept as a safety copy (Settings, Data).' : 'Backup restored. There was no room to keep a copy of your previous data.', result.kept ? undefined : 'info');
}

/* Swaps in a whole new state. When there is room the old state is kept first as a safety copy; if that copy is what stops the new state fitting, it is dropped and the swap is retried. */
function replaceState(next, kind) {
  const previous = state;
  let copyKey = keepSafetyCopy(kind, JSON.stringify(previous));
  state = next;
  let saved = writeState();
  if (!saved && copyKey) { removeSafetyCopy(copyKey); copyKey = null; saved = writeState(); }
  if (!saved) { state = previous; if (copyKey) removeSafetyCopy(copyKey); reportSaveFailure(); return { ok: false, kept: false }; }
  if (storageFailed) { storageFailed = false; updateStorageStatus(); }
  return { ok: true, kept: Boolean(copyKey) };
}

async function clearAllData() {
  const copies = safetyCopies().length;
  const ok = await confirmDialog({ title: 'Clear all data?', danger: true, phrase: 'RESET', offerBackup: true, confirmLabel: 'Clear everything',
    message: `This permanently deletes every food log, weigh-in, workout, habit, photo and setting stored on this device${copies ? `, along with the ${copies} safety cop${copies === 1 ? 'y' : 'ies'} kept in this browser` : ''}. It cannot be undone.` });
  if (!ok) return;
  const previous = state;
  state = normalizeState(null);
  if (!saveState()) { state = previous; return; }
  safetyCopies().forEach(c => removeSafetyCopy(c.key)); /* "clear all" means all: no copy of the old data is left behind */
  resetTransientUi(); renderCurrent();
  showToast('All data cleared');
}

/* ==========================================================================
   Quick log + photo viewer
   ========================================================================== */

function openQuick() {
  const today = selectedDate === todayKey();
  setText('quick-modal-sub', `Logging for ${today ? 'today' : dateLabel(selectedDate, { weekday: 'long', month: 'short', day: 'numeric' })}`);
  setText('quick-water-sub', `${(getWater() / 1000).toFixed(1)} L so far`);
  setText('quick-workout-title', getWorkout().completed ? 'Mark workout not done' : 'Mark workout complete');
  setText('quick-workout-sub', cap(planForDay().type));
  openModal('quick-modal');
}

let openPhotoId = null;
function openPhoto(id) {
  const p = state.photos.find(x => isObj(x) && x.id === id);
  if (!p || !SAFE_IMG.test(String(p.dataUrl))) return;
  openPhotoId = id;
  $('photo-modal-img').src = p.dataUrl;
  $('photo-modal-img').alt = p.title ? `Progress photo: ${p.title}` : 'Progress photo';
  setText('photo-modal-title', p.title || 'Progress photo');
  setText('photo-modal-date', dateLabel(p.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
  openModal('photo-modal', { focus: 'photo-modal-close' });
}

/* ---------- confirmed deletions ---------- */
async function deleteFood(id) {
  const e = getFoodEntries().find(x => x.id === id); if (!e) return;
  const ok = await confirmDialog({ title: 'Remove this food entry?', confirmLabel: 'Remove', message: `“${e.name}” (${fmt(safeNumber(e.calories))} kcal) will be removed from ${dateLabel(selectedDate, { month: 'short', day: 'numeric' })} and the daily totals will update.` });
  if (!ok) return;
  state.food[selectedDate] = getFoodEntries().filter(x => x.id !== id);
  commit('Food entry removed');
}
async function deleteWeight(k) {
  if (!(k in state.weights)) return;
  const ok = await confirmDialog({ title: 'Delete this weight entry?', confirmLabel: 'Delete', message: `The ${fmtWeight(state.weights[k])} ${unit()} check-in from ${dateLabel(k, { month: 'short', day: 'numeric', year: 'numeric' })} will be removed from your history and chart.` });
  if (!ok) return;
  delete state.weights[k]; commit('Weight entry deleted');
}
async function deleteMeasurement(k) {
  if (!(k in state.measurements)) return;
  const ok = await confirmDialog({ title: 'Delete these measurements?', confirmLabel: 'Delete', message: `Measurements from ${dateLabel(k, { month: 'short', day: 'numeric', year: 'numeric' })} will be removed.` });
  if (!ok) return;
  delete state.measurements[k]; commit('Measurements deleted');
}
async function deletePhoto() {
  const p = state.photos.find(x => isObj(x) && x.id === openPhotoId); if (!p) return;
  const ok = await confirmDialog({ title: 'Delete this photo?', confirmLabel: 'Delete photo', message: `${p.title ? `“${p.title}”` : 'This photo'} will be removed from this device. This cannot be undone.` });
  if (!ok) return;
  state.photos = state.photos.filter(x => x !== p);
  closeModal('photo-modal', { restoreFocus: false }); openPhotoId = null;
  commit('Photo deleted');
  const gallery = $('photo-gallery'), first = gallery && gallery.querySelector('.photo-card'); (first || $('photo-title')).focus({ preventScroll: true });
}

/* ==========================================================================
   Event wiring (delegated, so re-rendered markup keeps working)
   ========================================================================== */

function bindEvents() {
  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('input', onInput);

  /* header date controls */
  $('date-prev').addEventListener('click', () => setSelectedDate(addDays(selectedDate, -1)));
  $('date-next').addEventListener('click', () => setSelectedDate(addDays(selectedDate, 1)));
  $('date-today').addEventListener('click', () => setSelectedDate(todayKey()));
  $('selected-date').addEventListener('change', e => { if (isDateKey(e.target.value)) setSelectedDate(e.target.value); else e.target.value = selectedDate; });

  /* dialogs */
  $('quick-action-fab').addEventListener('click', openQuick);
  $('close-quick-modal').addEventListener('click', () => closeModal('quick-modal'));
  $('quick-water-btn').addEventListener('click', () => { closeModal('quick-modal'); addWater(250); });
  $('quick-workout-btn').addEventListener('click', () => { closeModal('quick-modal'); setWorkoutComplete(!getWorkout().completed); });
  $('photo-modal-close').addEventListener('click', () => { closeModal('photo-modal'); openPhotoId = null; });
  $('photo-modal-delete').addEventListener('click', deletePhoto);
  dismissers['photo-modal'] = () => { closeModal('photo-modal'); openPhotoId = null; };

  /* single-purpose buttons */
  $('customize-routine').addEventListener('click', () => go('settings', { focus: 'edit-workout-day' }));
  $('complete-workout').addEventListener('click', () => { setWorkoutComplete(!getWorkout().completed); celebrate($('complete-workout')); });
  $('dash-complete-workout').addEventListener('click', () => { setWorkoutComplete(!getWorkout().completed); celebrate($('dash-complete-workout')); });
  $('timer-start').addEventListener('click', timerStart);
  $('timer-reset').addEventListener('click', timerReset);
  $('remove-water').addEventListener('click', undoWater);
  $('export-grocery').addEventListener('click', exportGrocery);
  $('grocery-uncheck').addEventListener('click', () => { state.groceryChecked = {}; commit('Shopping list unchecked'); });
  $('reset-meal-plan').addEventListener('click', async () => {
    if (!state.mealPlan || !Object.keys(state.mealPlan).length) { showToast('You are already using the suggested plan.', 'info'); return; }
    const ok = await confirmDialog({ title: 'Reset the meal plan?', confirmLabel: 'Reset plan', message: 'Your meal choices for every day go back to the suggested plan. Food you have already logged is not affected.' });
    if (ok) { state.mealPlan = null; commit('Meal plan reset'); }
  });
  $('export-data').addEventListener('click', exportBackup);
  $('banner-export').addEventListener('click', exportBackup);
  $('footer-export-data').addEventListener('click', exportBackup);
  $('export-csv').addEventListener('click', exportCsv);
  $('import-trigger').addEventListener('click', () => $('import-data').click());
  $('import-data').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; importBackup(f); });
  $('clear-data').addEventListener('click', clearAllData);
  $('reset-workout-plan').addEventListener('click', async () => {
    if (!state.workoutPlan) { showToast('You are already using the default plan.', 'info'); return; }
    const ok = await confirmDialog({ title: 'Restore the default plan?', confirmLabel: 'Restore default', message: 'All seven days go back to the built-in workout plan. Logged sets and completed workouts are kept.' });
    if (ok) { state.workoutPlan = null; dirtyForms.delete('workout-editor-form'); commit('Default plan restored'); }
  });

  bindForms();

  window.addEventListener('hashchange', () => {
    const p = pageFromHash(); if (!p) return;
    const f = pendingFocus; pendingFocus = null; showPage(p, { focus: f });
  });
  window.addEventListener('storage', e => {
    if (e.storageArea !== localStorage || e.key !== STORAGE_KEY) return;
    try { state = normalizeState(e.newValue ? JSON.parse(e.newValue) : null); } catch (err) { return; }
    renderCurrent();
  });
}

function onClick(e) {
  const t = e.target;
  const nav = t.closest('.nav-link');
  if (nav) { go(nav.dataset.page); return; }
  const goEl = t.closest('[data-go-page]');
  if (goEl) {
    if (goEl.closest('#quick-modal')) closeModal('quick-modal', { restoreFocus: false });
    go(goEl.dataset.goPage, { focus: goEl.dataset.focus || null }); return;
  }
  const water = t.closest('[data-water]'); if (water) { addWater(Number(water.dataset.water)); return; }
  const preset = t.closest('[data-timer]'); if (preset) { timerSetPreset(Number(preset.dataset.timer)); return; }
  const range = t.closest('#weight-range [data-range]'); if (range) { ui.range = Number(range.dataset.range); renderWeightChart(true); return; }
  const a = t.closest('[data-act]'); if (!a) return;
  const d = a.dataset;
  switch (d.act) {
    case 'day-pick': setSelectedDate(d.date); break;
    case 'meal-day': ui.mealDay = Number(d.day); renderMealPlanner(); { const b = document.querySelector(`#meal-week-strip [data-day="${d.day}"]`); if (b) b.focus({ preventScroll: true }); } break;
    case 'log-meal': logMeal(d.meal, d.slot); break;
    case 'set-toggle': toggleSet(Number(d.ex), Number(d.set)); break;
    case 'food-cat': ui.foodCat = d.cat; renderFoodChips(); renderFoodResults(); break;
    case 'food-fav': {
      const i = state.favorites.indexOf(d.name);
      if (i >= 0) state.favorites.splice(i, 1); else state.favorites.push(d.name);
      saveState(); renderFoodChips(); renderFoodResults();
      const b = Array.from(document.querySelectorAll('#food-database-results .star-btn')).find(x => x.dataset.name === d.name); if (b) b.focus({ preventScroll: true });
      break;
    }
    case 'food-add': {
      const f = FOOD_DATABASE[Number(d.i)]; if (!f) break;
      addFoodEntry({ name: f.name, type: $('food-db-meal').value, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, source: 'database' });
      break;
    }
    case 'food-del': deleteFood(d.id); break;
    case 'open-custom': activateTab($('tab-food-custom')); $('food-name').focus(); break;
    case 'weight-del': deleteWeight(d.date); break;
    case 'measure-del': deleteMeasurement(d.date); break;
    case 'photo-open': openPhoto(d.id); break;
    case 'copy-download': downloadSafetyCopy(d.key); break;
    case 'copy-delete': deleteSafetyCopy(d.key); break;
  }
}

function onChange(e) {
  const el = e.target, d = el.dataset || {};
  if (d.act === 'habit') { setHabit(d.habit, el.checked); return; }
  if (d.act === 'grocery') { if (el.checked) state.groceryChecked[d.key] = true; else delete state.groceryChecked[d.key]; commit(); return; }
  if (d.act === 'plan-select') {
    if (!state.mealPlan) state.mealPlan = {};
    if (!isObj(state.mealPlan[d.day])) state.mealPlan[d.day] = {};
    state.mealPlan[d.day][d.slot] = el.value;
    commit(el.value ? `${d.slot} updated for ${DAY_NAMES[Number(d.day)]}` : `${d.slot} cleared for ${DAY_NAMES[Number(d.day)]}`);
    return;
  }
  if (d.field) { setSetField(Number(d.ex), Number(d.set), d.field, el.value, { immediate: true }); return; }
  if (el.id === 'timer-auto') { state.preferences.autoRest = el.checked; if (saveState()) showToast(el.checked ? 'Timer will start after each set' : 'Auto-start turned off', 'info'); return; }
  if (el.name === 'theme') { state.preferences.theme = el.value; commit(`Accent colour set to ${THEME_NAMES[el.value]}`); return; }
  if (el.name === 'weight-unit') {
    const from = unit(), to = el.value === 'lb' ? 'lb' : 'kg';
    const pending = $('weight-input'), typed = pending ? parseFloat(pending.value) : NaN;
    /* a weigh-in that was typed but not saved keeps meaning the same weight: convert it rather than reading the number in the new unit */
    if (from !== to && Number.isFinite(typed)) pending.value = String(Math.round((to === 'lb' ? typed * LB_PER_KG : typed / LB_PER_KG) * 10) / 10);
    state.preferences.weightUnit = to;
    commit(`Weights are now shown in ${to === 'lb' ? 'pounds' : 'kilograms'}`); return;
  }
  if (el.id === 'edit-workout-day') {
    const next = Number(el.value);
    if (dirtyForms.has('workout-editor-form')) {
      el.value = String(editorDay);
      confirmDialog({ title: 'Discard your edits?', confirmLabel: 'Discard edits', message: `You have unsaved changes to ${DAY_NAMES[editorDay]}. Switching days will discard them.` })
        .then(ok => { if (ok) { fillPlanEditor(next); } $('edit-workout-day').focus(); });
    } else fillPlanEditor(next);
  }
}

function onInput(e) {
  const el = e.target, d = el.dataset || {};
  if (d.field) { setSetField(Number(d.ex), Number(d.set), d.field, el.value); return; }
  if (el.id === 'food-search') { ui.foodQuery = el.value; renderFoodResults(); return; }
  if (el.id === 'recovery-notes') updateNotesCount();
  if (el.getAttribute('aria-invalid') === 'true') fieldError(el, '');
  const form = el.closest('#targets-form, #workout-editor-form');
  if (form) dirtyForms.add(form.id);
}

/* ==========================================================================
   Forms
   ========================================================================== */

function bindForms() {
  $('food-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('food-name'), cal = $('food-calories'), p = $('food-protein'), c = $('food-carbs'), f = $('food-fat');
    const bad = validateFields([
      [name, name.value.trim() ? '' : 'Enter a name for this food.'],
      [cal, numberIn(cal, { min: 0, max: 10000, label: 'Calories' })],
      [p, numberIn(p, { min: 0, max: 1000, label: 'Protein' })],
      [c, numberIn(c, { min: 0, max: 1000, label: 'Carbs' })],
      [f, numberIn(f, { min: 0, max: 1000, label: 'Fat' })]
    ]);
    if (bad) return;
    addFoodEntry({ name: name.value.trim(), type: $('food-type').value, calories: Number(cal.value), protein: Number(p.value), carbs: Number(c.value), fat: Number(f.value), source: 'manual' });
    e.target.reset(); name.focus();
  });

  $('weight-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('weight-input'), lb = unit() === 'lb';
    if (validateFields([[input, numberIn(input, { min: lb ? 44 : 20, max: lb ? 1000 : 450, label: 'Weight' })]])) return;
    state.weights[selectedDate] = Number(storeWeight(Number(input.value)).toFixed(3));
    e.target.reset(); commit(`Weight saved for ${selectedDate === todayKey() ? 'today' : dateLabel(selectedDate, { month: 'short', day: 'numeric' })}`);
  });

  $('measurement-form').addEventListener('submit', e => {
    e.preventDefault();
    const inputs = MEASURES.map(([id]) => $(`measure-${id}`)), filled = inputs.filter(i => i.value.trim() !== '');
    if (!filled.length) { validateFields([[inputs[0], 'Enter at least one measurement.']]); return; }
    if (validateFields(inputs.map((i, n) => [i, numberIn(i, { min: 10, max: 400, required: false, label: MEASURES[n][1] })]))) return;
    const rec = isObj(state.measurements[selectedDate]) ? state.measurements[selectedDate] : {};
    inputs.forEach((i, n) => { if (i.value.trim() !== '') rec[MEASURES[n][0]] = Number(i.value); });
    state.measurements[selectedDate] = rec;
    e.target.reset(); commit('Measurements saved');
  });

  $('photo-form').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target, file = $('photo-file').files[0], btn = form.querySelector('button[type="submit"]');
    if (!file) { validateFields([[$('photo-file'), 'Choose a photo first.']]); return; }
    if (!file.type.startsWith('image/')) { validateFields([[$('photo-file'), 'That file is not an image.']]); return; }
    btn.disabled = true;
    try {
      const dataUrl = await shrinkImage(file);
      const photo = { id: makeId(), date: selectedDate, title: $('photo-title').value.trim(), dataUrl };
      state.photos.push(photo);
      if (!saveState()) { state.photos = state.photos.filter(p => p !== photo); }
      else { form.reset(); renderCurrent(); showToast('Progress photo saved'); }
    } catch (err) { showToast(err.message || 'The photo could not be saved.', 'error'); }
    finally { btn.disabled = false; }
  });

  $('recovery-form').addEventListener('submit', e => {
    e.preventDefault();
    const sleep = $('sleep-hours'), notes = $('recovery-notes').value.trim();
    const energy = document.querySelector('input[name="energy"]:checked'), soreness = document.querySelector('input[name="soreness"]:checked');
    if (validateFields([[sleep, numberIn(sleep, { min: 0, max: 24, required: false, label: 'Sleep' })]])) return;
    if (sleep.value.trim() === '' && !energy && !soreness && !notes) { showToast('Add at least one value to save a check-in.', 'info'); sleep.focus(); return; }
    const h = ensureHabit();
    h.sleepHours = sleep.value.trim() === '' ? '' : Number(sleep.value);
    h.energy = energy ? energy.value : ''; h.soreness = soreness ? soreness.value : ''; h.notes = notes;
    recoveryFormDate = null;
    commit('Recovery check-in saved');
  });

  $('targets-form').addEventListener('submit', e => {
    e.preventDefault();
    const f = { calories: $('target-calories'), protein: $('target-protein'), carbs: $('target-carbs'), fat: $('target-fat'), water: $('target-water') };
    if (validateFields([
      [f.calories, numberIn(f.calories, { min: 500, max: 10000, label: 'Calories' })], [f.protein, numberIn(f.protein, { min: 0, max: 1000, label: 'Protein' })],
      [f.carbs, numberIn(f.carbs, { min: 0, max: 2000, label: 'Carbs' })], [f.fat, numberIn(f.fat, { min: 0, max: 1000, label: 'Fat' })],
      [f.water, numberIn(f.water, { min: 0.5, max: 10, label: 'Water' })]
    ])) return;
    state.goals = { calories: Number(f.calories.value), protein: Number(f.protein.value), carbs: Number(f.carbs.value), fat: Number(f.fat.value), water: Number(f.water.value) };
    dirtyForms.delete('targets-form');
    commit('Targets updated');
  });

  $('workout-editor-form').addEventListener('submit', e => {
    e.preventDefault();
    const type = $('edit-workout-type'), dur = $('edit-workout-duration'), desc = $('edit-workout-description'), ex = $('edit-workout-exercises');
    const { exercises, errors } = parseExercises(ex.value);
    const exMsg = errors.length ? errors.join(' ') : exercises.length ? '' : 'Add at least one exercise.';
    if (validateFields([
      [type, type.value.trim() ? '' : 'Give this day a title.'],
      [dur, dur.value.trim() ? '' : 'Add an estimated duration, or write Rest.'],
      [ex, exMsg]
    ])) return;
    const plans = [0, 1, 2, 3, 4, 5, 6].map(i => clone(planForDay(i)));
    plans[editorDay] = { type: type.value.trim(), duration: dur.value.trim(), description: desc.value.trim(), exercises };
    state.workoutPlan = plans;
    dirtyForms.delete('workout-editor-form');
    commit(`${DAY_NAMES[editorDay]} plan saved`);
  });
}

/* ==========================================================================
   Start-up
   ========================================================================== */

let lastToday = todayKey();
function checkRollover() {
  const now = todayKey(); if (now === lastToday) return;
  if (selectedDate === lastToday) { selectedDate = now; selectedDayIndex = mondayIndex(parseLocalDate(now)); }
  lastToday = now; renderCurrent();
}

/* Below 960px every page is one column and two panels appear in a different place than on desktop. CSS `order` alone would
   change only what is on screen; moving the nodes keeps keyboard and screen-reader order identical to the visual order. */
function initResponsiveOrder() {
  const narrow = window.matchMedia('(max-width: 959px)');
  const moves = [
    { node: '.dash-layout .consistency-panel', home: '.dash-layout > .dash-col:first-child', away: '.dash-layout > .dash-col:last-child', after: '.tile-row' },
    { node: '.progress-layout .measurement-panel', home: '.progress-layout > .stack:first-child', away: '.progress-layout > .stack:last-child', after: '.chart-panel' },
  ];
  const apply = () => moves.forEach(m => {
    const node = document.querySelector(m.node), home = document.querySelector(m.home), away = document.querySelector(m.away);
    if (!node || !home || !away) return;
    if (narrow.matches) { if (node.parentNode !== away) away.appendChild(node); }
    else if (node.parentNode !== home) { const ref = home.querySelector(m.after); if (ref) ref.after(node); else home.appendChild(node); }
  });
  apply();
  if (narrow.addEventListener) narrow.addEventListener('change', apply); else narrow.addListener(apply);
}

function init() {
  initResponsiveOrder();
  initModals(); initTabs(); initChart(); bindEvents();
  updateStorageStatus();
  showPage(pageFromHash() || 'dashboard', { initial: true });
  if (window.ResizeObserver) new ResizeObserver(positionNavIndicator).observe($('main-nav'));
  window.addEventListener('resize', positionNavIndicator);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(positionNavIndicator);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushPendingSave(); else checkRollover(); });
  window.addEventListener('pagehide', flushPendingSave);
  setInterval(checkRollover, 60000);
  if (startupNotice) showToast(startupNotice, 'error');
}

init();
