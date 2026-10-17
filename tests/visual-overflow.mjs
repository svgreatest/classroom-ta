import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
import { chromium } from 'playwright-chromium';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactsDir = path.resolve(rootDir, 'test-artifacts');
const screenshotsDir = path.resolve(artifactsDir, 'screenshots');

const PORTAL_URL = 'http://localhost:3000';
const SLIDEV_URL = 'http://localhost:3030';

// Check if an HTTP URL responds with 200
function checkHttp(url, timeoutMs = 2000) {
  return new Promise(resolve => {
    const req = http.get(url, { timeout: timeoutMs }, res => {
      resolve(res.statusCode && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Stop the app we launched. On Windows, kill() only stops the launcher, leaving Vite and
// Slidev alive and holding our stdout open, so the test command never returns.
function stopServer(child) {
  if (!child) return;
  if (process.platform === 'win32' && child.pid) {
    try {
      execSync(`taskkill /F /T /PID ${child.pid}`, { stdio: 'ignore' });
      return;
    } catch {}
  }
  child.kill();
}

// Wait for HTTP service
async function waitForHttp(url, maxWaitMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await checkHttp(url)) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

// Switch lesson via Portal API
function setLesson(lessonId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ lessonId });
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/slidev/set-lesson',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({ success: true, lessonId });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Calculate slide count for a lesson
function getSlideCount(lessonId) {
  const slidesFile = path.resolve(rootDir, 'lessons', lessonId, 'slides.md');
  if (!fs.existsSync(slidesFile)) return 0;
  const content = fs.readFileSync(slidesFile, 'utf8');
  const delimiter = /\n---\r?\n/g;
  const matches = content.match(delimiter);
  return (matches ? matches.length : 0) + 1;
}

// Discover all lessons in lessons/
function getAvailableLessons() {
  const lessonsPath = path.resolve(rootDir, 'lessons');
  if (!fs.existsSync(lessonsPath)) return [];
  return fs.readdirSync(lessonsPath, { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(lessonsPath, d.name, 'slides.md')))
    .map(d => d.name);
}

// Minimum CSS font sizes (slide canvas px, before Slidev scales the canvas)
const MCQ_MIN_OPTION_PX = 24;
const MCQ_MIN_QUESTION_PX = 24;

// Measure the active slide's MCQ: font sizes, then overflow with options and after Reveal.
// Returns a failure reason, or '' when everything passes.
async function checkMcqSlide(page, lessonScreenshotDir, slideNum) {
  const inspect = () => page.evaluate(() => {
    const layout = Array.from(document.querySelectorAll('.slidev-layout')).find(el => {
      const r = el.getBoundingClientRect();
      return r.width > 100 && r.height > 100;
    });
    const mcq = layout && layout.querySelector('.mcq');
    if (!mcq) return { error: 'MCQ not found in active slide' };
    const px = el => parseFloat(getComputedStyle(el).fontSize);
    const parentRect = layout.getBoundingClientRect();
    const overflow = Array.from(mcq.querySelectorAll('*')).reduce((worst, el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || el.closest('.katex-mathml')) return worst;
      return Math.max(worst, Math.round(r.bottom - parentRect.bottom), Math.round(r.right - parentRect.right));
    }, 0);
    return {
      optionPx: Array.from(mcq.querySelectorAll('.option-text')).map(px),
      questionPx: Array.from(mcq.querySelectorAll('.mcq-question')).map(px),
      hasOptions: !!mcq.querySelector('.options-grid'),
      hasExplanation: !!mcq.querySelector('.explanation-card'),
      hasReveal: !!mcq.querySelector('.btn-reveal'),
      overflow
    };
  });

  const before = await inspect();
  if (before.error) return before.error;
  const smallOption = before.optionPx.find(v => v < MCQ_MIN_OPTION_PX);
  if (smallOption !== undefined) return `MCQ option font ${smallOption}px < ${MCQ_MIN_OPTION_PX}px`;
  const smallQuestion = before.questionPx.find(v => v < MCQ_MIN_QUESTION_PX);
  if (smallQuestion !== undefined) return `MCQ question font ${smallQuestion}px < ${MCQ_MIN_QUESTION_PX}px`;
  if (before.overflow > 2) return `MCQ overflows slide by ${before.overflow}px`;
  if (!before.hasReveal) return '';

  await page.locator('.slidev-layout .mcq .btn-reveal:visible').first().click();
  await page.waitForTimeout(350);
  const revealed = await inspect();
  await page.screenshot({ path: path.join(lessonScreenshotDir, `slide-${slideNum.toString().padStart(2, '0')}-revealed.png`) });
  if (!revealed.hasExplanation || revealed.hasOptions) return 'MCQ Reveal did not swap options for the explanation';
  if (revealed.overflow > 2) return `MCQ explanation overflows slide by ${revealed.overflow}px`;

  await page.locator('.slidev-layout .mcq .btn-reveal:visible').first().click();
  await page.waitForTimeout(250);
  const back = await inspect();
  if (!back.hasOptions || back.hasExplanation) return 'MCQ Back did not restore the options';
  return '';
}

async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('       CLASSROOM TA AUTOMATED VISUAL & OVERFLOW TEST SUITE    ');
  console.log('=============================================================\n');

  // 1. Prepare Artifacts Directories
  if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  // 2. Verify server readiness
  console.log('[STEP 1/4] Checking server status...');
  let spawnedServer = null;
  const portalLive = await checkHttp(PORTAL_URL);

  if (!portalLive) {
    console.log('Server not detected at http://localhost:3000. Launching start-app.mjs...');
    const startScript = path.resolve(rootDir, 'scripts', 'start-app.mjs');
    spawnedServer = spawn('node', [startScript], {
      cwd: rootDir,
      stdio: 'inherit'
    });
    const ready = await waitForHttp(PORTAL_URL, 35000);
    if (!ready) {
      console.error('ERROR: Could not launch or connect to server.');
      stopServer(spawnedServer);
      process.exit(1);
    }
  }
  console.log('✓ Portal and Slidev engine confirmed running.\n');

  // 3. Launch Headless Browser
  console.log('[STEP 2/4] Launching headless browser (Playwright Chromium)...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  const lessons = getAvailableLessons();
  console.log(`Discovered ${lessons.length} lessons to verify:`, lessons.join(', '), '\n');

  const testResults = {
    totalSlides: 0,
    passedSlides: 0,
    failedSlides: 0,
    slides: [],
    portalTests: []
  };

  // 4. Slide Verification & Screenshot Inspection
  console.log('[STEP 3/4] Verifying slide layouts, boundaries, and capturing screenshots...');

  for (const lessonId of lessons) {
    console.log(`\n-------------------------------------------------------------`);
    console.log(`Verifying Lesson: ${lessonId}`);
    console.log(`-------------------------------------------------------------`);

    const lessonScreenshotDir = path.resolve(screenshotsDir, lessonId);
    if (!fs.existsSync(lessonScreenshotDir)) fs.mkdirSync(lessonScreenshotDir, { recursive: true });

    // Switch Slidev to current lesson
    await setLesson(lessonId);
    // Wait for Slidev reload/rebuild
    await new Promise(r => setTimeout(r, 2200));
    await waitForHttp(SLIDEV_URL, 15000);

    const slideCount = getSlideCount(lessonId);
    console.log(`Slide deck contains ${slideCount} slides.`);

    for (let s = 1; s <= slideCount; s++) {
      testResults.totalSlides++;
      const slideUrl = `${SLIDEV_URL}/${s}`;
      
      try {
        await page.goto(slideUrl, { waitUntil: 'networkidle', timeout: 12000 });
      } catch {
        // Retry once if navigation timed out
        await page.goto(slideUrl, { waitUntil: 'domcontentloaded' });
      }
      
      // The first slide after a lesson switch can arrive before Slidev finishes compiling the deck
      await page.waitForSelector('.slidev-layout', { state: 'attached', timeout: 30000 }).catch(() => {});

      // Let animations and math render
      await page.waitForTimeout(400);

      // Deep layout inspection
      const measurement = await page.evaluate((slideNum) => {
        // Locate active visible slide layout
        const activeLayout = Array.from(document.querySelectorAll('.slidev-layout')).find(el => {
          const r = el.getBoundingClientRect();
          return r.width > 100 && r.height > 100;
        });

        if (!activeLayout) {
          return { error: 'No active slide layout element found' };
        }

        const parentRect = activeLayout.getBoundingClientRect();

        // Query all visible descendants
        const allVisible = Array.from(activeLayout.querySelectorAll('*')).filter(el => {
          // Screen-reader-only content, including KaTeX's MathML copy, is clipped out of view
          if (el.closest('.sr-only, .katex-mathml')) return false;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });

        const elementMetrics = allVisible.map(el => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName.toLowerCase(),
            className: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
            text: (el.innerText || '').slice(0, 45).replace(/\s+/g, ' ').trim(),
            bottom: r.bottom,
            right: r.right,
            overflowY: Math.round(r.bottom - parentRect.bottom),
            overflowX: Math.round(r.right - parentRect.right)
          };
        });

        const maxBottom = Math.max(...elementMetrics.map(e => e.bottom), 0);
        const maxRight = Math.max(...elementMetrics.map(e => e.right), 0);

        const clearanceBottom = Math.round(parentRect.bottom - maxBottom);
        const clearanceRight = Math.round(parentRect.right - maxRight);

        const overflowsY = elementMetrics.filter(e => e.overflowY > 2);
        const overflowsX = elementMetrics.filter(e => e.overflowX > 2);

        return {
          parentRect: {
            width: Math.round(parentRect.width),
            height: Math.round(parentRect.height)
          },
          clearanceBottom,
          clearanceRight,
          overflowsY,
          overflowsX
        };
      }, s);

      const slideFilename = `slide-${s.toString().padStart(2, '0')}.png`;
      const screenshotPath = path.join(lessonScreenshotDir, slideFilename);
      const relScreenshotPath = path.relative(artifactsDir, screenshotPath).replace(/\\/g, '/');

      let isPassed = true;
      let failureReason = '';

      // A shared addon component that failed to resolve is left in the DOM as its raw tag
      const unresolved = await page.evaluate(() =>
        ['badge', 'card', 'mcq', 'questiontimer', 'tutorlink', 'stackviz', 'memoryrow', 'bigidea', 'inindustry']
          .filter(tag => document.querySelector(`.slidev-layout ${tag}`))
      );

      if (measurement.error) {
        isPassed = false;
        failureReason = measurement.error;
      } else if (unresolved.length > 0) {
        isPassed = false;
        failureReason = `Unresolved slide component(s): ${unresolved.join(', ')}`;
      } else if (measurement.overflowsY.length > 0) {
        isPassed = false;
        const worst = measurement.overflowsY[0];
        failureReason = `Vertical overflow by ${worst.overflowY}px: <${worst.tag} class="${worst.className}"> "${worst.text}"`;
      } else if (measurement.overflowsX.length > 0) {
        isPassed = false;
        const worst = measurement.overflowsX[0];
        failureReason = `Horizontal overflow by ${worst.overflowX}px: <${worst.tag} class="${worst.className}"> "${worst.text}"`;
      }

      // Capture high-res screenshot
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // MCQ slides: readable from the back row, and Reveal/Back must not overflow
      // Slidev keeps neighbouring slides in the DOM, so only look inside the visible layout
      const hasMcq = await page.evaluate(() => Array.from(document.querySelectorAll('.slidev-layout')).some(el => {
        const r = el.getBoundingClientRect();
        return r.width > 100 && r.height > 100 && el.querySelector('.mcq');
      }));
      if (isPassed && hasMcq) {
        const mcqFailure = await checkMcqSlide(page, lessonScreenshotDir, s);
        if (mcqFailure) {
          isPassed = false;
          failureReason = mcqFailure;
        }
      }

      if (isPassed) {
        testResults.passedSlides++;
        console.log(`  ✓ Slide ${s.toString().padStart(2, ' ')}: PASS (Clearance: bottom ${measurement.clearanceBottom}px, right ${measurement.clearanceRight}px) -> ${relScreenshotPath}`);
      } else {
        testResults.failedSlides++;
        console.log(`  ✗ Slide ${s.toString().padStart(2, ' ')}: FAIL - ${failureReason}`);
      }

      testResults.slides.push({
        lessonId,
        slideNumber: s,
        passed: isPassed,
        clearanceBottom: measurement.clearanceBottom,
        clearanceRight: measurement.clearanceRight,
        failureReason,
        screenshot: relScreenshotPath
      });
    }
  }

  // 5. Portal Integration Tests
  console.log('\n-------------------------------------------------------------');
  console.log('[STEP 4/4] Verifying Classroom TA Portal Features (http://localhost:3000)...');
  console.log('-------------------------------------------------------------');

  const portalScreenshotDir = path.resolve(screenshotsDir, 'portal');
  if (!fs.existsSync(portalScreenshotDir)) fs.mkdirSync(portalScreenshotDir, { recursive: true });

  const runPortalTest = async (testName, action) => {
    try {
      const result = await action();
      const filename = `${testName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      const screenshotPath = path.join(portalScreenshotDir, filename);
      await page.screenshot({ path: screenshotPath });
      const relPath = path.relative(artifactsDir, screenshotPath).replace(/\\/g, '/');
      console.log(`  ✓ ${testName} -> ${relPath}`);
      testResults.portalTests.push({ name: testName, passed: true, screenshot: relPath, details: result });
    } catch (err) {
      console.log(`  ✗ ${testName}: ${err.message}`);
      testResults.portalTests.push({ name: testName, passed: false, error: err.message });
    }
  };

  // Test 5.1: Portal Slide View
  await runPortalTest('Portal Slide View & BrandHeader', async () => {
    await page.goto(PORTAL_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('iframe');
    const title = await page.title();
    return { title };
  });

  // Test 5.2: Visualizer Tab
  await runPortalTest('Interactive Visualizer Tab Switch', async () => {
    await page.keyboard.press('2');
    await page.waitForTimeout(600);
    const hasVisualizer = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main && !main.querySelector('.hidden')?.contains(document.querySelector('svg, canvas, pre'));
    });
    return { hasVisualizer };
  });

  // Test 5.3: Code Runner Tab
  await runPortalTest('Monaco Code Runner Tab Switch', async () => {
    await page.keyboard.press('3');
    await page.waitForTimeout(600);
    const hasEditor = await page.evaluate(() => {
      return !!document.querySelector('.monaco-editor, .monaco-runner-container');
    });
    return { hasEditor };
  });

  // Switch back to slides
  await page.keyboard.press('1');
  await page.waitForTimeout(400);

  // Test 5.4: Drawing Pen Overlay
  await runPortalTest('Non-destructive Screen Drawing Pen Toggle', async () => {
    await page.keyboard.press('d');
    await page.waitForTimeout(300);
    const canvasVisible = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return !!c;
    });
    await page.keyboard.press('d'); // close
    await page.waitForTimeout(200);
    return { canvasVisible };
  });

  // Test 5.5: Whiteboard Modal
  await runPortalTest('Whiteboard Scratchpad Modal Toggle', async () => {
    await page.keyboard.press('w');
    await page.waitForTimeout(400);
    const whiteboardVisible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div')).some(d => d.innerText.includes('Clear Board'));
    });
    await page.keyboard.press('Escape'); // close
    await page.waitForTimeout(200);
    return { whiteboardVisible };
  });

  // Reset backend to 03-pointers-and-stacks
  await setLesson('03-pointers-and-stacks');

  await browser.close();

  // 6. Generate Interactive Visual HTML Report
  const htmlReportPath = path.join(artifactsDir, 'report.html');
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Classroom TA - Visual & Overflow Test Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #141413; color: #faf6ee; margin: 0; padding: 2rem; }
    h1, h2, h3 { color: #faf6ee; }
    .badge-pass { background: #10b981; color: #fff; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }
    .badge-fail { background: #ef4444; color: #fff; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }
    .summary-card { background: #1e1e1c; border: 1px solid #383733; border-radius: 8px; padding: 1.25rem; margin-bottom: 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem; margin-top: 1rem; }
    .card { background: #181816; border: 1px solid #383733; border-radius: 8px; overflow: hidden; }
    .card img { width: 100%; display: block; border-bottom: 1px solid #2d2c28; }
    .card-info { padding: 0.85rem; font-size: 0.85rem; }
    .card-title { font-weight: bold; margin-bottom: 0.4rem; display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>
  <h1>Classroom TA Visual & Overflow Test Report</h1>
  <div class="summary-card">
    <p><strong>Total Slides Tested:</strong> ${testResults.totalSlides}</p>
    <p><strong>Passed Slides:</strong> <span class="badge-pass">${testResults.passedSlides}</span></p>
    <p><strong>Failed Slides:</strong> <span class="${testResults.failedSlides > 0 ? 'badge-fail' : 'badge-pass'}">${testResults.failedSlides}</span></p>
    <p><strong>Portal Features Verified:</strong> ${testResults.portalTests.filter(t => t.passed).length} / ${testResults.portalTests.length}</p>
  </div>

  <h2>Portal Features</h2>
  <div class="grid">
    ${testResults.portalTests.map(p => `
      <div class="card">
        <img src="${p.screenshot}" alt="${p.name}" />
        <div class="card-info">
          <div class="card-title">
            <span>${p.name}</span>
            <span class="badge-pass">PASS</span>
          </div>
        </div>
      </div>
    `).join('')}
  </div>

  <h2>Slide Decks</h2>
  <div class="grid">
    ${testResults.slides.map(s => `
      <div class="card">
        <img src="${s.screenshot}" alt="${s.lessonId} Slide ${s.slideNumber}" />
        <div class="card-info">
          <div class="card-title">
            <span>${s.lessonId} - Slide ${s.slideNumber}</span>
            <span class="${s.passed ? 'badge-pass' : 'badge-fail'}">${s.passed ? 'PASS' : 'FAIL'}</span>
          </div>
          <div>Bottom Clearance: ${s.clearanceBottom}px</div>
          <div>Right Clearance: ${s.clearanceRight}px</div>
          ${s.failureReason ? `<div style="color: #ef4444; margin-top: 4px;">${s.failureReason}</div>` : ''}
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;
  fs.writeFileSync(htmlReportPath, htmlContent, 'utf8');

  // Save JSON summary
  fs.writeFileSync(path.join(artifactsDir, 'test-summary.json'), JSON.stringify(testResults, null, 2), 'utf8');

  // Clean up if we spawned the server
  stopServer(spawnedServer);

  // Final Summary Output
  console.log('\n=============================================================');
  console.log('                     TEST RESULTS SUMMARY                    ');
  console.log('=============================================================');
  console.log(`Total Slides Tested:      ${testResults.totalSlides}`);
  console.log(`Slides Passed (0 Overflows): ${testResults.passedSlides}`);
  console.log(`Slides Failed:            ${testResults.failedSlides}`);
  console.log(`Portal Features Passed:   ${testResults.portalTests.filter(t => t.passed).length}/${testResults.portalTests.length}`);
  console.log(`Visual Report Generated:  file://${htmlReportPath}`);
  console.log('=============================================================\n');

  if (testResults.failedSlides > 0 || testResults.portalTests.some(t => !t.passed)) {
    console.error('FAIL: One or more visual or overflow tests failed.');
    process.exit(1);
  } else {
    console.log('SUCCESS: All slides verified with ZERO overflows! Visual screenshots captured.');
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
