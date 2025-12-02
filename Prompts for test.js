
Recreate a runtest function with test_url as a parameter. 

Open test_url, if test_url not provided or the step fails, return error saying target URL either not found or not working.

define sleepTime as 5 in the config file of the application

define function chooseOptions(checktext, currentStep, (array)valueToClick[]){
	takesnapshot
	-. Do you see Checktext anywhere in the page? 
	- If yes, print Pass: currentStep + Checktext, 
	- else print Fail: "+Checktext+" not found on the page  and return FAIL with error checktext not found
	for each val in valueToClick{
		Do you see val anywhere in the page? 
			if yes -. Click on the span with text val. and print Pass: val
			 else print Fail: "+val+" not found on the page  and return FAIL with error val not found
	}
		
		
		
}

define function clickNext(){
	-. wait for sleepTime
		-. Click on the div with text "NEXT"
		- if error return error with message failed on currentStep.
}

- wait for sleepTime
- Click on the button having label / text as 'Get Started'
- On error return error with message "Get Started Failed"

-. wait for sleepTime
- currentStep = step 1 industry
- Checktext = "Which industry do you identify with the most?"
- valueToClick = ["Government / Defense"]
chooseOptions(checktext, currentStep, valueToClick)
clickNext()

-. wait for sleepTime
- currentStep = Step 2: Compliance Subject
- Checktext = "Who are you seeking compliance for?"
- valueToClick = ["My customer needs to be compliant"]
chooseOptions(checktext, currentStep, valueToClick)
clickNext()


-. wait for sleepTime
- currentStep = Step 3: Certification Type
- Checktext = "Which security certification would you like to explore today?"
- valueToClick = ["CMMC"]
chooseOptions(checktext, currentStep, valueToClick)
clickNext()



-. wait for sleepTime
- currentStep = Step 4: Environment
- Checktext = "Please select the environment that applies to your customer"
- valueToClick = ["Azure Gov Cloud"]
chooseOptions(checktext, currentStep, valueToClick)
clickNext()


-. wait for sleepTime
- currentStep = Step 5: IT Footprint
- Checktext = "Please select the closest that apply to your customer"
- valueToClick = ["Less than 50", "2 or less", "6 to 25"]
chooseOptions(checktext, currentStep, valueToClick)
clickNext()



-. wait for sleepTime
- currentStep = Step 6: Familiarity With Compliance
- Checktext = "Please select the closest that apply to your customer"
- valueToClick = ["My customer has been certified in past to an IT standard like SOC 2 or ISO 27001"]
chooseOptions(checktext, currentStep, valueToClick)
clickNext()


-. wait for sleepTime
- currentStep = Step 7: IT Controls
- Checktext = "The following answers are pre-filled as "Yes" because you selected that your customer has been formally audited in the past. Please edit the pre-filled questions as needed if not accurate."
clickNext()




-. wait for sleepTime
- currentStep = Step 7: IT Controls
- Checktext = "The following answers are pre-filled as "Yes" because you selected that your customer has been formally audited in the past. Please edit the pre-filled questions as needed if not accurate."
clickNext()



-. wait for sleepTime
takesnapshot
-. Do you see "Create account to download the entire proposal!" anywhere in the page? If yes, print "Pass: Step 7 IT Controls", 
- if error return error with message failed on  Step 7 IT Controls.

-. wait for sleepTime
-. Do you see "CMMC C3PAO Certification Proposal" and "For Your Customer" anywhere in the page? If yes, print "Pass: The proposal is visible. Entire test is a PASS. Please close the script now"
- return PASS












-. wait for sleepTime
-. Do you see "Which security certification would you like to explore today?" anywhere in the page? If yes, print "Pass: Step 2 Compliance Subject", 
-. Click on the span with text "CMMC". 
-. wait for sleepTime
-. Click on the div with text "NEXT"
- if error return error with message failed on step 2 Compliance Subject.

-. wait for sleepTime
-. Do you see "Please select the environment that applies to your customer" anywhere in the page? If yes, print "Pass: Step 3 Certification Type", 
-. Click on the span with text "Azure Gov Cloud". 
-. wait for sleepTime
-. Click on the div with text "NEXT"
- if error return error with message failed on Step 3 Certification Type.

-. wait for sleepTime
-. Do you see "Please select the closest that apply to your customer" anywhere in the page? If yes, print "Pass: Step 4 Environment", 
-. Click on the span with text "Less than 50". 
-. wait for sleepTime
-. Click on the span with text "2 or less". 
-. wait for sleepTime
-. Click on the span with text "6 to 25". 
-. wait for sleepTime
-. Click on the div with text "NEXT"
- if error return error with message failed on step 1 industry.

-. wait for sleepTime
-. Do you see "Please select the closest that apply to your customer" anywhere in the page? If yes, print "Pass: Step 5 IT Footprint", 
-. Click on the span with text "My customer has been certified in past to an IT standard like SOC 2 or ISO 27001". 
-. wait for sleepTime
-. Click on the div with text "NEXT"
- if error return error with message failed on Step 4 Environment.

-. wait for sleepTime
-. Do you see "The following answers are" anywhere in the page? If yes, print "Pass: Step 6 Familiarity with Compliance", 
-. Click on the div with text "NEXT"
- if error return error with message failed on Step 6 Familiarity with Compliance.

-. wait for sleepTime
-. Do you see "Create account to download the entire proposal!" anywhere in the page? If yes, print "Pass: Step 7 IT Controls", 
- if error return error with message failed on  Step 7 IT Controls.

-. wait for sleepTime
-. Do you see "CMMC C3PAO Certification Proposal" and "For Your Customer" anywhere in the page? If yes, print "Pass: The proposal is visible. Entire test is a PASS. Please close the script now"
- return PASS






Now understand that test.js script is a test script which is part of a test suite. 
We need to create a web application which will allow us to create test suites, In each test suite we can add test scripts having name, description. Here the name will be of exact test script to run.
For example, If I create a testSuite named "Self-Service All tests" and then add an entry for a test case with name: test.js and description: Testing the flow of assessments". The dashboard should show the list of test suites and when I click on the test suits, it should show the list of test cases inside. 


Against each test case, we should have a play button which on clicking should invoke respective script's runTest() function and fetch back it's return value to the application dashboard. The script should execute on server side terminal only. 




Hence we will now try to setup a web application which will have the following things:

The web page will have a table following columns:
1. Script Name
2. Script Description
3. Start Script
4. Test Status 

Test status will by deafult be not running. If someone clicks on start script the status should change to running. If the final outcome of the script is PASS then the status becomes pass, else when the script completes and the final console print is not PASS or database update is not PASS then it should say FAILED. 

For example:
current test.js is a script whith Script Description: "CMMC - My Customer". When someone will click on play button the consol should start running the test.js script. And when test.js is running the status should be running. After the script is done, it will say done. 