(function () {
  const STORAGE_COOKIE = "oscode_cookie_consent";
  const STORAGE_SOUND = "oscode_sound_pref";

  function splitChars(el) {
    const text = el.textContent.trim();
    el.textContent = "";
    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "char";
      span.style.setProperty("--i", String(i));
      span.textContent = ch === " " ? "\u00a0" : ch;
      el.appendChild(span);
    });
  }

  document.querySelectorAll("[data-split]").forEach(splitChars);

  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((word, i) => {
      const span = document.createElement("span");
      span.className = "word";
      span.style.setProperty("--wd", `${i * 0.04}s`);
      span.textContent = word;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  }

  const manifestoTitle = document.querySelector("[data-manifesto]");
  if (manifestoTitle) {
    splitWords(manifestoTitle);
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            manifestoTitle.classList.add("is-visible");
            obs.unobserve(manifestoTitle);
          }
        });
      },
      { threshold: 0.25 }
    );
    obs.observe(manifestoTitle);
  }

  const menuToggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!open));
      mobileNav.hidden = open;
      document.body.style.overflow = open ? "" : "hidden";
    });
    mobileNav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        menuToggle.setAttribute("aria-expanded", "false");
        mobileNav.hidden = true;
        document.body.style.overflow = "";
      });
    });
  }

  const cookieBar = document.getElementById("cookieBar");
  const cookieAccept = document.getElementById("cookieAccept");
  const cookieDeny = document.getElementById("cookieDeny");

  function hideCookieBar() {
    if (!cookieBar) return;
    cookieBar.classList.add("is-hidden");
    setTimeout(() => {
      cookieBar.hidden = true;
      cookieBar.classList.remove("is-hidden");
    }, 400);
  }

  const consent = localStorage.getItem(STORAGE_COOKIE);
  if (consent && cookieBar) {
    cookieBar.hidden = true;
  }

  cookieAccept?.addEventListener("click", () => {
    localStorage.setItem(STORAGE_COOKIE, "accept");
    hideCookieBar();
  });

  cookieDeny?.addEventListener("click", () => {
    localStorage.setItem(STORAGE_COOKIE, "deny");
    hideCookieBar();
  });

  const soundToggle = document.getElementById("soundToggle");
  const ambient = document.getElementById("ambient");

  if (soundToggle && ambient) {
    ambient.volume = 0.35;

    const prefOff = () => localStorage.getItem(STORAGE_SOUND) === "off";

    soundToggle.setAttribute("aria-pressed", "false");

    function tryPlayFromClick() {
      if (prefOff()) return;
      if (!ambient.paused) return;
      ambient
        .play()
        .then(() => {
          soundToggle.setAttribute("aria-pressed", "true");
          localStorage.setItem(STORAGE_SOUND, "on");
        })
        .catch(() => {});
    }

    function onFirstSiteClick() {
      tryPlayFromClick();
      document.removeEventListener("click", onFirstSiteClick);
    }

    document.addEventListener("click", onFirstSiteClick);

    soundToggle.addEventListener("click", () => {
      if (ambient.paused) {
        ambient.play().catch(() => {});
        soundToggle.setAttribute("aria-pressed", "true");
        localStorage.setItem(STORAGE_SOUND, "on");
      } else {
        ambient.pause();
        soundToggle.setAttribute("aria-pressed", "false");
        localStorage.setItem(STORAGE_SOUND, "off");
      }
    });
  }
})();
