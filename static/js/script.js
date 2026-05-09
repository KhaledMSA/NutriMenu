/**
 * NutriMenu Landing Page - Interactive Script
 * Handles basic UI interactions, animations, and user interactions
 */

// ===== DOM Ready Handler =====
document.addEventListener("DOMContentLoaded", function () {
  console.log("NutriMenu Landing Page - Loaded");

  // Initialize all interactive features
  initializeClickHandlers();
  initializeScrollAnimations();
  initializeHeaderEffects();
});

// ===== Click Handlers for Action Buttons =====
/**
 * Initialize click handlers for all action buttons
 * Routes different button actions to appropriate functions
 */
function initializeClickHandlers() {
  // Get all buttons with data-action attribute
  const actionButtons = document.querySelectorAll("[data-action]");

  actionButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      const action = this.getAttribute("data-action");
      handleButtonAction(action, e);
    });
  });
}

/**
 * Handle button clicks based on action type
 * @param {string} action - The action type from data-action attribute
 * @param {Event} event - The click event object
 */
function handleButtonAction(action, event) {
  event.preventDefault();

  switch (action) {
    case "login":
      handleLoginClick();
      break;
    case "start":
      handleStartClick();
      break;
    default:
      console.log("Action triggered:", action);
  }
}

/**
 * Handle login button click
 * Currently shows a placeholder feedback
 */
function handleLoginClick() {
  console.log("Login button clicked");
  // Placeholder: Show user feedback
  showNotification("Login functionality coming soon!", "info");
  // TODO: Integrate with Flask backend authentication
  // window.location.href = '/login';
}

/**
 * Handle start/CTA button click
 * Currently shows a placeholder feedback
 */
function handleStartClick() {
  console.log("Start building menu button clicked");
  // Placeholder: Show user feedback
  showNotification(
    "Getting ready to start your menu... Redirecting soon!",
    "info",
  );
  // TODO: Integrate with Flask backend and data entry form
  // window.location.href = '/create-menu';
}

/**
 * Display a temporary notification to the user
 * @param {string} message - The message to display
 * @param {string} type - Type of notification: 'info', 'success', 'error', 'warning'
 */
function showNotification(message, type = "info") {
  // Create notification container if it doesn't exist
  let notificationContainer = document.getElementById("notification-container");

  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "notification-container";
    notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
            pointer-events: none;
        `;
    document.body.appendChild(notificationContainer);
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
        background-color: ${getNotificationColor(type)};
        color: #f5f5f7;
        padding: 16px 20px;
        border-radius: 8px;
        margin-bottom: 12px;
        font-size: 14px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease-out;
        pointer-events: auto;
        cursor: pointer;
    `;

  notification.textContent = message;

  // Add close on click
  notification.addEventListener("click", function () {
    this.style.animation = "slideInRight 0.3s ease-out reverse";
    setTimeout(() => this.remove(), 300);
  });

  notificationContainer.appendChild(notification);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = "slideInRight 0.3s ease-out reverse";
      setTimeout(() => notification.remove(), 300);
    }
  }, 4000);
}

/**
 * Get notification background color based on type
 * @param {string} type - Type of notification
 * @returns {string} CSS color value
 */
function getNotificationColor(type) {
  const colors = {
    info: "#6366f1", // Indigo
    success: "#10b981", // Green
    error: "#ef4444", // Red
    warning: "#f59e0b", // Amber
  };
  return colors[type] || colors["info"];
}

// ===== Scroll Animation Handler =====
/**
 * Initialize scroll-based animations for elements
 * Uses Intersection Observer API for performance
 */
function initializeScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.animation = "fadeInUp 0.6s ease-out forwards";
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all feature cards and steps
  const animatableElements = document.querySelectorAll(
    ".feature-card, .step, .section-title, .section-subtitle",
  );

  animatableElements.forEach((el) => {
    el.style.opacity = "0";
    observer.observe(el);
  });
}

// ===== Header Effects =====
/**
 * Initialize header visual effects on scroll
 * Changes header styling based on scroll position
 */
function initializeHeaderEffects() {
  const header = document.querySelector(".header");
  let lastScrollY = 0;

  window.addEventListener(
    "scroll",
    function () {
      const scrollY = window.scrollY;

      // Update header appearance based on scroll
      if (scrollY > 50) {
        header.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.15)";
        header.style.backgroundColor = "rgba(15, 20, 25, 0.95)";
      } else {
        header.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.12)";
        header.style.backgroundColor = "rgba(15, 20, 25, 0.8)";
      }

      lastScrollY = scrollY;
    },
    { passive: true },
  );
}

// ===== Smooth Scroll Enhancement =====
/**
 * Enhance navigation links with smooth scroll behavior
 * Handles anchor link navigation
 */
document.addEventListener("click", function (e) {
  const href = e.target.getAttribute("href");

  // Check if it's an anchor link (but not login or action buttons)
  if (href && href.startsWith("#") && href !== "#") {
    e.preventDefault();
    const targetElement = document.querySelector(href);

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }
});

// ===== Accessibility: Keyboard Navigation =====
/**
 * Add keyboard accessibility for buttons
 * Allows Tab navigation and Enter/Space activation
 */
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" || e.key === " ") {
    const activeElement = document.activeElement;

    if (activeElement && activeElement.getAttribute("data-action")) {
      if (e.key === " ") e.preventDefault(); // Prevent page scroll on Space
      activeElement.click();
    }
  }
});

// ===== Utility: Check if element is in viewport =====
/**
 * Utility function to check if an element is visible in the viewport
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} True if element is in viewport
 */
function isElementInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// ===== Performance: Throttle Function =====
/**
 * Throttle function to limit how often a function can be called
 * Useful for scroll/resize events
 * @param {Function} func - The function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ===== Analytics Placeholder =====
/**
 * Track user interactions for analytics
 * Placeholder for future analytics integration
 * @param {string} eventName - Name of the event
 * @param {Object} eventData - Additional event data
 */
function trackEvent(eventName, eventData = {}) {
  // Placeholder for analytics implementation
  console.log("Event tracked:", {
    event: eventName,
    timestamp: new Date().toISOString(),
    data: eventData,
  });

  // TODO: Integrate with analytics service (Google Analytics, Mixpanel, etc.)
  // if (window.gtag) {
  //     gtag('event', eventName, eventData);
  // }
}

// ===== Development: Log Application State =====
/**
 * Development helper to log application state
 */
function logAppState() {
  console.group("NutriMenu Application State");
  console.log("Viewport Size:", {
    width: window.innerWidth,
    height: window.innerHeight,
  });
  console.log("Scroll Position:", {
    x: window.scrollX,
    y: window.scrollY,
  });
  console.log("Active Element:", document.activeElement);
  console.groupEnd();
}

// Export for potential future module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    handleButtonAction,
    showNotification,
    trackEvent,
    logAppState,
  };
}
