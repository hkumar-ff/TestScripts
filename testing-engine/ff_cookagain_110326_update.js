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

async function safeClickButtonByLabelContains(page, labelPart) {
  await page.waitForFunction(
    (targetPart) => {
      const normalize = (t) => (t || '').toLowerCase().replace(/[\s_-]+/g, ' ').trim();
      const isVisible = (el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };

      const target = normalize(targetPart);
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some((btn) => normalize(btn.textContent || '').includes(target) && isVisible(btn));
    },
    { timeout: 15000 },
    labelPart
  );

  const clicked = await page.evaluate((targetPart) => {
    const normalize = (t) => (t || '').toLowerCase().replace(/[\s_-]+/g, ' ').trim();
    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };

    const target = normalize(targetPart);
    const buttons = Array.from(document.querySelectorAll('button'));
    const button = buttons.find((btn) => normalize(btn.textContent || '').includes(target) && isVisible(btn));
    if (!button || typeof button.click !== 'function') return false;
    button.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    button.click();
    return true;
  }, labelPart);

  if (!clicked) throw new Error(`Button containing label "${labelPart}" not found/clickable`);
}

// Get buttons from "Dishes by Cuisine" section
async function getDishesByCuisineButtonsByXPath(page) {
  // XPath to get all buttons under div[2] in the Dishes by Cuisine section
  // Pattern: //*[@id="root"]/div/main/div/main/div[2]/div/div/div[2]/div[2]//button
  const xpath = '//*[@id="root"]/div/main/div/main/div[2]/div/div/div[2]/div[2]//button';
  
  const result = await page.evaluate((xpathExpr) => {
    const buttons = document.evaluate(
      xpathExpr,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    const allLabels = [];
    for (let i = 0; i < buttons.snapshotLength; i++) {
      const btn = buttons.snapshotItem(i);
      const label = (btn.textContent || '').replace(/\s+/g, ' ').trim() || '(no label)';
      allLabels.push(label);
    }

    return {
      found: allLabels.length > 0,
      count: allLabels.length,
      labels: allLabels
    };
  }, xpath);

  return result;
}

// Click 3 random buttons from "Dishes by Cuisine" section
async function clickThreeDishesByCuisine(page) {
  const dishesData = await getDishesByCuisineButtonsByXPath(page);
  
  if (!dishesData.found || dishesData.count < 3) {
    throw new Error(`Not enough dishes in "Dishes by Cuisine" section. Found: ${dishesData.count}`);
  }

  // Get the actual button elements to click using XPath
  const clickedButtons = await page.evaluate(() => {
    // XPath to get all buttons under div[2] in the Dishes by Cuisine section
    const buttons = document.evaluate(
      '//*[@id="root"]/div/main/div/main/div[2]/div/div/div[2]/div[2]//button',
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    const allButtons = [];
    for (let i = 0; i < buttons.snapshotLength; i++) {
      allButtons.push(buttons.snapshotItem(i));
    }

    // Filter visible and enabled buttons
    const visibleButtons = allButtons.filter((btn) => {
      const rect = btn.getBoundingClientRect();
      const style = window.getComputedStyle(btn);
      return rect.width > 0 && rect.height > 0 && 
             style.visibility !== 'hidden' && 
             style.display !== 'none' &&
             !btn.disabled;
    });

    // Shuffle and pick 3
    const shuffled = visibleButtons.sort(() => Math.random() - 0.5);
    const targets = shuffled.slice(0, 3);
    
    const labels = [];
    targets.forEach((btn) => {
      btn.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
      labels.push((btn.textContent || '').trim());
      btn.click();
    });

    return labels;
  });

  if (clickedButtons.length < 3) {
    throw new Error(`Could only click ${clickedButtons.length} buttons from "Dishes by Cuisine", expected 3`);
  }

  return clickedButtons;
}

async function assertPageHasText(page, expectedText) {
  const found = await page.evaluate((text) => {
    const bodyText = (document.body?.innerText || '').toLowerCase();
    return bodyText.includes((text || '').toLowerCase());
  }, expectedText);

  if (!found) {
    throw new Error(`Expected text not found on page: "${expectedText}"`);
  }
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

    // ===== LOGIN FLOW (from ff_login_nosignup.js) =====
    
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

    // ===== DISH SELECTION AND COOKING FLOW (from ff_cookagain.js) =====
    
    // Wait for "Dishes by Cuisine" section to fully load
    await waitForPageLoad(page);
    console.log('Waiting for "Dishes by Cuisine" section to load...');
    
    // Additional wait to ensure dishes are fully rendered
    await sleepFunc();
    await sleepFunc();

    // Select 3 random dishes from "Dishes by Cuisine" section
    console.log('Selecting 3 dishes from "Dishes by Cuisine"...');
    await sleepFunc();
    const selectedDishes = await clickThreeDishesByCuisine(page);
    console.log(`Selected 3 dishes: ${selectedDishes.join(' | ')}`);
    
    // Wait for page to fully load after selecting dishes
    await waitForPageLoad(page);
    console.log('Page fully loaded after selecting dishes');

    // Click the button whose label contains "Let's Cook".
    await sleepFunc();
    await safeClickButtonByLabelContains(page, "Let's Cook");
    console.log('Clicked button containing "Let\'s Cook"');
    
    // Wait for page to fully load after clicking
    await waitForPageLoad(page);
    console.log('Page fully loaded after clicking "Let\'s Cook"');

    // Validate next page title/content contains "Plan Details".
    // If missing, test fails immediately.
    await sleepFunc();
    await assertPageHasText(page, 'Plan Details');
    console.log('Verified page contains "Plan Details"');

    // Then click the button whose label contains "Customize Ingredients".
    // Extra wait before step to stabilize UI.
    await sleepFunc();
    await sleepFunc();
    await sleepFunc();
    await safeClickButtonByLabelContains(page, 'Customize Ingredients');
    console.log('Clicked button containing "Customize Ingredients"');
    
    // Wait for page to fully load after clicking
    await waitForPageLoad(page);
    console.log('Page fully loaded after clicking "Customize Ingredients"');

    // Validate the next page contains title/content "Customize Ingredients".
    // If missing, fail the script.
    await sleepFunc();
    await assertPageHasText(page, 'Customize Ingredients');
    console.log('Verified page contains "Customize Ingredients"');

    // Click button whose label contains "View Recipe & Shopping List".
    await sleepFunc();
    await safeClickButtonByLabelContains(page, 'View Recipe & Shopping List');
    console.log('Clicked button containing "View Recipe & Shopping List"');
    
    // Wait for page to fully load after clicking
    await waitForPageLoad(page);
    console.log('Page fully loaded after clicking "View Recipe & Shopping List"');

    // Verify that the page opened after step has a button with label containing "Share with Yourself"
    await sleepFunc();
    const hasShareWithYourself = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => {
        const text = (btn.textContent || '').toLowerCase().replace(/[\s_-]+/g, ' ').trim();
        return text.includes('share with yourself');
      });
    });

    if (!hasShareWithYourself) {
      throw new Error('ERROR: The page does not have a button with label containing "Share with Yourself"');
    }
    console.log('PASS: Button with label containing "Share with Yourself" found');

    // Click the "Share with Yourself" button
    await sleepFunc();
    await safeClickButtonByLabelContains(page, 'Share with Yourself');
    console.log('Clicked "Share with Yourself" button');

    // Wait for page to fully load after clicking "Share with Yourself"
    await waitForPageLoad(page);
    console.log('Page fully loaded after clicking "Share with Yourself"');

    await sleepFunc();
    console.log('Test completed successfully!');

  } catch (error) {
    console.log(`ERROR: ${error?.message || error}`);
    console.log(`Current URL at failure: ${page.url()}`);
    await page.screenshot({ path: `ff_cookagain_110326_update_error_${Date.now()}.png`, fullPage: true }).catch(() => {});
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