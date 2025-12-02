Follow case2.js and keep the structure same, only update the flow of navigation as per the details below:




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
- valueToClick = ["My company needs to be compliant"]
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
- Checktext = "Please select the environment that applies to your company"
- valueToClick = ["Azure Gov Cloud"]
chooseOptions(checktext, currentStep, valueToClick)
clickNext()


-. wait for sleepTime
- currentStep = Step 5: IT Footprint
- Checktext = "Please select the environment that applies to your company"
- valueToClick = ["Less than 50", "2 or less", "6 to 25"]
chooseOptions(checktext, currentStep, valueToClick)
clickNext()



-. wait for sleepTime
- currentStep = Step 6: Familiarity With Compliance
- Checktext = "Please select the environment that applies to your company"
- valueToClick = ["We have been certified in past to an IT standard like SOC 2 or ISO 27001"]
chooseOptions(checktext, currentStep, valueToClick)
clickNext()


-. wait for sleepTime
- currentStep = Step 7: IT Controls
- Checktext = "The following answers are pre-filled as "Yes" because you selected that you have been formally audited in the past. Please edit the pre-filled questions as needed if not accurate."
clickNext()




-. wait for sleepTime
takesnapshot
-. Do you see "Create account to download the entire proposal!" anywhere in the page? If yes, print "Pass: Step 7 IT Controls", 
- if error return error with message failed on  Step 7 IT Controls.

-. wait for sleepTime
-. Do you see "CMMC C3PAO Certification Proposal" and "For MSP" anywhere in the page? If yes, print "Pass: The proposal is visible. Entire test is a PASS. Please close the script now"
- return PASS


