const puppeteer = require('puppeteer');
const fs = require('fs');
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

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const datetime = dd + mm + yyyy + hh + min;

  // Check for saved session
  const sessionCookiesPath = './ca-woa-session.json';
  let sessionRestored = false;

  if (fs.existsSync(sessionCookiesPath)) {
    try {
      console.log('Attempting to restore saved create account woa session...');
      const sessionData = JSON.parse(fs.readFileSync(sessionCookiesPath, 'utf8'));
      await page.setCookie(...sessionData.cookies);

      // Try to navigate to create account page directly
      await page.goto(test_url);
      await sleepFunc();

      // Check if we're already at the create account form
      const isCreateAccountFormPresent = await page.evaluate((text) => {
        return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
      }, "Create Account");

      if (isCreateAccountFormPresent) {
        console.log('Successfully restored session - skipping to Create Account form');
        sessionRestored = true;
      } else {
        console.log('Saved session expired - proceeding with fresh start');
      }
    } catch (error) {
      console.log('Error restoring session:', error.message);
    }
  }

  if (!sessionRestored) {
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
  }

  // Fill form with public email
  await sleepFunc();
  await page.type('input[placeholder*="Email"]', `alpha${datetime}@gmail.com`);
  // Clear phone input first, then type
  await page.evaluate(() => {
    const phoneInput = document.querySelector('input[placeholder*="Phone"]');
    if (phoneInput) phoneInput.value = '';
  });
  await page.type('input[placeholder*="Phone"]', '+918527489490');
  await page.type('input[placeholder*="Name"]', 'Scripted Testing Donot Call');
  await page.type('input[placeholder*="Organization"]', 'Testing Co. Do not call');
  await page.type('input[placeholder*="Password"]', 'Alpha6&h!@#$%^&*');
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
    const emailInput = document.querySelector('input[placeholder*="Email"]');
    if (emailInput) emailInput.value = '';
  });
  await takeScreenshotFunc();
  await sleepFunc();

  // Check empty email validation
  const isEmptyEmailErrorPresent = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Enter a valid business email address (e.g., user@company.com).");
  if (!isEmptyEmailErrorPresent) {
    console.log('Fail: Please enter a valid email address. not found on the page');
    await browser.close();
    process.exit(1);
  }
  console.log('Pass: Empty email validated. Please enter a valid email address.');

  // Fill valid email and details
  await sleepFunc();
  await page.type('input[placeholder*="Email"]', 'hkumar@farmfetch.com');
  await page.evaluate(() => {
    const phoneInput = document.querySelector('input[placeholder*="Phone"]');
    if (phoneInput) phoneInput.value = '+918527489490';
    const nameInput = document.querySelector('input[placeholder*="Name"]');
    if (nameInput) nameInput.value = 'Scripted Testing Donot Call';
    const orgInput = document.querySelector('input[placeholder*="Organization"]');
    if (orgInput) orgInput.value = 'Testing Co. Do not call';
    const passInput = document.querySelector('input[placeholder*="Password"]');
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
    const passInput = document.querySelector('input[placeholder*="Password"]');
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

  // Check for success or failure
  await sleepFunc();
  const isSuccessPresent = await page.evaluate((text) => {
    return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
  }, "Thank you");
  if (isSuccessPresent) {
    console.log('Pass: Account creation successful.');

    // Save session cookies for future runs (skip navigation steps)
    if (!sessionRestored) {
      try {
        const cookies = await page.cookies();
        const sessionData = {
          cookies: cookies,
          timestamp: new Date().toISOString(),
          url: test_url
        };
        fs.writeFileSync(sessionCookiesPath, JSON.stringify(sessionData, null, 2));
        console.log('Saved create account woa session for future use');
      } catch (error) {
        console.log('Error saving session:', error.message);
      }
    }
  } else {
    const isFailPresent = await page.evaluate((text) => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
    }, "Account already exists");
    if (isFailPresent) {
      console.log('Pass: Existing account validated. Account already exists message found.');
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
