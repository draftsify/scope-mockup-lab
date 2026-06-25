/* ============================================================
   QNT / Quantumium — interactions + procedural chart
   ============================================================ */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const SVGNS = "http://www.w3.org/2000/svg";
  const el = (n, a = {}) => {
    const e = document.createElementNS(SVGNS, n);
    for (const k in a) e.setAttribute(k, a[k]);
    return e;
  };

  /* deterministic pseudo-random so the chart is stable */
  let seed = 8675309;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

  const BUY = css("--buy"), SELL = css("--sell"), MINT = css("--accent-mint");

  /* ----- candlestick generator ----- */
  const N = 72;
  const candles = [];
  let price = 40;
  for (let i = 0; i < N; i++) {
    const drift = Math.sin(i / 9) * 0.6 + (i / N) * 4.2;
    const o = price;
    const c = o + (rnd() - 0.45) * 1.6 + drift * 0.08;
    const hi = Math.max(o, c) + rnd() * 0.9;
    const lo = Math.min(o, c) - rnd() * 0.9;
    candles.push({ o, c, hi, lo, up: c >= o, vol: 0.3 + rnd() });
    price = c;
  }
  const lows = Math.min(...candles.map((d) => d.lo));
  const highs = Math.max(...candles.map((d) => d.hi));
  const pad = (highs - lows) * 0.08;
  const min = lows - pad, max = highs + pad;

  function buildChart() {
    const svg = $("#chart");
    const W = 1000, H = 330;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = "";
    const plotW = W - 46;
    const y = (v) => H - ((v - min) / (max - min)) * H;
    const step = plotW / N;
    const cw = step * 0.62;

    /* gridlines + axis labels */
    const grid = el("g");
    for (let g = 0; g <= 6; g++) {
      const yy = (H / 6) * g;
      grid.appendChild(el("line", { x1: 0, x2: plotW, y1: yy, y2: yy, stroke: "rgba(255,255,255,.035)", "stroke-dasharray": "2 6" }));
      const val = max - ((max - min) / 6) * g;
      const t = el("text", { x: plotW + 8, y: yy + 3, fill: "rgba(255,255,255,.28)", "font-size": 10, "font-family": "var(--font-mono)" });
      t.textContent = Math.round(val) + "K";
      grid.appendChild(t);
    }
    svg.appendChild(grid);

    /* candles (draw-in via stroke trick on wicks + scale on bodies) */
    candles.forEach((d, i) => {
      const x = i * step + step / 2;
      const col = d.up ? BUY : SELL;
      const wick = el("line", { x1: x, x2: x, y1: y(d.hi), y2: y(d.lo), stroke: col, "stroke-width": 1, opacity: 0 });
      svg.appendChild(wick);
      const top = y(Math.max(d.o, d.c)), bot = y(Math.min(d.o, d.c));
      const body = el("rect", {
        x: x - cw / 2, y: top, width: cw, height: Math.max(1.4, bot - top),
        fill: col, rx: 0.8, opacity: 0,
        style: "transform-box:fill-box;transform-origin:center bottom;transform:scaleY(0)"
      });
      svg.appendChild(body);
      const dl = 0.5 + i * 0.011;
      wick.animate([{ opacity: 0 }, { opacity: 0.85 }], { duration: 280, delay: dl * 1000, fill: "forwards", easing: "ease-out" });
      body.animate(
        [{ transform: "scaleY(0)", opacity: 0 }, { transform: "scaleY(1)", opacity: 1 }],
        { duration: 360, delay: dl * 1000, fill: "forwards", easing: "cubic-bezier(.22,1,.36,1)" }
      );
    });

    /* live price line */
    const last = candles[candles.length - 1];
    const ly = y(last.c);
    svg.appendChild(el("line", { x1: 0, x2: plotW, y1: ly, y2: ly, stroke: MINT, "stroke-width": 1, "stroke-dasharray": "3 4", opacity: 0.55 }));
    return { y, plotW, last };
  }

  function buildVolume() {
    const svg = $("#vol");
    const W = 1000, H = 56;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = "";
    const plotW = W - 46, step = plotW / N, cw = step * 0.62;
    const vmax = Math.max(...candles.map((d) => d.vol));
    candles.forEach((d, i) => {
      const x = i * step + step / 2;
      const h = (d.vol / vmax) * (H - 8);
      const r = el("rect", {
        x: x - cw / 2, y: H - h, width: cw, height: h, rx: 0.8,
        fill: d.up ? BUY : SELL, opacity: 0.28,
        style: "transform-box:fill-box;transform-origin:center bottom;transform:scaleY(0)"
      });
      svg.appendChild(r);
      r.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], { duration: 420, delay: 600 + i * 9, fill: "forwards", easing: "cubic-bezier(.22,1,.36,1)" });
    });
  }

  function placePriceFlag(ctx) {
    const wrap = $(".bg-chart");
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const frac = ctx.y(ctx.last.c) / 330;
    $("#priceFlag").style.top = rect.top + rect.height * frac + "px";
  }

  /* footer volume histogram */
  function buildFooter() {
    const foot = $("#foot");
    foot.innerHTML = "";
    for (let i = 0; i < 90; i++) {
      const b = document.createElement("div");
      b.className = "vbar";
      const h = 6 + rnd() * 30;
      b.style.height = h + "px";
      b.style.animationDelay = 0.4 + i * 0.008 + "s";
      if (rnd() > 0.6) b.style.background = rnd() > 0.5 ? "rgba(127,217,181,.3)" : "rgba(226,125,110,.28)";
      foot.appendChild(b);
    }
  }

  /* ----- sliding indicator helper ----- */
  function slide(ind, btn, group) {
    const gb = group.getBoundingClientRect();
    const bb = btn.getBoundingClientRect();
    ind.style.left = bb.left - gb.left + "px";
    ind.style.width = bb.width + "px";
  }

  /* ----- bottom tabs ----- */
  function initTabs() {
    const tabs = $("#tabs");
    const ind = $("#tabInd");
    const btns = $$(".t", tabs);
    const set = (b) => { btns.forEach((x) => x.classList.toggle("on", x === b)); slide(ind, b, tabs); };
    btns.forEach((b) => b.addEventListener("click", () => set(b)));
    requestAnimationFrame(() => set($(".t.on", tabs)));
    window.addEventListener("resize", () => set($(".t.on", tabs)));
  }

  /* ----- order modes ----- */
  function initModes() {
    const modes = $("#modes");
    const ind = $("#modeInd");
    const btns = $$("button:not(.gear)", modes);
    const set = (b) => { btns.forEach((x) => x.classList.toggle("on", x === b)); slide(ind, b, modes); };
    btns.forEach((b) => b.addEventListener("click", () => set(b)));
    requestAnimationFrame(() => set($("button.on", modes)));
    window.addEventListener("resize", () => set($("button.on", modes)));
  }

  /* ----- buy / sell toggle ----- */
  function initBuySell() {
    const bs = $("#bs");
    const cta = $("#cta");
    const label = $("#ctaLabel");
    const chg = $("#chg");
    $$("button", bs).forEach((b) =>
      b.addEventListener("click", () => {
        const side = b.dataset.s;
        bs.dataset.side = side;
        $$("button", bs).forEach((x) => x.classList.toggle("on", x === b));
        label.textContent = (side === "buy" ? "Buy" : "Sell") + " QNT";
        const mint = "linear-gradient(180deg, var(--accent-mint), var(--accent-mint-strong))";
        const sell = "linear-gradient(180deg, #e89384, var(--sell))";
        cta.style.background = side === "buy" ? mint : sell;
        cta.style.boxShadow = side === "buy" ? "var(--shadow-cta)" : "0 10px 30px -8px rgba(226,125,110,.4)";
        cta.style.color = side === "buy" ? "#062018" : "#2a0f0a";
      })
    );
  }

  /* ----- amount + presets + estimate ----- */
  const PRICE_PER_SOL = 23240; // QNT per SOL (mock)
  function recalc() {
    const sol = parseFloat($("#amtInput").value) || 0;
    const tok = Math.round(sol * PRICE_PER_SOL).toLocaleString("en-US");
    $("#estTok").textContent = "≈ " + tok + " QNT";
    $("#estUsd").textContent = "$" + (sol * 43).toFixed(2);
  }
  function initAmount() {
    const input = $("#amtInput");
    const presets = $("#presets");
    input.addEventListener("input", () => {
      recalc();
      $$("button", presets).forEach((p) => p.classList.toggle("on", p.dataset.v === parseFloat(input.value || 0).toFixed(3)));
    });
    $$("button", presets).forEach((p) =>
      p.addEventListener("click", () => {
        input.value = parseFloat(p.dataset.v).toFixed(3);
        $$("button", presets).forEach((x) => x.classList.toggle("on", x === p));
        recalc();
      })
    );
    recalc();
  }

  /* ----- draggable trades window ----- */
  function initTrades() {
    const win = $("#trades");
    const head = $("#tradesHead");
    const body = $("#tradesBody");
    let drag = null;
    /* set explicit position so it stays put across the drag */
    const lock = () => {
      const r = win.getBoundingClientRect();
      win.style.left = r.left + "px";
      win.style.top = r.top + "px";
      win.style.right = "auto";
      win.style.bottom = "auto";
    };
    head.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".win")) return;
      lock();
      const r = win.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
      win.classList.add("dragging");
      head.setPointerCapture(e.pointerId);
    });
    head.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const x = Math.max(8, Math.min(window.innerWidth - win.offsetWidth - 8, e.clientX - drag.dx));
      const y = Math.max(8, Math.min(window.innerHeight - 60, e.clientY - drag.dy));
      win.style.left = x + "px";
      win.style.top = y + "px";
    });
    const end = () => { drag = null; win.classList.remove("dragging"); };
    head.addEventListener("pointerup", end);
    head.addEventListener("pointercancel", end);

    /* minimize */
    $("#tradesMin").addEventListener("click", () => {
      const min = win.classList.toggle("min");
      body.style.maxHeight = min ? "0px" : body.scrollHeight + "px";
    });
    requestAnimationFrame(() => (body.style.maxHeight = body.scrollHeight + "px"));
  }

  /* ----- live ticking price flag (subtle ambience) ----- */
  function initLiveTick(ctx) {
    const flag = $("#priceFlag .tag");
    let base = 44;
    setInterval(() => {
      const next = Math.max(40, Math.min(49, base + (Math.random() - 0.5) * 0.8));
      base = next;
      flag.textContent = next.toFixed(0) + "K";
    }, 2600);
  }

  /* ----- CTA press feedback ----- */
  function initCta() {
    $("#cta").addEventListener("click", function () {
      this.animate(
        [{ transform: "translateY(0) scale(1)" }, { transform: "translateY(0) scale(.97)" }, { transform: "translateY(-1px) scale(1)" }],
        { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" }
      );
    });
  }

  /* ----- sidebar / dock active swap ----- */
  function initNav() {
    $$(".side .ic:not(.bot)").forEach((b) =>
      b.addEventListener("click", () => { $$(".side .ic").forEach((x) => x.classList.remove("on")); b.classList.add("on"); })
    );
  }

  /* ----- boot ----- */
  function boot() {
    const ctx = buildChart();
    buildVolume();
    buildFooter();
    placePriceFlag(ctx);
    initTabs();
    initModes();
    initBuySell();
    initAmount();
    initTrades();
    initCta();
    initNav();
    initLiveTick(ctx);
    window.addEventListener("resize", () => placePriceFlag(ctx));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
