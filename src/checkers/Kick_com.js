const {
  log,
  logVoro,
  clearConsole,
  logCheckerStats,
  getUserNames,
  sleep,
  handleTLS,
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

const parseCookies = (raw) => {
  let customHeader = {};
  customHeader[raw[0].split("; ")[0].split("=")[0]] = decodeURIComponent(
    raw[0].split("; ")[0].split("=")[1]
  );
  return {
    kick_session: decodeURIComponent(
      raw
        .find((x) => x.includes("kick_session"))
        .replace("kick_session=", "")
        .split("; ")[0]
    ),
    XsrfToken: decodeURIComponent(
      raw
        .find((x) => x.includes("XSRF-TOKEN"))
        .replace("XSRF-TOKEN=", "")
        .split("; ")[0]
    ),
    customHeader: customHeader,
  };
};

const encodeCookies = (session, token) => {
  return {
    kick_session: encodeURIComponent(session),
    XsrfToken: encodeURIComponent(token),
  };
};

const buildCookieString = (session, token, customHeader) => {
  let encoded = encodeCookies(session, token);
  return `XSRF-TOKEN=${encoded.kick_session}; kick_session=${
    encoded.kick_session
  }; ${Object.keys(customHeader)[0]}=${encodeURIComponent(
    Object.values(customHeader)[0]
  )};`;
};

const getCsrfCookie = async () => {
  let t = await handleTLS({
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      "Alt-Used": "kick.com",
      Connection: "keep-alive",
      Referer: "https://kick.com/",
      TE: "trailers",
      "tls-url": "https://kick.com/sanctum/csrf-cookie",
      "X-Socket-ID": "62727.1403499",
    },
    method: "GET",
  });

  return parseCookies(t.headers["set-cookie"]);
};

const getTokenProvider = async (session, token, customHeader) => {
  let cookieString = buildCookieString(session, token, customHeader);
  let c = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      "Alt-Used": "kick.com",
      Connection: "keep-alive",
      Referer: "https://kick.com/",
      TE: "trailers",
      "tls-url": "https://kick.com/kick-token-provider",
      Authorization: `Bearer ${token}`,
      "X-XSRF-TOKEN": token,
      Cookie: cookieString,
      "X-Socket-ID": "62727.1403499",
    },
    method: "GET",
    responseType: "json",
  };
  let t = await handleTLS(c);
  return parseCookies(t.headers["set-cookie"]);
};

const check = async (session, token, customHeader, username) => {
  totalChecks++;
  try {
    let cookieString = buildCookieString(session, token, customHeader);
    await handleTLS({
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Alt-Used": "kick.com",
        Connection: "keep-alive",
        Referer: "https://kick.com/",
        TE: "trailers",
        "tls-url": "https://kick.com/api/v1/signup/verify/username",
        Authorization: `Bearer ${token}`,
        "X-XSRF-TOKEN": token,
        "X-Socket-ID": "62727.1403499",
        Cookie: cookieString,
      },
      method: "POST",
      json: {
        username: username,
      },
    });
    valid.push(username);
    await writeToFile(
      path.join(__dirname, "../../exports/kick_com.txt"),
      username
    );
  } catch (e) {
    if (e.response) {
      switch (e.response.statusCode) {
        case 422:
          preclaimed++;
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
    log(`[>] Kick.com Username Checker`, "success");
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
    (async () => {
      let t = await getCsrfCookie();
      let tokenProvider = await getTokenProvider(
        t.kick_session,
        t.XsrfToken,
        t.customHeader
      );
      check(
        tokenProvider.kick_session,
        tokenProvider.XsrfToken,
        tokenProvider.customHeader,
        usernames[i]
      );
    })();
    await sleep(1 * 1000);
  }
};

module.exports = { run };
