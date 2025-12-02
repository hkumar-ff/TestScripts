const puppeteer = require('puppeteer');
const readline = require('readline');

async function runTest(complianceSubject, certificationType, proposalTitle, familiarity) {
  // Launch browser in non-headless mode to see the page
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized']
  });
  const page = await browser.newPage();
  await page.setViewport(null);

  // Navigate to the website
  await page.goto('https://selfservicedev.controlcase.com');

  console.log('Website www.controlcase.com opened in browser.');
  console.log('Clicking "Get Started" button...');

  // Wait for the button and click it
  try {
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const button = buttons.find(b => b.textContent.trim() === 'Get Started');
      if (button) {
        button.click();
        return true;
      }
      return false;
    });
  console.log('"Get Started" button clicked.');
  } catch (error) {
    console.log('Button not found or could not be clicked.');
  }

  console.log('Waiting for 10 seconds...');
  try {
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');
  } catch (error) {
    console.log('Error during wait, proceeding anyway.');
  }

  // Wait for the form elements to load
  try {
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('Which industry do you identify with the most?'));
    }, { timeout: 15000 });
    console.log('Pass: Get Started is working on the homepage');

    // Click on Government / Defense span
    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.textContent.trim() === 'Government / Defense');
      if (span) span.click();
    });

    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    // Click on Next div
    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const div = divs.find(d => d.textContent.trim() === 'NEXT');
      if (div) div.click();
    });

  } catch (error) {
    console.log('Form elements not found or timed out.');
  }

  try {
    // Step 1
    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    const isStep1Present = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('Who are you seeking compliance for?'));
    });
    if (isStep1Present) {
      console.log('Pass: Step 1 Industry');
    }

    await page.evaluate((subject) => {
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.textContent.trim() === subject);
      if (span) span.click();
    }, complianceSubject);

    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const div = divs.find(d => d.textContent.trim() === 'NEXT');
      if (div) div.click();
    });

    // Step 2
    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    const isStep2Present = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('Which security certification would you like to explore today?'));
    });
    if (isStep2Present) {
      console.log('Pass: Step 2 Compliance Subject');
    }

    await page.evaluate((certType) => {
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.textContent.trim() === certType);
      if (span) span.click();
    }, certificationType);

    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const div = divs.find(d => d.textContent.trim() === 'NEXT');
      if (div) div.click();
    });

    // Step 3
    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    const isStep3Present = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('Please select the environment that applies to your customer'));
    });
    if (isStep3Present) {
      console.log('Pass: Step 3 Certification Type');
    }

    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.textContent.trim() === 'Azure Gov Cloud');
      if (span) span.click();
    });

    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const div = divs.find(d => d.textContent.trim() === 'NEXT');
      if (div) div.click();
    });

    // Step 4
    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    const isStep4Present = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('Please select the closest that apply to your customer'));
    });
    if (isStep4Present) {
      console.log('Pass: Step 4 Environment');
    }

    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.textContent.trim() === 'Less than 50');
      if (span) span.click();
    });

    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.textContent.trim() === '2 or less');
      if (span) span.click();
    });

    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.textContent.trim() === '6 to 25');
      if (span) span.click();
    });

    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const div = divs.find(d => d.textContent.trim() === 'NEXT');
      if (div) div.click();
    });

    // Step 5
    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    const isStep5Present = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('Please select the closest that apply to your customer'));
    });
    if (isStep5Present) {
      console.log('Pass: Step 5 IT Footprint');
    }

    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.textContent.trim() === 'My customer has been certified in past to an IT standard like SOC 2 or ISO 27001');
      if (span) span.click();
    });
    await page.evaluate((fwc) => {
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.textContent.trim() === fwc);
      if (span) span.click();
    }, familiarity);

    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const div = divs.find(d => d.textContent.trim() === 'NEXT');
      if (div) div.click();
    });

    // Step 6
    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    const isStep6Present = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('The following answers are'));
    });
    if (isStep6Present) {
      console.log('Pass: Step 6 Familiarity with Compliance');
    }

    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const div = divs.find(d => d.textContent.trim() === 'NEXT');
      if (div) div.click();
    });

    // Step 7
    console.log('Waiting for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Waited 10 seconds.');

    const isStep7aPresent = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('Create account to download the entire proposal!'));
    });
    if (isStep7aPresent) {
      console.log('Pass: Step 7 IT Controls');
    }

    const isStep7bPresent = await page.evaluate((title) => {
      return Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes(title));
    }, proposalTitle);
    if (isStep7bPresent) {
      console.log('Pass: '+proposalTitle+' is visible in the proposal screen. Entire test is a PASS. Please close the script now');
      await browser.close();
      return "PASS";
    } else {
      console.log('Test completed. Closing browser...');
      await browser.close();
      return "FAIL";
    }

  } catch (error) {
    console.log('Error during additional steps:', error);
    await browser.close();
    return "FAIL";
  }
}


// const complianceSubject = 'My customer needs to be compliant';
// const certificationType = 'CMMC';
// const proposalTitle = 'CMMC C3PAO Certification Proposal';
// const familiarity = "My customer has been certified in past to an IT standard like SOC 2 or ISO 27001";
// Status: PASS

// const complianceSubject = 'My company needs to be compliant';
// const certificationType = 'CMMC';
// const proposalTitle = 'CMMC C3PAO Certification Proposal';
// const familiarity = "We have been certified in past to an IT standard like SOC 2 or ISO 27001";
// Status: PASS

// const complianceSubject = 'I need to evaluate my vendor for compliance';
// const certificationType = 'CMMC';
// const proposalTitle = 'CMMC C3PAO Certification Proposal';
// const familiarity = "My vendor has been certified in past to an IT standard like SOC 2 or ISO 27001";
// Status: PASS

// const complianceSubject = 'I need to evaluate my vendor for compliance';
// const certificationType = 'CMMC';
// const proposalTitle = 'CMMC C3PAO Certification Proposal';
// const familiarity = "My vendor has been certified in past to an IT standard like SOC 2 or ISO 27001";
// Status: PASS

runTest(complianceSubject, certificationType, proposalTitle, familiarity);
