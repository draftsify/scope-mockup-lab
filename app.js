/* ============================================================
   QNT / Quantumium — interactions + live TradingView chart
   ============================================================ */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* deterministic pseudo-random so the footer histogram is stable */
  let seed = 8675309;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

  /* ============================================================
     Live TradingView chart — themed to the Quantumium palette
     (mint candles, terracotta downs, near-black canvas, no chrome)
     ============================================================ */
  function initTradingView() {
    const host = $("#tvchart");
    const skel = $("#chartSkeleton");
    if (!host) return;

    const overrides = {
      "paneProperties.background": "#050607",
      "paneProperties.backgroundType": "solid",
      "paneProperties.vertGridProperties.color": "rgba(255,255,255,0.025)",
      "paneProperties.horzGridProperties.color": "rgba(255,255,255,0.025)",
      "paneProperties.crossHairProperties.color": "rgba(232,234,233,0.22)",
      "scalesProperties.lineColor": "rgba(255,255,255,0.05)",
      "scalesProperties.textColor": "rgba(232,234,233,0.5)",
      "scalesProperties.fontSize": 11,
      "mainSeriesProperties.candleStyle.upColor": "#7fd9b5",
      "mainSeriesProperties.candleStyle.downColor": "#e27d6e",
      "mainSeriesProperties.candleStyle.borderUpColor": "#7fd9b5",
      "mainSeriesProperties.candleStyle.borderDownColor": "#e27d6e",
      "mainSeriesProperties.candleStyle.wickUpColor": "#9fe9cf",
      "mainSeriesProperties.candleStyle.wickDownColor": "#ec9a8d",
      "mainSeriesProperties.showPriceLine": true,
      "mainSeriesProperties.priceLineColor": "#7fd9b5",
      "paneProperties.legendProperties.showLegend": false,
      "paneProperties.legendProperties.showStudyTitles": false
    };

    const studiesOverrides = {
      "volume.volume.color.0": "rgba(226,125,110,0.4)",
      "volume.volume.color.1": "rgba(127,217,181,0.4)",
      "volume.volume.transparency": 62
    };

    const config = {
      symbol: "BINANCE:SOLUSDT",
      interval: "5",
      theme: "dark",
      style: "1",
      locale: "en",
      timezone: "Etc/UTC",
      backgroundColor: "#050607",
      gridColor: "rgba(255,255,255,0.025)",
      hide_top_toolbar: true,
      hide_side_toolbar: true,
      hide_legend: true,
      allow_symbol_change: false,
      save_image: false,
      withdateranges: false,
      studies: []
    };

    const disabled = [
      "header_widget", "left_toolbar", "border_around_the_chart",
      "control_bar", "timeframes_toolbar", "legend_widget", "symbol_info"
    ];

    const q = new URLSearchParams({
      hideideas: "1",
      overrides: JSON.stringify(overrides),
      studies_overrides: JSON.stringify(studiesOverrides),
      enabled_features: "[]",
      disabled_features: JSON.stringify(disabled),
      locale: "en"
    });

    const iframe = document.createElement("iframe");
    iframe.title = "QNT / SOL live chart";
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("frameborder", "0");
    iframe.src =
      "https://s.tradingview.com/widgetembed/?" + q.toString() +
      "#" + encodeURIComponent(JSON.stringify(config));

    const reveal = () => {
      if (host.classList.contains("ready")) return;
      host.classList.add("ready");
      if (skel) skel.classList.add("hide");
    };
    iframe.addEventListener("load", () => setTimeout(reveal, 350));
    setTimeout(reveal, 2800); // safety if onload is delayed
    host.appendChild(iframe);
  }

  /* ============================================================
     Footer volume histogram (decorative, very thin)
     ============================================================ */
  function buildFooter() {
    const foot = $("#foot");
    if (!foot) return;
    foot.innerHTML = "";
    for (let i = 0; i < 90; i++) {
      const b = document.createElement("div");
      b.className = "vbar";
      b.style.height = 6 + rnd() * 30 + "px";
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
    const tabs = $("#tabs"), ind = $("#tabInd");
    const btns = $$(".t", tabs);
    const set = (b) => { btns.forEach((x) => x.classList.toggle("on", x === b)); slide(ind, b, tabs); };
    btns.forEach((b) => b.addEventListener("click", () => set(b)));
    requestAnimationFrame(() => set($(".t.on", tabs)));
    window.addEventListener("resize", () => set($(".t.on", tabs)));
  }

  /* ----- order modes ----- */
  function initModes() {
    const modes = $("#modes"), ind = $("#modeInd");
    const btns = $$("button:not(.gear)", modes);
    const set = (b) => { btns.forEach((x) => x.classList.toggle("on", x === b)); slide(ind, b, modes); };
    btns.forEach((b) => b.addEventListener("click", () => set(b)));
    requestAnimationFrame(() => set($("button.on", modes)));
    window.addEventListener("resize", () => set($("button.on", modes)));
  }

  /* ----- buy / sell toggle ----- */
  function initBuySell() {
    const bs = $("#bs"), cta = $("#cta"), label = $("#ctaLabel");
    $$("button", bs).forEach((b) =>
      b.addEventListener("click", () => {
        const side = b.dataset.s;
        bs.dataset.side = side;
        $$("button", bs).forEach((x) => x.classList.toggle("on", x === b));
        label.textContent = (side === "buy" ? "Buy" : "Sell") + " QNT";
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
    $("#estTok").textContent = "≈ " + Math.round(sol * PRICE_PER_SOL).toLocaleString("en-US") + " QNT";
    $("#estUsd").textContent = "$" + (sol * 43).toFixed(2);
  }
  function initAmount() {
    const input = $("#amtInput"), presets = $("#presets");
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
    const win = $("#trades"), head = $("#tradesHead"), body = $("#tradesBody");
    let drag = null;
    const lock = () => {
      const r = win.getBoundingClientRect();
      Object.assign(win.style, { left: r.left + "px", top: r.top + "px", right: "auto", bottom: "auto" });
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

    $("#tradesMin").addEventListener("click", () => {
      const min = win.classList.toggle("min");
      body.style.maxHeight = min ? "0px" : body.scrollHeight + "px";
    });
    requestAnimationFrame(() => (body.style.maxHeight = body.scrollHeight + "px"));
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

  /* ----- sidebar active swap ----- */
  function initNav() {
    $$(".side .ic:not(.bot)").forEach((b) =>
      b.addEventListener("click", () => { $$(".side .ic").forEach((x) => x.classList.remove("on")); b.classList.add("on"); })
    );
  }

  /* ----- boot ----- */
  function boot() {
    initTradingView();
    buildFooter();
    initTabs();
    initModes();
    initBuySell();
    initAmount();
    initTrades();
    initCta();
    initNav();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
