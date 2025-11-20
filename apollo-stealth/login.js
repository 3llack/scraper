const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', 
    userDataDir: 'C:/Users/HP/AppData/Local/Google/Chrome/User Data/Profile 7', 
    args: ['--start-maximized']
  });

  const page = (await browser.pages())[0]; 
  await page.goto('https://app.apollo.io', { waitUntil: 'domcontentloaded' });

  const cookies = await page.cookies();
  fs.writeFileSync('auth.json', JSON.stringify(cookies, null, 2));

  console.log(`Cookies saved to auth.json`);
  await browser.close();
})();
