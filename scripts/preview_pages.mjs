import { chromium } from 'playwright';
import path from 'node:path';

async function capture() {
  const browser = await chromium.launch({
    executablePath: '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
  const htmlPath = 'file://' + path.resolve(process.cwd(), 'public', 'proposal_template.html');
  await page.goto(htmlPath, { waitUntil: 'networkidle' });

  const pages = await page.$$('.page');
  for (let i = 0; i < pages.length; i++) {
    const outPath = path.resolve(process.cwd(), `preview_page_${i + 1}.png`);
    await pages[i].screenshot({ path: outPath });
    console.log(`Saved preview_page_${i + 1}.png`);
  }
  await browser.close();
}

capture().catch(console.error);
