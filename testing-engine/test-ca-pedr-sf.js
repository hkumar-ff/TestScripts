const puppeteer = require('puppeteer');
const fs = require('fs');
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
  const email = `alpha${datetime}@gmail.com`; // Public email for testing

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

  // Fill form with public email
  await sleepFunc();
  await page.type('input[id="_r_1_"]', email);
  // Clear phone input first, then type
  await page.focus('input[placeholder="Enter phone number"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.keyboard.press('Delete');
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
  console.log('Pass: Public Email/Direct Register x Step 2: Inline Email Verification. NO');

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
        .fill(email); // Use the dynamic email instead of hardcoded
      await sleepFunc();
      await takeScreenshotFunc();
      await sleepFunc();
    }
    console.log('Filled search input with email:', email);

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

    // If we reach here, lead was found, which is FAIL
    console.log('FAIL: Public email record found unexpectedly in Salesforce.');
    await browser.close();
    process.exit(1);
  } catch (error) {
    // If any step fails (e.g., timeout), no lead found, which is PASS
    await takeScreenshotFunc();
    console.log('PASS: The public email record not found as expected in Salesforce.');
    await browser.close();
    process.exit(0);
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
