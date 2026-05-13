/**
 * NutriMenu Landing Page - Interactive Script
 * Handles basic UI interactions, animations, and user interactions
 */

// ===== DOM Ready Handler =====
// Routing decisions live in Flask/Jinja2 (server-rendered hrefs).
// This file only handles non-routing UI polish: animations and header effects.
document.addEventListener("DOMContentLoaded", function () {
  initializeScrollAnimations();
  initializeHeaderEffects();
});

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
