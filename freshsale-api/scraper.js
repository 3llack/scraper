const axios = require("axios");
const fs = require("fs");

// === CONFIG ===
const API_KEY = process.env.FS_API_KEY;
const BASE_URL = "#";
const VIEW_ID = process.env.V_ID;
const OUT_FILE = "freshsales-api-contacts.json";

// === HELPERS ===
async function fetch(endpoint, params = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const resp = await axios.get(url, {
    headers: {
      Authorization: `Token token=${API_KEY}`,
      "Content-Type": "application/json",
    },
    params,
  });
  return resp.data;
}

// Get all users → map owner_id → name
async function getUsers() {
  let page = 1;
  let users = [];
  while (true) {
    const data = await fetch("/users", { page, per_page: 100 });
    if (!data.users || data.users.length === 0) break;
    users.push(...data.users);
    if (data.users.length < 100) break;
    page++;
  }
  return Object.fromEntries(users.map((u) => [u.id, u.display_name]));
}

// Get all statuses → map id → name
async function getStatuses() {
  const data = await fetch("/contact_statuses");
  if (!data.contact_statuses) return {};
  return Object.fromEntries(
    data.contact_statuses.map((s) => [s.id, s.name])
  );
}

// === FETCH CONTACTS ===
async function fetchContacts(page = 1, per_page = 100) {
  const data = await fetch(`/contacts/view/${VIEW_ID}`, { page, per_page });
  return data.contacts || data.items || [];
}

// === MAP CONTACT ===
function mapContact(c, userMap, statusMap) {
  return {
    name:
      c.display_name ||
      `${c.first_name || ""} ${c.last_name || ""}`.trim(),
    lead: c.id || c.lead_id || "",
    jobTitle: c.job_title || "",
    email: Array.isArray(c.emails)
      ? c.emails.map((e) => (e.value ? e.value : e)).join(", ")
      : c.email || "",
    mobile: c.mobile_number || "",
    status: statusMap[c.contact_status_id] || "",
    tags: Array.isArray(c.tags)
      ? c.tags.map((t) => (typeof t === "object" ? t.name : t)).join(", ")
      : "",
    cxManager: userMap[c.owner_id] || "",
  };
}

// === MAIN SCRAPER ===
(async () => {
  console.log("Fetching user map...");
  const userMap = await getUsers();
  console.log(`Loaded ${Object.keys(userMap).length} users`);

  console.log("Fetching statuses...");
  const statusMap = await getStatuses();
  console.log(`Loaded ${Object.keys(statusMap).length} statuses`);

  let allContacts = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    console.log(`Fetching contacts page ${page}...`);
    const contacts = await fetchContacts(page, perPage);

    if (!contacts || contacts.length === 0) break;

    const mapped = contacts.map((c) => mapContact(c, userMap, statusMap));
    allContacts.push(...mapped);
    console.log(
      ` Got ${mapped.length} contacts (total: ${allContacts.length})`
    );

    if (contacts.length < perPage) break;
    page++;
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(allContacts, null, 2));
  console.log(`Done! Saved ${allContacts.length} contacts to ${OUT_FILE}`);
})();
