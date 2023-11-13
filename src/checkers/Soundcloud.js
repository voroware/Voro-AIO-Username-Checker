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

const check = async (username) => {
  totalChecks++;
  try {
    await request({
      method: "GET",
      url: `https://api-v2.soundcloud.com/resolve`,
      searchParams: {
        url: `https://soundcloud.com/${username}`,
        client_id: "TtbhBUaHqao06g1mUwVTxbjj8TSUkiCl",
        app_version: "1694761046",
        app_locale: "en",
      },
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.1",
        "Accept-Language": "en-US,en;q=0.9",
        Origin: "https://soundcloud.com",
        Referer: "https://soundcloud.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      },
    });
    preclaimed++;
  } catch (e) {
    if (e.response) {
      switch (e.response.statusCode) {
        case 404:
          valid.push(username);
          await writeToFile(
            path.join(__dirname, "../../exports/soundcloud.txt"),
            username
          );
          return;
        default:
          errors++;
          return;
      }
    } else {
      errors++;
    }
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
    log(`[>] SoundCloud Username Checker`, "success");
    log(
      `[>] ${togo}/${usernames.length} (${compeletedPercent}% complete)\n`,
      "info"
    );
    logCheckerStats(valid.length, errors, preclaimed, cpm, eta);
    await sleep(100);
  } while (true);
};

const run = async () => {
  logVoro();
  let usernames = await getUserNames();
  usernamesToUse = usernames;
  updateLogs();
  for (let i = 0; i < usernames.length; i++) {
    check(usernames[i]);
    await sleep(35);
  }
};

module.exports = { run };
