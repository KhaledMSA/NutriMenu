/**
 * NutriMenu - Menu Builder (Phase 3 refined)
 *
 * Pure Vanilla JavaScript. Responsibilities (UI layer only):
 *   1. Dynamically add/remove meal blocks and ingredient rows.
 *   2. Live image preview for meal photos via URL.createObjectURL.
 *   3. Numeric-only enforcement on ingredient weights (grams).
 *   4. Hydrate the builder when editing an existing menu (data embedded as JSON).
 *   5. Submit JSON + binaries via fetch + FormData.
 *
 * Server (/create-menu) is the authoritative source of validation, authorization,
 * and persistence.
 */

(function () {
  "use strict";

  // ===== DOM References =====
  const form = document.getElementById("builder-form");
  const mealList = document.getElementById("meal-list");
  const emptyHint = document.getElementById("empty-meal-hint");
  const addMealBtn = document.getElementById("add-meal-btn");
  const mealTemplate = document.getElementById("meal-template");
  const ingredientTemplate = document.getElementById("ingredient-template");
  const submitBtn = document.getElementById("submit-btn");
  const feedback = document.getElementById("builder-feedback");
  const existingMenuDataNode = document.getElementById("existing-menu-data");

  let mealCounter = 0;
  const submitDefaultLabel = submitBtn.textContent;

  // ===== Utilities =====

  function showFeedback(message, category) {
    feedback.innerHTML = "";
    const div = document.createElement("div");
    div.className = "flash flash-" + category;
    div.textContent = message;
    feedback.appendChild(div);
    feedback.hidden = false;
    feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideFeedback() {
    feedback.hidden = true;
    feedback.innerHTML = "";
  }

  function refreshMealOrdinals() {
    const blocks = mealList.querySelectorAll(".meal-block");
    blocks.forEach(function (block, index) {
      const numEl = block.querySelector(".meal-number");
      if (numEl) numEl.textContent = String(index + 1);
    });
    emptyHint.hidden = blocks.length > 0;
  }

  /**
   * Strict numeric scrubbing for ingredient weights. Anything non-numeric
   * (g, gr, grams, spaces, letters) is removed immediately so the payload
   * is API-ready. We allow a single decimal point.
   */
  function attachNumericGuard(input) {
    input.addEventListener("input", function () {
      const raw = input.value;
      // Keep digits and a single dot. Discard the rest as the user types.
      let cleaned = raw.replace(/[^\d.]/g, "");
      const firstDot = cleaned.indexOf(".");
      if (firstDot !== -1) {
        cleaned =
          cleaned.slice(0, firstDot + 1) +
          cleaned.slice(firstDot + 1).replace(/\./g, "");
      }
      if (cleaned !== raw) {
        input.value = cleaned;
      }
    });
    // Defensive: paste handling.
    input.addEventListener("paste", function (event) {
      const pasted = (event.clipboardData || window.clipboardData).getData("text");
      if (/[^\d.]/.test(pasted)) {
        event.preventDefault();
        const cleaned = pasted.replace(/[^\d.]/g, "");
        document.execCommand("insertText", false, cleaned);
      }
    });
  }

  /**
   * Live image preview for meal photos. Returns a function that re-renders
   * the preview when called with a File (or null to clear).
   */
  function attachImagePreview(fileInput, previewNode, iconNode, textNode) {
    const defaultText = textNode.textContent;
    let lastObjectUrl = null;

    function render(file) {
      if (lastObjectUrl) {
        URL.revokeObjectURL(lastObjectUrl);
        lastObjectUrl = null;
      }
      if (!file) {
        previewNode.innerHTML = "";
        previewNode.hidden = true;
        iconNode.hidden = false;
        textNode.textContent = defaultText;
        return;
      }
      lastObjectUrl = URL.createObjectURL(file);
      previewNode.innerHTML =
        '<img src="' + lastObjectUrl + '" alt="Meal preview" />';
      previewNode.hidden = false;
      iconNode.hidden = true;
      textNode.textContent = file.name;
    }

    fileInput.addEventListener("change", function () {
      render(fileInput.files && fileInput.files[0] ? fileInput.files[0] : null);
    });

    return render;
  }

  // ===== Ingredient Rows =====

  function createIngredientRow(presetName, presetGrams) {
    const fragment = ingredientTemplate.content.cloneNode(true);
    const row = fragment.querySelector(".ingredient-row");

    const nameInput = row.querySelector(".ingredient-name-input");
    const weightInput = row.querySelector(".ingredient-weight-input");

    if (typeof presetName === "string") nameInput.value = presetName;
    if (presetGrams !== null && presetGrams !== undefined && presetGrams !== "") {
      weightInput.value = String(presetGrams);
    }

    attachNumericGuard(weightInput);

    row.querySelector(".remove-ingredient-btn").addEventListener("click", function () {
      row.remove();
    });

    return row;
  }

  // ===== Meal Blocks =====

  function createMealBlock(preset) {
    const fragment = mealTemplate.content.cloneNode(true);
    const block = fragment.querySelector(".meal-block");
    const localId = mealCounter++;
    block.dataset.mealIndex = String(localId);

    const photoInput = block.querySelector(".meal-photo-input");
    const photoLabel = block.querySelector(".meal-photo-label");
    const photoPreview = block.querySelector(".meal-photo-preview");
    const photoIcon = block.querySelector(".meal-photo-icon");
    const photoText = block.querySelector(".meal-photo-text");

    const photoInputId = "meal-photo-" + localId;
    photoInput.id = photoInputId;
    photoLabel.setAttribute("for", photoInputId);
    attachImagePreview(photoInput, photoPreview, photoIcon, photoText);

    block.querySelector(".remove-meal-btn").addEventListener("click", function () {
      block.remove();
      refreshMealOrdinals();
    });

    const ingredientList = block.querySelector(".ingredient-list");
    block.querySelector(".add-ingredient-btn").addEventListener("click", function () {
      ingredientList.appendChild(createIngredientRow());
    });

    if (preset) {
      block.querySelector(".meal-name-input").value = preset.name || "";
      block.querySelector(".meal-description-input").value = preset.description || "";

      // If an existing photo is on file, show its URL as the current preview.
      if (preset.photo_filename) {
        const existingUrl =
          "/static/uploads/" + encodeURIComponent(preset.photo_filename);
        photoPreview.innerHTML =
          '<img src="' + existingUrl + '" alt="Current photo" />';
        photoPreview.hidden = false;
        photoIcon.hidden = true;
        photoText.textContent = "Replace current photo";
        // Mark that there is a server-side photo so we don't re-require an upload.
        block.dataset.hasExistingPhoto = "true";
      }

      const ingredients = Array.isArray(preset.ingredients) ? preset.ingredients : [];
      if (ingredients.length === 0) {
        ingredientList.appendChild(createIngredientRow());
      } else {
        ingredients.forEach(function (ing) {
          ingredientList.appendChild(
            createIngredientRow(ing.name, ing.amount_grams)
          );
        });
      }
    } else {
      ingredientList.appendChild(createIngredientRow());
    }

    return block;
  }

  // ===== Serialization =====

  function collectMenuPayload() {
    const meals = [];
    const photoAttachments = [];

    const blocks = mealList.querySelectorAll(".meal-block");
    blocks.forEach(function (block, positionalIndex) {
      const name = block.querySelector(".meal-name-input").value.trim();
      const description = block.querySelector(".meal-description-input").value.trim();

      const ingredients = [];
      block.querySelectorAll(".ingredient-row").forEach(function (row) {
        const ingredientName = row.querySelector(".ingredient-name-input").value.trim();
        const weightRaw = row.querySelector(".ingredient-weight-input").value.trim();
        if (ingredientName) {
          ingredients.push({
            name: ingredientName,
            // Send a numeric string (or null) — the server parses to float.
            amount_grams: weightRaw === "" ? null : weightRaw,
          });
        }
      });

      const photoInput = block.querySelector(".meal-photo-input");
      const file =
        photoInput.files && photoInput.files.length > 0 ? photoInput.files[0] : null;
      if (file) {
        photoAttachments.push({ positionalIndex: positionalIndex, file: file });
      }

      meals.push({
        position: positionalIndex,
        name: name,
        description: description,
        ingredients: ingredients,
        has_photo: Boolean(file) || block.dataset.hasExistingPhoto === "true",
      });
    });

    return {
      payload: { meals: meals },
      photoAttachments: photoAttachments,
    };
  }

  function validatePayload(payload) {
    if (payload.meals.length === 0) {
      return "Please add at least one meal before saving.";
    }
    for (let i = 0; i < payload.meals.length; i++) {
      const meal = payload.meals[i];
      if (!meal.name) return "Meal #" + (i + 1) + " is missing a name.";
      if (!meal.description) return "Meal #" + (i + 1) + " is missing a description.";
      if (meal.ingredients.length === 0) {
        return "Meal #" + (i + 1) + " needs at least one ingredient.";
      }
      for (let j = 0; j < meal.ingredients.length; j++) {
        const ing = meal.ingredients[j];
        if (
          ing.amount_grams !== null &&
          ing.amount_grams !== "" &&
          isNaN(Number(ing.amount_grams))
        ) {
          return (
            "Meal #" + (i + 1) + ' "' + ing.name + '": weight must be numeric (grams).'
          );
        }
      }
    }
    return null;
  }

  // ===== Submission =====

  async function handleSubmit(event) {
    event.preventDefault();
    hideFeedback();

    const { payload, photoAttachments } = collectMenuPayload();
    const error = validatePayload(payload);
    if (error) {
      showFeedback(error, "error");
      return;
    }

    const formData = new FormData();
    formData.append("menu_json", JSON.stringify(payload));
    photoAttachments.forEach(function (attachment) {
      formData.append("meal_photo_" + attachment.positionalIndex, attachment.file);
    });

    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      const data = await response.json().catch(function () {
        return {};
      });

      if (!response.ok) {
        showFeedback(data.message || "Server error.", "error");
        if (data.redirect_url) {
          setTimeout(function () {
            window.location.assign(data.redirect_url);
          }, 1500);
        }
        submitBtn.disabled = false;
        submitBtn.textContent = submitDefaultLabel;
        return;
      }

      if (data.redirect_url) {
        window.location.assign(data.redirect_url);
      } else {
        showFeedback(data.message || "Menu saved.", "success");
        submitBtn.disabled = false;
        submitBtn.textContent = submitDefaultLabel;
      }
    } catch (networkError) {
      showFeedback("Network error — please try again.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = submitDefaultLabel;
    }
  }

  // ===== Bootstrap =====

  addMealBtn.addEventListener("click", function () {
    mealList.appendChild(createMealBlock());
    refreshMealOrdinals();
  });

  form.addEventListener("submit", handleSubmit);

  // Hydrate from existing menu (edit mode), or seed one empty meal.
  let existingMeals = null;
  if (existingMenuDataNode) {
    try {
      existingMeals = JSON.parse(existingMenuDataNode.textContent);
    } catch (parseError) {
      existingMeals = null;
    }
  }

  if (Array.isArray(existingMeals) && existingMeals.length > 0) {
    existingMeals.forEach(function (meal) {
      mealList.appendChild(createMealBlock(meal));
    });
  } else {
    mealList.appendChild(createMealBlock());
  }
  refreshMealOrdinals();
})();
