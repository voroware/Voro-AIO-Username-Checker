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
    let { body } = await request({
      url: `https://auth.roblox.com/v1/usernames/validate?birthday=2015-03-04T00:00:00.000Z&context=Signup&username=${username}`,
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      },
      responseType: "json",
    });
    if (body.code === 1) {
      preclaimed++;
    } else if (body.code === 0) {
      valid.push(username);
      await writeToFile(
        path.join(__dirname, "../../exports/roblox.txt"),
        username
      );
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
    log(`[>] Roblox Username Checker`, "success");
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
    await sleep(30);
  }
};

module.exports = { run };
