For testing PCI DSS with self. 
create script file named otherpop.js
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

Find and click "Other". 
Find and click "NEXT" 



stepid = "Let us Assist You"
criteria = "ControlCase offers 60+ globally recognized certifications across all major industries, helping organizations meet compliance objectives with confidence."
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL stepid + Criteria . 

Find and click "Name"
Find and click "Company"
Find and click "Email"
Find and click "Phone"
criteria = "Name is required"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL + Criteria . 

criteria = "Company is required"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL + Criteria . 


criteria = "Email is required"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL + Criteria . 


Find input field id "_r_2_" and write "Harish Testing" into it.
Find input field id "_r_3_" and write "Testing Other Do not call".
Find input field id "_r_4_" and input "Other@autotest.com"
find input field placeholder "Enter phone number" and input "+91.8527489490"
find and click "Select Area of Interest"


find and click "Cybersecurity Services"
find and click "Other"
find and click "Firewall Review"

find and click "Submit"


criteria = "Thank you for your response, our team will get back to you shortly!"
Found criteria on the page? PASS: FAIL 
log a meessage of status on PASS/FAIL + Criteria . 

if page redirected to "/certifications/": PASS: FAIL;

log a message of status on PASS/FAIL opening page certifications. 

Return PASS