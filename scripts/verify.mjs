#!/usr/bin/env node
/**
 * Rail Diary ERP - Automated System Verification Harness
 * Executable entry point for `npm run verify` in project workspace root.
 * Evaluates all 5 domain test suites, emits structured diagnostic scorecard, and enforces clean exit codes.
 */

import { performance } from 'perf_hooks';
import { runSchemaTests } from './tests/schema.test.mjs';
import { runRbacTests } from './tests/rbac.test.mjs';
import { runKmFinderTests } from './tests/km-finder.test.mjs';
import { runQrGeoTests } from './tests/qr-geo.test.mjs';
import { runAnalyticsTests } from './tests/analytics.test.mjs';

// ANSI Color Codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BLUE = '\x1b[34m';
const GRAY = '\x1b[90m';

async function main() {
  const startTime = performance.now();

  console.log(`${BOLD}${CYAN}================================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}            RAIL DIARY ERP - AUTOMATED SYSTEM VERIFICATION HARNESS            ${RESET}`);
  console.log(`${GRAY}            DFCCIL IMSD SMUN Unit (Km 1167.210 – 1249.720 + Link Line 6.169 Km)${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================================${RESET}\n`);

  const suiteRunners = [
    { id: 1, name: 'Schema Integrity & Seeding Counts', runner: runSchemaTests },
    { id: 2, name: 'RBAC Security & Permission Matrix', runner: runRbacTests },
    { id: 3, name: 'Km Quick Finder & Chainage Boundaries', runner: runKmFinderTests },
    { id: 4, name: 'Personal QR Code & GPS Geolocation', runner: runQrGeoTests },
    { id: 5, name: 'Interactive Analytics Data Aggregation', runner: runAnalyticsTests }
  ];

  const results = [];
  let totalAssertions = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const s of suiteRunners) {
    const sStart = performance.now();
    let suiteResult;

    try {
      suiteResult = await s.runner();
    } catch (err) {
      suiteResult = {
        name: s.name,
        total: 1,
        passed: 0,
        failed: 1,
        errors: [{ test: 'Suite Execution', error: err }],
        details: [{ title: 'Suite Execution Crash', passed: false, error: err.message }]
      };
    }

    const sDuration = (performance.now() - sStart).toFixed(2);
    suiteResult.durationMs = sDuration;
    results.push(suiteResult);

    totalAssertions += suiteResult.total;
    totalPassed += suiteResult.passed;
    totalFailed += suiteResult.failed;

    const isSuccess = suiteResult.failed === 0;
    const statusTag = isSuccess ? `${GREEN}[✓] PASS${RESET}` : `${RED}[✗] FAIL${RESET}`;

    console.log(`${BOLD}${s.id}. ${suiteResult.name}${RESET}  ${statusTag}  ${GRAY}(${suiteResult.passed}/${suiteResult.total} passed in ${sDuration}ms)${RESET}`);

    // Print summary details
    for (const d of suiteResult.details || []) {
      if (d.passed) {
        console.log(`    ${GREEN}•${RESET} ${GRAY}${d.title}${RESET}`);
      } else {
        console.log(`    ${RED}✖ ${d.title}${RESET}`);
        if (d.error) {
          console.log(`      ${RED}Error: ${d.error}${RESET}`);
        }
      }
    }
    console.log();
  }

  const totalDuration = (performance.now() - startTime).toFixed(2);

  console.log(`${BOLD}${CYAN}================================================================================${RESET}`);
  console.log(`${BOLD}                            VERIFICATION SCORECARD                             ${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================================${RESET}`);
  console.log(`  ${BOLD}Suite #  Verification Domain                        Total  Pass  Fail  Status${RESET}`);
  console.log(`  ${GRAY}-----------------------------------------------------------------------------${RESET}`);

  results.forEach((r, idx) => {
    const num = String(idx + 1).padEnd(2, ' ');
    const name = r.name.padEnd(42, ' ');
    const tot = String(r.total).padStart(5, ' ');
    const pass = String(r.passed).padStart(5, ' ');
    const fail = String(r.failed).padStart(5, ' ');
    const status = r.failed === 0 ? `${GREEN}PASSED${RESET}` : `${RED}FAILED${RESET}`;
    console.log(`  [${num}]    ${name} ${tot} ${pass} ${fail}  ${status}`);
  });

  console.log(`  ${GRAY}-----------------------------------------------------------------------------${RESET}`);
  console.log(`  ${BOLD}TOTAL    ${'All Domains'.padEnd(42, ' ')} ${String(totalAssertions).padStart(5, ' ')} ${String(totalPassed).padStart(5, ' ')} ${String(totalFailed).padStart(5, ' ')}  ${totalFailed === 0 ? `${GREEN}100% OK${RESET}` : `${RED}ERRORS${RESET}`}${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================================${RESET}`);

  if (totalFailed === 0) {
    console.log(`\n${BOLD}${GREEN}✔ VERIFICATION SUCCESS: ALL ${results.length} SUITES PASSED (${totalPassed}/${totalAssertions} ASSERTIONS) [${totalDuration}ms]${RESET}`);
    console.log(`${GREEN}✔ Exit Code: 0 - Ready for deployment & milestone signoff.${RESET}\n`);
    process.exit(0);
  } else {
    console.error(`\n${BOLD}${RED}✖ VERIFICATION FAILURE: ${totalFailed} ASSERTION(S) FAILED OUT OF ${totalAssertions} [${totalDuration}ms]${RESET}`);
    console.error(`${RED}✖ Exit Code: 1 - Please resolve test defects before proceeding.${RESET}\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`${RED}Fatal Uncaught Error in Verification Runner:${RESET}`, err);
  process.exit(1);
});
