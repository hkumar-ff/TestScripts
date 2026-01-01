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

  // Check for heading text on initial page
  await sleepFunc();
  const hasAssessOnce = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('Assess Once'));
  });
  const hasComplyToMany = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('Comply to Many'));
  });
  if (hasAssessOnce && hasComplyToMany) {
    console.log('PASS: The web page open with heading of "Assess Once, Comply to Many"');
  } else {
    console.log('FAIL: The web page does not open with heading of "Assess Once, Comply to Many"');
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
  // Check tracker for industry selection
  await sleepFunc();
  const trackerText = await page.evaluate(() => {
    const el = document.querySelector('div.industry > span.value') ||
               document.querySelector('::-p-xpath(//*[@id="root"]/div/div/div/div[1]/div[1]/div[1]/div/div[1]/span[2])') ||
               document.querySelector(':scope >>> div.industry > span.value');
    return el ? el.textContent : null;
  });
  if (trackerText && trackerText.includes('Managed Service Provider')) {
    console.log('PASS: (1.3) The tracker shows the selection My Industry: Managed Service Provider.');
  } else {
    console.log('FAIL:   (1.3) The tracker shows the selection My Industry: Managed Service Provider.');
    await browser.close();
    process.exit(1);
  }

  // Check step-timeline-wrapper classes
  await sleepFunc();
  const timelineCheck = await page.evaluate(() => {
    const wrappers = Array.from(document.querySelectorAll('div.step-timeline-wrapper'));
    if (wrappers.length === 0) return false;
    const firstActive = wrappers[0].classList.contains('active');
    const restPending = wrappers.slice(1).every(el => el.classList.contains('pending'));
    return firstActive && restPending;
  });
  if (timelineCheck) {
    console.log('PASS: All steps except step 1 are disabled in the left navigation of the assessment view');
  } else {
    console.log('FAIL: Testing of only step 1 being active in left navigation is failed');
    await browser.close();
    process.exit(1);
  }

  // Print all options available on industry page
  await sleepFunc();
  const industryOptions = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label.custom-radio-wrapper'));
    return labels.map(label => label.innerText.trim());
  });
  console.log('All options:', industryOptions);
  console.log('Count of options:', industryOptions.length);
  if (industryOptions.length === 10) {
    console.log('PASS: Total options on industry page are 10');
  } else {
    console.log('FAIL: Total options on Industry page are not 10');
    await browser.close();
    process.exit(1);
  }

  // Check if Back button is disabled
  await sleepFunc();
  const formContentBefore = await page.evaluate(() => {
    const fw = document.querySelector('div.form-wrapper');
    return fw ? fw.innerHTML : null;
  });
  await page.click('div.back').catch(() => {});
  await sleepFunc();
  const formContentAfter = await page.evaluate(() => {
    const fw = document.querySelector('div.form-wrapper');
    return fw ? fw.innerHTML : null;
  });
  const isDisabled = formContentBefore === formContentAfter;
  if (isDisabled) {
    console.log('PASS: The back link is still disabled');
  } else {
    console.log('FAIL: The back link is still active');
    await browser.close();
    process.exit(1);
  }

  await chooseOptions(page, browser, "Which industry do you identify with the most?", "step 1 industry", ["Government / Defense"], sleepFunc, takeScreenshotFunc);

  // Check tracker after selecting industry
  await sleepFunc();
  const selectedIndustry = await page.evaluate(() => {
    const el = document.querySelector('div.track-item.industry div.value') ||
               document.querySelector('div.industry > span.value') ||
               document.querySelector('::-p-xpath(//*[@id="root"]/div/div/div/div[1]/div[1]/div[1]/div/div[1]/span[2])') ||
               document.querySelector(':scope >>> div.industry > span.value');
    return el ? el.textContent.trim() : null;
  });
  if (selectedIndustry === 'Government / Defense') {
    console.log('PASS: Right industry is being displayed in the tracker');
  } else {
    console.log('FAIL: Wrong industry is being displayed on the tracker in the left');
    await browser.close();
    process.exit(1);
  }

  // Check how many radio buttons are marked as checked/selected
  await sleepFunc();
  const checkedCount = await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll('input[type="radio"]:checked'));
    return radios.length;
  });
  if (checkedCount === 1) {
    console.log('PASS: Only one industry is selectable');
  } else {
    console.log('FAIL: More than one industry is selectable');
    await browser.close();
    process.exit(1);
  }

  await clickNext(page, browser, "step 1 industry", sleepFunc, takeScreenshotFunc);

  
  // Step 2: Compliance Subject
  await sleepFunc();
  await chooseOptions(page, browser, "Who are you seeking compliance for?", "Step 2: Compliance Subject", ["My customer needs to be compliant"], sleepFunc, takeScreenshotFunc);
  

  // Check if Back button is now enabled on Certification Type page
  await sleepFunc();
  const formContentBefore2 = await page.evaluate(() => {
    const fw = document.querySelector('div.form-wrapper');
    return fw ? fw.innerHTML : null;
  });
  await page.click('div.back').catch(() => {});
  await sleepFunc();
  const formContentAfter2 = await page.evaluate(() => {
    const fw = document.querySelector('div.form-wrapper');
    return fw ? fw.innerHTML : null;
  });
  const isEnabled = formContentBefore2 !== formContentAfter2;
  if (isEnabled) {
    console.log('PASS: The back link is now enabled on Certification Type page');
    // Log which page we reached
    const reachedPage = await page.evaluate(() => {
      const question = document.querySelector('h2') || document.querySelector('.question');
      return question ? question.textContent.trim() : 'Unknown page';
    });
    console.log('Reached page:', reachedPage);
    // Click next to return to Certification Type page
    await clickNext(page, browser, "Step 2: Compliance Subject", sleepFunc, takeScreenshotFunc);
  } else {
    console.log('FAIL: The back link is still disabled on Certification Type page');
    await browser.close();
    process.exit(1);
  }

  // Step 3: Certification Type
  await sleepFunc();
  await chooseOptions(page, browser, "Which security certification would you like to explore today?", "Step 3: Certification Type", ["CMMC"], sleepFunc, takeScreenshotFunc);

  // Print all options available on Certification Type page
  await sleepFunc();
  const certOptions = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label.custom-radio-wrapper'));
    return labels.map(label => label.innerText.trim());
  });
  console.log('All options on Certification Type page:', certOptions);
  console.log('Count of options:', certOptions.length);
  if (certOptions.length === 6) {
    console.log('PASS: Total options on Certification Type page are 6');
  } else {
    console.log('FAIL: Total options on Certification Type page are not 6');
    await browser.close();
    process.exit(1);
  }

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
