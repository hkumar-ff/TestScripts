For testing PCI DSS with vendor. 
create script file named pcidss-vendor.js
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
Find and click "I need to evaluate my vendor for compliance". 
Find and click "NEXT" 


stepid = "Step 3: Certification Type"
criteria = "Which security certification would you like to explore today?"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 

Find and click "PCI DSS". 
Find and click "NEXT" 



stepid = "Step 4: Environment"
criteria = "Please select the environment that applies to your vendor"
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

criteria = "PCI DSS Certification Proposal"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL Criteria . 

criteria = "For Your Vendor"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL Criteria . 

criteria = "Create account to download the entire proposal!"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL Criteria . 

If no FAIL encountered so far return PASS to the testfuciton. 


