const {
  request,
  log,
  logVoro,
  clearConsole,
  logCheckerStats,
  getUserNames,
  sleep,
  writeToFile,
} = require("../utils");
const path = require("path");

let preclaimed = 0;
let errors = 0;
let cpm = 0;
let totalChecks = 0;
let startTime = Date.now();
let usernamesToUse;

const valid = [];
const token = "";

const check = async (username) => {
  totalChecks++;
  try {
    let { body } = await request({
      url: `https://discord.com/api/v10/users/@me/pomelo-attempt`,
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        authority: "discord.com",
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        authorization: token,
        "content-type": "application/json",
        origin: "https://discord.com",
        referer: "https://discord.com/channels/@me",
        "x-debug-options": "bugReporterEnabled",
        "x-discord-locale": "en-US",
        "x-discord-timezone": "America/New_York",
        "x-super-properties": Buffer.from(
          JSON.stringify({
            os: "Windows",
            browser: "Chrome",
            device: "",
            system_locale: "en-US",
            browser_user_agent:
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
            browser_version: "116.0.0.0",
            os_version: "10",
            referrer: "https://www.google.com/",
            referring_domain: "www.google.com",
            search_engine: "google",
            referrer_current: "",
            referring_domain_current: "",
            release_channel: "stable",
            client_build_number: 228672,
            client_event_source: null,
          })
        ).toString("base64"),
      },
      responseType: "json",
      timeout: 5000,
      json: {
        username: username.replaceAll(" ", "_"),
      },
    });
    if (body.taken === false) {
      valid.push(username);
      await writeToFile(
        path.join(__dirname, "../../exports/discord_username.txt"),
        username
      );
    } else {
      preclaimed++;
    }
  } catch (e) {
    errors++;
  }
};

const updateLogs = async () => {
  do {
    clearConsole();
    let usernames = usernamesToUse;
    let togo = usernames.length - valid.length - preclaimed - errors;
    let compeletedPercent = parseFloat(
      (1 - togo / usernames.length) * 100
    ).toFixed(2);
    let elapsedTime = (Date.now() - startTime) / 60000;
    cpm = (totalChecks / elapsedTime).toFixed(2);
    let eta = togo / cpm;
    logVoro();
    log(`[>] Discord Username Checker`, "success");
    log(
      `[>] ${togo}/${usernames.length} (${compeletedPercent}% complete)\n`,
      "info"
    );
    logCheckerStats(valid.length, errors, preclaimed, cpm, eta);
    await sleep(150);
  } while (true);
};

const run = async () => {
  logVoro();
  let usernames = await getUserNames();
  usernamesToUse = usernames;
  updateLogs();
  for (let i = 0; i < usernames.length; i++) {
    check(usernames[i]);
    await sleep(100);
  }
};

module.exports = { run };
