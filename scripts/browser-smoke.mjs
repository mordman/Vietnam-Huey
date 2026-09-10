import { chromium } from 'playwright';

const baseUrl = process.env.SMOKE_URL ?? 'http://127.0.0.1:4173/';
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

const browser = await chromium.launch({
  headless: true,
  args: ['--disable-gpu', '--use-gl=swiftshader'],
});

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.url()} (${request.failure()?.errorText ?? 'unknown'})`);
  });

  const response = await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1800);

  if (!response || !response.ok()) {
    throw new Error(`Page returned ${response?.status() ?? 'no response'}`);
  }
  if (!(await page.locator('canvas').count())) throw new Error('Three.js canvas was not created');
  if (!(await page.evaluate(() => Boolean(window.game?.isRunning)))) {
    throw new Error('Game loop did not start');
  }
  if (consoleErrors.length || pageErrors.length || failedRequests.length) {
    throw new Error([
      ...consoleErrors.map((error) => `console.error: ${error}`),
      ...pageErrors.map((error) => `pageerror: ${error}`),
      ...failedRequests.map((error) => `requestfailed: ${error}`),
    ].join('\n'));
  }

  console.log(`browser smoke ok: ${baseUrl}`);
} finally {
  await browser.close();
}