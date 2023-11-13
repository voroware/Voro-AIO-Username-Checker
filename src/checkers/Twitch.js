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
      method: "POST",
      url: "https://gql.twitch.tv/gql",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        "Accept-Language": "en-US",
        "Client-Id": "kimne78kx3ncx6brgo4mv6wki5h1ko",
        Origin: "https://www.twitch.tv",
        Referer: "https://www.twitch.tv/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      },
      json: [
        {
          operationName: "UsernameValidator_User",
          variables: { username: username },
          extensions: {
            persistedQuery: {
              version: 1,
              sha256Hash:
                "fd1085cf8350e309b725cf8ca91cd90cac03909a3edeeedbd0872ac912f3d660",
            },
          },
        },
      ],
      responseType: "json",
      timeout: 5000,
    });
    if (body[0].data.isUsernameAvailable === true) {
      valid.push(username);
      await writeToFile(
        path.join(__dirname, "../../exports/twitch.txt"),
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
    log(`[>] Twitch.tv Username Checker`, "success");
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
    await sleep(50);
  }
};

module.exports = { run };
