/* KICKVERSE - app.js
   Requiere que products.js se cargue antes que este archivo.
   Esta versión usa el catálogo local de products.js; no depende de localhost:3000.
*/

let cart = [];
let wishlist = [];

let customConfig = {
    model: "Urban X",
    price: 1599,
    bodyColor: "#10b981",
    accentColor: "#06d6a0",
    customText: "",
    neon: false
};

let appliedDiscountPercent = 0;
let appliedDiscountCode = "";
let currentWheelRotation = 0;
let selectedPrize = null;

const prizes = [
    { label: "5% OFF", percent: 5, code: "KICK5", color: "#10b981" },
    { label: "10% OFF", percent: 10, code: "KICK10", color: "#8b5cf6" },
    { label: "15% OFF", percent: 15, code: "KICK15", color: "#ec4899" },
    { label: "20% OFF", percent: 20, code: "KICK20", color: "#06d6a0" },
    { label: "Envío Gratis", percent: 0, code: "FREESHIP", color: "#3b82f6" },
    { label: "5% OFF", percent: 5, code: "KICK5", color: "#f59e0b" }
];

document.addEventListener("DOMContentLoaded", () => {
    if (!Array.isArray(products)) {
        console.error("No se encontró el arreglo products. Revisa que products.js se cargue antes de app.js.");
        return;
    }

    renderProducts(products);
    renderOffers();
    updateCartUI();
    updateWishlistBadge();
    drawWheel();
});

/* -------------------- CATÁLOGO -------------------- */

function renderProducts(items) {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    grid.innerHTML = "";

    if (!Array.isArray(items) || items.length === 0) {
        grid.innerHTML = '<p class="text-gray-400 col-span-full text-center py-10">No hay tenis para mostrar en esta categoría.</p>';
        return;
    }

    items.forEach(product => {
        const isWishlisted = wishlist.some(item => item.id === product.id);
        const card = document.createElement("article");
        card.className = "glass-panel p-6 rounded-3xl border border-gray-800 flex flex-col justify-between group hover:border-emerald-500/50 transition duration-300 shadow-xl";

        card.innerHTML = `
            <div>
                <div class="relative mb-4 overflow-hidden rounded-2xl bg-gray-900">
                    <span class="absolute top-3 left-3 z-10 bg-emerald-500 text-brand-dark text-xs font-bold px-3 py-1 rounded-full uppercase">${escapeHTML(product.tag || "Tenis")}</span>
                    <button type="button" onclick="toggleWishlist(${Number(product.id)})"
                        aria-label="Agregar a favoritos"
                        class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full glass-panel flex items-center justify-center text-white hover:text-pink-500 transition shadow-lg">
                        <i class="${isWishlisted ? "fa-solid text-pink-500" : "fa-regular"} fa-heart"></i>
                    </button>
                    <img src="${safeImage(product.image)}" alt="${escapeHTML(product.name)}"
                        loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/600x400/11131d/ffffff?text=KICKVERSE'"
                        class="w-full h-56 object-contain p-3 group-hover:scale-105 transition duration-500">
                </div>
                <div class="flex items-center justify-between gap-2 mb-1">
                    <h3 class="text-xl font-bold text-white">${escapeHTML(product.name)}</h3>
                    <div class="flex items-center text-amber-400 text-xs font-bold space-x-1 shrink-0">
                        <i class="fa-solid fa-star"></i>
                        <span>${Number(product.rating || 0).toFixed(1)}</span>
                    </div>
                </div>
                <p class="text-gray-400 text-sm mb-3">${escapeHTML(product.desc || "Modelo disponible en KICKVERSE.")}</p>
                <div class="flex items-center justify-between mb-4">
                    <span class="text-xl font-black text-emerald-400">${formatPrice(product.price)} MXN</span>
                </div>
            </div>
            <div class="flex space-x-2 pt-2">
                <button type="button" onclick="openProductDetail(${Number(product.id)})"
                    class="flex-1 glass-panel hover:bg-gray-800 text-gray-200 font-semibold py-2.5 rounded-xl text-sm transition">Vista previa</button>
                <button type="button" onclick="addToCart(${Number(product.id)})"
                    class="bg-emerald-500 hover:bg-emerald-400 text-brand-dark font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-lg flex items-center justify-center"
                    aria-label="Agregar al carrito">
                    <i class="fa-solid fa-cart-plus"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderOffers() {
    const grid = document.getElementById("offersGrid");
    if (!grid) return;

    const offers = products.filter(product => product.tag === "Oferta" || Number(product.price) <= 1499);
    grid.innerHTML = "";

    if (offers.length === 0) {
        grid.innerHTML = '<p class="text-gray-400 col-span-full text-center py-8">Próximamente tendremos ofertas.</p>';
        return;
    }

    offers.forEach(product => {
        const discountedPrice = Math.round(Number(product.price) * 0.85);
        const card = document.createElement("article");
        card.className = "glass-panel p-6 rounded-3xl border border-pink-500/30 flex flex-col justify-between group hover:border-pink-500 transition duration-300 shadow-xl relative overflow-hidden";

        card.innerHTML = `
            <div>
                <div class="relative mb-4 overflow-hidden rounded-2xl bg-gray-900">
                    <span class="absolute top-3 left-3 z-10 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">15% OFF</span>
                    <img src="${safeImage(product.image)}" alt="${escapeHTML(product.name)}"
                        loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/600x400/11131d/ffffff?text=KICKVERSE'"
                        class="w-full h-56 object-contain p-3 group-hover:scale-105 transition duration-500">
                </div>
                <h3 class="text-xl font-bold text-white mb-1">${escapeHTML(product.name)}</h3>
                <p class="text-gray-400 text-sm mb-3">${escapeHTML(product.desc || "")}</p>
                <div class="flex items-center flex-wrap gap-3 mb-4">
                    <span class="text-2xl font-black text-pink-500">${formatPrice(discountedPrice)} MXN</span>
                    <span class="text-sm text-gray-500 line-through">${formatPrice(product.price)} MXN</span>
                </div>
            </div>
            <button type="button" onclick="addOfferToCart(${Number(product.id)}, ${discountedPrice})"
                class="w-full bg-pink-500 hover:bg-pink-400 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg flex items-center justify-center space-x-2">
                <i class="fa-solid fa-bolt"></i><span>Aprovechar Oferta</span>
            </button>
        `;
        grid.appendChild(card);
    });
}

function filterProducts(category, event) {
    document.querySelectorAll(".filter-tab").forEach(button => {
        button.className = "filter-tab glass-panel hover:bg-gray-800 text-gray-300 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap";
    });

    const clickedButton = event?.currentTarget || event?.target;
    if (clickedButton) {
        clickedButton.className = "filter-tab active-tab bg-emerald-500 text-brand-dark px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap";
    }

    renderProducts(category === "all" ? products : products.filter(product => product.category === category));
}

/* -------------------- CARRITO -------------------- */

function addToCart(productId) {
    const product = products.find(item => Number(item.id) === Number(productId));
    if (!product) {
        alert("No se encontró ese producto.");
        return;
    }

    cart.push({ ...product, cartPrice: Number(product.price) });
    updateCartUI();
    showToast(`${product.name} se agregó al carrito.`);
}

function addOfferToCart(productId, offerPrice) {
    const product = products.find(item => Number(item.id) === Number(productId));
    if (!product) return;

    cart.push({ ...product, cartPrice: Number(offerPrice), isOffer: true });
    updateCartUI();
    showToast(`${product.name} se agregó con precio de oferta.`);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function getCartSubtotal() {
    return cart.reduce((sum, item) => sum + Number(item.cartPrice ?? item.price ?? 0), 0);
}

function getCartTotal() {
    const subtotal = getCartSubtotal();
    return Math.max(0, Math.round(subtotal * (1 - appliedDiscountPercent / 100)));
}

function updateCartUI() {
    const badge = document.getElementById("cartBadge");
    const container = document.getElementById("cartItemsContainer");
    const totalEl = document.getElementById("cartTotal");

    if (badge) badge.textContent = cart.length;

    if (container) {
        container.innerHTML = "";

        if (cart.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">Tu carrito está vacío. Agrega unos tenis para comenzar.</p>';
        } else {
            cart.forEach((item, index) => {
                const price = Number(item.cartPrice ?? item.price ?? 0);
                const itemEl = document.createElement("div");
                itemEl.className = "flex items-center justify-between gap-3 py-3";

                itemEl.innerHTML = `
                    <div class="min-w-0">
                        <h4 class="font-bold text-sm text-white">${escapeHTML(item.name)}</h4>
                        <span class="text-emerald-400 text-xs font-semibold">${formatPrice(price)} MXN</span>
                        ${item.isOffer ? '<span class="block text-pink-400 text-xs">Precio de oferta</span>' : ""}
                    </div>
                    <button type="button" onclick="removeFromCart(${index})" aria-label="Eliminar producto"
                        class="text-gray-400 hover:text-red-400 text-sm p-2 shrink-0">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                `;

                container.appendChild(itemEl);
            });
        }
    }

    if (totalEl) {
        const subtotal = getCartSubtotal();
        const total = getCartTotal();

        totalEl.innerHTML = appliedDiscountPercent > 0
            ? `<span class="text-xs text-gray-400 line-through mr-2">${formatPrice(subtotal)}</span>${formatPrice(total)} MXN`
            : `${formatPrice(total)} MXN`;
    }
}

function openCheckoutModal() {
    if (cart.length === 0) {
        alert("Tu carrito está vacío. Agrega tenis antes de continuar.");
        return;
    }

    const subtotal = getCartSubtotal();
    const total = getCartTotal();
    const modalBody = document.getElementById("modalBody");

    if (!modalBody) return;

    modalBody.innerHTML = `
        <div class="text-center mb-6">
            <h3 class="text-2xl font-black text-white">Resumen de compra</h3>
            <p class="text-gray-400 text-xs mt-1">Demostración escolar: no se realizará ningún cobro real.</p>
            ${appliedDiscountPercent > 0 ? `<p class="text-emerald-400 text-sm mt-2">Cupón ${escapeHTML(appliedDiscountCode)} aplicado (${appliedDiscountPercent}%).</p>` : ""}
            <p class="text-gray-400 text-sm mt-3">Subtotal: ${formatPrice(subtotal)} MXN</p>
            <p class="text-emerald-400 font-bold text-xl mt-1">Total: ${formatPrice(total)} MXN</p>
        </div>
        <div class="rounded-xl bg-gray-800/60 border border-gray-700 p-4 text-sm text-gray-300 mb-5">
            Para una tienda real, conecta una pasarela de pago segura. No solicites ni guardes números de tarjeta o códigos CVV en esta página.
        </div>
        <button type="button" onclick="processDemoOrder()"
            class="w-full bg-emerald-500 hover:bg-emerald-400 text-brand-dark font-bold py-3.5 rounded-xl text-sm transition">
            Finalizar pedido de demostración
        </button>
    `;

    openModal();
}

function processDemoOrder() {
    if (cart.length === 0) return;

    alert("Pedido de demostración registrado. No se realizó ningún cobro.");

    cart = [];
    appliedDiscountPercent = 0;
    appliedDiscountCode = "";

    updateCartUI();
    closeModal();
    closeCartDrawer();
}

/* -------------------- FAVORITOS -------------------- */

function toggleWishlist(productId) {
    const product = products.find(item => Number(item.id) === Number(productId));
    if (!product) return;

    const index = wishlist.findIndex(item => Number(item.id) === Number(productId));

    if (index >= 0) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(product);
    }

    updateWishlistBadge();
    renderProducts(getVisibleProducts());
}

function getVisibleProducts() {
    const active = document.querySelector(".filter-tab.active-tab");
    const category = active?.getAttribute("onclick")?.match(/filterProducts\('([^']+)'/)?.[1] || "all";

    return category === "all"
        ? products
        : products.filter(product => product.category === category);
}

function updateWishlistBadge() {
    const badge = document.getElementById("wishlistBadge");
    if (badge) badge.textContent = wishlist.length;
}

/* -------------------- CAJÓN Y MODALES -------------------- */

function toggleCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");

    if (!drawer || !overlay) return;

    const isClosed = drawer.classList.contains("translate-x-full");

    if (isClosed) {
        openCartDrawer();
    } else {
        closeCartDrawer();
    }
}

function openCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");

    if (!drawer || !overlay) return;

    overlay.classList.remove("hidden");

    requestAnimationFrame(() => {
        overlay.classList.remove("opacity-0");
        drawer.classList.remove("translate-x-full");
    });
}

function closeCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");

    if (!drawer || !overlay) return;

    drawer.classList.add("translate-x-full");
    overlay.classList.add("opacity-0");

    setTimeout(() => overlay.classList.add("hidden"), 300);
}

function openModal() {
    const modal = document.getElementById("modalOverlay");
    if (!modal) return;

    modal.classList.remove("hidden");

    requestAnimationFrame(() => modal.classList.remove("opacity-0"));
}

function closeModal() {
    const modal = document.getElementById("modalOverlay");
    if (!modal) return;

    modal.classList.add("opacity-0");

    setTimeout(() => modal.classList.add("hidden"), 300);
}

function openAccountModal() {
    const body = document.getElementById("modalBody");
    if (!body) return;

    body.innerHTML = `
        <div class="text-center mb-6">
            <h3 class="text-2xl font-black text-white">Mi cuenta</h3>
            <p class="text-gray-400 text-xs mt-1">Acceso de demostración de KICKVERSE</p>
        </div>
        <form onsubmit="event.preventDefault(); alert('Inicio de sesión de demostración.'); closeModal();" class="space-y-4">
            <div>
                <label class="block text-xs font-semibold text-gray-300 mb-1">Correo electrónico</label>
                <input type="email" required autocomplete="email" placeholder="tu@email.com"
                    class="w-full bg-brand-dark/80 border border-gray-700 rounded-xl p-3 text-sm text-white">
            </div>
            <div>
                <label class="block text-xs font-semibold text-gray-300 mb-1">Contraseña</label>
                <input type="password" required autocomplete="current-password" placeholder="Tu contraseña"
                    class="w-full bg-brand-dark/80 border border-gray-700 rounded-xl p-3 text-sm text-white">
            </div>
            <button type="submit" class="w-full bg-emerald-500 hover:bg-emerald-400 text-brand-dark font-bold py-3.5 rounded-xl text-sm">Ingresar</button>
        </form>
        <p class="text-gray-500 text-xs mt-4">Este formulario es visual y no crea ni valida cuentas reales.</p>
    `;

    openModal();
}

function openSearchModal() {
    const body = document.getElementById("modalBody");
    if (!body) return;

    body.innerHTML = `
        <h3 class="text-xl font-bold text-white mb-4">Buscar en el catálogo</h3>
        <input type="search" oninput="handleSearch(this.value)" placeholder="Escribe el modelo..."
            class="w-full bg-brand-dark/80 border border-gray-700 p-3 rounded-xl text-sm text-white mb-4">
        <div id="searchResults" class="space-y-2 max-h-60 overflow-y-auto"></div>
    `;

    openModal();
}

function handleSearch(query) {
    const container = document.getElementById("searchResults");
    if (!container) return;

    const normalized = query.trim().toLowerCase();

    if (!normalized) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Escribe el nombre de un modelo.</p>';
        return;
    }

    const matches = products.filter(product =>
        `${product.name} ${product.category} ${product.desc}`.toLowerCase().includes(normalized)
    );

    container.innerHTML = matches.length
        ? matches.map(product => `
            <button type="button" onclick="openProductDetail(${Number(product.id)})"
                class="w-full text-left flex items-center justify-between gap-3 p-3 bg-gray-800/40 rounded-xl border border-gray-800 hover:border-emerald-500">
                <span class="text-sm font-semibold text-gray-200">${escapeHTML(product.name)}</span>
                <span class="text-emerald-400 text-xs font-bold">${formatPrice(product.price)} MXN</span>
            </button>
        `).join("")
        : '<p class="text-gray-400 text-sm">No encontramos ese modelo.</p>';
}

function openWishlistModal() {
    const body = document.getElementById("modalBody");
    if (!body) return;

    body.innerHTML = `
        <h3 class="text-xl font-bold text-white mb-4">Lista de deseos (${wishlist.length})</h3>
        <div class="space-y-3 max-h-60 overflow-y-auto">
            ${wishlist.length === 0
                ? '<p class="text-gray-400 text-sm">Todavía no tienes tenis favoritos.</p>'
                : wishlist.map(product => `
                    <div class="flex items-center justify-between gap-3 p-3 bg-gray-800/40 rounded-xl border border-gray-800">
                        <span class="text-sm font-semibold text-white">${escapeHTML(product.name)}</span>
                        <span class="text-emerald-400 text-xs font-bold">${formatPrice(product.price)} MXN</span>
                    </div>
                `).join("")}
        </div>
    `;

    openModal();
}

function openProductDetail(id) {
    const product = products.find(item => Number(item.id) === Number(id));
    const body = document.getElementById("modalBody");

    if (!product || !body) return;

    body.innerHTML = `
        <img src="${safeImage(product.image)}" alt="${escapeHTML(product.name)}"
            onerror="this.onerror=null;this.src='https://placehold.co/600x400/11131d/ffffff?text=KICKVERSE'"
            class="w-full h-56 object-contain bg-gray-900 rounded-2xl mb-4 p-3">
        <h3 class="text-2xl font-bold text-white mb-1">${escapeHTML(product.name)}</h3>
        <p class="text-emerald-400 font-bold text-lg mb-3">${formatPrice(product.price)} MXN</p>
        <p class="text-gray-300 text-sm mb-6">${escapeHTML(product.desc || "")}</p>
        <button type="button" onclick="addToCart(${Number(product.id)}); closeModal();"
            class="w-full bg-emerald-500 text-brand-dark font-bold py-3.5 rounded-xl">Agregar al carrito</button>
    `;

    openModal();
}

/* -------------------- PERSONALIZADOR -------------------- */

function setCustomModel(name, price, btn) {
    customConfig.model = name;
    customConfig.price = Number(price);

    const modelName = document.getElementById("customModelName");
    if (modelName) modelName.textContent = `${name} Custom`;

    document.querySelectorAll(".model-btn").forEach(button => {
        button.className = "model-btn glass-panel hover:bg-gray-800 text-gray-300 py-2.5 px-3 rounded-xl text-xs font-bold transition";
    });

    if (btn) {
        btn.className = "model-btn active-model bg-emerald-500 text-brand-dark py-2.5 px-3 rounded-xl text-xs font-bold transition";
    }
}

function updateCustomColor(part, color) {
    if (part === "body") {
        customConfig.bodyColor = color;
        document.getElementById("svgBody")?.setAttribute("fill", color);
    } else if (part === "accent") {
        customConfig.accentColor = color;
        document.getElementById("svgAccent")?.setAttribute("fill", color);
    }
}

function updateCustomText(value) {
    customConfig.customText = value.slice(0, 8).toUpperCase();

    let textElement = document.getElementById("svgCustomText");
    const svg = document.getElementById("customSneakerSvg");

    if (!svg) return;

    if (!textElement) {
        textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textElement.setAttribute("id", "svgCustomText");
        textElement.setAttribute("x", "220");
        textElement.setAttribute("y", "190");
        textElement.setAttribute("fill", "#ffffff");
        textElement.setAttribute("font-size", "14");
        textElement.setAttribute("font-weight", "bold");
        textElement.setAttribute("font-family", "Inter, sans-serif");
        textElement.setAttribute("text-anchor", "middle");
        svg.appendChild(textElement);
    }

    textElement.textContent = customConfig.customText;
}

function toggleNeonGlow() {
    const svg = document.getElementById("customSneakerSvg");
    if (!svg) return;

    customConfig.neon = !customConfig.neon;

    svg.style.filter = customConfig.neon
        ? "drop-shadow(0 0 18px rgba(16,185,129,.9))"
        : "drop-shadow(0 0 0 transparent)";
}

function addCustomToCart() {
    cart.push({
        id: `custom-${Date.now()}`,
        name: `${customConfig.model} Custom${customConfig.customText ? ` (${customConfig.customText})` : ""}`,
        price: customConfig.price,
        cartPrice: customConfig.price,
        desc: `Personalizado: color ${customConfig.bodyColor}`,
        isCustom: true
    });

    updateCartUI();
    openCartDrawer();
}

/* -------------------- RULETA -------------------- */

function drawWheel() {
    const canvas = document.getElementById("wheelCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = size / 2;
    const sliceAngle = (2 * Math.PI) / prizes.length;

    ctx.clearRect(0, 0, size, size);

    prizes.forEach((prize, index) => {
        const start = index * sliceAngle;

        ctx.beginPath();
        ctx.fillStyle = prize.color;
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, start, start + sliceAngle);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(start + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.fillText(prize.label, radius - 12, 0);
        ctx.restore();
    });
}

function openSpinWheelModal() {
    const modal = document.getElementById("wheelModalOverlay");
    if (!modal) return;

    document.getElementById("wheelSetupSection")?.classList.remove("hidden");
    document.getElementById("wheelContainer")?.classList.add("hidden");
    document.getElementById("wheelResult")?.classList.add("hidden");

    const canvas = document.getElementById("wheelCanvas");

    if (canvas) {
        canvas.style.transition = "none";
        canvas.style.transform = "rotate(0deg)";
    }

    currentWheelRotation = 0;
    selectedPrize = null;

    modal.classList.remove("hidden");

    requestAnimationFrame(() => modal.classList.remove("opacity-0"));

    drawWheel();
}

function closeWheelModal() {
    const modal = document.getElementById("wheelModalOverlay");
    if (!modal) return;

    modal.classList.add("opacity-0");

    setTimeout(() => modal.classList.add("hidden"), 300);
}

function startSpinWheel() {
    const emailInput = document.getElementById("spinUserEmail");

    if (!emailInput || !emailInput.checkValidity()) {
        emailInput?.reportValidity();
        return;
    }

    const canvas = document.getElementById("wheelCanvas");
    if (!canvas) return;

    document.getElementById("wheelSetupSection")?.classList.add("hidden");
    document.getElementById("wheelContainer")?.classList.remove("hidden");
    document.getElementById("wheelResult")?.classList.add("hidden");

    const prizeIndex = Math.floor(Math.random() * prizes.length);
    selectedPrize = prizes[prizeIndex];

    const sliceDegree = 360 / prizes.length;
    const targetDegree = 3600 + (360 - (prizeIndex * sliceDegree) - (sliceDegree / 2));

    currentWheelRotation += targetDegree;

    canvas.style.transition = "transform 4s cubic-bezier(0.15, 0.8, 0.15, 1)";

    requestAnimationFrame(() => {
        canvas.style.transform = `rotate(${currentWheelRotation}deg)`;
    });

    setTimeout(() => {
        if (!selectedPrize) return;

        const prizeText = document.getElementById("wonPrizeText");
        const codeText = document.getElementById("promoCodeText");

        if (prizeText) prizeText.textContent = selectedPrize.label;
        if (codeText) codeText.textContent = selectedPrize.code;

        document.getElementById("wheelResult")?.classList.remove("hidden");
    }, 4100);
}

function applyWheelDiscount() {
    if (!selectedPrize) return;

    appliedDiscountPercent = selectedPrize.percent;
    appliedDiscountCode = selectedPrize.code;

    updateCartUI();

    if (appliedDiscountPercent > 0) {
        alert(`Cupón ${appliedDiscountCode} aplicado. El descuento se verá en el total del carrito.`);
    } else {
        alert("Ganaste envío gratis. El descuento de envío se debe configurar cuando la tienda tenga un sistema de entregas.");
    }

    closeWheelModal();
}

/* -------------------- UTILIDADES -------------------- */

function formatPrice(value) {
    return `$${Number(value || 0).toLocaleString("es-MX")}`;
}

function safeImage(url) {
    const value = String(url || "");

    return /^https:\/\/images\.unsplash\.com\//.test(value)
        ? value
        : "https://placehold.co/600x400/11131d/ffffff?text=KICKVERSE";
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function showToast(message) {
    let toast = document.getElementById("kickverseToast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "kickverseToast";
        toast.className = "fixed top-24 right-4 z-[100] bg-emerald-500 text-gray-950 font-bold text-sm px-5 py-3 rounded-xl shadow-xl opacity-0 transition-opacity";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.remove("opacity-0");

    clearTimeout(showToast.timeout);

    showToast.timeout = setTimeout(() => {
        toast.classList.add("opacity-0");
    }, 2200);
}

/* Permite cerrar el cajón al pulsar el fondo oscuro. */
document.addEventListener("click", event => {
    if (event.target?.id === "cartOverlay") {
        closeCartDrawer();
    }
});