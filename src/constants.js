export const GROUP_PRESETS = [
  { name: "Work", color: "#FF6B5E" },
  { name: "Personal", color: "#5EC9A7" },
  { name: "Health", color: "#7FB5E0" },
];

export const PALETTE = ["#FF6B5E", "#F4508C", "#FFB35C", "#5EC9A7", "#7FB5E0", "#A78BDA", "#E0A47F", "#8A8177"];

/* daily phrase bank — rotates by day, no near-term repeats */
export const PHRASES = [
  "Slow is smooth, and smooth is fast.",
  "You don't need a perfect day. You need a clear one.",
  "Three things, done gently, beat ten things done in panic.",
  "Calm is a skill you practice one morning at a time.",
  "The list serves you. Never the other way around.",
  "Begin with the smallest true thing.",
  "Clarity is choosing what not to do.",
  "Today is wide enough for what matters.",
  "Momentum loves modest starts.",
  "Rest is part of the plan, not a break from it.",
  "One honest hour outweighs a scattered day.",
  "What you release also counts as progress.",
  "Attention is the rarest kind of wealth.",
  "You are allowed to do this quietly.",
  "Small steps, taken daily, become a direction.",
  "The day doesn't need to be full to be good.",
  "Trust the version of you who made this plan.",
  "Unhurried is not the same as behind.",
  "Do less, but do it with your whole attention.",
  "A short list is a kind of self-respect.",
  "Finish one thing before you feed the next worry.",
  "Your pace is a feature, not a flaw.",
  "Every day clear is a small act of trust.",
  "Nothing important grows in a rush.",
  "Choose the next right thing, not the whole map.",
  "Ease is earned by deciding early.",
  "Let the morning be simple on purpose.",
  "What matters today fits in one breath.",
  "Progress hides in ordinary afternoons.",
  "You can hold a lot by holding less at once.",
  "The quiet hours do the heavy lifting.",
  "Plans are promises you keep softly.",
  "Enough is a decision, not an amount.",
  "Leave room in the day for the day itself.",
  "Steadiness is its own kind of ambition.",
  "Make peace with the unfinished; it will wait.",
  "Start where the resistance is smallest.",
  "A calm mind sees further than a busy one.",
  "The bonus of a clear day is the evening.",
  "Tomorrow will thank you for tonight's honesty.",
];

/* bill category keywords */
export const BILL_CATS = ["Housing", "Bills", "Subscriptions", "Other"];

export const GROCERY_WORDS = /^(buy|get|pick up|comprar)\s+/i;

/* the Today ring's shape — identical geometry to the brand mark's halo (same
   3 arcs, same gaps, same hidden L). Each arc maps to one Top 3 slot, in order. */
export const HALO_ARCS = [
  { d: "M 75.77,89.03 A 44,44 0 0 1 28.42,89.15", length: 49.99 },
  { d: "M 22.73,84.85 A 44,44 0 0 1 25.15,17.14", length: 77.33 },
  { d: "M 30.47,13.63 A 44,44 0 0 1 81.16,84.95", length: 128.86 },
];
