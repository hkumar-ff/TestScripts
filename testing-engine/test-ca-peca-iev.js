const puppeteer = require('puppeteer');
const fs = require('fs');
const { sleepTime } = require('./config.js');
const { sleep, takeScreenshot, chooseOptions, clickNext } = require('./common');

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

  // Check for saved session
  const sessionCookiesPath = './createaccount-session.json';
  let sessionRestored = false;
  let skipToForm = false;

  if (fs.existsSync(sessionCookiesPath)) {
    try {
      console.log('Attempting to restore saved create account session...');
      const sessionData = JSON.parse(fs.readFileSync(sessionCookiesPath, 'utf8'));
      await page.setCookie(...sessionData.cookies);

      // Try to navigate to a later step in the process
      await page.goto(test_url);
      await sleepFunc();

      // Check if we're already at the create account form (past CAPTCHA)
      const isCreateAccountPresent = await page.evaluate((text) => {
        return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
      }, "Create Account");

      if (isCreateAccountPresent) {
        console.log('Successfully restored session past CAPTCHA - skipping to form filling');
        sessionRestored = true;
        skipToForm = true;
      } else {
        console.log('Saved session expired - proceeding with fresh start');
      }
    } catch (error) {
      console.log('Error restoring session:', error.message);
    }
  }

  if (!sessionRestored) {
    try {
      // await sleepFunc();
      await page.goto(test_url);
      await sleepFunc();
      console.log('Website opened in browser.');
      await takeScreenshotFunc();
    } catch (error) {
      console.log("ERROR:"+error+" | target URL either not found or not working");
      await browser.close();
      process.exit(1);
    }

    // Get Started
    try {
      await sleepFunc();
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const button = buttons.find(b => b.textContent.trim() === 'Get Started');
        if (button) {
          button.click();
          console.log('"Get Started" button clicked.');
        } else {
          throw new Error('Get Started button not found');
        }
      });
      await takeScreenshotFunc();
      await sleepFunc();
    } catch (error) {
      console.log("Get Started Failed:", error.message);
      await browser.close();
      process.exit(1);
    }

    // Step 1: Industry
    await sleepFunc();
    await chooseOptions(page, browser, "Which industry do you identify with the most?", "step 1 industry", ["Retails and Payment Providers"], sleepFunc, takeScreenshotFunc);
    await clickNext(page, browser, "step 1 industry", sleepFunc, takeScreenshotFunc);

    // Step 2: Compliance Subject
    await sleepFunc();
    await chooseOptions(page, browser, "Who are you seeking compliance for?", "Step 2: Compliance Subject", ["My company needs to be compliant"], sleepFunc, takeScreenshotFunc);
    await clickNext(page, browser, "Step 2: Compliance Subject", sleepFunc, takeScreenshotFunc);

    // Step 3: Certification Type
    await sleepFunc();
    await chooseOptions(page, browser, "Which security certification would you like to explore today?", "Step 3: Certification Type", ["PCI DSS"], sleepFunc, takeScreenshotFunc);
    await clickNext(page, browser, "Step 3: Certification Type", sleepFunc, takeScreenshotFunc);

    // Step 4: Environment
    await sleepFunc();
    await chooseOptions(page, browser, "Please select the environment that applies to your company", "Step 4: Environment", ["AWS"], sleepFunc, takeScreenshotFunc);
    await clickNext(page, browser, "Step 4: Environment", sleepFunc, takeScreenshotFunc);

    // Step 5: IT Footprint
    await sleepFunc();
    await chooseOptions(page, browser, "Please select the closest that apply to your company", "Step 5: IT Footprint", ["251 to 1000", "3 to 5", "26 to 100"], sleepFunc, takeScreenshotFunc);
    await clickNext(page, browser, "Step 5: IT Footprint", sleepFunc, takeScreenshotFunc);

    // Step 6: Familiarity With Compliance
    await sleepFunc();
    await chooseOptions(page, browser, "Please select the closest that apply to your company", "Step 6: Familiarity With Compliance", ["We have been certified in past to an IT standard like SOC 2 or ISO 27001"], sleepFunc, takeScreenshotFunc);
    await clickNext(page, browser, "Step 6: Familiarity With Compliance", sleepFunc, takeScreenshotFunc);

    // Step 7: IT Controls
    await sleepFunc();
    await takeScreenshotFunc();
    const isCheckTextPresentStep7 = await page.evaluate((text) => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
    }, "because you selected that you have been formally audited in the past. Please edit the pre-filled questions as needed if not accurate.");
    if (!isCheckTextPresentStep7) {
      console.log(`Fail: Step 7: IT Controls: because you selected that you have been formally audited in the past. Please edit the pre-filled questions as needed if not accurate. not found on the page`);
      await browser.close();
      process.exit(1);
    }
    console.log(`Pass: Step 7: IT Controls: because you selected that you have been formally audited in the past. Please edit the pre-filled questions as needed if not accurate.`);
    await clickNext(page, browser, "Step 7: IT Controls", sleepFunc, takeScreenshotFunc);

    // Final check
    await sleepFunc();
    await sleepFunc();
    await sleepFunc();
    const isProposalPresent = await page.evaluate((text) => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
    }, "PCI DSS 4.0 Certification Proposal");
    if (!isProposalPresent) {
      console.log('Fail: PCI DSS 4.0 Certification Proposal not found on the page');
      await browser.close();
      process.exit(1);
    }
    console.log('Pass: PCI DSS 4.0 Certification Proposal');

    const isForRetailsPresent = await page.evaluate((text) => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
    }, "For Retails & Payment");
    if (!isForRetailsPresent) {
      console.log('Fail: For Retails & Payment not found on the page');
      await browser.close();
      process.exit(1);
    }
    console.log('Pass: For Retails & Payment');

    const isCreateAccountPresent = await page.evaluate((text) => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
    }, "Create account to download the entire proposal!");
    if (!isCreateAccountPresent) {
      console.log('Fail: Create account to download the entire proposal! not found on the page');
      await browser.close();
      process.exit(1);
    }
    console.log('Pass: Create account to download the entire proposal!');
  }

  if (!skipToForm) {
    // Skip to Download Now step if session was restored
    if (sessionRestored) {
      console.log('Session restored - jumping directly to Download Now step');
    }

    // Click Download Now
    await sleepFunc();
    await takeScreenshotFunc();
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const button = buttons.find(b => b.textContent.trim() === 'Download Now');
      if (button) button.click();
    });
    await sleepFunc();

    // Check for CAPTCHA after Download Now click
    const isCaptchaPresent = await page.evaluate((text) => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
    }, "Let's confirm you are human");

    if (isCaptchaPresent) {
      console.log('CAPTCHA detected: "Let\'s confirm it is really you"');
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

      // Save session cookies for future runs (skip CAPTCHA)
      try {
        const cookies = await page.cookies();
        const sessionData = {
          cookies: cookies,
          timestamp: new Date().toISOString(),
          url: test_url
        };
        fs.writeFileSync(sessionCookiesPath, JSON.stringify(sessionData, null, 2));
        console.log('Saved create account session for future use');
      } catch (error) {
        console.log('Error saving session:', error.message);
      }
    }
  } else {
    console.log('Session restored past CAPTCHA - jumping directly to form filling');
  }

  // Check Create Account
  await sleepFunc();
  const isCreateAccountFormPresent = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Create Account");
  if (!isCreateAccountFormPresent) {
    console.log('Fail: Create Account not found on the page');
    await browser.close();
    process.exit(1);
  }
  console.log('Pass: Create Account');

  // Fill form with public email
  await sleepFunc();
  await page.type('input[id="_r_1_"]', `alpha${datetime}@gmail.com`);
  // Clear phone input first, then type
  await page.evaluate(() => {
    const phoneInput = document.querySelector('input[placeholder="Enter phone number"]');
    if (phoneInput) phoneInput.value = '';
  });
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
  console.log('Pass: Public Email/Completed Assessment x Step 2: Inline Email Verification. NO');

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
