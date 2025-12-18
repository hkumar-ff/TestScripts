For testing PCI DSS with self. 
create script file named test-createaccount-form.js
Follow the same theme as test.js
Take snapshot before each click. 
Call sleepfunc after every click
If a FAIL is encounted at any step, return FAIL. 


Find and Click on "Get Started" labelled button. 

stepid = "step 1: Industry"
criteria = "Which industry do you identify with the most?"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 
Find and click "Retails and Payment Providers". 
Find and click "NEXT" 


stepid = "step 2: Compliance Subject"
criteria = "Who are you seeking compliance for?"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 
Find and click "My company needs to be compliant". 
Find and click "NEXT" 


stepid = "Step 3: Certification Type"
criteria = "Which security certification would you like to explore today?"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 

Find and click "PCI DSS". 
Find and click "NEXT" 



stepid = "Step 4: Environment"
criteria = "Please select the environment that applies to your company"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 

Find and click "AWS". 
Find and click "NEXT" 




stepid = "Step 5: IT Footprint"
criteria = "Please select the closest that apply to your vendor"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 

Find and click "251 to 1000". 
Find and click "3 to 5". 
Find and click "26 to 100". 
Find and click "NEXT" 

stepid = "Step 6: Familiarity With Compliance"
criteria = "Please select the closest that apply to your company"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 

Find and click "We have been certified in past to an IT standard like SOC 2 or ISO 27001". 
Find and click "NEXT" 

stepid = "Step 7: IT Controls"
criteria = "because you selected that you have been formally audited in the past. Please edit the pre-filled questions as needed if not accurate."
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 

Find and click "NEXT" 

criteria = "PCI DSS 4.0 Certification Proposal"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL Criteria . 

criteria = "For Retails & Payment"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL Criteria . 

criteria = "Create account to download the entire proposal!"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL Criteria . 



Find and click "Download Now"
criteria = "Create Account"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL Criteria . 

// Comment: Testing public email restriction
find input field "Email" and write "alpha@gmail.com"

find input field "Phone" and input phone number as "+918527489490"

find input field "Name" and input "Scripted Testing Donot Call"
find input field "Organization Name" and input "Testing Co. Do not call"
find input field "Password" and input "Alpha6&h!@#$%^&*"

find and click "Submit"

criteria = "Enter a valid business email address (e.g., user@company.com)."
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL: Public email validated. Criteria . 

find input field "Email" and make it empty ""

criteria = "Please enter a valid email address."
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL: Empty email validated. Criteria . 



find input field "Email" and replace content "hkumar@farmfetch.com"

find input field "Phone" and replace content phone number as "+918527489490"

find input field "Name" and replace content "Scripted Testing Donot Call"
find input field "Organization Name" and replace content "Testing Co. Do not call"
find input field "Password" and replace content "Alpha"

Found button with label "Submit" disabled on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL: Password validation working. 

find input field "Password" and replace content "Alpha6&h!@#$%^&*"

find and click "Submit" button. 

criteria = "Account already exists"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL: Existing account validated. Criteria message found. 

log message "Please test create account success manually.".

Return PASS