# LabelGuard AI

Problem Statement ID

26034

Problem Statement Title

Software System to check compliance of Packaged Commodities under Legal Metrology(Packaged Commodities) Rules, 2011 by scanning products, images and labels.

Description

Background:

Packaged commodities are widely sold through retail stores, supermarkets and e-commerce platforms across India. Under the Legal Metrology Act, 2009 and the Legal Metrology(Packaged Commodities) Rules, 2011, every packaged commodity is required to bear mandatory declarations such as name and address of manufacturer/packer/importer, net quantity, Maximum Retail Price (MRP), month and year of manufacture/packing/import,consumer care details and other prescribed declarations in a specified format and manner.These declarations are important for ensuring transparency, fair trade practices and consumer protection. However, due to the large volume and variety of packaged products available in the market, manual inspection and compliance checking by enforcement agencies becomes time-consuming and resource intensive. Non-compliance such as missing declarations, incorrect font sizes, improper MRP declarations and other such practices are frequently observed.There is scope to develop a compliance checking system capable of scanning product labels,package images and product listings to identify violations under the Legal Metrology(Packaged Commodities) Rules, 2011. Accordingly, a software system capable of automatically detecting, extracting and validating mandatory declarations and identifying noncompliances in packaged commodities through image and label analysis can be developed.

Description:

Develop a software application capable of scanning packaged commodity labels, product images and product information to automatically assess compliance with the Legal Metrology(Packaged Commodities) Rules, 2011.

The system should be capable of:

• Scanning and analyzing images of packaged commodities.
• Detecting mandatory declarations prescribed under Legal Metrology rules.
• Checking correctness, completeness and placement of declarations.
• Identifying missing or non-compliant declarations.
• Checking readability and font size requirements.
• Generating compliance reports and violation summaries.
• Maintaining a repository of scanned products and compliance history.
• Providing dashboards for enforcement officials.

Expected Solution:

The proposed solution should include:

• User-friendly web and/or mobile-based software application.
• Automated extraction and validation of mandatory declarations.
• Rule-based compliance checking for Legal Metrology (Packaged Commodities)

Rules, 2011.

• Generation of digital compliance reports in PDF and editable formats.
• Dashboard for monitoring inspections, violations and product compliance details.
• Search and retrieval facility for previously scanned products and reports.
• Technical documentation describing software architecture and deployment framework.

Key Functional Requirements:

• Image upload and product scanning functionality.
• Extraction of declarations from labels and packaging and detection of mandatory declarations
• Font size and readability analysis.
• Detection of missing, misleading or non-standard declarations.
• Generation of compliance/non-compliance reports.
• Attachment of photographs and supporting evidence.
• Repository of scanned products and inspection history.
• Role-based user access and secure authentication.
• Dashboard for monitoring compliance status and enforcement activities.
• Export of reports to PDF and editable formats.

OrganizationMinistry of Consumer Affairs, Food & Public DistributionDepartmentDepartment of Consumer Affairs (DoCA)CategorySoftwareThemeAgriculture, FoodTech & Rural DevelopmentYoutube LinkDataset Linkhttps://consumeraffairs.gov.in/pages/legal-metrology-act and the Legal Metrology (Packaged commodities) Rules, 2011

i write something from my end

You are an expert full-stack engineer, AI/ML engineer, UI/UX designer, and hackathon product builder.

I want you to actually build the website/app, not just explain the architecture or give me a plan.

Build a polished, functional prototype for SIH Problem Statement 26034.

PROJECT

Product Name

LabelGuard AI

Problem Statement

Software System to check compliance of Packaged Commodities under the Legal Metrology (Packaged Commodities) Rules, 2011 by scanning products, images, and labels.

Organization

Ministry of Consumer Affairs, Food & Public Distribution
Department of Consumer Affairs (DoCA)

Category

Software

CORE PRODUCT IDEA

Build an AI-powered Legal Metrology Compliance Inspection Platform for enforcement officers.

An officer should be able to:

Upload/scan a packaged product → AI extracts label information → compliance rules are checked → violations are identified → evidence is highlighted → officer reviews findings → compliance report is generated.

The product must feel like a real government enforcement platform, not a generic OCR demo or chatbot.

IMPORTANT

I have only 2 days to build this project.

Therefore:

Build a realistic MVP.

Do NOT over-engineer.

Do NOT create unnecessary features.

Prioritize a polished working demo.

Use mock/demo data where external infrastructure is unavailable.

The core compliance workflow must actually work.

Use AI/OCR where it provides real value.

Use deterministic rule-based validation for legal compliance wherever possible.

Never pretend AI-generated results are legally definitive.

MAIN USER

Enforcement Officer

The officer uses the application to inspect packaged commodities and identify possible violations.

The system should assist the officer, not replace legal judgment.

MAIN WORKFLOW

Build this complete flow:

Login
↓
Dashboard
↓
Create New Inspection
↓
Upload Product Images
↓
Image Processing / OCR
↓
Extract Label Information
↓
Compliance Analysis
↓
Violation Detection
↓
Evidence Highlighting
↓
Officer Verification
↓
Compliance Result
↓
Generate Report
↓
Save Inspection History

REQUIRED SCREENS

1. Login

Create a professional government/enterprise login screen.

Include:

LabelGuard AI logo

Product tagline

Email

Password

Login button

Demo login option

Secure-looking design

Ministry/Department context

Authentication can be mocked for the MVP if necessary.

2. Dashboard

Create a polished enforcement dashboard.

Show:

Statistics

Total inspections

Compliant products

Non-compliant products

Pending reviews

Violations detected

Charts

Compliance trend

Violation categories

Recent inspections

Recent Inspections

Show:

Product

Date

Officer

Compliance status

Violation count

View report

Main CTA

- New Inspection

3. NEW INSPECTION

Create an inspection workflow.

Allow the officer to:

Upload product images

Upload multiple images

Drag and drop

Preview images

Remove images

Add product name/identifier

Start AI analysis

Make the upload experience polished.

4. AI ANALYSIS SCREEN

Create a visually impressive processing screen.

Show stages such as:

✓ Image received
✓ Preprocessing image
✓ Extracting label information
✓ Detecting mandatory declarations
✓ Applying Legal Metrology rules
✓ Checking readability
✓ Generating compliance assessment

Use subtle animations.

Do NOT create fake long loading times.

5. COMPLIANCE ANALYSIS

This is the most important screen.

Display the uploaded package image on one side.

Display extracted information on the other.

Example:

EXTRACTED DECLARATIONS

Manufacturer
ABC Foods Pvt Ltd

Address
New Delhi, India

Net Quantity
500 g

MRP
₹120

Manufacturing/Packing Date
07/2026

Consumer Care
1800-XXX-XXXX

Then show compliance checks:

✓ Manufacturer details
✓ Address
✓ Net quantity
✓ MRP
⚠ Font size
✗ Consumer care details
✓ Date declaration

6. EVIDENCE VIEWER

Create a major "wow" feature.

When a violation is detected:

Highlight the relevant area on the package image.

Draw a bounding box or visual marker.

Show the detected text.

Show the relevant compliance requirement.

Explain why it may be non-compliant.

Show confidence.

Allow officer verification.

Example:

POTENTIAL VIOLATION

Consumer Care Declaration

Status:
Missing

Confidence:
94%

Evidence:
No consumer-care declaration detected.

Officer Action:

[Confirm Violation]

[False Positive]

[Needs Manual Review]

The officer must remain in control.

7. COMPLIANCE SCORE

Create a professional result card.

Example:

COMPLIANCE SCORE

82 / 100

⚠ POTENTIALLY NON-COMPLIANT

7 Checks Passed
2 Violations
1 Manual Review

Use clear visual hierarchy.

Do not make the score look legally authoritative.

Label it as an AI-assisted preliminary assessment.

8. VIOLATION DETAILS

Create a detailed violation panel.

For every violation show:

Violation category

Extracted evidence

Relevant rule/reference

Explanation

Confidence

Image evidence

Officer verification status

Include:

AI Assessment
↓
Legal Rule
↓
Evidence
↓
Officer Decision

This explainability flow should be one of the strongest parts of the product.

9. REPORT GENERATION

Create a professional inspection report page.

Include:

Product details

Inspection ID

Date

Officer

Uploaded evidence

Extracted declarations

Compliance checks

Violations

Legal references

Officer decisions

Final assessment

Add:

Download PDF

and

Export Report

If real PDF generation takes too long, create a print-ready report view that can be exported through the browser.

10. INSPECTION HISTORY

Create a searchable table.

Columns:

Inspection ID

Product

Date

Officer

Status

Violations

Score

View Report

Add:

Search

Filters

Status filter

Date filter

Product filter

11. PRODUCT DETAILS

Allow officers to open a previous product and see:

Product information

Previous inspections

Compliance history

Previous violations

Current status

This can demonstrate repeat inspection capability.

AI / OCR IMPLEMENTATION

Use the simplest reliable implementation possible.

Preferred pipeline:

Image
↓
OCR / Vision
↓
Structured extraction
↓
Compliance rule engine
↓
Violation detection
↓
Evidence
↓
Report

Use free/open-source or free-tier AI services where possible.

If an external AI/OCR API requires a key:

Keep it in environment variables.

NEVER expose it in frontend code.

Provide a demo/mock fallback if the API is unavailable.

The application should still be demoable.

RULE ENGINE

Do NOT let an LLM alone decide legal compliance.

Implement a simple deterministic rule engine.

Represent checks in structured form.

Example:

{
requirement: "Net Quantity",
extractedValue: "...",
status: "PASS",
confidence: 0.97,
evidence: "...",
ruleReference: "..."
}

Create the architecture so additional legal rules can easily be added later.

Use the official Legal Metrology source provided for the project.

If a legal requirement cannot reliably be determined from an image, mark:

Manual Verification Required

instead of inventing a result.

DESIGN DIRECTION

The UI should look like a premium government enforcement / enterprise compliance platform.

Design inspiration:

Modern enterprise SaaS

Government digital platforms

Linear

Vercel

Stripe dashboards

Palantir-style analytical interfaces

Avoid:

Generic ChatGPT UI

Excessive glassmorphism

Overly flashy neon AI effects

Cartoonish illustrations

Huge unnecessary gradients

Use:

Clean typography

Strong hierarchy

Professional cards

Data visualization

Subtle AI accents

Clear status colors

Excellent spacing

Responsive layouts

Smooth but restrained animations

RESPONSIVENESS

Make it work on:

1440px

1366px

1024px

768px

430px

375px

No:

horizontal overflow

overlapping buttons

broken cards

excessive blank space

unreadable tables

inaccessible modals

TECH STACK

Prefer:

Frontend

React / Next.js
Tailwind CSS

Backend

Node.js or Python/FastAPI

Database

Supabase/PostgreSQL

AI/OCR

Use an appropriate free/open-source or free-tier solution.

Deployment

Vercel or another reliable free-tier platform.

Do not introduce unnecessary frameworks.

SECURITY

Implement basic production-safe practices:

Environment variables for secrets

No API keys in frontend

File type validation

File size limits

Input validation

Safe image handling

Basic authentication/demo authentication

Secure API calls

Error handling

ARCHITECTURE

Keep the code:

Modular

Easy to understand

Reusable

Easy to modify

AI-coding friendly

The architecture should allow us to add new compliance rules quickly.

2-DAY PRIORITY

If time becomes limited, prioritize in this exact order:

P0

Product upload

OCR/extraction

Compliance rule engine

Violation detection

Evidence visualization

Compliance result

P1

Dashboard

Inspection history

Report generation

P2

Advanced analytics

Extra AI features

Additional polish

Do NOT sacrifice the core inspection workflow for secondary features.

DEMO EXPERIENCE

The final demo should be approximately 3–5 minutes.

Demo flow:

Login
↓
Dashboard
↓
New Inspection
↓
Upload packaged product
↓
AI scans package
↓
Declarations extracted
↓
Compliance rules applied
↓
Violation highlighted on image
↓
Officer reviews evidence
↓
Compliance score generated
↓
Report generated

The "highlighted violation + legal rule + evidence" moment should be the main demo wow moment.

Build a small, polished, believable, working compliance inspection product, not a huge unfinished system.

## Development

### Prerequisites

- Node.js (v20+) and npm (or bun)
- API Keys: Google Gemini API Key (`GEMINI_API_KEY`) and/or OpenAI API Key (`OPENAI_API_KEY`)

### Setup & Run

```sh
npm install
# Configure your .env file with GEMINI_API_KEY and/or OPENAI_API_KEY
npm run dev
```
