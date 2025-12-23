const puppeteer = require('puppeteer');
const { sleepTime } = require('./config.js');
const { sleep, takeScreenshot } = require('./common');

async function runTest(test_url, input_data = {}) {
  if (!test_url) {
    console.log("target URL not provided");
    process.exit(1);
  }

  console.log('Working with test_url:', test_url);
  console.log('Input data:', input_data);
  console.log('sleepTime:', sleepTime);

  const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage();
  await page.setViewport(null);

  const sleepFunc = sleep(sleepTime, page);
  const takeScreenshotFunc = takeScreenshot(page);

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const datetime = dd + mm + yyyy + hh + min;

  try {
    await page.goto('https://selfservicedev.controlcase.com/create-account');
    await sleepFunc();
    console.log('Website opened in browser.');
    await takeScreenshotFunc();
  } catch (error) {
    console.log("ERROR:"+error+" | target URL either not found or not working");
    await browser.close();
    process.exit(1);
  }

  // Check for CAPTCHA after Submit click
  const isCaptchaPresent = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Let's confirm you are human");

  if (isCaptchaPresent) {
    console.log('CAPTCHA detected: "Let\'s confirm you are human"');
    console.log('Please complete the CAPTCHA manually.');
    console.log('Script will wait until CAPTCHA is resolved and you reach the intended webpage...');

    // Wait for CAPTCHA to be completed and page to change
    await page.waitForFunction(() => {
      const captchaText = Array.from(document.querySelectorAll('*')).some(el =>
        el.textContent.includes("Let's confirm you are human")
      );
      return !captchaText; // Return true when CAPTCHA text is gone
    }, { timeout: 300000 }); // 5 minute timeout

    console.log('CAPTCHA completed, continuing...');
    await sleepFunc();
    await takeScreenshotFunc();
  }

  // Fill form with public email
  await sleepFunc();
  await page.type('input[id="_r_1_"]', `alpha${datetime}@gmail.com`);
  // Clear phone input first, then type
  await page.focus('input[placeholder="Enter phone number"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.keyboard.press('Delete');
  await page.type('input[placeholder="Enter phone number"]', '+918527489490');
  await page.type('input[id="_r_2_"]', 'Scripted Testing Donot Call');
  await page.type('input[id="_r_3_"]', 'Testing Co. Do not call');
  await page.type('input[id="_r_4_"]', 'Alpha6&h!@#$%^&*');
  await takeScreenshotFunc();
  await sleepFunc();

  // Click Submit
  await takeScreenshotFunc();
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const button = buttons.find(b => b.textContent.trim() === 'Submit');
    if (button) button.click();
  });
  await sleepFunc();

  // Check public email validation
  const isPublicEmailErrorPresent = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Enter a valid business email address (e.g., user@company.com).");
  if (!isPublicEmailErrorPresent) {
    console.log('Fail: Enter a valid business email address (e.g., user@company.com). not found on the page');
    await browser.close();
    process.exit(1);
  }
  console.log('Pass: Public email validated. Enter a valid business email address (e.g., user@company.com).');
  console.log('Pass: Public Email/Direct Register x Step 2: Inline Email Verification. NO');

  console.log('PASS');
  await browser.close();
  process.exit(0);
}

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
runTest(test_url, input_data);
