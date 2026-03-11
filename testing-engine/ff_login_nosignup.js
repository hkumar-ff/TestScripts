import puppeteer from 'puppeteer';
import { sleepTime } from './config.js';
import { sleep } from './common.js';

function normalizeTargetUrl(inputUrl) {
  if (!inputUrl) return inputUrl;
  const trimmed = inputUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// Helper function to wait for page to fully load
async function waitForPageLoad(page, timeoutMs = 30000) {
  try {
    // Wait for network idle (no requests for 500ms)
    await page.waitForNetworkIdle({ idleTime: 500, timeout: timeoutMs }).catch(() => {});
  } catch (e) {
    // If network idle fails, try alternative approach
    try {
      await page.waitForFunction(() => document.readyState === 'complete', { timeout: timeoutMs }).catch(() => {});
    } catch (e2) {
      // Continue even if this fails
    }
  }
  
  // Additional wait for DOM stability
  await page.waitForFunction(() => {
    return document.readyState === 'complete' && 
           !document.body.querySelector('.loading') && 
           !document.body.querySelector('[class*="loading"]');
  }, { timeout: timeoutMs }).catch(() => {});
}

async function safeClickSelector(page, selector, label) {
  await page.waitForSelector(selector, { visible: true, timeout: 15000 });
  await page.$eval(selector, (el) => {
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  });

  try {
    await page.click(selector);
  } catch {
    const clicked = await page.$eval(selector, (el) => {
      if (!el || typeof el.click !== 'function') return false;
      el.click();
      return true;
    });
    if (!clicked) throw new Error(`${label} not clickable`);
  }
}

async function safeClickByText(page, textMatchers, label) {
  await page.waitForFunction(
    (matchers) => {
      const normalize = (t) => (t || '').toLowerCase().replace(/[\s_-]+/g, ' ').trim();
      const isVisible = (el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };

      const candidates = Array.from(document.querySelectorAll('button, a, div, span'));
      return candidates.some((node) => {
        const text = normalize(node.textContent || '');
        return matchers.includes(text) && isVisible(node);
      });
    },
    { timeout: 15000 },
    textMatchers
  );

  const clicked = await page.evaluate((matchers) => {
    const normalize = (t) => (t || '').toLowerCase().replace(/[\s_-]+/g, ' ').trim();
    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };

    const candidates = Array.from(document.querySelectorAll('button, a, div, span'));
    const el = candidates.find((node) => {
      const text = normalize(node.textContent || '');
      return matchers.includes(text) && isVisible(node);
    });

    if (!el || typeof el.click !== 'function') return false;
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    el.click();
    return true;
  }, textMatchers);

  if (!clicked) throw new Error(`${label} button not found/clickable`);
}

async function safeClickButtonByLabel(page, buttonLabel) {
  await page.waitForFunction(
    (targetLabel) => {
      const normalize = (t) => (t || '').toLowerCase().replace(/[\s_-]+/g, ' ').trim();
      const isVisible = (el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };

      const target = normalize(targetLabel);
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some((btn) => normalize(btn.textContent || '') === target && isVisible(btn));
    },
    { timeout: 15000 },
    buttonLabel
  );

  const clicked = await page.evaluate((targetLabel) => {
    const normalize = (t) => (t || '').toLowerCase().replace(/[\s_-]+/g, ' ').trim();
    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };

    const target = normalize(targetLabel);
    const buttons = Array.from(document.querySelectorAll('button'));
    const button = buttons.find((btn) => normalize(btn.textContent || '') === target && isVisible(btn));
    if (!button || typeof button.click !== 'function') return false;
    button.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    button.click();
    return true;
  }, buttonLabel);

  if (!clicked) throw new Error(`Button with label "${buttonLabel}" not found/clickable`);
}

async function runTest(targetUrl) {
  if (!targetUrl) {
    console.log('target URL not provided');
    process.exit(1);
  }

  const normalizedUrl = normalizeTargetUrl(targetUrl);

  console.log('Working with target URL:', normalizedUrl);

  const browser = await puppeteer.launch({
    headless: false,
    protocolTimeout: 240000,
    args: ['--start-maximized'],
  });

  const page = await browser.newPage();
  await page.setViewport(null);
  const sleepFunc = sleep(sleepTime, page);

  try {
    // Open target URL.
    await sleepFunc();
    await page.goto(normalizedUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleepFunc();

    console.log('Website opened in browser.');

    // 1) Open profile popup
    // await sleepFunc();
    // await safeClickSelector(page, '#profile-button', '#profile-button');
    // console.log('Clicked #profile-button');

    // 2) Verify popup text
    await sleepFunc();
    await page.waitForFunction(
      () => document.body && document.body.innerText.includes('Create a free account'),
      { timeout: 15000 }
    );
    console.log('Popup with "Create a free account" is visible');

    // 3) Click "Log In"
    await sleepFunc();
    await safeClickByText(page, ['log in', 'login'], 'Log In');
    console.log('Clicked Log In');

    // 4) Fill email in "Enter your email"
    const emailSelector = 'input[placeholder*="Enter your email" i], input[type="email"]';
    await sleepFunc();
    await page.waitForSelector(emailSelector, { visible: true, timeout: 15000 });
    await sleepFunc();
    await page.click(emailSelector, { clickCount: 3 });
    await sleepFunc();
    await page.type(emailSelector, input_data.email || 'hktesting@farmfetch.com');
    console.log('Entered email');

    // 5) Click "continue"
    await sleepFunc();
    await safeClickButtonByLabel(page, 'Continue');
    console.log('Clicked continue');

    // 6) Fill password
    const passwordSelector = 'input[type="password"]';
    await sleepFunc();
    await page.waitForSelector(passwordSelector, { visible: true, timeout: 15000 });
    await sleepFunc();
    await page.click(passwordSelector, { clickCount: 3 });
    await sleepFunc();
    await page.type(passwordSelector, input_data.password || 'abcd1234');
    console.log('Entered password');

    // 7) Click sign-in
    await sleepFunc();
    await safeClickByText(page, ['sign in', 'signin'], 'Sign-in');
    console.log('Clicked sign-in');

    // Wait for dashboard to load
    await waitForPageLoad(page);
    console.log('Dashboard loaded after login');

    await sleepFunc();
    console.log('Login test completed successfully!');

  } catch (error) {
    console.log(`ERROR: ${error?.message || error}`);
    console.log(`Current URL at failure: ${page.url()}`);
    await page.screenshot({ path: `ff_login_nosignup_error_${Date.now()}.png`, fullPage: true }).catch(() => {});
    await browser.close();
    process.exit(1);
  }
}

// Parse input JSON from command line arguments
const test_url = process.argv[2];
const input_json = process.argv[3] || '{}';
let input_data;
try {
  input_data = JSON.parse(input_json);
} catch (e) {
  console.log('Error parsing input JSON:', e.message);
  input_data = {};
}
console.log('Input data:', input_data);

runTest(test_url);