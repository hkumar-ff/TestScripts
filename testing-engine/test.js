const puppeteer = require('puppeteer');
const { sleepTime } = require('./config.js');

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

  const sleep = async () => await new Promise(resolve => setTimeout(resolve, sleepTime * 1000));

  const takeScreenshot = async () => {
    if (process.env.SCREENSHOT_DIR) await page.screenshot({path: `${process.env.SCREENSHOT_DIR}/${Date.now()}.png`});
  };

  try {
    // await sleep();
    await page.goto(test_url);
    await sleep();
    console.log('Website opened in browser.');
    await takeScreenshot();
  } catch (error) {
    console.log("ERROR:"+error+" | target URL either not found or not working");
    await browser.close();
    process.exit(1);
  }

  async function chooseOptions(checkText, currentStep, valueToClick) {
    await takeScreenshot();
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
      await sleep();
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
      await takeScreenshot();
    }
  }

  async function clickNext(currentStep) {
    try {
      await sleep();
      await page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll('div'));
        const div = divs.find(d => d.textContent.trim() === 'NEXT');
        if (div) div.click();
      });
      await takeScreenshot();
    } catch (error) {
      console.log(`failed on ${currentStep}`);
      await browser.close();
      process.exit(1);
    }
  }

  // Get Started
  try {
    await sleep();
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
    await takeScreenshot();
    await sleep();
  } catch (error) {
    console.log("Get Started Failed:", error.message);
    await browser.close();
    process.exit(1);
  }

  // Step 1: Industry
  await sleep();
  await chooseOptions("Which industry do you identify with the most?", "step 1 industry", ["Government / Defense"]);
  await clickNext("step 1 industry");

  // Step 2: Compliance Subject
  await sleep();
  await chooseOptions("Who are you seeking compliance for?", "Step 2: Compliance Subject", ["My customer needs to be compliant"]);
  await clickNext("Step 2: Compliance Subject");

  // Step 3: Certification Type
  await sleep();
  await chooseOptions("Which security certification would you like to explore today?", "Step 3: Certification Type", ["CMMC"]);
  await clickNext("Step 3: Certification Type");

  // Step 4: Environment
  await sleep();
  await chooseOptions("Please select the environment that applies to your customer", "Step 4: Environment", ["Azure Gov Cloud"]);
  await clickNext("Step 4: Environment");

  // Step 5: IT Footprint
  await sleep();
  await chooseOptions("Please select the closest that apply to your customer", "Step 5: IT Footprint", ["Less than 50", "2 or less", "6 to 25"]);
  await clickNext("Step 5: IT Footprint");

  // Step 6: Familiarity With Compliance
  await sleep();
  await chooseOptions("Please select the closest that apply to your customer", "Step 6: Familiarity With Compliance", ["My customer has been certified in past to an IT standard like SOC 2 or ISO 27001"]);
  await clickNext("Step 6: Familiarity With Compliance");

  // Step 7: IT Controls (click next twice)
  await sleep();
  await clickNext("Step 7: IT Controls");
  await sleep();
  await clickNext("Step 7: IT Controls");

  // Check Step 7
  await sleep();
  await takeScreenshot();
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
  await sleep();
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
