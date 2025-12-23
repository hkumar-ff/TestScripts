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

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const datetime = dd + mm + yyyy + hh + min;
  const name = 'Bot Testing ' + datetime;
  const email = 'goingaway' + datetime + '@autotest.com';

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
  // await sleepFunc();
  // await chooseOptions(page, browser, "Who are you seeking compliance for?", "Step 2: Compliance Subject", ["My company needs to be compliant"], sleepFunc, takeScreenshotFunc);
  // await clickNext(page, browser, "Step 2: Compliance Subject", sleepFunc, takeScreenshotFunc);

  // Going Away Action: Move mouse to center then outside browser window to trigger exit popup
  console.log('Performing "going away" action: moving mouse to center then outside browser window...');
  await sleepFunc();

  // Get actual window dimensions from browser
  const dimensions = await page.evaluate(() => {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  });
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  console.log(`Window dimensions: ${dimensions.width}x${dimensions.height}, center: ${centerX}, ${centerY}`);

  await page.mouse.move(centerX, centerY); // Move mouse to center of viewport
  await sleepFunc();

  await page.mouse.move(-100, -100); // Then move mouse outside viewport to trigger exit popup
  await sleepFunc();
  await takeScreenshotFunc();
  console.log('Mouse moved from center to outside viewport - exit popup should appear now');

  // Wait for popup to appear and check for "Let us Assist You" text
  await sleepFunc();
  await takeScreenshotFunc();
  const isAssistTextPresent = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "ControlCase offers 60+ globally recognized certifications across all major industries, helping organizations meet compliance objectives with confidence.");
  if (!isAssistTextPresent) {
    console.log('Fail: Let us Assist You: ControlCase offers 60+ globally recognized certifications across all major industries, helping organizations meet compliance objectives with confidence. not found on the page');
    await browser.close();
    process.exit(1);
  }
  console.log('Pass: Exit popup appeared with "Let us Assist You" message');

  // Click on fields to trigger validation
  await sleepFunc();
  await page.click('#_r_2_');
  await page.click('#_r_3_');
  await page.click('#_r_4_');
  await page.click('input[placeholder="Enter phone number"]');
  await takeScreenshotFunc();
  await sleepFunc();

  // Check validation messages
  const isNameRequired = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Name is required");
  if (!isNameRequired) {
    console.log('Fail: Name is required not found on the page');
    await browser.close();
    process.exit(1);
  }
  console.log('Pass: Name is required');

  const isCompanyRequired = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Company is required");
  if (!isCompanyRequired) {
    console.log('Fail: Company is required not found on the page');
    await browser.close();
    process.exit(1);
  }
  console.log('Pass: Company is required');

  const isEmailRequired = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Email is required");
  if (!isEmailRequired) {
    console.log('Fail: Email is required not found on the page');
    await browser.close();
    process.exit(1);
  }
  console.log('Pass: Email is required');

  // Fill form
  await sleepFunc();
  await page.type('#_r_2_', name);
  console.log('Name: '+name);
  await page.type('#_r_3_', 'Testing Going Away Do not call');
  await page.type('#_r_4_', email);
  console.log('Email: '+email);
  await page.type('input[placeholder="Enter phone number"]', '+91.8527489490');
  await takeScreenshotFunc();
  await sleepFunc();

  // Click Select Area of Interest
  await sleepFunc();
  await takeScreenshotFunc();
  await page.click('.area-of-interest');
  await sleepFunc();

  // Select Cybersecurity Services
  await sleepFunc();
  await takeScreenshotFunc();
  await page.click('li[data-value="Cybersecurity Services"]');
  await sleepFunc();

  // Select Other
  await sleepFunc();
  await takeScreenshotFunc();
  await page.click('li[data-value="other-compliance-options"]');
  await sleepFunc();

  // Select Firewall Review
  await sleepFunc();
  await takeScreenshotFunc();
  await page.click('li[data-value="Firewall Review"]');
  await sleepFunc();

  // Click Select Area of Interest
  await sleepFunc();
  await takeScreenshotFunc();
  await page.click('.area-of-interest');
  await sleepFunc();

  // Fill Additional Message
  await sleepFunc();
  await page.click('#_r_7_');
  await page.type('#_r_7_', 'Testing exit-intent popup triggered by going away action.');
  await takeScreenshotFunc();
  await sleepFunc();


  // Click Submit
  await takeScreenshotFunc();
  await page.click('button[type="submit"]');
  await sleepFunc();
  await takeScreenshotFunc();

  // Check for "Thank You" message (for exit-intent popup, no redirect happens)
  await sleepFunc();
  const isThankYouPresent = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Thank you for your response");

  if (!isThankYouPresent) {
    console.log('Fail: "Thank you for your response" message not found after form submission');
    await browser.close();
    process.exit(1);
  }
  console.log('Pass: "Thank you for your response" message appeared after form submission');

  console.log('PASS');
  await browser.close();
  process.exit(0);
}

const test_url = process.argv[2];
runTest(test_url);
