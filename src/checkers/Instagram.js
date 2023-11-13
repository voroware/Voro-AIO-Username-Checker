const {
  request,
  log,
  logVoro,
  clearConsole,
  logCheckerStats,
  getUserNames,
  sleep,
} = require("../utils");

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
    let { body } = await request({
      method: "POST",
      url: "https://www.instagram.com/api/v1/web/accounts/web_create_ajax/attempt/",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        "X-CSRFToken": "en",
      },
      json: {
        email: "",
        username: username,
        first_name: "x",
        opt_into_one_tap: "false",
      },
      responseType: "json",
    });
    if (body.username_suggestions.length === 0 && body.status === "ok") {
      valid.push(username);
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
    log(`[>] Instagram Username Checker`, "success");
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
    await sleep(50);
  }
};

module.exports = { run };
