const puppeteer = require('puppeteer');
const { sleepTime } = require('./config.js');
const { sleep, takeScreenshot } = require('./common');

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
    await page.goto(test_url);
    await sleepFunc();
    console.log('Website opened in browser.');
    await takeScreenshotFunc();
  } catch (error) {
    console.log("ERROR:"+error+" | target URL either not found or not working");
    await browser.close();
    process.exit(1);
  }

  // Click Sign In
  try {
    await sleepFunc();
    await takeScreenshotFunc();
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const signIn = elements.find(e => e.textContent.trim() === 'Sign In');
      if (signIn) {
        signIn.click();
        console.log('"Sign In" clicked.');
      } else {
        throw new Error('Sign In not found');
      }
    });
    await sleepFunc();
  } catch (error) {
    console.log("Sign In Failed:", error.message);
    await browser.close();
    process.exit(1);
  }

  // Click Create Account
  try {
    await sleepFunc();
    await takeScreenshotFunc();
    await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      const createAccount = anchors.find(a => a.textContent.trim() === 'Create Account');
      if (createAccount) {
        createAccount.click();
        console.log('"Create Account" clicked.');
      } else {
        throw new Error('Create Account not found');
      }
    });
    await sleepFunc();
  } catch (error) {
    console.log("Create Account Failed:", error.message);
    await browser.close();
    process.exit(1);
  }

  // Fill Email
  try {
    await sleepFunc();
    await page.type('input[placeholder*="Email"]', 'hkumar@farmfetch.com');
    await sleepFunc();
    console.log('Email filled.');
  } catch (error) {
    console.log("Fill Email Failed:", error.message);
    await browser.close();
    process.exit(1);
  }

  // Fill Phone
  try {
    await sleepFunc();
    await page.type('input[placeholder*="Phone"]', '+918527489490');
    await sleepFunc();
    console.log('Phone filled.');
  } catch (error) {
    console.log("Fill Phone Failed:", error.message);
    await browser.close();
    process.exit(1);
  }

  // Fill Name
  try {
    await sleepFunc();
    await page.type('input[placeholder*="Name"]', 'Harish Testing without assessment');
    await sleepFunc();
    console.log('Name filled.');
  } catch (error) {
    console.log("Fill Name Failed:", error.message);
    await browser.close();
    process.exit(1);
  }

  // Fill Organization Name
  try {
    await sleepFunc();
    await page.type('input[placeholder*="Organization"]', 'Testing Do not call');
    await sleepFunc();
    console.log('Organization Name filled.');
  } catch (error) {
    console.log("Fill Organization Name Failed:", error.message);
    await browser.close();
    process.exit(1);
  }

  // Fill Password
  try {
    await sleepFunc();
    await page.type('input[placeholder*="Password"]', 'k3*NW0U4f6(U^a#n');
    await sleepFunc();
    console.log('Password filled.');
  } catch (error) {
    console.log("Fill Password Failed:", error.message);
    await browser.close();
    process.exit(1);
  }

  // Click Submit
  try {
    await sleepFunc();
    await takeScreenshotFunc();
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submit = buttons.find(b => b.textContent.trim() === 'Submit');
      if (submit) {
        submit.click();
        console.log('"Submit" clicked.');
      } else {
        throw new Error('Submit button not found');
      }
    });
    await sleepFunc();
  } catch (error) {
    console.log("Submit Failed:", error.message);
    await browser.close();
    process.exit(1);
  }

  // Check for success or failure
  await sleepFunc();
  const isSuccessPresent = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Thank you");
  if (isSuccessPresent) {
    console.log('Pass: Account creation successful.');
  } else {
    const isFailPresent = await page.evaluate((text) => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
    }, "Account already exists");
    if (isFailPresent) {
      console.log('Fail: Account already exists.');
      await browser.close();
      process.exit(1);
    } else {
      console.log('Fail: Unknown response after submit.');
      await browser.close();
      process.exit(1);
    }
  }

  console.log('PASS');
  await browser.close();
  process.exit(0);
}

const test_url = process.argv[2];
runTest(test_url);
