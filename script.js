// Team Green Bot - basic script
console.log("Team Green Bot is online! 🌱🤖");

// Example: change header text when clicked
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (header) {
    header.addEventListener("click", () => {
      header.style.background = "#4caf50";
      header.innerText = "Team Green Bot Activated!";
    });
  }
});
