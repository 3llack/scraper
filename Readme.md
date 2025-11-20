Lead Scrapers (Apollo + Freshsales)
This project contains two Node.js scrapers:


Apollo Scraper – extracts leads from Apollo
Freshsales Scraper – extracts contacts from Freshsales CRM views using API

Both scripts output clean JSON files for further processing.


Requirements
Node.js 16+


API keys for:
Freshsales CRM


Installation
Clone the project and install dependencies:
git clone https://github.com/3llack/scraper.git
cd scraper
npm install dependencies


Setup
Create a .env file in the project root:
APOLLO_API_KEY=your_apollo_key
FRESHSALES_API_KEY=your_freshsales_key
FRESHSALES_VIEW_ID=your_view_id


Your .gitignore should hide: 
.env, node_modules, and any JSON output.


Running the Scrapers
Apollo Scraper
Fetches leads from Apollo and saves them to leads.json.
node scraper.js --> to run

Freshsales Scraper
Fetches contacts from a Freshsales CRM view and saves them to freshsales-api-contacts.json.
node scraper.js --> to run


Output Format
Both scrapers produce JSON with the following structure:


Notes
  Pagination is handled automatically.

  All requests include proper authorization headers.

  The scripts only read data; nothing is modified in your CRM.

  Errors are logged clearly for debugging.
