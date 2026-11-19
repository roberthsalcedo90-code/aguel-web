(function () {
  const BAG_KEY = "AGUEL_BAG_V2";
  const PRODUCTS = window.AGUEL_PRODUCTS || [];

  function fmtCOP(val) {
    return "COP $" + Number(val || 0).toLocaleString("es-CO");
  }

  function loadBag() {
    try {
      return JSON.parse(localStorage.getItem(BAG_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveBag(bag) {
    try {
      localStorage.setItem(BAG_KEY, JSON.stringify(bag));
    } catch {}
  }

  function showToast(msg) {
    const t = document.getElementById("fwToast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function addToBag(pid, vid) {
    const p = PRODUCTS.find((x) => x.id === pid);
    const v = p && p.variants.find((x) => x.id === vid);
    if (!p || !v || !v.available) return;
    const bag = loadBag();
    const size = v.title === "Default Title" ? "Única" : v.title;
    const existing = bag.find((i) => i.pid === pid && i.vid === vid);
    if (existing) existing.qty += 1;
    else {
      bag.push({
        pid,
        vid,
        handle: p.handle,
        title: p.title,
        size,
        price: v.price,
        img: p.images[0] || "assets/hero-colonial.jpg",
        qty: 1,
      });
    }
    saveBag(bag);
    renderBagDrawer();
    showToast(`Añadido · ${p.title} (${size})`);
  }

  function updateBagQty(idx, delta) {
    const bag = loadBag();
    if (!bag[idx]) return;
    bag[idx].qty += delta;
    if (bag[idx].qty <= 0) bag.splice(idx, 1);
    saveBag(bag);
    renderBagDrawer();
  }

  function renderBagDrawer() {
    const bag = loadBag();
    const count = bag.reduce((s, i) => s + i.qty, 0);
    const sub = bag.reduce((s, i) => s + i.price * i.qty, 0);
    const cntEl = document.getElementById("fwBagCount");
    const subEl = document.getElementById("fwBagSubtotal");
    const listEl = document.getElementById("fwBagItems");
    if (cntEl) cntEl.textContent = count;
    if (subEl) subEl.textContent = fmtCOP(sub);
    if (!listEl) return;

    if (!bag.length) {
      listEl.innerHTML = `<div style="padding:3rem 0; text-align:center; color:var(--muted);">
        <p style="font-family:var(--serif); font-size:1.45rem; font-weight:300; margin:0 0 0.75rem;">Tu bolsa está vacía</p>
        <a href="colecciones.html" class="text-link">Explorar colecciones</a>
      </div>`;
      return;
    }

    listEl.innerHTML = bag
      .map(
        (item, idx) => `
      <div style="display:grid; grid-template-columns:76px 1fr; gap:1rem; padding-bottom:1.1rem; border-bottom:1px solid var(--hairline);">
        <a href="producto.html?p=${item.handle}">
          <img src="${item.img}" alt="${item.title}" style="width:76px; height:100px; object-fit:cover;" />
        </a>
        <div style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <a href="producto.html?p=${item.handle}" style="font-family:var(--serif); font-size:1.15rem;">${item.title}</a>
            <div style="font-family:var(--display); font-size:0.65rem; letter-spacing:0.14em; text-transform:uppercase; color:var(--muted);">
              Talla ${item.size} · ${fmtCOP(item.price)}
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
            <div style="display:inline-flex; border:1px solid var(--hairline);">
              <button type="button" onclick="window.AguelApp.updateBagQty(${idx}, -1)" style="background:none; border:none; padding:0.2rem 0.6rem; cursor:pointer;">&minus;</button>
              <span style="padding:0.2rem 0.6rem; font-size:0.78rem;">${item.qty}</span>
              <button type="button" onclick="window.AguelApp.updateBagQty(${idx}, 1)" style="background:none; border:none; padding:0.2rem 0.6rem; cursor:pointer;">+</button>
            </div>
            <span style="font-family:var(--display); font-size:0.78rem;">${fmtCOP(item.price * item.qty)}</span>
          </div>
        </div>
      </div>`
      )
      .join("");
  }

  function checkoutWhatsApp() {
    const bag = loadBag();
    if (!bag.length) {
      showToast("Añade primero una prenda a tu bolsa");
      return;
    }
    const lines = bag.map((i) => `- ${i.qty}x ${i.title} (Talla ${i.size}) — ${fmtCOP(i.price * i.qty)}`);
    const sub = bag.reduce((s, i) => s + i.price * i.qty, 0);
    const msg = encodeURIComponent(
      `Hola AGUEL, deseo confirmar mi selección:\n\n${lines.join("\n")}\n\nTotal estimado: ${fmtCOP(sub)}`
    );
    window.open(`https://wa.me/573107925629?text=${msg}`, "_blank", "noopener");
  }

  function closeAllOverlays() {
    document.getElementById("fwBackdrop")?.classList.remove("open");
    document.getElementById("fwBagDrawer")?.classList.remove("open");
    document.getElementById("fwSearchSheet")?.classList.remove("open");
    document.getElementById("fwMobileDrawer")?.classList.remove("open");
  }

  function openDrawer(id) {
    closeAllOverlays();
    document.getElementById("fwBackdrop")?.classList.add("open");
    document.getElementById(id)?.classList.add("open");
    if (id === "fwSearchSheet") {
      setTimeout(() => document.getElementById("fwSearchInput")?.focus(), 180);
      renderSearchResults("");
    }
  }

  function renderSearchResults(q) {
    const box = document.getElementById("fwSearchResults");
    if (!box) return;
    const query = (q || "").trim().toLowerCase();
    const matches = query
      ? PRODUCTS.filter((p) =>
          (p.title + " " + p.category + " " + p.capsule + " " + p.desc).toLowerCase().includes(query)
        ).slice(0, 10)
      : PRODUCTS.filter((p) =>
          ["camisa-aurora", "camisa-filandia", "vestido-quimbaya", "top-tibirre-blanco", "bolso-iraca-cuero-mediano-mostaza"].includes(p.handle)
        );
    box.innerHTML = matches
      .map(
        (p) => `
      <a href="producto.html?p=${p.handle}" style="display:block;">
        <div style="aspect-ratio:3/4; background:var(--hueso); overflow:hidden; margin-bottom:0.45rem;">
          <img src="${p.images[0]}" alt="${p.title}" style="width:100%; height:100%; object-fit:cover;" />
        </div>
        <div style="font-size:0.8rem;">${p.title}</div>
        <div style="font-family:var(--display); font-size:0.72rem; color:var(--muted);">${fmtCOP(p.price)}</div>
      </a>`
      )
      .join("");
  }

  function productCardHTML(p) {
    const img1 = p.images[0] || "assets/hero-colonial.jpg";
    const img2 = p.images[1] || img1;
    const anyAvail = p.variants.some((v) => v.available);
    let badge = "";
    if (p.compare) badge = `<span class="fw-card-badge">Archivo / Oferta</span>`;
    else if (!anyAvail) badge = `<span class="fw-card-badge soldout">Agotado</span>`;

    const sizeBtns = p.variants
      .slice(0, 5)
      .map((v) => {
        const lbl = v.title === "Default Title" ? "Única" : v.title;
        return `<button class="fw-qs-btn" type="button" ${
          v.available ? "" : "disabled"
        } onclick="event.preventDefault(); event.stopPropagation(); window.AguelApp.addToBag(${p.id}, ${v.id})">${lbl}</button>`;
      })
      .join("");

    return `
      <article class="fw-card">
        <a class="fw-card-media" href="producto.html?p=${p.handle}">
          ${badge}
          <img class="base-img" src="${img1}" alt="${p.title}" loading="lazy" />
          <img class="hover-img" src="${img2}" alt="${p.title} detalle" loading="lazy" />
          <div class="fw-quick-sizes">${sizeBtns}</div>
        </a>
        <div class="fw-card-foot">
          <a class="fw-card-title" href="producto.html?p=${p.handle}">${p.title}</a>
          <div class="fw-card-price">
            ${fmtCOP(p.price)}
            ${p.compare ? `<span class="price-old">${fmtCOP(p.compare)}</span>` : ""}
          </div>
        </div>
        <div class="fw-card-sub">${p.capsule} · ${p.category}</div>
      </article>`;
  }

  function editorialBreakHTML({ eyebrow, title, text, photo, ctaText, ctaHref, handles }) {
    const items = (handles || [])
      .map((h) => PRODUCTS.find((p) => p.handle === h))
      .filter(Boolean)
      .map(
        (p) => `
      <a class="mini-look" href="producto.html?p=${p.handle}">
        <img src="${p.images[0]}" alt="${p.title}" />
        <div>
          <div style="font-family:var(--serif); font-size:1.05rem; line-height:1.15;">${p.title}</div>
          <div style="font-family:var(--display); font-size:0.68rem; color:var(--muted); margin-top:0.2rem;">${fmtCOP(p.price)}</div>
        </div>
      </a>`
      )
      .join("");

    return `
      <div class="editorial-break">
        <div class="break-media">
          <img src="${photo}" alt="${title}" loading="lazy" />
        </div>
        <div>
          <div class="opener-eyebrow">${eyebrow}</div>
          <h3 class="spread-title" style="font-size:clamp(1.75rem,3vw,2.5rem);">${title}</h3>
          <p class="spread-text" style="margin-bottom:1.25rem;">${text}</p>
          <a class="text-link" href="${ctaHref}">${ctaText} &rarr;</a>
          ${items ? `<div class="break-looks">${items}</div>` : ""}
        </div>
      </div>`;
  }

  function initAguelShell(activeKey, isHeroTop) {
    const headerHTML = `
      <header class="fw-header ${isHeroTop ? "is-hero-top" : ""}" id="fwHeader">
        <button class="fw-mobile-toggle" type="button" onclick="window.AguelApp.openDrawer('fwMobileDrawer')">Menú</button>
        <ul class="fw-nav left">
          <li><a href="colecciones.html" class="${activeKey === "colecciones" ? "active" : ""}">Colecciones</a></li>
          <li><a href="mujer.html" class="${activeKey === "mujer" ? "active" : ""}">Mujer</a></li>
          <li><a href="hombre.html" class="${activeKey === "hombre" ? "active" : ""}">Hombre</a></li>
          <li><a href="accesorios.html" class="${activeKey === "accesorios" ? "active" : ""}">Accesorios</a></li>
        </ul>

        <a class="fw-logo" href="index.html" aria-label="AGUEL Inicio">
          <img class="logo-dark" src="assets/logo-negro.png" alt="AGUEL" />
          <img class="logo-light" src="assets/logo-blanco.png" alt="AGUEL" />
        </a>

        <ul class="fw-nav right">
          <li class="hide-sm"><a href="archivo.html" class="${activeKey === "archivo" ? "active" : ""}">Archivo</a></li>
          <li><button class="fw-nav-btn" type="button" onclick="window.AguelApp.openDrawer('fwSearchSheet')">Buscar</button></li>
          <li><button class="fw-nav-btn fw-bag-pill" type="button" onclick="window.AguelApp.openDrawer('fwBagDrawer')">Bolsa (<span id="fwBagCount">0</span>)</button></li>
        </ul>
      </header>`;

    const footerHTML = `
      <footer class="fw-footer">
        <div class="fw-footer-grid">
          <div>
            <img src="assets/logo-negro.png" alt="AGUEL" style="height:18px; margin-bottom:1rem;" />
            <p style="max-width:36ch; color:var(--muted); margin:0;">
              Colombian Resortwear · Amco Studio S.A.S., Pereira, Risaralda. Piezas tejidas y bordadas en fibras naturales colombianas.
            </p>
            <form class="fw-news-row" onsubmit="event.preventDefault(); window.AguelApp.showToast('Suscrito a Lanzamientos Especiales'); this.reset();">
              <input type="email" placeholder="Correo para lanzamientos especiales" required />
              <button type="submit">Enviar</button>
            </form>
          </div>
          <div>
            <h5>Universos</h5>
            <ul>
              <li><a href="colecciones.html#ingrato-amor">Ingrato Amor (35)</a></li>
              <li><a href="colecciones.html#sin-deberte-nada">Sin Deberte Nada (17)</a></li>
              <li><a href="colecciones.html#aguel-orchids">Aguel Orchids (3)</a></li>
              <li><a href="mujer.html">Mujer (45)</a></li>
              <li><a href="hombre.html">Hombre (43)</a></li>
              <li><a href="accesorios.html">Accesorios &amp; Iraca</a></li>
            </ul>
          </div>
          <div>
            <h5>Casa &amp; Oficio</h5>
            <ul>
              <li><a href="archivo.html#casa-palma">Casa Palma · Helena Merheg</a></li>
              <li><a href="archivo.html#las-delicias">Las Delicias · Valle del Cauca</a></li>
              <li><a href="archivo.html#cuidados">Cuidados del Lino</a></li>
              <li><a href="archivo.html#cambios">Cambios (5 días)</a></li>
            </ul>
          </div>
          <div>
            <h5>Atelier</h5>
            <ul>
              <li>Calle 14 #23-267 Portal de los Álamos, Pereira</li>
              <li><a href="https://wa.me/573107925629" target="_blank" rel="noopener">WhatsApp +57 310 792 5629</a></li>
              <li><a href="mailto:info@aguel.co">info@aguel.co</a></li>
              <li><a href="https://instagram.com/aguel.co" target="_blank" rel="noopener">Instagram @aguel.co</a></li>
            </ul>
          </div>
        </div>
        <div class="fw-footer-bottom">
          <span>&copy; 2026 AGUEL · Amco Studio S.A.S.</span>
          <span>Sitio web diseñado con datos reales del catálogo aguel.co</span>
        </div>
      </footer>

      <div class="fw-backdrop" id="fwBackdrop" onclick="window.AguelApp.closeAllOverlays()"></div>

      <nav class="fw-mobile-drawer" id="fwMobileDrawer" aria-label="Menú móvil">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <img src="assets/logo-negro.png" alt="AGUEL" style="height:16px;" />
          <button type="button" onclick="window.AguelApp.closeAllOverlays()" style="background:none; border:none; font-size:1.3rem; cursor:pointer;">&times;</button>
        </div>
        <a href="index.html">Inicio</a>
        <a href="colecciones.html">Colecciones</a>
        <a href="mujer.html">Mujer</a>
        <a href="hombre.html">Hombre</a>
        <a href="accesorios.html">Accesorios &amp; Iraca</a>
        <a href="archivo.html">Archivo &amp; Cuidados</a>
      </nav>

      <div class="fw-search-sheet" id="fwSearchSheet" role="dialog" aria-label="Buscar en AGUEL">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <span style="font-family:var(--display); font-size:0.65rem; letter-spacing:0.2em; text-transform:uppercase; color:var(--muted);">Buscar entre 66 prendas y accesorios</span>
          <button type="button" onclick="window.AguelApp.closeAllOverlays()" style="background:none; border:none; font-size:1.4rem; cursor:pointer;">&times;</button>
        </div>
        <input class="fw-search-input" id="fwSearchInput" type="search" placeholder="Lino, Camisa Aurora, Iraca, Orquídeas..." />
        <div class="fw-search-results" id="fwSearchResults"></div>
      </div>

      <aside class="fw-drawer" id="fwBagDrawer" aria-label="Bolsa de Compra">
        <div style="padding:1.35rem 1.5rem; border-bottom:1px solid var(--hairline); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-family:var(--display); font-size:0.62rem; letter-spacing:0.2em; text-transform:uppercase; color:var(--terracota);">Selección AGUEL</div>
            <div style="font-family:var(--serif); font-size:1.65rem; font-weight:300;">Tu Bolsa</div>
          </div>
          <button type="button" onclick="window.AguelApp.closeAllOverlays()" style="background:none; border:none; font-size:1.4rem; cursor:pointer;">&times;</button>
        </div>
        <div id="fwBagItems" style="flex:1; overflow-y:auto; padding:1.35rem 1.5rem; display:flex; flex-direction:column; gap:1.1rem;"></div>
        <div style="padding:1.35rem 1.5rem; background:var(--hueso); border-top:1px solid var(--hairline);">
          <div style="display:flex; justify-content:space-between; font-family:var(--display); font-size:0.88rem; font-weight:600; margin-bottom:0.85rem;">
            <span>Subtotal estimado</span>
            <span id="fwBagSubtotal">COP $0</span>
          </div>
          <button class="btn-luxe" type="button" onclick="window.AguelApp.checkoutWhatsApp()">Solicitar por WhatsApp</button>
        </div>
      </aside>

      <div class="fw-toast" id="fwToast"></div>`;

    document.body.insertAdjacentHTML("afterbegin", headerHTML);
    document.body.insertAdjacentHTML("beforeend", footerHTML);

    document.getElementById("fwSearchInput")?.addEventListener("input", (e) => {
      renderSearchResults(e.target.value);
    });

    if (isHeroTop) {
      const hdr = document.getElementById("fwHeader");
      const onScroll = () => hdr.classList.toggle("is-hero-top", window.scrollY < 80);
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    renderBagDrawer();
  }

  window.AguelApp = {
    PRODUCTS,
    fmtCOP,
    showToast,
    addToBag,
    updateBagQty,
    checkoutWhatsApp,
    openDrawer,
    closeAllOverlays,
    productCardHTML,
    editorialBreakHTML,
    initAguelShell,
  };
})();
