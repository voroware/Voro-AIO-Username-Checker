const chalk = require("chalk");
const got = require("got");
const readline = require("readline");
const path = require("path");
const fs = require("fs/promises");
const lockfile = require("proper-lockfile");

const request = async (config) => {
  let res = await got(config);
  return res;
};

const log = (message, type) => {
  switch (type) {
    case "info":
      console.log(chalk.cyanBright(message));
      break;
    case "error":
      console.log(chalk.redBright(message));
      break;
    case "success":
      console.log(chalk.greenBright(message));
      break;
    case "warn":
      console.log(chalk.yellowBright(message));
      break;
  }
};

const logCheckerStats = (hits, errors, preclaimed, cpm, eta) => {
  console.log(
    chalk.cyanBright(
      `[>] Hits: ${hits}\n[>] Errors: ${errors}\n[>] Taken: ${preclaimed}\n[>] CPM: ${cpm}\n[>] ETA: ${eta.toFixed(
        2
      )} minutes`
    )
  );
};

const logVoro = () => {
  clearConsole();
  let msg = `
██╗   ██╗ ██████╗ ██████╗  ██████╗      ██████╗██╗  ██╗███████╗ ██████╗██╗  ██╗███████╗██████╗ 
██║   ██║██╔═══██╗██╔══██╗██╔═══██╗    ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝██╔════╝██╔══██╗
██║   ██║██║   ██║██████╔╝██║   ██║    ██║     ███████║█████╗  ██║     █████╔╝ █████╗  ██████╔╝
╚██╗ ██╔╝██║   ██║██╔══██╗██║   ██║    ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗ ██╔══╝  ██╔══██╗
 ╚████╔╝ ╚██████╔╝██║  ██║╚██████╔╝    ╚██████╗██║  ██║███████╗╚██████╗██║  ██╗███████╗██║  ██║
  ╚═══╝   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝      ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝\n
                          Advanced Username Checker
                            Made by @voromade
    `;
  console.log(chalk.cyanBright(msg));
};

const logOptions = (options) => {
  // Determine the length of the longest string for padding
  const maxLength = options.reduce(
    (max, str) => Math.max(max, str ? str.length : 0),
    0
  );

  // Print the menu with custom spacing
  for (let i = 0; i < options.length; i += 2) {
    // Get the first option and pad it to align the text
    const firstOption = `${chalk.gray(`[${i + 1}]`)} ${options[i]}`.padEnd(
      maxLength + 35,
      " "
    );
    const secondOption = options[i + 1]
      ? `${chalk.gray(`[${i + 2}]`)} ${options[i + 1]}`
      : ``;
    console.log(
      `${chalk.cyanBright(firstOption)}${chalk.cyanBright(secondOption)}`
    );
  }
};

const clearConsole = () => {
  console.clear();
  return;
};

const setTitleBar = () => {
  process.title = `VORO CHECKER - Username Checker | By @voromade`;
};

const getUserInput = (prompt) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(
      chalk.cyanBright(`${chalk.gray("[>]")} ${prompt}`),
      (answer) => {
        resolve(answer);
        rl.close();
      }
    );
  });
};

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const getUserNames = async () => {
  let usernames = [];

  let p = path.join(__dirname, "../data");
  let usernameFiles = await fs.readdir(p);
  for (let usernameFile of usernameFiles) {
    let contents = await fs.readFile(`${path.join(p, usernameFile)}`, "utf-8");
    let splitString = contents.replaceAll("\n", "").split("\r");
    for (let username of splitString) {
      usernames.push(username);
    }
    log(`[+] Loaded ${usernameFile}`, "info");
  }

  log(
    `[✓] Successfully loaded ${usernames.length} usernames from ${usernameFiles.length} files!`,
    "success"
  );

  return usernames;
};

const handleTLS = async (config) => {
  let req = await got("<your_tls_url_here>", config); // 2 modules require TLS (Kick.com & Solo.to)
  return req;
};

const pathExists = async (filePath) => {
  try {
    await fs.readFile(filePath);
    return true;
  } catch (e) {
    return false;
  }
};

const writeToFile = async (filePath, content) => {
  const lockOptions = {
    retries: {
      retries: 100, // Number of retries
      factor: 3, // The exponential factor to use
      minTimeout: 1 * 1000, // The number of milliseconds before starting the first retry
      maxTimeout: 60 * 1000, // The maximum number of milliseconds between two retries
      randomize: true, // Randomizes the timeouts by multiplying with a factor between 1 to 2
    },
  };

  let release;
  try {
    let fileExists = await pathExists(filePath);
    if (!fileExists) {
      await fs.writeFile(filePath, ""); // Create an empty file
    }

    // Try to acquire the lock
    release = await lockfile.lock(filePath, lockOptions);
    await fs.appendFile(filePath, `${content}\n`);

    // Release the lock
    await release();
    release = null; // Set to null to avoid double release
  } catch (err) {
    log(`Error adding to file: ${err.message}`, "error");
  } finally {
    if (release) {
      // Make sure to release the lock if it was acquired but an error occurred
      await release();
    }
  }
};

module.exports = {
  request,
  log,
  logVoro,
  logOptions,
  clearConsole,
  setTitleBar,
  getUserInput,
  sleep,
  logCheckerStats,
  getUserNames,
  handleTLS,
  writeToFile,
};
