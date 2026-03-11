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

async function assertPageHasText(page, expectedText) {
  const found = await page.evaluate((text) => {
    const bodyText = (document.body?.innerText || '').toLowerCase();
    return bodyText.includes((text || '').toLowerCase());
  }, expectedText);

  if (!found) {
    throw new Error(`Expected text not found on page: "${expectedText}"`);
  }
}

async function getButtonLabels(page) {
  const labels = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button.transition-all'));
    return buttons.map((btn) => (btn.textContent || '').replace(/\s+/g, ' ').trim() || '(no label)');
  });
  return labels;
}

function checkForNonVegetarianDishes(buttonLabels) {
  const nonVegKeywords = [
    'chicken', 'beef', 'pork', 'lamb', 'fish', 'shrimp', 'crab', 'lobster',
    'steak', 'burger', 'sausage', 'bacon', 'turkey', 'duck', 'venison',
    'meat', 'poultry', 'seafood', 'shellfish', 'ham', 'bacon', 'egg', 'eggs'
  ];
  
  const foundNonVeg = buttonLabels.filter(label => 
    nonVegKeywords.some(keyword => 
      label.toLowerCase().includes(keyword)
    )
  );
  
  return foundNonVeg;
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

    // Click "Start Planning" button
    await sleepFunc();
    await safeClickButtonByLabel(page, 'Start Planning');
    console.log('Clicked "Start Planning" button');

    // Wait for page to load and verify we're on the "Select Everything you Like" page
    await waitForPageLoad(page);
    console.log('Waiting for "Select Everything you Like" page...');

    // Wait for "Select Everything you Like" text to appear
    await sleepFunc();
    await sleepFunc();
    await assertPageHasText(page, 'Select Everything you Like');
    console.log('Verified page contains "Select Everything you Like"');

    // Phase 2: Customize Your Plate Flow
    console.log('Starting Customize Your Plate flow...');

    // Find divs with class "bg-[#333333]" and click their parent buttons one by one
    await sleepFunc();
    console.log('Finding divs with class "bg-[#333333]" and clicking parent buttons...');
    
    // Get all divs with class "bg-[#333333]" and their parent buttons
    const divHandles = await page.$$('div.bg-\\[\\#333333\\]');
    const qualifyingButtons = [];
    
    for (let i = 0; i < divHandles.length; i++) {
      const divHandle = divHandles[i];
      const parentHandle = await divHandle.evaluateHandle((div) => div.parentElement);
      
      if (parentHandle) {
        const tagName = await parentHandle.evaluate((el) => el.tagName);
        if (tagName === 'BUTTON') {
          const isVisible = await parentHandle.evaluate((btn) => {
            const rect = btn.getBoundingClientRect();
            const style = window.getComputedStyle(btn);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && !btn.disabled;
          });
          
          if (isVisible) {
            const label = await parentHandle.evaluate((btn) => (btn.textContent || '').replace(/\s+/g, ' ').trim() || '(no label)');
            qualifyingButtons.push({
              index: i,
              label: label,
              buttonHandle: parentHandle
            });
          } else {
            await parentHandle.dispose();
          }
        } else {
          await parentHandle.dispose();
        }
      }
      await divHandle.dispose();
    }

    console.log(`Found ${qualifyingButtons.length} buttons (parents of divs with class "bg-[#333333]")`);

    // Click buttons one by one with waits
    for (let i = 0; i < qualifyingButtons.length; i++) {
      const buttonInfo = qualifyingButtons[i];
      
      // Click the button
      await buttonInfo.buttonHandle.evaluate((btn) => {
        btn.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
        btn.click();
      });

      console.log(`Clicked button ${i + 1}/${qualifyingButtons.length}: ${buttonInfo.label}`);
      
      // Wait between clicks (except for the last one)
      if (i < qualifyingButtons.length - 1) {
        await sleepFunc();
        await waitForPageLoad(page);
        console.log(`Waited after clicking button ${i + 1}`);
      }
      
      // Dispose of the handle
      await buttonInfo.buttonHandle.dispose();
    }

    console.log(`Successfully clicked ${qualifyingButtons.length} buttons (parents of divs with class "bg-[#333333]")`);

    // Click buttons with labels: "Chickpeas", "Grains", "Vegetarian"
    await sleepFunc();
    await safeClickButtonByLabel(page, 'Chickpeas');
    console.log('Clicked "Chickpeas" button');

    await sleepFunc();
    await safeClickButtonByLabel(page, 'Grains');
    console.log('Clicked "Grains" button');

    await sleepFunc();
    await safeClickButtonByLabel(page, 'Vegetarian');
    console.log('Clicked "Vegetarian" button');

    // Click "Next" button
    await sleepFunc();
    await safeClickButtonByLabelContains(page, 'Next');
    console.log('Clicked "Next" button');

    // Wait for next page to load
    await waitForPageLoad(page);
    console.log('Next page loaded after ingredient selection');

    // Phase 3: Ingredient Selection
    // Click "Next" button again
    await sleepFunc();
    await safeClickButtonByLabelContains(page, 'Next');
    console.log('Clicked second "Next" button');

    // Wait for page to load with "Select Your Dishes" text
    await waitForPageLoad(page);
    console.log('Waiting for "Select Your Dishes" page...');
    
    // Wait for "Select Your Dishes" text to appear
    await sleepFunc();
    await sleepFunc();
    await assertPageHasText(page, 'Select Your Dishes');
    console.log('Verified page contains "Select Your Dishes"');

    // Phase 4: Non-vegetarian Dish Validation
    console.log('Checking for non-vegetarian dishes...');

    // Get all button labels on the page
    const buttonLabels = await getButtonLabels(page);
    console.log(`Found ${buttonLabels.length} buttons on the page`);
    console.log('Button labels:', buttonLabels.join(' | '));

    // Check for non-vegetarian dishes
    const nonVegDishes = checkForNonVegetarianDishes(buttonLabels);

    if (nonVegDishes.length > 0) {
      throw new Error(`FAIL: Non Vegetarian Dish - ${nonVegDishes.join(', ')} was found`);
    } else {
      console.log('PASS: No non-vegetarian dish found');
    }

    // Phase 5: Dish Selection and Cooking
    console.log('Starting dish selection and cooking flow...');

    // Click buttons one by one with waits in between
    if (buttonLabels.length > 0) {
      await sleepFunc();
      await safeClickButtonByLabel(page, buttonLabels[0] || 'First Dish');
      console.log(`Clicked first dish: ${buttonLabels[0] || 'First Dish'}`);
      
      // Wait after clicking first button
      await sleepFunc();
      await waitForPageLoad(page);
      console.log('Waited after clicking first dish');
    }

    if (buttonLabels.length > 1) {
      await sleepFunc();
      await safeClickButtonByLabel(page, buttonLabels[1]);
      console.log(`Clicked second dish: ${buttonLabels[1]}`);
      
      // Wait after clicking second button
      await sleepFunc();
      await waitForPageLoad(page);
      console.log('Waited after clicking second dish');
    }

    if (buttonLabels.length > 2) {
      await sleepFunc();
      await safeClickButtonByLabel(page, buttonLabels[2]);
      console.log(`Clicked third dish: ${buttonLabels[2]}`);
      
      // Wait after clicking third button
      await sleepFunc();
      await waitForPageLoad(page);
      console.log('Waited after clicking third dish');
    }

    // Click button containing "Let's Cook"
    await sleepFunc();
    await safeClickButtonByLabelContains(page, "Let's Cook");
    console.log('Clicked button containing "Let\'s Cook"');

    // Wait for page reload
    await waitForPageLoad(page);
    console.log('Page reloaded after "Let\'s Cook"');

    // Verify page contains "Plan Details" text
    await sleepFunc();
    await assertPageHasText(page, 'Plan Details');
    console.log('Verified page contains "Plan Details"');

    // Click button containing "Customize Ingredients"
    await sleepFunc();
    await safeClickButtonByLabelContains(page, 'Customize Ingredients');
    console.log('Clicked button containing "Customize Ingredients"');

    // Wait for page to load
    await waitForPageLoad(page);
    console.log('Page loaded after "Customize Ingredients"');

    // Verify page contains "Customize Ingredients" text
    await sleepFunc();
    await assertPageHasText(page, 'Customize Ingredients');
    console.log('Verified page contains "Customize Ingredients"');

    // Click button containing "View Recipe & Shopping List"
    await sleepFunc();
    await safeClickButtonByLabelContains(page, 'View Recipe & Shopping List');
    console.log('Clicked button containing "View Recipe & Shopping List"');

    // Wait for next page to load
    await waitForPageLoad(page);
    console.log('Page loaded after "View Recipe & Shopping List"');

    // Phase 6: Share and Return (from ff_cookagain.js)
    console.log('Starting Share with Yourself flow...');

    // Verify that the page opened has a button with label containing "Share with Yourself"
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

    // Click header logo trigger to return to dashboard
    await sleepFunc();
    await sleepFunc();
    await sleepFunc();
    await sleepFunc();
    await safeClickSelector(page, '#header-logo-trigger', '#header-logo-trigger');
    console.log('Clicked #header-logo-trigger to go back to dashboard');
    
    // Wait for page to fully load after clicking header logo
    await waitForPageLoad(page);
    console.log('Page fully loaded after clicking header logo');

    await sleepFunc();
    console.log('Test completed successfully!');

  } catch (error) {
    console.log(`ERROR: ${error?.message || error}`);
    console.log(`Current URL at failure: ${page.url()}`);
    await page.screenshot({ path: `ff_customize_110326_error_${Date.now()}.png`, fullPage: true }).catch(() => {});
    await browser.close();
    process.exit(1);
  }
}

const targetUrl = process.argv[2];
runTest(targetUrl);