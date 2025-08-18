// index.js - Team Green Bot Core

import fs from "fs";
import path from "path";

// ============ Bot Config ============ //
const BOT_NAME = "Team Green Bot";
const skillsDir = path.join(process.cwd(), "skills");

// ============ Load Skills ============ //
let skills = {};
fs.readdirSync(skillsDir).forEach(file => {
  if (file.endsWith(".js")) {
    const skillName = file.replace(".js", "");
    skills[skillName] = require(path.join(skillsDir, file));
  }
});

// ============ Message Handler ============ //
function handleMessage(input) {
  console.log(`[${BOT_NAME}] Received:`, input);

  // Find skill to handle input
  for (let skill in skills) {
    if (skills[skill].canHandle(input)) {
      return skills[skill].handle(input);
    }
  }

  return "🤖 Sorry, I don’t know how to handle that yet.";
}

// ============ Test Run ============ //
console.log(`${BOT_NAME} is online!`);
console.log(handleMessage("hello bot"));
