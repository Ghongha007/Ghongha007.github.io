(function () {
  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const unlockForm = document.getElementById("unlock-form");
  const passInput = document.getElementById("passcode");
  const letterSlots = document.querySelectorAll(".letter-slot");
  const casePanel = document.getElementById("case-files");
  const lockStatus = document.getElementById("lock-status");
  const monitorFrame = document.querySelector(".terminal-monitor .monitor-frame");
  const yearSpan = document.getElementById("year");

  // Initialise year in footer
  if (yearSpan) {
    yearSpan.textContent = String(new Date().getFullYear());
  }

  // Theme -----------------------------------------------------------------
  const storedTheme = localStorage.getItem("dipti-theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    root.setAttribute("data-theme", storedTheme);
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const current = root.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("dipti-theme", next);
    });
  }

  // Sherlock lock ---------------------------------------------------------
  if (!unlockForm || !passInput || !casePanel || !lockStatus || !monitorFrame) {
    return;
  }

  function updateLetterSlots(value) {
    const upper = value.toUpperCase().slice(0, 4);
    letterSlots.forEach(function (slot, index) {
      slot.textContent = upper[index] || "_";
    });
  }

  passInput.addEventListener("input", function (event) {
    updateLetterSlots(event.target.value || "");
  });

  unlockForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const value = (passInput.value || "").trim().toUpperCase();

    if (value === "SHER") {
      casePanel.classList.remove("is-locked");
      casePanel.classList.add("is-unlocked");
      lockStatus.textContent = "Terminal status: UNLOCKED";
      monitorFrame.classList.add("monitor-frame--unlocked");
      passInput.disabled = true;
      const button = unlockForm.querySelector("button[type='submit']");
      if (button) {
        button.disabled = true;
        button.textContent = "Unlocked";
      }

      // Smooth scroll to case panel
      casePanel.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      lockStatus.textContent = "Access denied. Try again.";
      monitorFrame.classList.remove("monitor-frame--unlocked");
      monitorFrame.classList.remove("monitor-frame--error");

      // Trigger CSS shake animation
      void monitorFrame.offsetWidth; // force reflow
      monitorFrame.classList.add("monitor-frame--error");
    }
  });
})();
