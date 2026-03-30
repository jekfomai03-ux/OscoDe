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

  // Reveal-анимации при скролле (лёгкие, без тяжёлых эффектов)
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length > 0) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal--active");
            revealObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -12% 0px" }
    );
    revealEls.forEach((el) => revealObs.observe(el));
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

  // Калькулятор стоимости
  const calculator = document.getElementById("calculator");
  const calcRangeText = document.getElementById("calcRangeText");
  if (calculator && calcRangeText) {
    const elType = document.getElementById("calcType");
    const elPages = document.getElementById("calcPages");
    const elContent = document.getElementById("calcContent");
    const elBrief = document.getElementById("calcBrief");
    const elTime = document.getElementById("calcTime");
    const featCheckboxes = document.querySelectorAll("[data-feat]");

    const typeBase = {
      landing: { min: 70000, max: 110000 },
      multipage: { min: 120000, max: 190000 },
      catalog: { min: 150000, max: 240000 },
      webapp: { min: 280000, max: 420000 }
    };

    const pagesMult = {
      "1": { min: 1.0, max: 1.0 },
      "2-3": { min: 1.25, max: 1.35 },
      "4-7": { min: 1.6, max: 1.8 },
      "8-15": { min: 2.2, max: 2.5 },
      "16+": { min: 3.0, max: 3.4 }
    };

    const designMult = {
      template: { min: 1.0, max: 1.1 },
      semi: { min: 1.2, max: 1.35 },
      custom: { min: 1.45, max: 1.6 }
    };

    const contentMult = {
      ready: { min: 1.0, max: 1.05 },
      partial: { min: 1.12, max: 1.22 },
      need: { min: 1.28, max: 1.38 }
    };

    const briefMult = {
      clear: { min: 1.0, max: 1.0 },
      partial: { min: 1.08, max: 1.15 },
      none: { min: 1.15, max: 1.25 }
    };

    const timeMult = {
      standard: { min: 1.0, max: 1.0 },
      fast: { min: 1.07, max: 1.12 },
      rush: { min: 1.12, max: 1.22 }
    };

    // Сложность: 1..5
    const complexityMult = {
      min: [0.9, 1.0, 1.15, 1.35, 1.6],
      max: [1.0, 1.12, 1.3, 1.55, 1.85]
    };

    const featureCosts = {
      form: { min: 15000, max: 22000 },
      catalog: { min: 60000, max: 85000 },
      filters: { min: 40000, max: 60000 },
      cms: { min: 70000, max: 110000 },
      auth: { min: 35000, max: 55000 },
      payment: { min: 90000, max: 140000 },
      integrations: { min: 45000, max: 70000 },
      animations: { min: 18000, max: 32000 }
    };

    function formatNumber(value) {
      return Math.round(value).toLocaleString("ru-RU");
    }

    function roundNice(value) {
      // Округляем до 5к, чтобы диапазон читался приятнее
      const step = 5000;
      return Math.round(value / step) * step;
    }

    function calc() {
      const type = elType?.value || "landing";
      const pages = elPages?.value || "1";
      const design = "template";
      const complexity = 3; // фиксируем значение, т.к. параметр убран
      const content = elContent?.value || "ready";
      const brief = elBrief?.value || "clear";
      const time = elTime?.value || "standard";

      const base = typeBase[type] || typeBase.landing;
      const pm = pagesMult[pages] || pagesMult["1"];
      const dm = designMult[design] || designMult.template;
      const cm = contentMult[content] || contentMult.ready;
      const brm = briefMult[brief] || briefMult.clear;
      const tm = timeMult[time] || timeMult.standard;

      const ciMin = complexityMult.min[complexity - 1] ?? complexityMult.min[2];
      const ciMax = complexityMult.max[complexity - 1] ?? complexityMult.max[2];

      let featuresMin = 0;
      let featuresMax = 0;
      featCheckboxes.forEach((cb) => {
        if (!cb.checked) return;
        const key = cb.getAttribute("data-feat");
        const c = featureCosts[key];
        if (!c) return;
        featuresMin += c.min;
        featuresMax += c.max;
      });

      let min =
        base.min *
          pm.min *
          dm.min *
          ciMin *
          cm.min *
          brm.min *
          tm.min +
        featuresMin;
      let max =
        base.max *
          pm.max *
          dm.max *
          ciMax *
          cm.max *
          brm.max *
          tm.max +
        featuresMax;

      // Уменьшаем итоговую стоимость ещё в 2 раза (итого /8 относительно исходной формулы)
      min = min / 8;
      max = max / 8;

      min = roundNice(min);
      max = roundNice(max);
      if (max < min) max = min;

      calcRangeText.textContent = `от ${formatNumber(min)} до ${formatNumber(max)} ₽`;
    }

    function bind() {
      const update = () => {
        calc();
      };

      [elType, elPages, elContent, elBrief, elTime].forEach((el) => {
        el?.addEventListener("change", update);
        el?.addEventListener("input", update);
      });

      featCheckboxes.forEach((cb) => cb.addEventListener("change", calc));
      calc();
    }

    bind();
  }

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
