(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll("[data-reveal], .draw").forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`;
    if (reduce) el.classList.add("in");
    else io.observe(el);
  });

  const revealH = (box, el) => {
    if (box.scrollWidth <= box.clientWidth + 4) return;
    const br = box.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    if (er.left < br.left + 8) box.scrollLeft += er.left - br.left - 12;
    else if (er.right > br.right - 8)
      box.scrollLeft += er.right - br.right + 12;
  };

  const currentNav = document.querySelector(
    ".nav-links a[aria-current='page']"
  );
  if (currentNav) revealH(currentNav.parentElement, currentNav);

  const tocLinks = [...document.querySelectorAll(".toc a")];
  if (tocLinks.length) {
    const sections = tocLinks
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);
    let last = -1;
    const spy = () => {
      let cur = 0;
      sections.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= 120) cur = i;
      });
      tocLinks.forEach((a, i) => a.classList.toggle("active", i === cur));
      if (cur !== last) {
        last = cur;
        revealH(tocLinks[cur].parentElement, tocLinks[cur]);
      }
    };
    addEventListener("scroll", spy, { passive: true });
    spy();
  }

  document.querySelectorAll("details").forEach((d) => {
    d.classList.add("q");
  });
  document.querySelectorAll("table").forEach((t) => {
    if (t.parentElement && t.parentElement.classList.contains("tscroll")) return;
    const wrap = document.createElement("div");
    wrap.className = "tscroll";
    t.replaceWith(wrap);
    wrap.appendChild(t);
  });
  addEventListener("beforeprint", () =>
    document.querySelectorAll("details").forEach((d) => (d.open = true))
  );

  const triggers = [...document.querySelectorAll("[data-calc-open]")];
  if (triggers.length) buildCalc(triggers);

  document.querySelectorAll(".mcq").forEach((m) => {
    const ans = m.dataset.answer;
    m.querySelectorAll(".mcq-opts button").forEach((b) => {
      b.addEventListener("click", () => {
        if (m.classList.contains("done")) return;
        m.classList.add("done", "show");
        if (b.dataset.opt === ans) b.classList.add("right");
        else {
          b.classList.add("wrong");
          m.querySelector(`.mcq-opts button[data-opt="${ans}"]`)?.classList.add("right");
        }
      });
    });
  });

  if (!reduce && document.body.dataset.tilt) {
    addEventListener("pointermove", (e) => {
      const r = document.body.getBoundingClientRect();
      document.body.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    });
  }

  function buildCalc(triggers) {
    const modal = document.createElement("div");
    modal.className = "calc-modal";
    modal.innerHTML = `
      <div class="calc-panel glass" role="dialog" aria-label="Scientific calculator">
        <div class="calc-head">
          <h3>Calculator</h3>
          <span class="calc-mode">DEG</span>
          <button class="calc-close" aria-label="Close">✕</button>
        </div>
        <input class="calc-display" spellcheck="false" autocomplete="off" placeholder="0">
        <div class="calc-result" aria-live="polite"></div>
        <div class="calc-keys">
          <button class="ac" data-k="AC">AC</button>
          <button class="op" data-k="DEL">⌫</button>
          <button class="op" data-k="(">(</button>
          <button class="op" data-k=")">)</button>
          <button class="op" data-k="sin(">sin</button>
          <button class="op" data-k="cos(">cos</button>
          <button class="op" data-k="tan(">tan</button>
          <button class="op" data-k="^">xʸ</button>
          <button data-k="7">7</button>
          <button data-k="8">8</button>
          <button data-k="9">9</button>
          <button class="op" data-k="÷">÷</button>
          <button data-k="4">4</button>
          <button data-k="5">5</button>
          <button data-k="6">6</button>
          <button class="op" data-k="×">×</button>
          <button data-k="1">1</button>
          <button data-k="2">2</button>
          <button data-k="3">3</button>
          <button class="op" data-k="−">−</button>
          <button data-k="0">0</button>
          <button data-k=".">.</button>
          <button class="op" data-k="π">π</button>
          <button class="op" data-k="+">+</button>
          <button class="op" data-k="√(">√</button>
          <button class="op" data-k="%">%</button>
          <button class="op" data-k="log(">log</button>
          <button class="eq" data-k="=">=</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const display = modal.querySelector(".calc-display");
    const result = modal.querySelector(".calc-result");
    const open = () => {
      modal.classList.add("open");
      display.focus();
    };
    const close = () => modal.classList.remove("open");
    triggers.forEach((t) => t.addEventListener("click", open));
    modal.querySelector(".calc-close").addEventListener("click", close);
    modal.addEventListener("click", (e) => e.target === modal && close());
    addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        open();
      }
    });

    modal.querySelectorAll(".calc-keys button").forEach((b) => {
      b.addEventListener("click", () => {
        const k = b.dataset.k;
        if (k === "AC") {
          display.value = "";
          result.textContent = "";
        } else if (k === "DEL") {
          display.value = display.value.slice(0, -1);
        } else if (k === "=") {
          calculate();
        } else {
          display.value += k;
          display.focus();
        }
      });
    });
    display.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        calculate();
      }
    });

    function calculate() {
      const raw = display.value.trim();
      if (!raw) return;
      try {
        const val = evaluate(raw);
        result.textContent = raw + " =";
        display.value = Number.isFinite(val)
          ? +val.toFixed(10).toString()
          : "undefined";
      } catch {
        result.textContent = "check the expression";
      }
    }

    function evaluate(src) {
      let s = src
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/π/g, "PI")
        .replace(/√\(/g, "SQRT(")
        .replace(/\^/g, "**")
        .replace(/%/g, "/100");
      if (!/^[0-9A-Za-z_+\-*/().\s]*$/.test(s)) throw new Error("bad chars");
      const allowed = ["PI", "SQRT", "sin", "cos", "tan", "log", "LN", "ABS"];
      const idents = s.match(/[A-Za-z_]+/g) || [];
      idents.forEach((w) => {
        if (!allowed.includes(w)) throw new Error("unknown " + w);
      });
      const deg = (f) => (x) => f((x * Math.PI) / 180);
      const env = {
        PI: Math.PI,
        SQRT: Math.sqrt,
        ABS: Math.abs,
        sin: deg(Math.sin),
        cos: deg(Math.cos),
        tan: deg(Math.tan),
        log: Math.log10,
        LN: Math.log,
      };
      const fn = new Function(...Object.keys(env), `"use strict"; return (${s});`);
      const out = fn(...Object.values(env));
      if (typeof out !== "number") throw new Error("not a number");
      return out;
    }
  }
})();
