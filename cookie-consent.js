/**
 * cookie-consent.js
 * SacMusicals — Google Analytics consent management
 * -----------------------------------------------------------------------
 * MODEL: "Notice + working opt-out"
 *   - Google Analytics loads on every page load by default (see the
 *     inline snippet in <head> of every page).
 *   - This script shows a one-time disclosure banner. If the visitor
 *     clicks "Decline", we tell Google Analytics (via Consent Mode) to
 *     stop storing/using analytics cookies, AND we proactively delete
 *     any GA cookies already set, so decline is a real, working action
 *     and not just cosmetic.
 *   - The choice is stored in localStorage and re-applied on every page,
 *     and is always changeable later via the "Cookie Preferences" button
 *     in the footer.
 *
 * SELF-CONTAINED: this file does not depend on Bootstrap's JS. The
 * preferences modal's open/close/focus behavior is handled entirely
 * here, so this works identically on every page regardless of what
 * that page already loads (some pages use Bootstrap, some don't).
 *
 * IMPORTANT: the <head> of every page must already contain the Consent
 * Mode bootstrap snippet (see INTEGRATION-GUIDE.md) that sets a default
 * consent state BEFORE gtag.js loads. This file handles updates after
 * the user makes/changes a choice, plus all of the UI.
 * -----------------------------------------------------------------------
 */

(function () {
  "use strict";

  var STORAGE_KEY = "sacmusicals_consent";

  // -----------------------------------------------------------------
  // Storage helpers
  // -----------------------------------------------------------------

  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (parsed && (parsed.status === "granted" || parsed.status === "denied")) {
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function writeConsent(status) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ status: status, updatedAt: new Date().toISOString() })
      );
    } catch (e) {
      // Storage unavailable — consent still applies to this page view
      // via gtag below, it just won't persist across pages.
    }
  }

  // -----------------------------------------------------------------
  // Google Consent Mode + cookie cleanup
  // -----------------------------------------------------------------

  function updateGoogleConsent(status) {
    if (typeof window.gtag !== "function") return;
    window.gtag("consent", "update", { analytics_storage: status });
  }

  function deleteCookie(name) {
    var domain = window.location.hostname;
    var variants = ["", "; domain=" + domain, "; domain=." + domain];
    variants.forEach(function (domainPart) {
      document.cookie =
        name + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT" + domainPart;
    });
  }

  function clearAnalyticsCookies() {
    var cookies = document.cookie.split(";");
    cookies.forEach(function (cookie) {
      var name = cookie.split("=")[0].trim();
      if (name === "_ga" || /^_ga_/.test(name) || name === "_gid" || name === "_gat") {
        deleteCookie(name);
      }
    });
  }

  function applyConsent(status) {
    updateGoogleConsent(status);
    if (status === "denied") {
      clearAnalyticsCookies();
    }
  }

  // -----------------------------------------------------------------
  // Banner (built entirely in JS — no markup needed in the HTML pages)
  // -----------------------------------------------------------------

  function buildBanner() {
    var banner = document.createElement("div");
    banner.className = "cc-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Cookie notice");
    banner.innerHTML =
      '<div class="cc-banner__inner">' +
      '  <p class="cc-banner__text">' +
      "    <strong>We use cookies for basic site analytics.</strong> " +
      "    SacMusicals uses Google Analytics to understand how visitors use this site. " +
      "    You can decline analytics cookies at any time from Cookie Preferences in the footer." +
      "  </p>" +
      '  <div class="cc-banner__actions">' +
      '    <a href="privacy-policy.html#cookies" class="cc-btn-link">Learn More</a>' +
      '    <button type="button" class="cc-btn cc-btn-outline" data-cc-action="decline">Decline</button>' +
      '    <button type="button" class="cc-btn cc-btn-primary" data-cc-action="accept">Accept</button>' +
      "  </div>" +
      "</div>";
    return banner;
  }

  function showBanner() {
    var existing = document.querySelector(".cc-banner");
    if (existing) {
      existing.classList.add("is-visible");
      return existing;
    }
    var banner = buildBanner();
    document.body.appendChild(banner);

    // Force reflow so the transform transition plays on first show
    // eslint-disable-next-line no-unused-expressions
    banner.offsetHeight;
    banner.classList.add("is-visible");

    banner.addEventListener("click", function (event) {
      var action = event.target.getAttribute("data-cc-action");
      if (!action) return;

      var status = action === "accept" ? "granted" : "denied";
      writeConsent(status);
      applyConsent(status);
      hideBanner(banner);
      syncPreferencesModal(status);
    });

    return banner;
  }

  function hideBanner(banner) {
    if (!banner) return;
    banner.classList.remove("is-visible");
  }

  // -----------------------------------------------------------------
  // Preferences modal
  // Expects static markup already in the page:
  //   <div class="cc-modal-overlay" id="cookiePreferencesModal"> ... </div>
  // Opened by ANY element with class "cookie-preferences-toggle"
  // (the footer link/button uses this class already).
  // -----------------------------------------------------------------

  var lastFocusedTrigger = null;

  function syncPreferencesModal(status) {
    var toggle = document.getElementById("cookieAnalyticsToggle");
    var statusNote = document.getElementById("cookieStatusNote");
    if (toggle) {
      toggle.checked = status === "granted";
    }
    if (statusNote) {
      statusNote.textContent =
        status === "granted"
          ? "Analytics cookies are currently ON."
          : "Analytics cookies are currently OFF.";
    }
  }

  function openModal(modalEl, trigger) {
    lastFocusedTrigger = trigger || document.activeElement;

    var consent = readConsent();
    var status = consent ? consent.status : "granted"; // default posture
    syncPreferencesModal(status);

    modalEl.classList.add("is-open");
    modalEl.setAttribute("aria-hidden", "false");

    // Move focus into the modal for keyboard/screen-reader users
    var closeBtn = modalEl.querySelector("[data-cc-modal-close]");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(modalEl) {
    modalEl.classList.remove("is-open");
    modalEl.setAttribute("aria-hidden", "true");
    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === "function") {
      lastFocusedTrigger.focus();
    }
  }

  function wirePreferencesModal() {
    var modalEl = document.getElementById("cookiePreferencesModal");
    if (!modalEl) return;

    var toggle = document.getElementById("cookieAnalyticsToggle");
    var saveBtn = document.getElementById("cookiePreferencesSave");

    // Any element on the page with this class opens the modal
    // (the footer "Cookie Preferences" button already has it).
    document.querySelectorAll(".cookie-preferences-toggle").forEach(function (el) {
      el.addEventListener("click", function () {
        openModal(modalEl, el);
      });
    });

    // Close via the × button
    modalEl.querySelectorAll("[data-cc-modal-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        closeModal(modalEl);
      });
    });

    // Close by clicking the overlay itself (not the dialog box)
    modalEl.addEventListener("click", function (event) {
      if (event.target === modalEl) {
        closeModal(modalEl);
      }
    });

    // Close on Escape
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modalEl.classList.contains("is-open")) {
        closeModal(modalEl);
      }
    });

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var status = toggle && toggle.checked ? "granted" : "denied";
        writeConsent(status);
        applyConsent(status);
        syncPreferencesModal(status);
        hideBanner(document.querySelector(".cc-banner"));
        closeModal(modalEl);
      });
    }
  }

  // -----------------------------------------------------------------
  // Init
  // -----------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", function () {
    var consent = readConsent();

    if (consent) {
      applyConsent(consent.status);
    } else {
      showBanner();
    }

    wirePreferencesModal();
  });
})();
