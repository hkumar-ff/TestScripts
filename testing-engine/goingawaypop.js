const puppeteer = require('puppeteer');
const fs = require('fs');
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
  // Clear phone input first, then type
  await page.focus('input[placeholder="Enter phone number"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.keyboard.press('Delete');
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
        .fill(email); // Use the email from goingawaypop.js
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
      targetPage.locator('::-p-aria(Bot Testing[role="link"])'),
      targetPage.locator('tbody th a'),
      targetPage.locator('::-p-xpath(//*[@id="brandBand_2"]/div/div/div[2]/div/div[2]/div/div/div[2]/div/div/div/div[2]/div[2]/div[1]/div/div/table/tbody/tr/th/span/a)'),
      targetPage.locator(':scope >>> tbody th a'),
      targetPage.locator('::-p-text(Bot Testing)')
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

    // Click on Details tab
    await page.click('#detailTab__item');
    await sleepFunc();

    // Click to expand sections to ensure content is loaded
    await page.click('records-record-layout-section:nth-of-type(1) records-record-layout-row:nth-of-type(1) records-record-layout-item.item-left');
    await sleepFunc();

    await page.click('records-record-layout-section:nth-of-type(1) records-record-layout-row:nth-of-type(2) records-record-layout-item.item-left');
    await sleepFunc();

    await page.click('records-record-layout-row:nth-of-type(22) records-record-layout-item.item-left');
    await sleepFunc();

    // Get the full page text content
    const pageText = await page.evaluate(() => document.body.textContent);

    // Take screenshot of the loaded Salesforce lead details page
    await takeScreenshotFunc();

    // Clean phone number for search (remove spaces, hyphens, brackets, keep +)
    const cleanPhone = '+91.8527489490'.replace(/[\.\-\s\(\)]/g, '');

    // Check if name is found on the page
    if (!pageText.includes(name)) {
      console.log('FAIL: Name "' + name + '" not found in Salesforce lead details.');
      await browser.close();
      process.exit(1);
    }

    // Check if cleaned phone number is found on the page
    if (!pageText.includes(cleanPhone)) {
      console.log('FAIL: Phone number "' + cleanPhone + '" not found in Salesforce lead details.');
      await browser.close();
      process.exit(1);
    }

    // Check if company name is found on the page
    if (!pageText.includes('Testing Going Away Do not call')) {
      console.log('FAIL: Company name "Testing Going Away Do not call" not found in Salesforce lead details.');
      await browser.close();
      process.exit(1);
    }

    // Check if area of interest is found on the page
    if (!pageText.includes('Firewall Security Review;Professional Services;Cybersecurity Services')) {
      console.log('FAIL: Area of interest "Firewall Security Review;Professional Services;Cybersecurity Services" not found in Salesforce lead details.');
      await browser.close();
      process.exit(1);
    }

    // Check if assistance message is found on the page
    if (!pageText.includes('Assistance required:- Testing exit-intent popup triggered by going away action.')) {
      console.log('FAIL: Assistance message "Assistance required:- Testing exit-intent popup triggered by going away action." not found in Salesforce lead details.');
      await browser.close();
      process.exit(1);
    }

    // Check if summary of choices is found on the page
    if (!pageText.includes('Summary of Choices:- Industry: Retails and Payment Providers, For company')) {
      console.log('FAIL: Summary of choices "Summary of Choices:- Industry: Retails and Payment Providers, For company" not found in Salesforce lead details.');
      await browser.close();
      process.exit(1);
    }

    console.log('PASS: Name - Form: "' + name + '", Found in Salesforce: YES');
    console.log('PASS: Phone - Form: "+91.8527489490", Found in Salesforce: "' + cleanPhone + '"');
    console.log('PASS: Company - Form: "Testing Going Away Do not call", Found in Salesforce: YES');
    console.log('PASS: Area of Interest - Form: "Firewall Security Review;Professional Services;Cybersecurity Services", Found in Salesforce: YES');
    console.log('PASS: Assistance Message - Form: "Testing exit-intent popup triggered by going away action.", Found in Salesforce: YES');
    console.log('PASS: Summary of Choices - Form: "Summary of Choices:- Industry: Retails and Payment Providers, For company", Found in Salesforce: YES');
    console.log('PASS: email : ' + email + ' found in Salesforce.');
    await browser.close();
    process.exit(0);
  } catch (error) {
    // If any step fails (e.g., timeout), lead not found, which is FAIL
    await takeScreenshotFunc();
    console.log('FAIL: email not found in Salesforce.');
    await browser.close();
    process.exit(1);
  }
}

const test_url = process.argv[2];
runTest(test_url);
