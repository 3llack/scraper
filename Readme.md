Lead Scrapers (Apollo + Freshsales + Hostinger)
This project contains two Node.js scrapers:


Apollo Scraper – extracts leads from Apollo
Freshsales Scraper – extracts contacts from Freshsales CRM views using API
Hostinger Scraper - extracts mails from inbox using keywords

All scripts output clean JSON files for further processing.


Requirements
Node.js 16+


API keys for:
Freshsales CRM


Installation
Clone the project and install dependencies:
git clone https://github.com/3llack/scraper.git
cd scraper
npm i dependencies


Setup
Create a .env file in the project root:
APOLLO_API_KEY=your_apollo_key
FRESHSALES_API_KEY=your_freshsales_key
FRESHSALES_VIEW_ID=your_view_id
HOSTINGER_MAIL_ADDRESS=your_mail_address
HOSTINGER_MAIL_PASSWORRD=your_mail_password
HOSTINGER_IMAP_HOST="imap.hostinger.com"
HOSTINGER_PORT="993" or check your hpanel for port details


Your .gitignore should hide: 
.env, node_modules, and any JSON output.


Running the Scrapers
Apollo Scraper
Fetches leads from Apollo and saves them to leads.json.
node scraper.js --> to run

Freshsales Scraper
Fetches contacts from a Freshsales CRM view and saves them to freshsales-api-contacts.json.
node scraper.js --> to run

Hostinger Scraper
Fetches mails from inbox and saves to mail.json
node.scraper.js


Output Format
.json 


