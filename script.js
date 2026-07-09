/* ZAPPY_STOREFRONT_RUNTIME_BOOTSTRAP_V1 */
(function() {
  'use strict';
  var runtimeLoaded = false;
  var runtimePromise = null;
  var runtimeSrc = '/storefront-runtime.js';
  var immediatePath = /\/(?:products?|product|category|cart|checkout|account|order-success|courses?|lesson|my-learning|certificate)(?:\/|$|[?#])/i;
  function hasCriticalCommerceDom() {
    return !!document.querySelector('#zappy-product-grid,#zappy-product-detail,#cart-items,#checkout-form,.checkout-page,.cart-page,.order-success-page,[data-product-id],.product-detail-page');
  }
  function shouldLoadImmediately() {
    return immediatePath.test(window.location.pathname || '/') || hasCriticalCommerceDom();
  }
  function loadRuntime() {
    if (runtimeLoaded) return Promise.resolve();
    if (runtimePromise) return runtimePromise;
    runtimePromise = new Promise(function(resolve, reject) {
      var existing = document.querySelector('script[data-zappy-storefront-runtime="true"]');
      if (existing) {
        existing.addEventListener('load', function() { runtimeLoaded = true; resolve(); }, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      var script = document.createElement('script');
      script.src = runtimeSrc;
      script.defer = true;
      script.setAttribute('data-zappy-storefront-runtime', 'true');
      script.onload = function() { runtimeLoaded = true; resolve(); };
      script.onerror = reject;
      document.head.appendChild(script);
    }).catch(function(error) {
      runtimePromise = null;
      throw error;
    });
    return runtimePromise;
  }
  function replayAfterLoad(event) {
    var target = event.target;
    if (!target || runtimeLoaded || runtimePromise) return;
    var interactive = target.closest && target.closest('button,a,[role="button"],input,select,textarea,.mobile-toggle,.hamburger,.cart-link,.login-link,.nav-search-toggle,.zappy-products-dropdown');
    if (!interactive) return;
    loadRuntime().then(function() {
      if (typeof target.click === 'function' && event.type === 'click') {
        setTimeout(function() { try { target.click(); } catch (_) {} }, 0);
      }
    });
  }
  window.__zappyLoadStorefrontRuntime = loadRuntime;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (shouldLoadImmediately()) loadRuntime();
    }, { once: true });
  } else if (shouldLoadImmediately()) {
    loadRuntime();
  }
  ['click', 'focusin', 'pointerdown', 'touchstart', 'keydown'].forEach(function(eventName) {
    document.addEventListener(eventName, replayAfterLoad, { capture: true, passive: eventName !== 'click' && eventName !== 'keydown' });
  });
  if (!shouldLoadImmediately()) {
    var lateLoad = function() { loadRuntime(); };
    setTimeout(function() {
      if (runtimeLoaded || runtimePromise) return;
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(lateLoad, { timeout: 2000 });
      } else {
        lateLoad();
      }
    }, 12000);
  }
})();