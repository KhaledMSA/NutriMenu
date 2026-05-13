/**
 * NutriMenu - Restaurant Profile Form
 *
 * Vanilla JavaScript. Responsibilities (UI only):
 *   - Live preview of the chosen logo via URL.createObjectURL.
 *   - Submit via fetch + FormData so we can render server-side feedback inline.
 *
 * The Flask /profile route is the single source of validation and persistence.
 */

(function () {
  "use strict";

  const form = document.getElementById("profile-form");
  const logoInput = document.getElementById("restaurant_logo");
  const logoPreview = document.getElementById("restaurant-logo-preview");
  const logoIcon = document.getElementById("restaurant-logo-icon");
  const logoText = document.getElementById("restaurant-logo-text");
  const submitBtn = document.getElementById("profile-submit-btn");
  const feedback = document.getElementById("profile-feedback");

  let lastObjectUrl = null;

  function showFeedback(message, category) {
    feedback.innerHTML = "";
    const div = document.createElement("div");
    div.className = "flash flash-" + category;
    div.textContent = message;
    feedback.appendChild(div);
    feedback.hidden = false;
    feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderLogoPreview(file) {
    if (lastObjectUrl) {
      URL.revokeObjectURL(lastObjectUrl);
      lastObjectUrl = null;
    }
    if (!file) {
      logoPreview.innerHTML = "";
      logoPreview.hidden = true;
      logoIcon.hidden = false;
      return;
    }
    lastObjectUrl = URL.createObjectURL(file);
    logoPreview.innerHTML =
      '<img src="' + lastObjectUrl + '" alt="Selected logo preview" />';
    logoPreview.hidden = false;
    logoIcon.hidden = true;
    logoText.textContent = file.name;
  }

  if (logoInput) {
    logoInput.addEventListener("change", function () {
      const file = logoInput.files && logoInput.files[0];
      renderLogoPreview(file || null);
    });
  }

  if (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = "Saving...";

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const data = await response.json().catch(function () {
          return {};
        });
        if (!response.ok) {
          showFeedback(data.message || "Could not save profile.", "error");
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
          return;
        }
        if (data.redirect_url) {
          window.location.assign(data.redirect_url);
        } else {
          showFeedback(data.message || "Profile saved.", "success");
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      } catch (err) {
        showFeedback("Network error — please try again.", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    });
  }
})();
