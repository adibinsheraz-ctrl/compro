/**
 * Pure prediction checks for the chance/fine rules.
 * Run: npx tsx src/lib/chance-engine.selftest.ts
 */
import {
  chanceRemaining,
  isChanceExhausted,
  predictIncident,
} from "./types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const settings = { chances_allowed: 1, fine_amount: 50 };

const fresh = { chances_used: 0, total_fine: 0 };
assert(!isChanceExhausted(fresh, settings), "fresh should have chance");
assert(chanceRemaining(fresh, settings) === 1, "one chance left");
assert(
  predictIncident(fresh, settings).type === "chance_used",
  "first log is chance"
);

const used = { chances_used: 1, total_fine: 0 };
assert(isChanceExhausted(used, settings), "chance exhausted");
assert(
  predictIncident(used, settings).type === "fine" &&
    predictIncident(used, settings).amount === 50,
  "second log is fine"
);
assert(
  predictIncident(used, settings).nextTotalFine === 50,
  "fine accumulates"
);

const multi = { chances_allowed: 2, fine_amount: 100 };
const mid = { chances_used: 1, total_fine: 0 };
assert(!isChanceExhausted(mid, multi), "second chance still open");
assert(predictIncident(mid, multi).type === "chance_used", "uses 2nd chance");

// Used chances never auto-heal in prediction (chances_used stays until undo)
assert(isChanceExhausted({ chances_used: 1 }, settings), "no regen");

console.log("chance-engine selftest OK");
