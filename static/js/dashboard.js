/**
 * NutriMenu - Dashboard
 *
 * Vanilla JavaScript. Single responsibility: copy the public menu URL to
 * the clipboard with brief visual feedback. All routing decisions and
 * authorization happen server-side via Flask + Jinja2.
 */

(function () {
  "use strict";

  const copyBtn = document.getElementById("copy-url-btn");
  if (!copyBtn) return;

  copyBtn.addEventListener("click", async function () {
    const targetId = copyBtn.dataset.copyTarget;
    const target = document.getElementById(targetId);
    if (!target) return;

    const url = target.textContent.trim();
    const originalText = copyBtn.textContent;

    try {
      await navigator.clipboard.writeText(url);
      copyBtn.textContent = "Copied!";
    } catch (err) {
      // Fallback for browsers without clipboard API access.
      const range = document.createRange();
      range.selectNodeContents(target);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copyBtn.textContent = "Select & Copy";
    }

    setTimeout(function () {
      copyBtn.textContent = originalText;
    }, 1800);
  });
})();
