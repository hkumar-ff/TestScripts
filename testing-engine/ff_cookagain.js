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

async function clickAnyThreeTransitionButtons(page) {
  // Wait until at least 3 visible, enabled buttons with class "transition-all" are present.
  await page.waitForFunction(
    () => {
      const isVisible = (el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };

      const buttons = Array.from(document.querySelectorAll('button.transition-all')).filter(
        (btn) => isVisible(btn) && !btn.disabled
      );
      return buttons.length >= 3;
    },
    { timeout: 15000 }
  );

  // Click any 3 RANDOM buttons from the matching list.
  const clickedButtonTexts = await page.evaluate(() => {
    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };

    const buttons = Array.from(document.querySelectorAll('button.transition-all')).filter(
      (btn) => isVisible(btn) && !btn.disabled
    );
    const shuffled = [...buttons].sort(() => Math.random() - 0.5);
    const targets = shuffled.slice(0, 3);
    if (targets.length < 3) return [];

    return targets.map((target) => {
      target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
      const label = (target.textContent || '').trim() || '(no label)';
      target.click();
      return label;
    });
  });

  if (!clickedButtonTexts || clickedButtonTexts.length < 3) {
    throw new Error('Unable to click 3 buttons with class "transition-all"');
  }

  return clickedButtonTexts;
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

async function waitForDialog(page, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      page.removeListener('dialog', onDialog);
      reject(new Error(`Dialog did not appear within ${timeoutMs}ms`));
    }, timeoutMs);

    const onDialog = (dialog) => {
      clearTimeout(timer);
      resolve(dialog);
    };

    page.once('dialog', onDialog);
  });
}

async function getButtonsInGrandparentOfText(page, textToFind) {
  const result = await page.evaluate((targetText) => {
    const normalize = (t) => (t || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const wanted = normalize(targetText);

    const allNodes = Array.from(document.querySelectorAll('body *'));
    const match = allNodes.find((el) => normalize(el.textContent || '') === wanted);

    if (!match) {
      return { found: false, count: 0 };
    }

    const grandParent = match.parentElement?.parentElement;
    if (!grandParent) {
      return { found: true, count: 0, labels: [] };
    }

    const buttons = Array.from(grandParent.querySelectorAll('button'));
    const labels = buttons.map((btn) => (btn.textContent || '').replace(/\s+/g, ' ').trim() || '(no label)');
    const buttonCount = buttons.length;
    return { found: true, count: buttonCount, labels };
  }, textToFind);

  return result;
}

async function getButtonsInSpaceY3(page) {
  const result = await page.evaluate(() => {
    const spaceY3Divs = Array.from(document.querySelectorAll('div.space-y-3'));
    
    if (spaceY3Divs.length === 0) {
      return { found: false, count: 0, labels: [] };
    }

    // Get buttons from all space-y-3 divs
    const allButtons = [];
    spaceY3Divs.forEach((div) => {
      const buttons = Array.from(div.querySelectorAll('button'));
      buttons.forEach((btn) => {
        const label = (btn.textContent || '').replace(/\s+/g, ' ').trim() || '(no label)';
        allButtons.push(label);
      });
    });

    return { 
      found: allButtons.length > 0, 
      count: allButtons.length, 
      labels: allButtons 
    };
  });

  return result;
}

async function getCookAgainButtonsByXPath(page) {
  const xpath = '//*[@id="root"]/div/main/div/main/div[2]/div/div/div[1]/div/div[2]/button';
  
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


async function getCookAgainButtonsByXPathWithLabel(page) {
  const result = await page.evaluate(() => {
    const cookAgainButtons = [];
    const cookAgainLabels = document.evaluate(
        "//h2[contains(text(), 'Cook Again')]",
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
    );

    for (let i = 0; i < cookAgainLabels.snapshotLength; i++) {
        const label = cookAgainLabels.snapshotItem(i);
        const grandParentDiv = label.parentElement.parentElement;
        if (grandParentDiv && grandParentDiv.tagName === 'DIV') {
            const buttons = grandParentDiv.querySelectorAll('button');
            buttons.forEach(button => {
                if (!cookAgainButtons.includes(button)) {
                    cookAgainButtons.push(button);
                }
            });
        }
    }

    const allLabels = cookAgainButtons.map((btn) => (btn.textContent || '').replace(/\s+/g, ' ').trim() || '(no label)');
    
    return {
      found: allLabels.length > 0,
      count: allLabels.length,
      labels: allLabels
    };
  });

  return result;
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

function getLabelMultisetDiff(initialLabels, postLabels) {
  const toCounts = (arr) => {
    const counts = new Map();
    for (const label of arr || []) {
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    return counts;
  };

  const initialCounts = toCounts(initialLabels);
  const postCounts = toCounts(postLabels);
  const allLabels = new Set([...initialCounts.keys(), ...postCounts.keys()]);

  const added = [];
  const removed = [];

  for (const label of allLabels) {
    const before = initialCounts.get(label) || 0;
    const after = postCounts.get(label) || 0;
    if (after > before) added.push(`${label} (+${after - before})`);
    if (before > after) removed.push(`${label} (-${before - after})`);
  }

  return { added, removed };
}

function normalizeLabelValue(label) {
  return (label || '').toLowerCase().replace(/\s+/g, ' ').trim();
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
    await sleepFunc();
    await safeClickSelector(page, '#profile-button', '#profile-button');
    console.log('Clicked #profile-button');

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
    await page.type(emailSelector, 'hktesting@farmfetch.com');
    console.log('Entered email');

    // Baseline before step 5: capture Cook Again button count + labels.
    await sleepFunc();
    const initialCookAgain = await getButtonsInGrandparentOfText(page, 'Cook Again');
    if (initialCookAgain.found) {
      console.log(`Initial Cook Again buttons count: ${initialCookAgain.count}`);
      console.log(`Initial Cook Again button labels: ${initialCookAgain.labels.join(' | ') || '(none)'}`);
    } else {
      console.log('Initial Cook Again not found on the page.');
    }

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
    await page.type(passwordSelector, 'abcd1234');
    console.log('Entered password');

    // 7) Click sign-in
    await sleepFunc();
    await safeClickByText(page, ['sign in', 'signin'], 'Sign-in');
    console.log('Clicked sign-in');

    // Repeat steps 8 to 15 for 25 iterations after login.
    // Keep previous round Cook Again snapshot so comparison is against last round,
    // not always against the initial baseline.
    let previousCookAgain = initialCookAgain;
    for (let iteration = 1; iteration <= 25; iteration++) {
      console.log(`Starting cycle ${iteration}/25 (steps 8-15)`);

      // Wait for page to fully load before starting
      await waitForPageLoad(page);

      // STEP 8: Capture current Cook Again buttons BEFORE selecting new dishes
      const cookAgainBefore = await getCookAgainButtonsByXPath(page);
      console.log(`Cook Again BEFORE selection: ${cookAgainBefore.count} buttons`);
      console.log(`Labels: ${(cookAgainBefore.labels || []).join(' | ') || '(none)'}`);

      // Wait for "Dishes by Cuisine" section to fully load
      await waitForPageLoad(page);
      console.log('Waiting for "Dishes by Cuisine" section to load...');
      
      // Additional wait to ensure dishes are fully rendered
      await sleepFunc();
      await sleepFunc();

      // STEP 9: Select 3 random dishes from "Dishes by Cuisine" section
      console.log('Selecting 3 dishes from "Dishes by Cuisine"...');
      await sleepFunc();
      const selectedDishes = await clickThreeDishesByCuisine(page);
      console.log(`Selected 3 dishes: ${selectedDishes.join(' | ')}`);
      
      // Wait for page to fully load after selecting dishes
      await waitForPageLoad(page);
      console.log('Page fully loaded after selecting dishes');

      // STEP 10: Click the button whose label contains "Let's Cook".
      await sleepFunc();
      await safeClickButtonByLabelContains(page, "Let's Cook");
      console.log('Clicked button containing "Let\'s Cook"');
      
      // Wait for page to fully load after clicking
      await waitForPageLoad(page);
      console.log('Page fully loaded after clicking "Let\'s Cook"');

      // STEP 11: Validate next page title/content contains "Plan Details".
      //     If missing, test fails immediately.
      await sleepFunc();
      await assertPageHasText(page, 'Plan Details');
      console.log('Verified page contains "Plan Details"');

      // STEP 12: Then click the button whose label contains "Customize Ingredients".
      // Extra wait before step 12 to stabilize UI.
      await sleepFunc();
      await sleepFunc();
      await sleepFunc();
      await safeClickButtonByLabelContains(page, 'Customize Ingredients');
      console.log('Clicked button containing "Customize Ingredients"');
      
      // Wait for page to fully load after clicking
      await waitForPageLoad(page);
      console.log('Page fully loaded after clicking "Customize Ingredients"');

      // STEP 13: Validate the next page contains title/content "Customize Ingredients".
      //     If missing, fail the script.
      await sleepFunc();
      await assertPageHasText(page, 'Customize Ingredients');
      console.log('Verified page contains "Customize Ingredients"');

      // STEP 14: Click button whose label contains "View Recipe & Shopping List".
      await sleepFunc();
      await safeClickButtonByLabelContains(page, 'View Recipe & Shopping List');
      console.log('Clicked button containing "View Recipe & Shopping List"');
      
      // Wait for page to fully load after clicking
      await waitForPageLoad(page);
      console.log('Page fully loaded after clicking "View Recipe & Shopping List"');

      // STEP 15: Verify that the page opened after step 14 has a button with label containing "Share with Yourself"
      await sleepFunc();
      const hasShareWithYourself = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => {
          const text = (btn.textContent || '').toLowerCase().replace(/[\s_-]+/g, ' ').trim();
          return text.includes('share with yourself');
        });
      });

      if (!hasShareWithYourself) {
        throw new Error('ERROR: After step 14, the page does not have a button with label containing "Share with Yourself"');
      }
      console.log('PASS: Button with label containing "Share with Yourself" found on the page after step 14');

      // Click the "Share with Yourself" button
      await sleepFunc();
      await safeClickButtonByLabelContains(page, 'Share with Yourself');
      console.log('Clicked "Share with Yourself" button');
      
      // Wait for page to fully load after clicking "Share with Yourself"
      await waitForPageLoad(page);
      console.log('Page fully loaded after clicking "Share with Yourself"');

      // Wait for popup to appear and then close it
      await sleepFunc();
      await sleepFunc();
      console.log('Waiting for popup to appear...');
      
      // Try to close popup by clicking "Close" button or "X" anchor
      const popupClosed = await page.evaluate(() => {
        // Find button with "Close" label
        const closeButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
          const text = (btn.textContent || '').toLowerCase().trim();
          return text === 'close';
        });
        
        if (closeButtons.length > 0) {
          closeButtons[0].click();
          return true;
        }
        
        // Find anchor with "X" label
        const xAnchors = Array.from(document.querySelectorAll('a')).filter(a => {
          const text = (a.textContent || '').toLowerCase().trim();
          return text === 'x';
        });
        
        if (xAnchors.length > 0) {
          xAnchors[0].click();
          return true;
        }
        
        return false;
      });

      if (popupClosed) {
        console.log('Closed popup successfully');
      } else {
        console.log('No popup close button found, continuing...');
      }

      // Wait after attempting to close popup
      await sleepFunc();
      console.log('Waited after popup handling');

      // STEP 16: Click header logo trigger to return to dashboard.
      await sleepFunc();
      await sleepFunc();
      await sleepFunc();
      await sleepFunc();
      await safeClickSelector(page, '#header-logo-trigger', '#header-logo-trigger');
      console.log('Clicked #header-logo-trigger to go back to dashboard');
      
      // Wait for page to fully load after clicking header logo
      await waitForPageLoad(page);
      console.log('Page fully loaded after clicking header logo');

      // STEP 17: On dashboard, verify Cook Again has the new dishes added
      await sleepFunc();
      await sleepFunc();
      await sleepFunc();
      await sleepFunc();
      await sleepFunc();
      
      const postCookAgain = await getCookAgainButtonsByXPathWithLabel(page);
      if (!postCookAgain.found) {
        throw new Error('Cook Again buttons not found using label-based XPath while validating new dishes');
      }

      console.log(`Cook Again AFTER selection: ${postCookAgain.count} buttons`);
      console.log(`Labels: ${(postCookAgain.labels || []).join(' | ') || '(none)'}`);

      // Validate that the 3 selected dishes are now present in Cook Again
      const cookAgainNormalizedSet = new Set((postCookAgain.labels || []).map((l) => normalizeLabelValue(l)));
      const selectedDishesNormalized = selectedDishes.map((l) => normalizeLabelValue(l));
      
      const missingDishes = selectedDishesNormalized.filter((label) => !cookAgainNormalizedSet.has(label));
      if (missingDishes.length > 0) {
        throw new Error(
          `Selected dishes NOT added to Cook Again: ${missingDishes.join(' | ')}`
        );
      }
      
      console.log(`PASS: All 3 selected dishes are now in Cook Again: ${selectedDishes.join(' | ')}`);

      // Compare initial vs post-process Cook Again button sets and print reader-friendly summary.
      const diff = getLabelMultisetDiff(previousCookAgain.labels || [], postCookAgain.labels || []);
      const beforeTotal = previousCookAgain.count || 0;
      const afterTotal = postCookAgain.count || 0;
      const totalDifference = afterTotal - beforeTotal;
      const hasDifference =
        previousCookAgain.found !== postCookAgain.found ||
        beforeTotal !== afterTotal ||
        diff.added.length > 0 ||
        diff.removed.length > 0;

      console.log('---- Cook Again Comparison Summary ----');
      console.log(`Before total: ${beforeTotal}`);
      console.log(`Before labels: ${(previousCookAgain.labels || []).join(' | ') || '(none)'}`);
      console.log(`After total: ${afterTotal}`);
      console.log(`After labels: ${(postCookAgain.labels || []).join(' | ') || '(none)'}`);

      if (hasDifference) {
        console.log('Difference: YES');
        console.log(`Before total ${beforeTotal}, after total ${afterTotal}, difference ${totalDifference}`);
        if (previousCookAgain.found !== postCookAgain.found) {
          console.log(`Found-state changed: previous=${previousCookAgain.found}, current=${postCookAgain.found}`);
        }
        if (diff.added.length > 0) console.log(`Added labels: ${diff.added.join(' | ')}`);
        if (diff.removed.length > 0) console.log(`Removed labels: ${diff.removed.join(' | ')}`);
      } else {
        console.log('Difference: NO');
        console.log(`Before total ${beforeTotal}, after total ${afterTotal}, difference ${totalDifference}`);
        console.log('No difference between initial and post-processed Cook Again list.');
      }
      console.log('--------------------------------------');

      // Retain this round snapshot for the next iteration's comparison.
      previousCookAgain = {
        found: postCookAgain.found,
        count: postCookAgain.count,
        labels: [...(postCookAgain.labels || [])],
      };
    }

    await sleepFunc();
    console.log('Login flow completed.');
    
    // Add step to logout and login again and verify if cook again items are still the same
    await sleepFunc();
    await safeClickSelector(page, '#profile-button', '#profile-button');
    console.log('Clicked #profile-button to logout');
    
    await sleepFunc();
    await safeClickByText(page, ['log out', 'logout'], 'Log Out');
    console.log('Clicked Log Out');
    
    await sleepFunc();
    await safeClickByText(page, ['log in', 'login'], 'Log In');
    console.log('Clicked Log In');
    
    await sleepFunc();
    await page.waitForSelector(emailSelector, { visible: true, timeout: 15000 });
    await sleepFunc();
    await page.click(emailSelector, { clickCount: 3 });
    await sleepFunc();
    await page.type(emailSelector, 'hktesting@farmfetch.com');
    console.log('Entered email');
    
    await sleepFunc();
    await safeClickButtonByLabel(page, 'Continue');
    console.log('Clicked continue');
    
    await sleepFunc();
    await page.waitForSelector(passwordSelector, { visible: true, timeout: 15000 });
    await sleepFunc();
    await page.click(passwordSelector, { clickCount: 3 });
    await sleepFunc();
    await page.type(passwordSelector, 'abcd1234');
    console.log('Entered password');
    
    await sleepFunc();
    await safeClickByText(page, ['sign in', 'signin'], 'Sign-in');
    console.log('Clicked sign-in');
    
    await sleepFunc();
    const finalCookAgain = await getCookAgainButtonsByXPathWithLabel(page);
    if (!finalCookAgain.found) {
      throw new Error('Cook Again buttons not found after re-login');
    }
    
    console.log(`Cook Again after re-login: ${finalCookAgain.count} buttons`);
    console.log(`Labels: ${(finalCookAgain.labels || []).join(' | ') || '(none)'}`);
    
    const diff = getLabelMultisetDiff(previousCookAgain.labels || [], finalCookAgain.labels || []);
    const hasDifference = diff.added.length > 0 || diff.removed.length > 0;
    
    if (hasDifference) {
      console.log('ERROR: Cook Again items changed after re-login');
      if (diff.added.length > 0) console.log(`Added labels: ${diff.added.join(' | ')}`);
      if (diff.removed.length > 0) console.log(`Removed labels: ${diff.removed.join(' | ')}`);
    } else {
      console.log('PASS: Cook Again items remained the same after re-login');
    }
  } catch (error) {
    console.log(`ERROR: ${error?.message || error}`);
    console.log(`Current URL at failure: ${page.url()}`);
    await page.screenshot({ path: `ff_cookagain_error_${Date.now()}.png`, fullPage: true }).catch(() => {});
    await browser.close();
    process.exit(1);
  }
}

const targetUrl = process.argv[2];
runTest(targetUrl);
