(() => {
  const cfg = window.SITE_CONFIG;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fill = (t) => t.replace("{name}", encodeURIComponent(cfg.player));
  // ---------- Navigation ----------
  const nav = document.getElementById("nav");
  nav.textContent = "";
  cfg.links.forEach((l) => {
    const a = document.createElement("a");
    a.href = l.href;
    a.textContent = l.label;
    nav.appendChild(a);
  });
  // ---------- Favicon ----------
  function setIcon(href) {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = href;
  }
  setIcon(fill(cfg.iconFallback));
  // ---------- Skin laden ----------
  const loadImg = (url, cors) => new Promise((res, rej) => {
    const i = new Image();
    if (cors) i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  async function loadSkin() {
    for (const tpl of cfg.skinSources) {
      const url = fill(tpl);
      for (const cors of [true, false]) {
        try {
          return {
            img: await loadImg(url, cors),
            url,
            cors
          };
        } catch (e) { }
      }
    }
    return null;
  }
  // Skin analysieren (Slim-Arme, altes 64x32-Format, Icon) - nur mit CORS moeglich
  function analyze(res) {
    const img = res.img;
    const k = img.naturalWidth / 64;
    const info = {
      src: res.url,
      slim: false,
      legacy: img.naturalHeight === img.naturalWidth / 2
    };
    if (!res.cors) return info;
    try {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const x = c.getContext("2d");
      x.drawImage(img, 0, 0);
      if (!info.legacy) info.slim = x.getImageData(Math.floor(54 * k), Math.floor(20 * k), 1, 1).data[3] === 0;
      info.src = c.toDataURL();
      const ic = document.createElement("canvas");
      ic.width = ic.height = 64;
      const y = ic.getContext("2d");
      y.imageSmoothingEnabled = false;
      y.drawImage(img, 8 * k, 8 * k, 8 * k, 8 * k, 0, 0, 64, 64);
      y.drawImage(img, 40 * k, 8 * k, 8 * k, 8 * k, 0, 0, 64, 64);
      setIcon(ic.toDataURL());
    } catch (e) { }
    return info;
  }
  // ---------- 3D-Modell ----------
  const model = document.getElementById("model");
  const anchor = document.getElementById("anchor");
  const el = (cls) => {
    const d = document.createElement("div");
    d.className = cls;
    return d;
  };

  function box(w, h, d, u, v) {
    const g = el("part");
    const faces = [
      [w, h, u + d, v + d, "rotateY(0deg)", d / 2], // front
      [w, h, u + 2 * d + w, v + d, "rotateY(180deg)", d / 2], // back
      [d, h, u, v + d, "rotateY(-90deg)", w / 2], // character right
      [d, h, u + d + w, v + d, "rotateY(90deg)", w / 2], // character left
      [w, d, u + d, v, "rotateX(90deg)", h / 2], // top
      [w, d, u + d + w, v, "rotateX(-90deg)", h / 2] // bottom
    ];
    faces.forEach(([fw, fh, ux, uy, rot, tz]) => {
      const f = el("face");
      f.style.cssText = `--fw:${fw};--fh:${fh};--ux:${ux};--uy:${uy};--rot:${rot};--tz:${tz}`;
      g.appendChild(f);
    });
    return g;
  }

  function solid(w, h, d, uv, ouv, k) {
    const g = el("part");
    g.appendChild(box(w, h, d, uv[0], uv[1]));
    if (ouv) {
      const o = el("part");
      o.style.transform = `scale3d(${k},${k},${k})`;
      o.appendChild(box(w, h, d, ouv[0], ouv[1]));
      g.appendChild(o);
    }
    return g;
  }
  const at = (g, x, y) => {
    g.style.transform = `translate3d(calc(var(--s) * ${x}), calc(var(--s) * ${y}), 0)`;
    return g;
  };
  let headG = null;

  function build(info) {
    if (info) model.style.setProperty("--skin", `url("${info.src}")`);
    else model.classList.add("noskin");
    const lg = info ? info.legacy : false;
    const aw = info && info.slim ? 3 : 4;
    const k = 1.05;
    headG = el("part");
    headG.appendChild(at(solid(8, 8, 8, [0, 0], [32, 0], 1.125), 0, -4));
    model.append(at(solid(8, 12, 4, [16, 16], lg ? null : [16, 32], k), 0, 0), at(solid(aw, 12, 4, [40, 16], lg ? null : [40, 32], k), -(4 + aw / 2), 0), at(solid(aw, 12, 4, lg ? [40, 16] : [32, 48], lg ? null : [48, 48], k), 4 + aw / 2, 0), at(solid(4, 12, 4, [0, 16], lg ? null : [0, 32], k), -2, 12), at(solid(4, 12, 4, lg ? [0, 16] : [16, 48], lg ? null : [0, 48], k), 2, 12), headG);
  }
  // ---------- Layout ----------
  let S = 36,
    oy = 0;

  function layout() {
    const vw = innerWidth,
      vh = innerHeight - document.querySelector("header").offsetHeight;
    let ox;
    if (vw > vh * 1.0 && vw >= 700) {
      S = Math.min(vw / 34, (vh + 87) / 19.5);
      ox = vw * 0.75;
      oy = 14 + 14 * S;
    } else {
      S = vw / 18;
      ox = vw * 0.65;
      oy = vh * 0.72;
    }
    model.style.setProperty("--s", S + "px");
    anchor.style.left = ox + "px";
    anchor.style.top = oy + "px";
  }
  addEventListener("resize", layout);
  layout();
  // ---------- Mausreaktion ----------
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let mx = 0,
    my = 0,
    cx = 0,
    cy = 0,
    hasPtr = false;
  addEventListener("pointermove", (e) => {
    hasPtr = true;
    const r = anchor.getBoundingClientRect();
    mx = clamp((e.clientX - r.left) / (innerWidth * 0.5), -1.2, 1.2);
    my = clamp((e.clientY - (r.top - 10 * S)) / (innerHeight * 0.5), -1.2, 1.2);
  }, {
    passive: true
  });
  document.documentElement.addEventListener("pointerleave", () => {
    hasPtr = false;
  });

  function frame(t) {
    let tx = mx,
      ty = my;
    if (!hasPtr || reduce) {
      tx = reduce ? 0 : Math.sin(t / 2200) * 0.55;
      ty = reduce ? 0 : Math.sin(t / 1700 + 1) * 0.15;
    }
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    const bob = reduce ? 0 : Math.sin(t / 1400) * 0.12;
    model.style.transform = `translateY(calc(var(--s) * ${bob.toFixed(3)})) rotateX(${(-6 - cy * 5).toFixed(2)}deg) rotateY(${(-22 + cx * 14).toFixed(2)}deg)`;
    if (headG) {
      headG.style.transform = `translate3d(0, calc(var(--s) * -6), 0) rotateY(${clamp(cx * 38, -55, 55).toFixed(2)}deg) rotateX(${clamp(-cy * 30, -35, 35).toFixed(2)}deg)`;
    }
    requestAnimationFrame(frame);
  }
  // ---------- Start ----------
  loadSkin().then((res) => {
    build(res ? analyze(res) : null);
    requestAnimationFrame(frame);
  });
})();
