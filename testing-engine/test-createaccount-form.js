const puppeteer = require('puppeteer');
const { sleepTime } = require('./config.js');
const { sleep, takeScreenshot, chooseOptions, clickNext } = require('./common');

async function runTest(test_url) {
  if (!test_url) {
    console.log("target URL not provided");
    process.exit(1);
  }

  console.log('Working with test_url:', test_url);
  console.log('sleepTime:', sleepTime);

  const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage();
  await page.setViewport(null);

  const sleepFunc = sleep(sleepTime, page);
  const takeScreenshotFunc = takeScreenshot(page);

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

  // Click Download Now
  await sleepFunc();
  await takeScreenshotFunc();
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const button = buttons.find(b => b.textContent.trim() === 'Download Now');
    if (button) button.click();
  });
  await sleepFunc();

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
  await page.type('input[name="Email"]', 'alpha@gmail.com');
  await page.type('input[name="Phone"]', '+918527489490');
  await page.type('input[name="Name"]', 'Scripted Testing Donot Call');
  await page.type('input[name="Organization Name"]', 'Testing Co. Do not call');
  await page.type('input[name="Password"]', 'Alpha6&h!@#$%^&*');
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

  // Clear email
  await sleepFunc();
  await page.evaluate(() => {
    const emailInput = document.querySelector('input[name="Email"]');
    if (emailInput) emailInput.value = '';
  });
  await takeScreenshotFunc();
  await sleepFunc();

  // Check empty email validation
  const isEmptyEmailErrorPresent = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Please enter a valid email address.");
  if (!isEmptyEmailErrorPresent) {
    console.log('Fail: Please enter a valid email address. not found on the page');
    await browser.close();
    process.exit(1);
  }
  console.log('Pass: Empty email validated. Please enter a valid email address.');

  // Fill valid email and details
  await sleepFunc();
  await page.type('input[name="Email"]', 'hkumar@farmfetch.com');
  await page.evaluate(() => {
    const phoneInput = document.querySelector('input[name="Phone"]');
    if (phoneInput) phoneInput.value = '+918527489490';
    const nameInput = document.querySelector('input[name="Name"]');
    if (nameInput) nameInput.value = 'Scripted Testing Donot Call';
    const orgInput = document.querySelector('input[name="Organization Name"]');
    if (orgInput) orgInput.value = 'Testing Co. Do not call';
    const passInput = document.querySelector('input[name="Password"]');
    if (passInput) passInput.value = 'Alpha';
  });
  await takeScreenshotFunc();
  await sleepFunc();

  // Check submit disabled
  const isSubmitDisabled = await page.evaluate(() => {
    const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Submit');
    return button && button.disabled;
  });
  if (!isSubmitDisabled) {
    console.log('Fail: Password validation working. Submit button should be disabled');
    await browser.close();
    process.exit(1);
  }
  console.log('Pass: Password validation working.');

  // Fill valid password
  await sleepFunc();
  await page.evaluate(() => {
    const passInput = document.querySelector('input[name="Password"]');
    if (passInput) passInput.value = 'Alpha6&h!@#$%^&*';
  });
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

  // Check existing account
  const isAccountExistsPresent = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Account already exists");
  if (!isAccountExistsPresent) {
    console.log('Fail: Account already exists not found on the page');
    await browser.close();
    process.exit(1);
  }
  console.log('Pass: Existing account validated. Account already exists message found.');

  console.log('Please test create account success manually.');
  console.log('PASS');
  await browser.close();
  process.exit(0);
}

const test_url = process.argv[2];
runTest(test_url);
