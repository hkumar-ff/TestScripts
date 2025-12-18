For testing cmmc with vendor. 
create script file named cmmc-vendor.js
Follow the same theme as test.js
Take snapshot before each click. 
Call sleepfunc after every click
If a FAIL is encounted at any step, return FAIL. 


Find and Click on "Get Started" labelled button. 

criteria = "Which industry do you identify with the most?"
stepid = "step 1: Industry"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 
Find and click "Government / Defense". 
Find and click "NEXT" 



criteria = "Who are you seeking compliance for?"
stepid = "step 2: Compliance Subject"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 
Find and click "I need to evaluate my vendor for compliance". 
Find and click "NEXT" 



criteria = "Which security certification would you like to explore today?"
stepid = "Step 3: Certification Type"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 

Find and click "CMMC". 
Find and click "NEXT" 



stepid = "Step 4: Environment"
criteria = "Please select the environment that applies to your vendor"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 

Find and click "Azure Gov Cloud". 
Find and click "NEXT" 




stepid = "Step 5: IT Footprint"
criteria = "Please select the closest that apply to your vendor"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 

Find and click "Less than 50". 
Find and click "2 or less". 
Find and click "6 to 25". 
Find and click "NEXT" 

stepid = "Step 6: Familiarity With Compliance"
criteria = "Please select the closest that apply to your vendor"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 

Find and click "My vendor has been certified in past to an IT standard like SOC 2 or ISO 27001". 
Find and click "NEXT" 

stepid = "Step 7: IT Controls"
criteria = "because you selected that your vendor has been formally audited in the past. Please edit the pre-filled questions as needed if not accurate."
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 

Find and click "NEXT" 

criteria = "CMMC C3PAO Certification Proposal"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL Criteria . 

criteria = "For Your Vendor"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL Criteria . 

criteria = "Create account to download the entire proposal!"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL Criteria . 

If no FAIL encountered so far return PASS to the testfuciton. 


