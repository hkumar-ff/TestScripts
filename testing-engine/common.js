import { debugEnabled } from './config.js';

const sleep = (sleepTime, page) => async () => {
  await new Promise(resolve => setTimeout(resolve, 5000));
  const isLoaded = await page.evaluate(() => document.readyState === 'complete');
  if (isLoaded) return;
  const remaining = Math.max(0, (sleepTime - 5) * 1000);
  if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
};

const takeScreenshot = (page) => async () => {
  if (process.env.SCREENSHOT_DIR) await page.screenshot({path: `${process.env.SCREENSHOT_DIR}/${Date.now()}.png`});
};

async function chooseOptions(page, browser, checkText, currentStep, valueToClick, sleepFunc, takeScreenshotFunc) {
  if (debugEnabled) console.log(`[DEBUG] ${currentStep}: Taking initial screenshot`);
  await takeScreenshotFunc();

  if (debugEnabled) console.log(`[DEBUG] ${currentStep}: Checking if text "${checkText}" is present on page`);
  const isCheckTextPresent = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, checkText);

  if (!isCheckTextPresent) {
    if (debugEnabled) {
      console.log(`[DEBUG] ${currentStep}: Page content check failed. Current URL:`, await page.url());
      const pageTitle = await page.title();
      console.log(`[DEBUG] ${currentStep}: Page title: ${pageTitle}`);
      const allText = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.map(el => el.textContent.trim()).filter(text => text.length > 0).slice(0, 20);
      });
      console.log(`[DEBUG] ${currentStep}: Sample page text:`, allText);
    }
    console.log(`Fail: ${checkText} not found on the page`);
    await browser.close();
    process.exit(1);
  }
  console.log(`Pass: ${currentStep}: ${checkText}`);

  for (const val of valueToClick) {
    if (debugEnabled) console.log(`[DEBUG] ${currentStep}: Sleeping before checking option "${val}"`);
    await sleepFunc();

    if (debugEnabled) console.log(`[DEBUG] ${currentStep}: Checking if option "${val}" is present on page`);
    const isValPresent = await page.evaluate((v) => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(v));
    }, val);

    if (!isValPresent) {
      if (debugEnabled) {
        console.log(`[DEBUG] ${currentStep}: Option "${val}" not found. Current URL:`, await page.url());
        const pageTitle = await page.title();
        console.log(`[DEBUG] ${currentStep}: Page title: ${pageTitle}`);
        const allText = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.map(el => el.textContent.trim()).filter(text => text.length > 0).slice(0, 20);
        });
        console.log(`[DEBUG] ${currentStep}: Sample page text:`, allText);
      }
      console.log(`Fail: ${val} not found on the page`);
      await browser.close();
      process.exit(1);
    }

    if (debugEnabled) console.log(`[DEBUG] ${currentStep}: Clicking on option "${val}"`);
    await page.evaluate((v) => {
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.innerText.trim() === v);
      if (span) span.click();
    }, val);
    console.log(`Pass: ${val}`);

    if (debugEnabled) console.log(`[DEBUG] ${currentStep}: Taking screenshot after selecting "${val}"`);
    await takeScreenshotFunc();
  }
}

async function clickNext(page, browser, currentStep, sleepFunc, takeScreenshotFunc) {
  try {
    if (debugEnabled) console.log(`[DEBUG] ${currentStep}: Sleeping before clicking NEXT`);
    await sleepFunc();

    if (debugEnabled) console.log(`[DEBUG] ${currentStep}: Looking for NEXT button`);
    const nextButtonFound = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const div = divs.find(d => d.textContent.trim() === 'NEXT');
      return !!div;
    });

    if (!nextButtonFound) {
      if (debugEnabled) {
        console.log(`[DEBUG] ${currentStep}: NEXT button not found. Current URL:`, await page.url());
        const pageTitle = await page.title();
        console.log(`[DEBUG] ${currentStep}: Page title: ${pageTitle}`);
        const allButtons = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('div, button'));
          return elements.map(el => ({
            tag: el.tagName,
            text: el.textContent.trim(),
            class: el.className
          })).filter(item => item.text.length > 0).slice(0, 10);
        });
        console.log(`[DEBUG] ${currentStep}: Available clickable elements:`, allButtons);
      }
      throw new Error('NEXT button not found');
    }

    if (debugEnabled) console.log(`[DEBUG] ${currentStep}: Clicking NEXT button`);
    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const div = divs.find(d => d.textContent.trim() === 'NEXT');
      if (div) div.click();
    });

    if (debugEnabled) console.log(`[DEBUG] ${currentStep}: Taking screenshot after clicking NEXT`);
    await takeScreenshotFunc();
  } catch (error) {
    if (debugEnabled) console.log(`[DEBUG] ${currentStep}: Error during clickNext:`, error.message);
    console.log(`failed on ${currentStep}`);
    await browser.close();
    process.exit(1);
  }
}

export {
  sleep,
  takeScreenshot,
  chooseOptions,
  clickNext
};
