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
  await chooseOptions(page, browser, "Which industry do you identify with the most?", "step 1 industry", ["Government / Defense"], sleepFunc, takeScreenshotFunc);
  await clickNext(page, browser, "step 1 industry", sleepFunc, takeScreenshotFunc);

  // Step 2: Compliance Subject
  await sleepFunc();
  await chooseOptions(page, browser, "Who are you seeking compliance for?", "Step 2: Compliance Subject", ["My customer needs to be compliant"], sleepFunc, takeScreenshotFunc);
  await clickNext(page, browser, "Step 2: Compliance Subject", sleepFunc, takeScreenshotFunc);

  // Step 3: Certification Type
  await sleepFunc();
  await chooseOptions(page, browser, "Which security certification would you like to explore today?", "Step 3: Certification Type", ["CMMC"], sleepFunc, takeScreenshotFunc);
  await clickNext(page, browser, "Step 3: Certification Type", sleepFunc, takeScreenshotFunc);

  // Step 4: Environment
  await sleepFunc();
  await chooseOptions(page, browser, "Please select the environment that applies to your customer", "Step 4: Environment", ["Azure Gov Cloud"], sleepFunc, takeScreenshotFunc);
  await clickNext(page, browser, "Step 4: Environment", sleepFunc, takeScreenshotFunc);

  // Step 5: IT Footprint
  await sleepFunc();
  await chooseOptions(page, browser, "Please select the closest that apply to your customer", "Step 5: IT Footprint", ["Less than 50", "2 or less", "6 to 25"], sleepFunc, takeScreenshotFunc);
  await clickNext(page, browser, "Step 5: IT Footprint", sleepFunc, takeScreenshotFunc);

  // Step 6: Familiarity With Compliance
  await sleepFunc();
  await chooseOptions(page, browser, "Please select the closest that apply to your customer", "Step 6: Familiarity With Compliance", ["My customer has been certified in past to an IT standard like SOC 2 or ISO 27001"], sleepFunc, takeScreenshotFunc);
  await clickNext(page, browser, "Step 6: Familiarity With Compliance", sleepFunc, takeScreenshotFunc);

  // Step 7: IT Controls (click next twice)
  await sleepFunc();
  await clickNext(page, browser, "Step 7: IT Controls", sleepFunc, takeScreenshotFunc);
  await sleepFunc();
  await clickNext(page, browser, "Step 7: IT Controls", sleepFunc, takeScreenshotFunc);

  // Check Step 7
  await sleepFunc();
  await takeScreenshotFunc();
  const isStep7Present = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes("Create account to download the entire proposal!"));
  });
  if (!isStep7Present) {
    console.log('failed on Step 7 IT Controls');
    await browser.close();
    process.exit(1);
  }
  console.log('PASS: Step 7 IT Controls');

  // Final check
  await sleepFunc();
  const isFinalPresent = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('CMMC C3PAO Certification Proposal')) &&
           Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('For Your Customer'));
  });
  if (!isFinalPresent) {
    console.log('failed on Step 7 IT Controls');
    await browser.close();
    process.exit(1);
  }
  console.log('PASS: The proposal is visible');
  console.log('PASS: CMMC C3PAO Certification Proposal For Your Customer found. Entire test is a PASS. Please close the script now');
  console.log("PASS");
  await browser.close();
  process.exit(0);
}

const test_url = process.argv[2];
runTest(test_url);
