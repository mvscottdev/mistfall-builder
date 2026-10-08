// Refreshes public/data/prices.json from a trade price dump.
//
//   node scripts/import-prices.cjs <trade_prices.json> [--date YYYY-MM-DD]
//
// Input: { "low": { "<cfgId>": number }, "avg": { "<cfgId>": number } }.
// Ids that aren't in public/data/catalogue.json are dropped. --date defaults
// to today.
'use strict';

const fs = require('fs');
const path = require('path');

const [source, ...rest] = process.argv.slice(2);
if (!source) {
  console.error('usage: node scripts/import-prices.cjs <trade_prices.json> [--date YYYY-MM-DD]');
  process.exit(1);
}
const dateFlag = rest.indexOf('--date');
const updatedAt = dateFlag >= 0 ? rest[dateFlag + 1] : new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(updatedAt)) throw new Error(`bad --date: ${updatedAt}`);

const DATA = path.join(__dirname, '..', 'public', 'data');
const catalogue = JSON.parse(fs.readFileSync(path.join(DATA, 'catalogue.json'), 'utf8'));
const trade = JSON.parse(fs.readFileSync(source, 'utf8'));
const known = new Set([...catalogue.items, ...catalogue.gems].map((r) => String(r.id)));

function pick(table = {}) {
  const out = {};
  for (const [id, price] of Object.entries(table)) {
    if (!known.has(id)) continue;
    if (!Number.isFinite(price) || price <= 0) throw new Error(`bad price for ${id}: ${price}`);
    out[id] = price;
  }
  return out;
}

const prices = { updatedAt, low: pick(trade.low), avg: pick(trade.avg) };
fs.writeFileSync(path.join(DATA, 'prices.json'), JSON.stringify(prices, null, 1) + '\n');

const priced = (rows) => rows.filter((r) => prices.low[r.id] ?? prices.avg[r.id]).length;
console.log(
  `prices.json: ${updatedAt}, items priced ${priced(catalogue.items)}/${catalogue.items.length}, ` +
    `gems priced ${priced(catalogue.gems)}/${catalogue.gems.length}`,
);
