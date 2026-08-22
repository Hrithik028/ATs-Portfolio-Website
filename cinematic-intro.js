(function () {
  "use strict";

  function mountCinematicIntro(options) {
    const overlay = document.getElementById(options.overlayId || "cinematic-intro");
    const formVideo = document.getElementById(options.formVideoId || "cinematic-form");
    const releaseVideo = document.getElementById(options.releaseVideoId || "cinematic-release");

    if (!overlay || !formVideo || !releaseVideo) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const restoredBelowTop = window.scrollY > 4;
    if (reducedMotion || restoredBelowTop) {
      overlay.remove();
      return;
    }

    const root = document.documentElement;
    let waiting = false;
    let releaseQueued = false;
    let releasing = false;
    let finished = false;
    let touchStartY = null;

    root.classList.add("cinematic-lock");
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    overlay.hidden = false;
    overlay.classList.add("is-active");

    formVideo.muted = true;
    formVideo.playsInline = true;
    releaseVideo.muted = true;
    releaseVideo.playsInline = true;
    releaseVideo.load();

    function preventAndQueue(event) {
      if (finished) {
        if (event.cancelable) event.preventDefault();
        return;
      }

      const isUpwardWheel = event.type === "wheel" && event.deltaY < 0;
      const isUpwardKey = event.type === "keydown" && event.key === "ArrowUp";
      if (isUpwardWheel || isUpwardKey) return;

      if (event.cancelable) event.preventDefault();
      releaseQueued = true;

      if (waiting) {
        startRelease();
      } else if (formVideo.paused) {
        formVideo.play().catch(function () {});
      }
    }

    function onTouchStart(event) {
      touchStartY = event.touches[0] ? event.touches[0].clientY : null;
    }

    function onTouchMove(event) {
      const currentY = event.touches[0] ? event.touches[0].clientY : null;
      if (touchStartY !== null && currentY !== null && touchStartY - currentY > 8) {
        preventAndQueue(event);
      } else if (event.cancelable) {
        event.preventDefault();
      }
    }

    function onKeyDown(event) {
      const releaseKeys = ["ArrowDown", "PageDown", " ", "End"];
      if (releaseKeys.includes(event.key) || event.key === "ArrowUp") {
        preventAndQueue(event);
      }
    }

    function enterFallingHold() {
      if (finished || releasing) return;
      waiting = true;
      overlay.classList.add("is-waiting");
      formVideo.pause();
      if (Number.isFinite(formVideo.duration)) {
        formVideo.currentTime = Math.max(0, formVideo.duration - 1 / 24);
      }
      if (releaseQueued) startRelease();
    }

    function startRelease() {
      if (releasing || finished) return;
      releasing = true;
      waiting = false;
      overlay.classList.remove("is-waiting");
      overlay.classList.add("is-releasing");
      releaseVideo.currentTime = 0;

      const playPromise = releaseVideo.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          releasing = false;
          waiting = true;
          overlay.classList.remove("is-releasing");
          overlay.classList.add("is-waiting");
        });
      }
    }

    function finishIntro() {
      if (finished) return;
      finished = true;
      overlay.classList.add("is-finished");
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      window.setTimeout(function () {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        root.classList.remove("cinematic-lock");
        window.removeEventListener("wheel", preventAndQueue);
        window.removeEventListener("keydown", onKeyDown);
        overlay.removeEventListener("touchstart", onTouchStart);
        overlay.removeEventListener("touchmove", onTouchMove);
        overlay.hidden = true;
        formVideo.removeAttribute("src");
        releaseVideo.removeAttribute("src");
        formVideo.load();
        releaseVideo.load();
      }, 620);
    }

    window.addEventListener("wheel", preventAndQueue, { passive: false });
    window.addEventListener("keydown", onKeyDown, { passive: false });
    overlay.addEventListener("touchstart", onTouchStart, { passive: true });
    overlay.addEventListener("touchmove", onTouchMove, { passive: false });
    formVideo.addEventListener("ended", enterFallingHold, { once: true });
    releaseVideo.addEventListener("ended", finishIntro, { once: true });

    formVideo.play().catch(function () {
      // Muted autoplay is normally allowed. If a browser blocks it, the first
      // scroll/touch/key gesture starts the same sequence without adding UI.
    });
  }

  window.mountCinematicIntro = mountCinematicIntro;
})();
