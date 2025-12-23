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

  // Fill form with input data
  await sleepFunc();
  await page.type('input[id="_r_1_"]', input_data.email);
  await takeScreenshotFunc();
  await sleepFunc();

  // Clear phone input first, then type
  await page.focus('input[placeholder="Enter phone number"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.keyboard.press('Delete');
  await page.type('input[placeholder="Enter phone number"]', input_data.phone);
  await takeScreenshotFunc();
  await sleepFunc();

  await page.type('input[id="_r_2_"]', input_data.name);
  await takeScreenshotFunc();
  await sleepFunc();

  await page.type('input[id="_r_3_"]', input_data.organization);
  await takeScreenshotFunc();
  await sleepFunc();

  await page.type('input[id="_r_4_"]', input_data.password);
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
  await takeScreenshotFunc();

  // Check for business email error
  const isBusinessEmailError = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Enter a valid business email address (e.g., user@company.com).");
  if (isBusinessEmailError) {
    console.log('Fail: Business email validation error found - test failed');
    await browser.close();
    process.exit(1);
  }

  // Check for Account already exists
  const isAccountExists = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Account already exists");
  if (isAccountExists) {
    console.log('Fail: Account already exists message found');
    await browser.close();
    process.exit(1);
  }

  // Check for Verify Your Email Address popup
  const isVerifyEmailPopup = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Verify Your Email Address");
  if (!isVerifyEmailPopup) {
    console.log('Fail: Verify Your Email Address popup not found');
    await browser.close();
    process.exit(1);
  }
  console.log('Pass: Verify Your Email Address popup found');
  console.log('Verification initiated');

  // Wait for human to input verification code
  console.log('Waiting for human to input verification code...');
  await page.waitForFunction(() => {
    const inputs = ['email-digit-0', 'email-digit-1', 'email-digit-2', 'email-digit-3', 'email-digit-4', 'email-digit-5'];
    return inputs.every(id => {
      const input = document.getElementById(id);
      return input && input.value && input.value.length === 1;
    });
  }, { timeout: 0 }); // infinite wait
  console.log('Verification code entered by human');

  // Click Verify Code
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const button = buttons.find(b => b.textContent.trim() === 'Verify Code');
    if (button) button.click();
  });
  await takeScreenshotFunc();
  console.log('Verification process completed');

  // Wait for redirect
  await page.waitForNavigation({ timeout: 300000 });
  // await sleepFunc();

  // Check URL and content
  const currentUrl = page.url();
  const urlPath = new URL(currentUrl).pathname;
  if (urlPath === '/login') {
    const hasLogIn = await page.evaluate((text) => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
    }, "Log In");
    const hasNeedAccount = await page.evaluate((text) => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
    }, "Need an account?");
    if (hasLogIn && hasNeedAccount) {
      console.log('Pass: Successfully redirected to login page with Log In and Need an account?');
      await takeScreenshotFunc(); // Take final screenshot of login page for test validation
      console.log('PASS');
      await browser.close();
      process.exit(0);
    } else {
      console.log('Fail: Redirected to login but missing Log In or Need an account?');
      await browser.close();
      process.exit(1);
    }
  } else {
    console.log(`Fail: Not redirected to login page, current URL: ${currentUrl}`);
    await browser.close();
    process.exit(1);
  }
}

const test_url = process.argv[2];
const input_json = process.argv[3] || '{"email":"harish@farmfetch.com","phone":"+918527489490","name":"Scripted Testing","organization":"Testing Co. Do not call","password":"Alpha6&h!@#$%^&*"}';
let input_data;
try {
  input_data = JSON.parse(input_json);
} catch (e) {
  console.log('Error parsing input JSON:', e.message);
  input_data = {};
}
console.log('Input data:', input_data);
runTest(test_url, input_data);
