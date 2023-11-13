const {
  logVoro,
  log,
  logOptions,
  sleep,
  getUserInput,
} = require("./src/utils.js");
const { menus, paths } = require("./config.json");
const path = require("path");

const init = async () => {
  logVoro();
  logOptions(menus);
  log("", "info");
  let answer = await getUserInput("Selection: ");
  await handler(parseInt(answer));
};

const handler = async (selection) => {
  if (isNaN(selection) || selection > menus.length || selection < 1) {
    log(`[X] Invalid Selection`, "error");
  }
  if (menus.length === selection) {
    log("[>] Exiting CLI...", "error");
    process.exit();
  } else {
    switch (selection) {
      default:
        log(`[>] Loading '${menus[selection - 1]}'`, "info");
        let { run } = require(path.join(
          __dirname,
          "src",
          paths[selection - 1]
        ));
        run();
        break;
    }
  }
};

init();
