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
    console.log('Starting Step 1: Industry');
    process.stdout.write('\n');
    await chooseOptions(page, browser, "Which industry do you identify with the most?", "step 1 industry", ["Retails and Payment Providers"], sleepFunc, takeScreenshotFunc);
    await clickNext(page, browser, "step 1 industry", sleepFunc, takeScreenshotFunc);
    console.log('Completed Step 1: Industry');
    process.stdout.write('\n');

    // Step 2: Compliance Subject
    await sleepFunc();
    console.log('Starting Step 2: Compliance Subject');
    process.stdout.write('\n');
    await chooseOptions(page, browser, "Who are you seeking compliance for?", "Step 2: Compliance Subject", ["My company needs to be compliant"], sleepFunc, takeScreenshotFunc);
    await clickNext(page, browser, "Step 2: Compliance Subject", sleepFunc, takeScreenshotFunc);
    console.log('Completed Step 2: Compliance Subject');
    process.stdout.write('\n');

    // Step 3: Certification Type
    await sleepFunc();
    console.log('Starting Step 3: Certification Type');
    process.stdout.write('\n');
    await chooseOptions(page, browser, "Which security certification would you like to explore today?", "Step 3: Certification Type", ["PCI DSS"], sleepFunc, takeScreenshotFunc);
    await clickNext(page, browser, "Step 3: Certification Type", sleepFunc, takeScreenshotFunc);
    console.log('Completed Step 3: Certification Type');
    process.stdout.write('\n');

    // Step 4: Environment
    await sleepFunc();
    console.log('Starting Step 4: Environment');
    process.stdout.write('\n');
    await chooseOptions(page, browser, "Please select the environment that applies to your company", "Step 4: Environment", ["AWS"], sleepFunc, takeScreenshotFunc);
    await clickNext(page, browser, "Step 4: Environment", sleepFunc, takeScreenshotFunc);
    console.log('Completed Step 4: Environment');
    process.stdout.write('\n');

    // Step 5: IT Footprint
    await sleepFunc();
    console.log('Starting Step 5: IT Footprint');
    process.stdout.write('\n');
    await chooseOptions(page, browser, "Please select the closest that apply to your company", "Step 5: IT Footprint", ["251 to 1000", "3 to 5", "26 to 100"], sleepFunc, takeScreenshotFunc);
    await clickNext(page, browser, "Step 5: IT Footprint", sleepFunc, takeScreenshotFunc);
    console.log('Completed Step 5: IT Footprint');
    process.stdout.write('\n');

    // Step 6: Familiarity With Compliance
    await sleepFunc();
    console.log('Starting Step 6: Familiarity With Compliance');
    process.stdout.write('\n');
    await chooseOptions(page, browser, "Please select the closest that apply to your company", "Step 6: Familiarity With Compliance", ["We have been certified in past to an IT standard like SOC 2 or ISO 27001"], sleepFunc, takeScreenshotFunc);
    await clickNext(page, browser, "Step 6: Familiarity With Compliance", sleepFunc, takeScreenshotFunc);
    console.log('Completed Step 6: Familiarity With Compliance');
    process.stdout.write('\n');

    // Step 7: IT Controls
    await sleepFunc();
    console.log('Starting Step 7: IT Controls');
    process.stdout.write('\n');
    await takeScreenshotFunc();
    const isCheckTextPresentStep7 = await page.evaluate((text) => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(text));
    }, "because you selected that you have been formally audited in the past. Please edit the pre-filled questions as needed if not accurate.");
    if (!isCheckTextPresentStep7) {
      console.log(`Fail: Step 7: IT Controls: because you selected that you have been formally audited in the past. Please edit the pre-filled questions as needed if not accurate. not found on the page`);
      process.stdout.write('\n');
      await browser.close();
      process.exit(1);
    }
    console.log(`Pass: Step 7: IT Controls: because you selected that you have been formally audited in the past. Please edit the pre-filled questions as needed if not accurate.`);
    process.stdout.write('\n');
    await clickNext(page, browser, "Step 7: IT Controls", sleepFunc, takeScreenshotFunc);
    console.log('Completed Step 7: IT Controls');
    process.stdout.write('\n');

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

  // Now proceed to Salesforce verification
  console.log('Proceeding to Salesforce lead verification...');

  // Salesforce Login Sequence with Persistent Sessions
  console.log('Starting Salesforce login...');

  const cookiesPath = './salesforce-cookies.json';
  let loggedIn = false;

  // Try to restore saved session first
  if (fs.existsSync(cookiesPath)) {
    try {
      console.log('Attempting to restore saved Salesforce session...');
      const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
      await page.setCookie(...cookies);

      // Navigate to Salesforce and check if still logged in
      await page.goto('https://d54000000qsyvea0--devinstnce.sandbox.my.salesforce.com/');
      await sleepFunc();

      // Check if login form is absent (means we're logged in)
      const isLoggedIn = await page.evaluate(() => {
        return !document.querySelector('#username') && !document.querySelector('#password');
      });

      if (isLoggedIn) {
        console.log('Successfully restored Salesforce session - skipping login');
        loggedIn = true;
      } else {
        console.log('Saved session expired - proceeding with fresh login');
      }
    } catch (error) {
      console.log('Error restoring session:', error.message);
    }
  }

  // If session restoration failed, do fresh login
  if (!loggedIn) {
    await page.goto('https://d54000000qsyvea0--devinstnce.sandbox.my.salesforce.com/');
    await sleepFunc();
    await takeScreenshotFunc();

    await sleepFunc();
    await page.type('#username', 'amisra@controlcase.com');
    await takeScreenshotFunc();

    await sleepFunc();
    await page.type('#password', 'Nitinapr@21');
    await takeScreenshotFunc();

    await sleepFunc();
    await page.click('#Login');
    await sleepFunc();
    await takeScreenshotFunc();

    // Check for two-factor authentication
    const isVerifyIdentity = await page.evaluate(() => {
      return document.body.textContent.includes('Verify Your Identity');
    });

    if (isVerifyIdentity) {
      console.log('Two-factor authentication required. Waiting for verification code...');
      await sleepFunc();
      // Wait for 6 digits in emc input
      while (true) {
        const emcValue = await page.$eval('#emc', el => el.value);
        if (emcValue.length === 6) {
          console.log('Verification code entered. Proceeding...');
          break;
        }
        await sleepFunc();
      }

      await sleepFunc();
      await page.click('input#save');
    }

    // Save cookies for future sessions
    try {
      const cookies = await page.cookies();
      fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
      console.log('Saved Salesforce session cookies for future use');
    } catch (error) {
      console.log('Error saving cookies:', error.message);
    }
  }

  console.log('Salesforce login sequence completed successfully');

  try {
    // Navigate to chatter page and perform search
    console.log('Navigating to Salesforce Chatter and performing search...');

    {
      const targetPage = page;
      await targetPage.setViewport({
        width: 1920,
        height: 911
      });
      await sleepFunc();
    }

    {
      const targetPage = page;
      await targetPage.goto('https://d54000000qsyvea0--devinstnce.sandbox.lightning.force.com/lightning/page/chatter');
      await sleepFunc();
      await takeScreenshotFunc();
      await sleepFunc();
    }

    {
      const targetPage = page;
      await puppeteer.Locator.race([
        targetPage.locator('::-p-aria(Search)'),
        targetPage.locator('#312\\:0'),
        targetPage.locator('::-p-xpath(//*[@id="312:0"])'),
        targetPage.locator(':scope >>> #312\\:0')
      ])
        .setTimeout(5000)
        .click({
          offset: {
            x: 72.78125,
            y: 20,
          },
        });
      await sleepFunc();
      await takeScreenshotFunc();
      await sleepFunc();
    }
    console.log('Clicked search button.');

    {
      const targetPage = page;
      await puppeteer.Locator.race([
        targetPage.locator('::-p-aria(Search by object type)'),
        targetPage.locator('#combobox-input-146'),
        targetPage.locator('::-p-xpath(//*[@id="combobox-input-146"])'),
        targetPage.locator(':scope >>> #combobox-input-146'),
        targetPage.locator('::-p-text(Search: Leads)')
      ])
        .setTimeout(5000)
        .click({
          offset: {
            x: 62,
            y: 19,
          },
        });
      await sleepFunc();
      await takeScreenshotFunc();
      await sleepFunc();
    }

    {
      const targetPage = page;
      await puppeteer.Locator.race([
        targetPage.locator('ul:nth-of-type(1) > li:nth-of-type(11) span.slds-media__body'),
        targetPage.locator('::-p-xpath(//*[@id="combobox-input-146-9-146"]/span[2])'),
        targetPage.locator(':scope >>> ul:nth-of-type(1) > li:nth-of-type(11) span.slds-media__body')
      ])
        .setTimeout(5000)
        .click({
          offset: {
            x: 53,
            y: 14,
          },
        });
      await sleepFunc();
      await takeScreenshotFunc();
      await sleepFunc();
    }
    console.log('Selected Leads for scoped search.');

    {
      const targetPage = page;
      await puppeteer.Locator.race([
        targetPage.locator('::-p-aria(Search Leads)'),
        targetPage.locator('#input-149'),
        targetPage.locator('::-p-xpath(//*[@id="input-149"])'),
        targetPage.locator(':scope >>> #input-149')
      ])
        .setTimeout(5000)
        .click({
          offset: {
            x: 75,
            y: 19,
          },
        });
      await sleepFunc();
      await takeScreenshotFunc();
      await sleepFunc();
    }

    {
      const targetPage = page;
      await puppeteer.Locator.race([
        targetPage.locator('::-p-aria(Search Leads)'),
        targetPage.locator('#input-149'),
        targetPage.locator('::-p-xpath(//*[@id="input-149"])'),
        targetPage.locator(':scope >>> #input-149')
      ])
        .setTimeout(5000)
        .fill(`alpha${datetime}@gmail.com`); // Use the email from form
      await sleepFunc();
      await takeScreenshotFunc();
      await sleepFunc();
    }
    console.log('Filled search input with email:', `alpha${datetime}@gmail.com`);

    {
      const targetPage = page;
      await targetPage.keyboard.down('Enter');
      await sleepFunc();
    }

    {
      const targetPage = page;
      await targetPage.keyboard.up('Enter');
      await sleepFunc();
    }

    {
      const targetPage = page;
      await puppeteer.Locator.race([
        targetPage.locator('div.leftContent > div'),
        targetPage.locator('::-p-xpath(//*[@id="brandBand_2"]/div/div/div[2]/div/div[2]/div/div/div[1]/div/div[1]/div)'),
        targetPage.locator(':scope >>> div.leftContent > div')
      ])
        .setTimeout(5000)
        .click({
          delay: 742.1999999880791,
          offset: {
            x: 0,
            y: 9,
          },
        });
      await sleepFunc();
      await takeScreenshotFunc();
      await sleepFunc();
    }

    await sleepFunc();
    await takeScreenshotFunc();
    await sleepFunc();

    console.log('Search completed. Now attempting to open first lead...');

    // Attempt to click on first lead in the table
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(Scripted Testing[role="link"])'),
      targetPage.locator('tbody th a'),
      targetPage.locator('::-p-xpath(//*[@id="brandBand_2"]/div/div/div[2]/div/div[2]/div/div/div[2]/div/div/div/div[2]/div[2]/div[1]/div/div/table/tbody/tr/th/span/a)'),
      targetPage.locator(':scope >>> tbody th a'),
      targetPage.locator('::-p-text(Scripted Testing)')
    ])
      .setTimeout(5000)
      .click({
        offset: {
          x: 78,
          y: 8.875,
        },
      });
    await sleepFunc();
    await takeScreenshotFunc();
    await sleepFunc();

    // If we reach here, lead was found, which is PASS
    console.log('PASS: Public email lead found as expected in Salesforce.');
    await browser.close();
    process.exit(0);
  } catch (error) {
    // If any step fails (e.g., timeout), lead not found, which is FAIL
    await takeScreenshotFunc();
    console.log('FAIL: Public email lead not found in Salesforce.');
    await browser.close();
    process.exit(1);
  }
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
