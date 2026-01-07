require("dotenv").config();
const Imap = require("imap");
const { simpleParser } = require("mailparser");
const fs = require("fs");


const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const IMAP_HOST = "imap.hostinger.com"; 
const IMAP_PORT = 993;
const KEYWORD = "Harmony Garden Lead"; // Search keyword (case-insensitive)
const OUT_FILE = "leadsfromgilbert.json";


const imap = new Imap({
  user: EMAIL,
  password: PASSWORD,
  host: IMAP_HOST,
  port: IMAP_PORT,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
});


function parseEmail(buffer) {
  return new Promise((resolve, reject) => {
    simpleParser(buffer, (err, parsed) => {
      if (err) reject(err);
      else resolve(parsed);
    });
  });
}


function containsKeyword(email) {
  const subject = (email.subject || "").toLowerCase();
  const text = (email.text || "").toLowerCase();
  const html = (email.html || "").toLowerCase();
  const keyword = KEYWORD.toLowerCase();

  return (
    subject.includes(keyword) ||
    text.includes(keyword) ||
    html.includes(keyword)
  );
}


function mapEmail(email, uid) {
  return {
    uid: uid,
    from: email.from?.text || "",
    to: email.to?.text || "",
    subject: email.subject || "",
    date: email.date || "",
    textBody: email.text || "",
    htmlBody: email.html || "",
    attachments: email.attachments?.map((a) => ({
      filename: a.filename,
      contentType: a.contentType,
      size: a.size,
    })) || [],
  };
}


// MAIN SCRAPER 
function scrapeEmails() {
  return new Promise((resolve, reject) => {
    const matchedEmails = [];
    let totalMessages = 0;
    let processedMessages = 0;

    imap.once("ready", () => {
      console.log("Connected to IMAP server");

      imap.openBox("INBOX", true, (err, box) => {
        if (err) return reject(err);

        totalMessages = box.messages.total;
        console.log(`Total emails in INBOX: ${totalMessages}`);

        if (totalMessages === 0) {
          imap.end();
          return resolve(matchedEmails);
        }

        const fetch = imap.seq.fetch("1:*", {
          bodies: "",
          struct: true,
        });

        fetch.on("message", (msg, seqno) => {
          let uid;
          let buffer = "";

          msg.on("body", (stream) => {
            stream.on("data", (chunk) => {
              buffer += chunk.toString("utf8");
            });
          });

          msg.once("attributes", (attrs) => {
            uid = attrs.uid;
          });

          msg.once("end", async () => {
            try {
              const parsed = await parseEmail(buffer);

              if (containsKeyword(parsed)) {
                matchedEmails.push(mapEmail(parsed, uid));
                console.log(`✓ Match found: "${parsed.subject}" (UID: ${uid})`);
              }
            } catch (e) {
              console.error(`Error parsing email UID ${uid}:`, e.message);
            }

            processedMessages++;

            // All done?
            if (processedMessages === totalMessages) {
              console.log("✓ All emails processed. Closing IMAP...");
              imap.end();
              resolve(matchedEmails);
            }
          });
        });

        fetch.once("error", reject);
      });
    });

    imap.once("error", reject);
    imap.connect();
  });
}

(async () => {
  try {
    console.log(`Connecting to ${EMAIL}...`);
    console.log(`Searching for keyword: "${KEYWORD}"`);

    const emails = await scrapeEmails();

    fs.writeFileSync(OUT_FILE, JSON.stringify(emails, null, 2));
    console.log(
      `\nDone! Found ${emails.length} matching emails. Saved to ${OUT_FILE}`
    );
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
})();