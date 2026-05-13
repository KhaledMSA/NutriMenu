/**
 * NutriMenu - Customer Digital Menu (Phase 4a)
 *
 * Vanilla JavaScript. Responsibilities:
 *   - Read meal data from each card's data-meal attribute (set by Jinja).
 *   - Render that data into the shared modal on click.
 *   - Manage modal open/close, focus, and keyboard dismissal.
 *
 * No server calls, no DOM mutation outside the modal — the menu data is
 * already fully rendered by Flask. This script is a pure presentation
 * enhancement.
 */

(function () {
  "use strict";

  const grid = document.getElementById("meal-grid");
  const modal = document.getElementById("meal-modal");
  const modalImage = document.getElementById("modal-image");
  const modalTitle = document.getElementById("modal-title");
  const modalDescription = document.getElementById("modal-description");
  const modalIngredients = document.getElementById("modal-ingredients");

  let previouslyFocusedElement = null;

  function openModal(meal, triggerElement) {
    previouslyFocusedElement = triggerElement;

    modalTitle.textContent = meal.name || "";
    modalDescription.textContent = meal.description || "";

    // Image (or placeholder if missing).
    modalImage.innerHTML = "";
    if (meal.photo_url) {
      const img = document.createElement("img");
      img.src = meal.photo_url;
      img.alt = meal.name || "Meal photo";
      modalImage.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "meal-modal-image-placeholder";
      placeholder.textContent = "🍽️";
      modalImage.appendChild(placeholder);
    }

    // Ingredients list.
    modalIngredients.innerHTML = "";
    const items = Array.isArray(meal.ingredients) ? meal.ingredients : [];
    if (items.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Ingredients not listed.";
      modalIngredients.appendChild(li);
    } else {
      items.forEach(function (item) {
        const li = document.createElement("li");
        const nameSpan = document.createElement("span");
        nameSpan.className = "ingredient-name";
        nameSpan.textContent = item.name || "";
        const amountSpan = document.createElement("span");
        amountSpan.className = "ingredient-amount";
        amountSpan.textContent = item.amount || "";
        li.appendChild(nameSpan);
        li.appendChild(amountSpan);
        modalIngredients.appendChild(li);
      });
    }

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modal.querySelector(".meal-modal-close").focus();
  }

  function closeModal() {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
      previouslyFocusedElement = null;
    }
  }

  // ===== Wiring =====

  if (grid) {
    grid.addEventListener("click", function (event) {
      const card = event.target.closest(".meal-card");
      if (!card) return;
      try {
        const meal = JSON.parse(card.dataset.meal);
        openModal(meal, card);
      } catch (parseError) {
        console.error("Failed to parse meal data:", parseError);
      }
    });
  }

  if (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target && event.target.hasAttribute("data-close-modal")) {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal && !modal.hidden) {
      closeModal();
    }
  });
})();
