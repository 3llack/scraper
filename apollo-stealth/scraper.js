const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
  // === CONFIG ===
  const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const USER_DATA_DIR = 'C:/Users/HP/AppData/Local/Google/Chrome/User Data/Profile 7';
  const BASE_URL = 'https://app.apollo.io/#/people';
  const SEARCH_QS = 'page=1&contactEmailStatusV2[]=verified&personTitles[]=payroll%20manager&personTitles[]=hr%20manager&personSeniorities[]=head&personSeniorities[]=director&personSeniorities[]=manager&personLocations[]=Australia&personLocations[]=France&personLocations[]=Germany&organizationNumEmployeesRanges[]=1%2C10&organizationNumEmployeesRanges[]=11%2C20&organizationNumEmployeesRanges[]=21%2C50&organizationNumEmployeesRanges[]=51%2C100&organizationIndustryTagIds[]=5567d01e73696457ee100000&organizationIndustryTagIds[]=5567ced173696450cb580000&organizationIndustryTagIds[]=5567d0467369645dbc200000&organizationIndustryTagIds[]=5567cddb7369644d250c0000&organizationIndustryTagIds[]=5567cd4773696439dd350000&organizationIndustryTagIds[]=5567cd4973696439b9010000&organizationIndustryTagIds[]=5567cd4c73696439c9030000&organizationIndustryTagIds[]=5567e1b3736964208b280000&sortAscending=false&sortByField=recommendations_score';
  const OUT_FILE = 'leads.json';

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    args: ['--start-maximized']
  });

  const page = (await browser.pages())[0];

  function buildSearchUrl(pageNum) {
    const params = new URLSearchParams(SEARCH_QS);
    params.set('page', String(pageNum));
    return `${BASE_URL}?${params.toString()}`;
  }

  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function scrollGridToRenderAll(page) {
    await page.evaluate(async () => {
      const scroller =
        document.querySelector('[data-testid*="VirtualScroller" i]') ||
        document.querySelector('[class*="VirtualScroller" i]') ||
        document.querySelector('[role="grid"]') ||
        document.scrollingElement;
      if (!scroller) return;

      let lastCount = 0;
      let stable = 0;

      for (let i = 0; i < 60; i++) {
        scroller.scrollBy(0, scroller.clientHeight);
        await new Promise((r) => setTimeout(r, 250));
        const rows = document.querySelectorAll('div[role="row"]');
        if (rows.length === lastCount) stable++;
        else { lastCount = rows.length; stable = 0; }
        if (stable >= 3) break;
      }
      scroller.scrollTo(0, 0);
    });
  }

  async function extractRows(page) {
  return await page.evaluate(async () => {
    const rows = Array.from(document.querySelectorAll('div[role="row"]'))
      .filter(r => r.querySelectorAll('div[role="cell"]').length > 0);

    const results = [];
    for (const row of rows) {
      try {
        const cells = row.querySelectorAll('div[role="cell"]');
        const name = (cells[0]?.innerText || '').trim();
        const title = (cells[1]?.innerText || '').trim();
        const company = (cells[2]?.innerText || '').trim();

        // click "Access Mail" if available
        const mailBtn = Array.from(row.querySelectorAll('button'))
          .find(b => b.innerText.trim().toLowerCase() === 'access mail');
        if (mailBtn) mailBtn.click();

        // wait for email to appear
        const email = await new Promise(resolve => {
          const check = () => {
            const mailEl = row.querySelector('a[href^="mailto:"]');
            if (mailEl) resolve(mailEl.getAttribute('href').replace(/^mailto:/, ''));
            else setTimeout(check, 500);
          };
          check();
        });

        results.push({ name, title, company, email });
      } catch {
        continue;
      }
    }
    return results;
  });
  }


  const leads = [];
  const seen = new Set();
  let pageNum = 1;

  while (true) {
    const url = buildSearchUrl(pageNum);
    console.log(`\n=== Page ${pageNum} ===`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    try {
      await page.waitForSelector('div[role="row"]', { timeout: 60000 });
    } catch {
      console.log('No rows found, stopping.');
      break;
    }

    await scrollGridToRenderAll(page);

    const rows = await extractRows(page);
    if (!rows.length) break;

    let added = 0;
    for (const r of rows) {
      const key = `${r.name}||${r.company}`;
      if (!seen.has(key) && (r.name || r.company || r.title)) {
        seen.add(key);
        leads.push(r);
        added++;
      }
    }

    console.log(`Found ${rows.length} rows, added ${added}, total: ${leads.length}`);
    fs.writeFileSync(OUT_FILE, JSON.stringify(leads, null, 2));

    pageNum++;
    await sleep(1000 + Math.random() * 1000); // small random delay to avoid bot detection
  }

  console.log(`\nDone. Saved ${leads.length} leads to ${OUT_FILE}`);
  await browser.close();
})();
