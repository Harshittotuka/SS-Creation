const WHATSAPP_NUMBER = "919829027413";
const CART_KEY = "roohaniyat-cart";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
const carouselAnimations = new WeakMap();

document.addEventListener("DOMContentLoaded", () => {
  bindPageTransitions();
  bindScrollReveal();
  bindAnnouncement();
  bindMenus();
  bindSlideshows();
  bindProductCarousels();
  bindLookCarousel();
  bindLazyImages();
  bindLookVideos();
  bindCardImageSwaps();
  bindCart();
  updateCart();
});

window.addEventListener("pageshow", () => {
  document.body.classList.remove("page-leaving");
  requestAnimationFrame(() => document.body.classList.add("page-ready"));
});

function bindPageTransitions() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pageSections = Array.from(document.querySelectorAll(".site-wrap > *, body > .global-section, .section-footer"));
  pageSections.forEach((section, index) => {
    section.dataset.pageSection = "";
    section.style.setProperty("--page-delay", `${Math.min(index, 5) * 55}ms`);
  });
  document.body.classList.add("page-transition-ready");
  requestAnimationFrame(() => document.body.classList.add("page-ready"));
  if (reduceMotion) return;

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (link.target || link.hasAttribute("download")) return;
    if (link.closest("[data-cart-open], [data-menu-open], [data-menu-close], [data-video-toggle]")) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;

    event.preventDefault();
    document.body.classList.add("page-leaving");
    window.setTimeout(() => {
      window.location.href = url.href;
    }, 180);
  });
}

function bindScrollReveal() {
  const revealSelectors = [
    ".global-section",
    ".shop-look-section",
    ".slideshow",
    ".marquee-band",
    ".page-hero",
    ".product-page",
    ".collection-grid",
    ".info-grid",
    ".blog-grid",
    ".section-footer",
  ];
  const staggerSelectors = [
    ".category-icons > a",
    ".image-grid > a",
    ".product-card",
    ".look-card",
    ".press-row > img",
    ".service-row > div",
    ".info-grid > article",
    ".blog-grid > article",
    ".thumb-list > button",
  ];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = Array.from(document.querySelectorAll(revealSelectors.join(",")));
  const staggerItems = Array.from(document.querySelectorAll(staggerSelectors.join(",")));
  const allItems = [...new Set([...revealItems, ...staggerItems])];

  if (!allItems.length) return;

  allItems.forEach((item, index) => {
    item.dataset.reveal = "";
    if (staggerItems.includes(item)) {
      item.style.setProperty("--reveal-delay", `${Math.min(index % 8, 6) * 55}ms`);
    }
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    allItems.forEach((item) => item.classList.add("is-revealed"));
    document.body.classList.add("reveal-ready");
    return;
  }

  const revealNow = (item) => {
    item.classList.add("is-revealed");
  };
  const shouldRevealImmediately = (item) => {
    const rect = item.getBoundingClientRect();
    return rect.top < window.innerHeight * 1.15;
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      revealNow(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px 12%", threshold: 0.04 });

  allItems.forEach((item) => {
    if (shouldRevealImmediately(item)) {
      revealNow(item);
    } else {
      observer.observe(item);
    }
  });
  document.body.classList.add("reveal-ready");
}

function bindAnnouncement() {
  const messages = [
    "Get a flat 15% off on all ethnic wear + a FREE vibrant dupatta",
    "EXTRA 5% OFF ON PREPAID ORDERS",
    "COD AVAILABLE | SHIPS IN 3 DAYS",
  ];
  const text = document.querySelector("[data-announcement-text]");
  const prev = document.querySelector("[data-announcement-prev]");
  const next = document.querySelector("[data-announcement-next]");
  if (!text) return;

  let index = 0;
  const set = (direction = 1) => {
    index = (index + direction + messages.length) % messages.length;
    text.textContent = messages[index];
    text.classList.remove("is-animating");
    void text.offsetWidth;
    text.classList.add("is-animating");
  };
  text.textContent = messages[index];
  prev?.addEventListener("click", () => set(-1));
  next?.addEventListener("click", () => set(1));
  setInterval(() => set(1), 5000);
}

function bindMenus() {
  const menu = document.querySelector("[data-mobile-menu]");
  document.querySelectorAll("[data-menu-open]").forEach((button) => {
    button.addEventListener("click", () => menu?.classList.add("open"));
  });
  document.querySelectorAll("[data-menu-close]").forEach((button) => {
    button.addEventListener("click", () => menu?.classList.remove("open"));
  });
}

function bindSlideshows() {
  document.querySelectorAll("[data-slideshow]").forEach((slideshow) => {
    const slides = Array.from(slideshow.querySelectorAll("[data-slide]"));
    const dots = Array.from(slideshow.querySelectorAll("[data-slide-dot]"));
    if (slides.length < 2) return;
    let index = 0;
    let locked = false;
    const loadSlideImage = (slide) => {
      const image = slide?.querySelector("img");
      if (!image) return Promise.resolve();
      if (image.dataset.lazySrc && image.src !== image.dataset.lazySrc) {
        image.src = image.dataset.lazySrc;
      }
      if (image.complete && image.naturalWidth > 0) return image.decode?.().catch(() => {}) || Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      }).then(() => image.decode?.().catch(() => {}) || undefined);
    };
    const show = (nextIndex) => {
      if (locked) return;
      locked = true;
      const normalized = (nextIndex + slides.length) % slides.length;
      loadSlideImage(slides[normalized]).then(() => {
        if (normalized === index) {
          locked = false;
          return;
        }
        slides[index].classList.remove("active");
        dots[index]?.classList.remove("active");
        index = normalized;
        slides[index].classList.add("active");
        dots[index]?.classList.add("active");
        locked = false;
      });
    };

    slides.forEach(loadSlideImage);
    dots.forEach((dot, dotIndex) => dot.addEventListener("click", () => show(dotIndex)));
    setInterval(() => show(index + 1), 5200);
  });
}

function bindProductCarousels() {
  document.querySelectorAll("[data-product-carousel]").forEach((carousel) => {
    const track = carousel.querySelector("[data-carousel-track]");
    const prev = carousel.querySelector("[data-carousel-prev]");
    const next = carousel.querySelector("[data-carousel-next]");
    if (!track || !prev || !next) return;

    const loadVisibleCards = (extra = track.clientWidth * 1.4) => {
      const left = track.scrollLeft - extra;
      const right = track.scrollLeft + track.clientWidth + extra;
      track.querySelectorAll(".product-card").forEach((card) => {
        const cardLeft = card.offsetLeft;
        const cardRight = cardLeft + card.offsetWidth;
        if (cardRight < left || cardLeft > right) return;
        card.querySelectorAll("[data-lazy-src]").forEach(loadLazyImage);
      });
    };
    const update = () => {
      prev.disabled = false;
      next.disabled = false;
      loadVisibleCards();
    };
    const move = (direction) => {
      prepareLoopMove(track, direction);
      loadVisibleCards(track.clientWidth * 2.4);
      slideCarouselBy(track, direction * getCarouselTileStep(track, ".product-card", 240));
    };

    prev.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    track.addEventListener("scroll", () => requestAnimationFrame(() => {
      normalizeLoopPosition(track);
      loadVisibleCards();
      update();
    }), { passive: true });
    bindCarouselDrag(track, () => {
      loadVisibleCards(track.clientWidth * 2.4);
      update();
    });
    window.addEventListener("resize", update);
    let autoplay = setInterval(() => move(1), 3800);
    carousel.addEventListener("mouseenter", () => {
      clearInterval(autoplay);
      autoplay = null;
    });
    carousel.addEventListener("mouseleave", () => {
      if (!autoplay) autoplay = setInterval(() => move(1), 3800);
    });
    requestAnimationFrame(() => {
      initializeLoopPosition(track);
      loadVisibleCards(track.clientWidth * 2.6);
      update();
    });
  });
}

function bindLookCarousel() {
  document.querySelectorAll("[data-look-carousel]").forEach((carousel) => {
    const track = carousel.querySelector("[data-look-track]");
    const prev = carousel.querySelector("[data-look-prev]");
    const next = carousel.querySelector("[data-look-next]");
    if (!track || !prev || !next) return;

    const loadNearVideos = () => {
      const preloadAhead = Math.min(520, track.clientWidth * 0.45);
      const left = track.scrollLeft - 180;
      const right = track.scrollLeft + track.clientWidth + preloadAhead;
      track.querySelectorAll("[data-look-video]").forEach((video) => {
        const card = video.closest(".look-card");
        if (!card) return;
        const cardLeft = card.offsetLeft;
        const cardRight = cardLeft + card.offsetWidth;
        if (cardRight >= left && cardLeft <= right) loadLookVideo(video);
      });
    };
    const move = (direction) => {
      prepareLoopMove(track, direction);
      loadNearVideos();
      slideCarouselBy(track, direction * getCarouselTileStep(track, ".look-card", 180));
    };

    prev.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    track.addEventListener("scroll", () => requestAnimationFrame(() => {
      normalizeLoopPosition(track);
      loadNearVideos();
    }), { passive: true });
    bindCarouselDrag(track, loadNearVideos);
    let autoplay = setInterval(() => move(1), 4200);
    carousel.addEventListener("mouseenter", () => {
      clearInterval(autoplay);
      autoplay = null;
    });
    carousel.addEventListener("mouseleave", () => {
      if (!autoplay) autoplay = setInterval(() => move(1), 4200);
    });
    requestAnimationFrame(() => {
      initializeLoopPosition(track);
      loadNearVideos();
    });
  });
}

function getLoopCopies(track) {
  return Math.max(2, Number(track.dataset.loopCopies || 2));
}

function getLoopWidth(track) {
  const items = Array.from(track.children);
  const copies = getLoopCopies(track);
  const setSize = Math.floor(items.length / copies);
  if (items[0] && items[setSize]) {
    return Math.max(0, items[setSize].offsetLeft - items[0].offsetLeft);
  }
  return Math.max(0, track.scrollWidth / copies);
}

function initializeLoopPosition(track) {
  const loopWidth = getLoopWidth(track);
  if (!loopWidth || track.dataset.loopReady === "true") return;
  track.scrollLeft = loopWidth;
  track.dataset.loopReady = "true";
}

function prepareLoopMove(track, direction) {
  const loopWidth = getLoopWidth(track);
  if (!loopWidth) return;
  initializeLoopPosition(track);
  if (direction < 0 && track.scrollLeft <= loopWidth * 0.35) {
    track.scrollLeft += loopWidth;
  } else if (direction > 0 && track.scrollLeft >= loopWidth * 1.65) {
    track.scrollLeft -= loopWidth;
  }
}

function normalizeLoopPosition(track) {
  const loopWidth = getLoopWidth(track);
  if (!loopWidth) return;
  if (track.scrollLeft >= loopWidth * 1.75) {
    track.scrollLeft -= loopWidth;
  } else if (track.scrollLeft <= loopWidth * 0.25) {
    track.scrollLeft += loopWidth;
  }
}

function slideCarouselBy(track, distance) {
  const previous = carouselAnimations.get(track);
  if (previous) cancelAnimationFrame(previous);

  const start = track.scrollLeft;
  const duration = 340;
  const startedAt = performance.now();
  const ease = (value) => 1 - Math.pow(1 - value, 3);
  track.classList.add("is-auto-sliding");

  const animate = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    track.scrollLeft = start + distance * ease(progress);
    normalizeLoopPosition(track);
    if (progress < 1) {
      carouselAnimations.set(track, requestAnimationFrame(animate));
    } else {
      carouselAnimations.delete(track);
      track.classList.remove("is-auto-sliding");
    }
  };

  carouselAnimations.set(track, requestAnimationFrame(animate));
}

function getCarouselTileStep(track, itemSelector, fallback) {
  const items = Array.from(track.querySelectorAll(itemSelector));
  const first = items[0];
  const second = items[1];
  const tileWidth = second && first
    ? second.offsetLeft - first.offsetLeft
    : first?.getBoundingClientRect().width || fallback;
  const visibleTiles = Math.max(1, Math.floor((track.clientWidth + 1) / Math.max(tileWidth, 1)));
  const preferredStep = window.matchMedia("(max-width: 767px)").matches ? 2 : 3;
  return tileWidth * Math.min(preferredStep, visibleTiles);
}

function bindCarouselDrag(track, onMove) {
  let isDragging = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;
  let suppressClick = false;

  track.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("button, input, select, textarea")) return;
    const animation = carouselAnimations.get(track);
    if (animation) cancelAnimationFrame(animation);
    carouselAnimations.delete(track);
    track.classList.remove("is-auto-sliding");
    prepareLoopMove(track, -1);
    isDragging = true;
    moved = false;
    startX = event.clientX;
    startScroll = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture?.(event.pointerId);
  });

  track.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 5) {
      moved = true;
      suppressClick = true;
    }
    track.scrollLeft = startScroll - delta;
    normalizeLoopPosition(track);
    onMove?.();
    event.preventDefault();
  });

  const finishDrag = (event) => {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove("is-dragging");
    track.releasePointerCapture?.(event.pointerId);
    normalizeLoopPosition(track);
    onMove?.();
    if (moved) {
      window.setTimeout(() => {
        suppressClick = false;
      }, 0);
    }
  };

  track.addEventListener("pointerup", finishDrag);
  track.addEventListener("pointercancel", finishDrag);
  track.addEventListener("lostpointercapture", finishDrag);
  track.addEventListener("click", (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);
}

function loadLookVideo(video) {
  const source = video.querySelector("source[data-video-src]");
  if (source && !source.src) {
    source.src = source.dataset.videoSrc;
    video.load();
  }
}

function bindLookVideos() {
  const videos = Array.from(document.querySelectorAll("[data-look-video]"));
  const play = (video) => {
    loadLookVideo(video);
    video.play?.().catch(() => {});
  };
  const pause = (video) => video.pause?.();

  videos.forEach((video) => {
    const shell = video.closest(".look-video-shell");
    video.addEventListener("loadeddata", () => shell?.classList.add("loaded"), { once: true });
    video.addEventListener("error", () => shell?.classList.add("loaded"), { once: true });
  });

  if (!("IntersectionObserver" in window)) {
    videos.slice(0, 4).forEach(play);
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) play(video);
        else pause(video);
      });
    }, { rootMargin: "700px 0px", threshold: 0.18 });
    videos.forEach((video) => observer.observe(video));
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-video-toggle]");
    if (!button) return;
    const video = button.closest(".look-card")?.querySelector("[data-look-video]");
    if (!video) return;
    video.muted = !video.muted;
    button.classList.toggle("active", !video.muted);
    button.textContent = video.muted ? "Sound" : "Mute";
    play(video);
  });
}

function loadLazyImage(image) {
  if (!image) return;
  if (image.dataset.lazySrc && image.src !== image.dataset.lazySrc) {
    image.src = image.dataset.lazySrc;
  }
  const shell = image.closest(".image-shell");
  const markLoaded = () => shell?.classList.add("loaded");
  if (image.complete && image.naturalWidth > 0) markLoaded();
  else {
    image.addEventListener("load", markLoaded, { once: true });
    image.addEventListener("error", markLoaded, { once: true });
  }
}

function bindLazyImages() {
  const images = Array.from(document.querySelectorAll("[data-lazy-src], .image-shell img"));
  const load = loadLazyImage;

  images.slice(0, 16).forEach(load);
  document.querySelectorAll(".story-strip [data-lazy-src]").forEach(load);

  if (!("IntersectionObserver" in window)) {
    images.forEach(load);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      load(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "1000px 0px 1200px" });

  images.forEach((image) => observer.observe(image));
}

function bindCardImageSwaps() {
  document.querySelectorAll("[data-card-image]").forEach((image) => {
    const primary = image.dataset.primary || image.dataset.lazySrc;
    const hover = image.dataset.hover;
    if (!primary || !hover || primary === hover) return;

    let hoverReady = false;
    let preload;
    const preloadHover = () => {
      if (hoverReady) return Promise.resolve();
      if (!preload) {
        preload = new Image();
        preload.decoding = "async";
        preload.src = hover;
      }
      if (preload.complete && preload.naturalWidth > 0) {
        hoverReady = true;
        return preload.decode?.().catch(() => {}) || Promise.resolve();
      }
      return new Promise((resolve) => {
        preload.addEventListener("load", resolve, { once: true });
        preload.addEventListener("error", resolve, { once: true });
      }).then(() => {
        hoverReady = true;
        return preload.decode?.().catch(() => {}) || undefined;
      });
    };
    const showHover = () => {
      preloadHover().then(() => {
        image.src = hover;
      });
    };
    const showPrimary = () => {
      image.src = primary;
    };

    image.closest(".product-card")?.addEventListener("mouseenter", showHover);
    image.closest(".product-card")?.addEventListener("mouseleave", showPrimary);
    image.closest(".product-card")?.addEventListener("focusin", showHover);
    image.closest(".product-card")?.addEventListener("focusout", showPrimary);
  });
}

function bindCart() {
  const drawer = document.querySelector("[data-cart-drawer]");
  document.querySelectorAll("[data-cart-open]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      drawer?.classList.add("open");
    });
  });
  document.querySelectorAll("[data-cart-close]").forEach((button) => {
    button.addEventListener("click", () => drawer?.classList.remove("open"));
  });
  drawer?.addEventListener("click", (event) => {
    if (event.target === drawer) drawer.classList.remove("open");
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-product-form]");
    if (!form) return;
    event.preventDefault();
    addFromForm(form);
    if (event.submitter?.hasAttribute("data-buy-now")) {
      openWhatsApp();
    } else {
      drawer?.classList.add("open");
    }
  });

  document.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove]");
    if (remove) {
      cart = cart.filter((item) => item.key !== remove.dataset.remove);
      saveCart();
      updateCart();
    }

    const thumb = event.target.closest("[data-thumb]");
    if (thumb) {
      const main = document.querySelector("[data-main-product-image]");
      if (main) main.src = thumb.dataset.thumb;
    }

    if (event.target.closest("[data-whatsapp-order]")) {
      openWhatsApp();
    }
  });
}

function addFromForm(form) {
  const variantSelect = form.querySelector("[name='variant']");
  const selected = variantSelect?.selectedOptions?.[0];
  if (!selected) return;

  const qty = Math.max(1, Number(form.querySelector("[name='quantity']")?.value || 1));
  const product = {
    handle: form.dataset.handle,
    title: form.dataset.title,
    image: form.dataset.image,
  };
  const item = {
    key: `${product.handle}:${selected.value}`,
    handle: product.handle,
    title: product.title,
    image: product.image,
    variantId: selected.value,
    variantTitle: selected.dataset.title || selected.textContent.trim(),
    sku: selected.dataset.sku || "",
    price: Number(selected.dataset.price || 0),
    quantity: qty,
  };

  const existing = cart.find((entry) => entry.key === item.key);
  if (existing) existing.quantity += qty;
  else cart.push(item);
  saveCart();
  updateCart();
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = count;
  });
  document.querySelectorAll("[data-cart-total]").forEach((node) => {
    node.textContent = money.format(total);
  });

  const list = document.querySelector("[data-cart-items]");
  if (!list) return;
  if (!cart.length) {
    list.innerHTML = '<p class="empty-cart">Your Bag is empty.</p>';
    return;
  }
  list.innerHTML = cart.map((item) => `
    <article class="cart-item">
      <img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}">
      <div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.variantTitle)}</p>
        ${item.sku ? `<p>SKU: ${escapeHtml(item.sku)}</p>` : ""}
        <p>${item.quantity} x ${money.format(item.price)}</p>
      </div>
      <button type="button" data-remove="${escapeAttr(item.key)}">Remove</button>
    </article>
  `).join("");
}

function openWhatsApp() {
  if (!cart.length) {
    document.querySelector("[data-cart-drawer]")?.classList.add("open");
    return;
  }
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const lines = [
    "Hello Roohaniyat Jaipur, I want to place this order:",
    "",
    ...cart.map((item, index) => [
      `${index + 1}. ${item.title}`,
      `Variant: ${item.variantTitle}`,
      item.sku ? `SKU: ${item.sku}` : "",
      `Qty: ${item.quantity}`,
      `Price: ${money.format(item.price)}`,
      `Product: ${location.origin}/products/${item.handle}/`,
    ].filter(Boolean).join("\n")),
    "",
    `Total: ${money.format(total)}`,
    "",
    "Please confirm availability and payment details.",
  ];
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
