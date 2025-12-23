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
  await takeScreenshotFunc();
  const isCheckTextPresent = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, checkText);
  if (!isCheckTextPresent) {
    console.log(`Fail: ${checkText} not found on the page`);
    await browser.close();
    process.exit(1);
  }
  console.log(`Pass: ${currentStep}: ${checkText}`);
  for (const val of valueToClick) {
    await sleepFunc();
    const isValPresent = await page.evaluate((v) => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(v));
    }, val);
    if (!isValPresent) {
      console.log(`Fail: ${val} not found on the page`);
      await browser.close();
      process.exit(1);
    }
    await page.evaluate((v) => {
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.innerText.trim() === v);
      if (span) span.click();
    }, val);
    console.log(`Pass: ${val}`);
    await takeScreenshotFunc();
  }
}

async function clickNext(page, browser, currentStep, sleepFunc, takeScreenshotFunc) {
  try {
    await sleepFunc();
    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const div = divs.find(d => d.textContent.trim() === 'NEXT');
      if (div) div.click();
    });
    await takeScreenshotFunc();
  } catch (error) {
    console.log(`failed on ${currentStep}`);
    await browser.close();
    process.exit(1);
  }
}

module.exports = {
  sleep,
  takeScreenshot,
  chooseOptions,
  clickNext
};
