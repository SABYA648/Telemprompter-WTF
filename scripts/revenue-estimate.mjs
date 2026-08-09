#!/usr/bin/env node
// Scenario model for possible future ad revenue. This is not a forecast.
// See docs/monetization-readiness.md for context and assumptions.

const HELP = `Usage: node scripts/revenue-estimate.mjs --pageviews=<n> --rpm=<a,b,c>

Prints a monthly ad-revenue scenario table:
  estimated monthly revenue = pageviews / 1000 x assumed page RPM

Options:
  --pageviews   Monetizable pageviews per month (positive number)
  --rpm         Comma-separated page RPM assumptions in USD (positive numbers)
  --help        Show this message

Example:
  node scripts/revenue-estimate.mjs --pageviews=100000 --rpm=1,3,5`;

function fail(message) {
  console.error(`Error: ${message}\n`);
  console.error(HELP);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}

const options = {};
for (const arg of args) {
  const match = arg.match(/^--([a-z]+)=(.+)$/);
  if (!match) fail(`unrecognized argument "${arg}"`);
  options[match[1]] = match[2];
}

const pageviews = Number(options.pageviews);
if (!Number.isFinite(pageviews) || pageviews <= 0) {
  fail('--pageviews must be a positive number');
}
if (!options.rpm) fail('--rpm is required (comma-separated list, e.g. 1,3,5)');

const rpms = options.rpm.split(',').map((part) => Number(part.trim()));
if (rpms.length === 0 || rpms.some((rpm) => !Number.isFinite(rpm) || rpm <= 0)) {
  fail('--rpm must contain only positive numbers');
}

const format = (value) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

console.log('Ad revenue scenario model (not a forecast)');
console.log('');
console.log(`Monetizable pageviews per month: ${pageviews.toLocaleString('en-US')}`);
console.log('');
console.log('Assumed page RPM | Estimated monthly revenue');
console.log('-----------------|--------------------------');
for (const rpm of rpms) {
  const estimate = (pageviews / 1000) * rpm;
  console.log(`${`$${format(rpm)}`.padStart(16)} | $${format(estimate)}`);
}
console.log('');
console.log('Formula: pageviews / 1000 x RPM.');
console.log('RPM is an assumption until real ad data exists; geography, page type,');
console.log('device, traffic quality, and ad implementation all change actual RPM.');
