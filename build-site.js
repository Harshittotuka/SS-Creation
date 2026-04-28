const fs = require("fs");
const path = require("path");

const root = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(root, "data/products.json"), "utf8"));
const shopTheLookData = JSON.parse(fs.readFileSync(path.join(root, "data/shop-the-look.json"), "utf8"));
const products = data.products.map(normalizeProduct);
const shopTheLookVideos = shopTheLookData.videos || [];

const nav = [
  ["Home", "/"],
  ["New Arrival", "/collections/new-arrival/"],
  ["Ready To Dispatch", "/collections/ready-to-dispatch/"],
  ["Sale", "/collections/sale/"],
  ["Coord Sets / Dresses", "/collections/coord-sets/"],
  ["Kurta and Suit Sets", "/collections/kurta-and-suit-sets/"],
  ["Best Sellers", "/collections/best-sellers/"],
  ["Gift Cards", "/collections/gift-cards/"],
  ["Contact", "/pages/contact/"],
  ["About Us", "/pages/about-us/"],
  ["Blogs", "/blogs/news/"],
];

const collections = [
  ["new-arrival", "New Arrival"],
  ["ready-to-dispatch", "Ready To Dispatch"],
  ["sale", "Sale"],
  ["coord-sets", "Coord Sets / Dresses"],
  ["kurta-and-suit-sets", "Kurta and Suit Sets"],
  ["best-sellers", "Best Sellers"],
  ["gift-cards", "Gift Cards"],
  ["festive-vibes", "Festive Vibes"],
  ["floral-affairs", "Floral Affairs"],
  ["casual-picks", "Casual Picks"],
  ["wedding-slides", "Wedding Slides"],
];

const collectionMap = new Map(collections.map(([slug, title]) => [slug, { title, products: products.filter((product) => product.sections.includes(slug)) }]));

write("index.html", homePage());
for (const [slug, { title, products: items }] of collectionMap) {
  write(`collections/${slug}/index.html`, collectionPage(title, items));
}
for (const product of products) {
  write(`products/${product.handle}/index.html`, productPage(product));
}
write("pages/contact/index.html", contentPage("Contact", contactCopy()));
write("pages/about-us/index.html", contentPage("About Us", aboutCopy()));
write("blogs/news/index.html", blogPage());

function normalizeProduct(product) {
  const variants = product.variants || [];
  const firstAvailable = variants.find((variant) => variant.available) || variants[0] || {};
  const price = Number(firstAvailable.price || 0);
  const compareAt = Number(firstAvailable.compareAtPrice || 0);
  const title = product.title || "";
  const tags = (product.tags || []).map((tag) => String(tag).toLowerCase());
  const created = Date.parse(product.publishedAt || product.updatedAt || 0);
  const isNew = created >= Date.now() - 365 * 24 * 60 * 60 * 1000;
  const categories = new Set();
  if (/coord|co-ord|cord|dress|night/i.test(title) || tags.includes("coset")) categories.add("coord");
  if (/kurta|suit|anarkali|palazzo|dupatta/i.test(title)) categories.add("kurta");
  return {
    ...product,
    tags,
    sections: normalizeSections(product.sections),
    variants,
    price,
    compareAt,
    available: variants.some((variant) => variant.available),
    onSale: variants.some((variant) => Number(variant.compareAtPrice || 0) > Number(variant.price || 0)) || tags.includes("sale"),
    isNew,
    categories,
    image: product.images?.[0]?.src || "",
    hoverImage: product.images?.[1]?.src || product.images?.[0]?.src || "",
    descriptionText: stripHtml(product.descriptionHtml || ""),
  };
}

function normalizeSections(sections) {
  if (!Array.isArray(sections)) return [];
  return [...new Set(sections.map((section) => slugifySection(section)).filter(Boolean))];
}

function slugifySection(section) {
  return String(section || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function layout(title, body, extraClass = "") {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} - Roohaniyat Jaipur</title>
  <meta name="theme-color" content="#800000">
  <link rel="preconnect" href="https://cdn.shopify.com" crossorigin>
  <link rel="preconnect" href="https://fonts.shopifycdn.com" crossorigin>
  <link rel="preload" as="font" href="https://roohaniyatjaipur.com/cdn/fonts/roboto/roboto_n4.2019d890f07b1852f56ce63ba45b2db45d852cba.woff2" type="font/woff2" crossorigin>
  <link rel="preload" as="font" href="https://roohaniyatjaipur.com/cdn/fonts/proza_libre/prozalibre_n4.f0507b32b728d57643b7359f19cd41165a2ba3ad.woff2" type="font/woff2" crossorigin>
  <link rel="shortcut icon" href="/assets/images/8jbmgvaw_f85dc791-fd2d-4fe4-9812-1b28a6675ada-0a0cdcae69.png" type="image/png">
  <link rel="stylesheet" href="/styles.css">
  <script defer src="/app.js"></script>
</head>
<body id="roohaniyat-jaipur" class="${extraClass}">
  ${mobileDrawer()}
  ${header()}
  <main class="site-wrap">${body}</main>
  ${footer()}
  ${cartDrawer()}
</body>
</html>`;
}

function header() {
  return `<div class="announcement-bar">
  <button type="button" data-announcement-prev aria-label="Previous announcement">&lsaquo;</button>
  <span class="announcement-text" data-announcement-text></span>
  <button type="button" data-announcement-next aria-label="Next announcement">&rsaquo;</button>
</div>
<h1 class="visually-hidden">Roohaniyat Jaipur</h1>
<header class="site-header">
  <section class="header-main">
    <div>
      <button class="icon-button" type="button" data-menu-open aria-label="Open navigation">${hamburger()}</button>
    </div>
    <a class="logo" href="/"><img src="/assets/images/logo-525333_header_logo_4c91e59a-623c-431c-af2f-fd13503b2276-dc3889fb15.png" alt="Roohaniyat Jaipur"></a>
    <div class="header-actions">
      <a class="icon-button" href="/collections/new-arrival/" aria-label="Search">Search</a>
      <a class="icon-button" href="/cart" data-cart-open aria-label="Open cart">${bag()}<span class="cart-count" data-cart-count>0</span></a>
    </div>
  </section>
  <nav class="desktop-nav">${nav.map(([label, href]) => `<a href="${href}">${escapeHtml(label)}</a>`).join("")}</nav>
</header>`;
}

function mobileDrawer() {
  return `<aside class="mobile-drawer" data-mobile-menu>
  <button class="drawer-close" type="button" data-menu-close>CLOSE &times;</button>
  <form class="mobile-search" action="/collections/new-arrival/"><input type="text" placeholder="Search"></form>
  <nav class="mobile-nav">${nav.map(([label, href]) => `<a href="${href}">${escapeHtml(label)}</a>`).join("")}</nav>
  <p><em>(C) 2022 - 2023 All Rights Reserved | ROOHANIYAT JAIPUR</em></p>
</aside>`;
}

function footer() {
  return `<section class="global-section section-tight">
  <div class="service-row">
    <div><strong>FREE SHIPPING</strong><span>Free Shipping on All Orders</span></div>
    <div><strong>COD AVAILABLE</strong><span>Cash On Delivery on All Orders</span></div>
    <div><strong>SAFE ONLINE PAYMENTS</strong><span>128bit SSL Secured</span></div>
    <div><strong>ON TIME DELIVERY</strong><span>With Our Trusted Courier Partners</span></div>
  </div>
</section>
<footer class="section-footer">
  <div class="footer-columns">
    <div>
      <h3>Let's Keep In Touch</h3>
      <p>Signup for exclusive offers and promotions.</p>
      <p>roohaniyatjaipur@gmail.com | +918560904132</p>
    </div>
    <div>
      <h3>Manufactured by</h3>
      <p>Vastraa Exports<br>80/435, Shankaracharya Marg, Mansarovar, Jaipur, 302020</p>
      <p><a href="/pages/about-us/">About Us</a> | <a href="/pages/contact/">Contact</a></p>
    </div>
  </div>
  <p>&copy; 2026 All Rights Reserved | Roohaniyat Jaipur</p>
</footer>`;
}

function cartDrawer() {
  return `<aside class="cart-drawer" data-cart-drawer>
  <div class="cart-panel">
    <div class="cart-head"><h2>Your Bag</h2><button class="drawer-close" type="button" data-cart-close>CLOSE &times;</button></div>
    <div class="cart-items" data-cart-items></div>
    <div class="cart-summary">
      <div class="cart-total-row"><span>Total</span><strong data-cart-total>&#8377;0</strong></div>
      <button class="whatsapp-order" type="button" data-whatsapp-order>Order on WhatsApp</button>
    </div>
  </div>
</aside>`;
}

function homePage() {
  const newArrival = collectionMap.get("new-arrival").products.slice(0, 16);
  const favourites = collectionMap.get("best-sellers").products.slice(18, 34);
  return layout("Home", `
    <section class="global-section section-tight">
      <div class="category-icons">
        ${categoryIcon("/collections/sale/", "/assets/images/roohaniyat_1-623e4a3434.png", "Best Deal")}
        ${categoryIcon("/collections/ready-to-dispatch/", "/assets/images/roohaniyat_2-c72724c9de.png", "Trending")}
        ${categoryIcon("/collections/new-arrival/", "/assets/images/roohaniyat_3-f23500cc0d.png", "New Arrival")}
        ${categoryIcon("/collections/best-sellers/", "/assets/images/roohaniyat_4-168352a671.png", "Best Seller")}
      </div>
    </section>
    ${slideshow([
      ["/assets/images/HAND_MADE_PRODUCTS_6be530a6-d761-4f3a-8a61-ad102487a489-18f8744b46.png", "/collections/new-arrival/"],
      ["/assets/images/HAND_MADE_PRODUCTS_c64d1c08-d190-43f1-af58-6a6fc6ad63e5-4cc17b9e13.png", "/collections/new-arrival/"],
      ["/assets/images/ROOHANIYAT-4f7598cdf8.png", "/collections/sale/"],
    ])}
    ${sectionHeading("STYLIST RECOMMENDATION", "Style as per Specialist")}
    <section class="global-section section-tight"><div class="image-grid">
      ${imageLink("/collections/festive-vibes/", "/assets/images/IMG-20240305-WA0034-ca98e474bb.jpg")}
      ${imageLink("/collections/floral-affairs/", "/assets/images/IMG-20240305-WA0032-8b4067c895.jpg")}
      ${imageLink("/collections/casual-picks/", "/assets/images/IMG-20240305-WA0033-53e12e551a.jpg")}
      ${imageLink("/collections/wedding-slides/", "/assets/images/IMG-20240305-WA0030-f4f398372d.jpg")}
    </div></section>
    ${sectionHeading("NEW ARRIVAL", "Twirl and Slay in Latest")}
    ${productCarousel(newArrival, "New Arrival")}
    ${shopTheLookSection()}
    ${sectionHeading("All Time Fav", "Crafted For Soul")}
    ${productCarousel(favourites, "All Time Fav")}
    <div class="marquee-band"><div>${Array(12).fill("<span>EXTRA 5% OFF ON PREPAID ORDERS (RAZORPAY)</span>").join("")}</div></div>
    <section class="global-section"><div class="brand-intro">
      <h2>India's Leading Ethnic Wear Brand for Modern Women</h2>
      <p>At Roohaniyat, every outfit is a celebration of fashion traditions and cultural heritage. Our journey of trying to becoming the most trusted ethnic fashion brand is a testimony of our commitment to quality and fine craftsmanship.</p>
    </div></section>
    ${slideshow([["/assets/images/WhatsApp_Image_2023-11-30_at_20.16.15-634f9803d3.jpg", "/collections/new-arrival/"]])}
    ${sectionHeading("Shop By Category", "Be Your Own Style Icon")}
    <section class="global-section section-tight"><div class="image-grid">
      ${imageLink("/collections/festive-vibes/", "/assets/images/IMG-20231130-WA0024-b1b2293030.jpg")}
      ${imageLink("/collections/floral-affairs/", "/assets/images/IMG-20231130-WA0022-9f37bf5975.jpg")}
      ${imageLink("/collections/casual-picks/", "/assets/images/IMG-20231130-WA0023-2931ef65c9.jpg")}
      ${imageLink("/collections/wedding-slides/", "/assets/images/IMG-20231130-WA0025-4e1119ad3d.jpg")}
    </div></section>
    ${sectionHeading("Give The Gift Of Cheerfulness", "You can have anything you want in life if you dress for it. Spread love with Roohaniyat")}
    <section class="global-section gift-banner section-tight"><a class="image-shell" href="/collections/gift-cards/">${lazyImg("/assets/images/rooh_gift_card_banner-965e089bba.jpg", "Shop gift cards")}</a></section>
    ${pressSection()}
    ${sectionHeading("Rooh Of Roohaniyat", "True Souls Of Roohaniyat")}
    ${storyStrip(["/assets/images/test1-1d3d4492e9.jpg", "/assets/images/test8-be3915e075.png", "/assets/images/test3-b64e2d8061.jpg", "/assets/images/test4-ab399493dc.jpg", "/assets/images/test2-9306124b22.png", "/assets/images/test6-4116a467a6.jpg", "/assets/images/test5-c1e3eda746.jpg", "/assets/images/test8-be3915e075.png"])}
    ${sectionHeading("Roots Of Roohaniyat", "Behind The Scenes")}
    <section class="global-section"><div class="long-copy">${brandLongCopy()}</div></section>
  `, "template-index");
}

function collectionPage(title, items) {
  return layout(title, `
    <section class="page-title"><h1>${escapeHtml(title)}</h1></section>
    <section class="collection-grid">${items.map(productCard).join("") || "<p>No products found.</p>"}</section>
  `, "template-collection");
}

function productPage(product) {
  const variants = product.variants.filter((variant) => variant.available);
  const usableVariants = variants.length ? variants : product.variants;
  const thumbs = product.images.slice(0, 8);
  return layout(product.title, `
    <section class="product-page">
      <div class="product-gallery">
        <div class="thumb-list">${thumbs.map((image) => `<button type="button" data-thumb="${escapeAttr(image.src)}"><img src="${escapeAttr(image.src)}" alt="${escapeAttr(product.title)}" loading="lazy" decoding="async"></button>`).join("")}</div>
        <div class="image-shell"><img class="main-product-image" data-main-product-image src="${escapeAttr(product.image)}" alt="${escapeAttr(product.title)}" loading="eager" decoding="async"></div>
      </div>
      <div class="product-summary">
        <h1>${escapeHtml(product.title)}</h1>
        <div><span class="price">${currency(product.price)}</span>${product.compareAt ? `<span class="compare">${currency(product.compareAt)}</span>` : ""}</div>
        <p class="trust-copy">COD AVAILABLE | SHIPS IN 3 DAYS</p>
        <p class="trust-copy">EASY 7 DAYS RETURN / EXCHANGE</p>
        <p class="trust-copy">EXTRA 5% OFF ON PREPAID ORDERS</p>
        ${productForm(product, usableVariants, true)}
        <h3>Get a flat 15% off on all ethnic wear + a FREE vibrant dupatta</h3>
        <p>${escapeHtml(product.descriptionText || "Invigorate your wardrobe collection this season by adding the captivating collection by Roohaniyat.")}</p>
        <h3>Shipping</h3>
        <p>Free shipping is available on all products across India. Depending upon the location, the product is delivered within 5-7 working days after dispatch.</p>
      </div>
    </section>
  `, "template-product");
}

function contentPage(title, html) {
  return layout(title, html, "template-page");
}

function blogPage() {
  return contentPage("Blogs", blogCopy());
}

function productCard(product) {
  const variants = product.variants.filter((variant) => variant.available);
  const usableVariants = variants.length ? variants : product.variants;
  return `<article class="product-card">
  <a class="product-image-wrap image-shell" href="/products/${product.handle}/">
    ${product.onSale ? '<span class="sale-badge">On Sale Now</span>' : ""}
    ${lazyImg(product.image, product.title, `data-card-image data-primary="${escapeAttr(product.image)}" data-hover="${escapeAttr(product.hoverImage)}"`)}
  </a>
  <h3><a href="/products/${product.handle}/">${escapeHtml(product.title)}</a></h3>
  <div><span class="price">${currency(product.price)}</span>${product.compareAt ? `<span class="compare">${currency(product.compareAt)}</span>` : ""}${product.compareAt > product.price ? `<span class="save">Save ${currency(product.compareAt - product.price)}</span>` : ""}</div>
  ${productForm(product, usableVariants, false)}
</article>`;
}

function productCarousel(items, label) {
  const loopItems = items.concat(items, items);
  return `<section class="global-section section-tight product-carousel" data-product-carousel aria-label="${escapeAttr(label)} carousel">
  <button class="carousel-arrow prev" type="button" data-carousel-prev aria-label="Previous ${escapeAttr(label)} products">&lsaquo;</button>
  <div class="product-carousel__track" data-carousel-track data-loop-copies="3">${loopItems.map(productCard).join("")}</div>
  <button class="carousel-arrow next" type="button" data-carousel-next aria-label="Next ${escapeAttr(label)} products">&rsaquo;</button>
</section>`;
}

function shopTheLookSection() {
  const loopItems = shopTheLookVideos.concat(shopTheLookVideos, shopTheLookVideos);
  return `<section id="shop-the-look" class="shop-look-section look-carousel" data-look-carousel aria-label="Shop the look videos">
  <div class="shop-look-inner">
    <div class="shop-look-heading">
      <h2 class="section-title">SHOP THE LOOK</h2>
      <h4 class="section-subtitle"><strong>Be You Be Beautiful</strong></h4>
    </div>
    <button class="carousel-arrow prev" type="button" data-look-prev aria-label="Previous shop the look video">&lsaquo;</button>
    <div class="look-carousel__track" data-look-track data-loop-copies="3">${loopItems.map(lookCard).join("")}</div>
    <button class="carousel-arrow next" type="button" data-look-next aria-label="Next shop the look video">&rsaquo;</button>
  </div>
</section>`;
}

function lookCard(item) {
  const href = item.productHandle === "new-arrival" ? "/collections/new-arrival/" : `/products/${item.productHandle}/`;
  return `<article class="look-card">
  <div class="look-video-shell">
    <video data-look-video muted loop playsinline preload="metadata" poster="${escapeAttr(item.poster)}" aria-label="${escapeAttr(item.productTitle)} video">
      <source data-video-src="${escapeAttr(item.video)}" type="video/mp4">
    </video>
    <button class="look-mute" type="button" data-video-toggle aria-label="Toggle video sound">Sound</button>
  </div>
  <a href="${href}" class="look-product">
    <span>Shop The Look</span>
    <strong>${escapeHtml(item.productTitle)}</strong>
  </a>
</article>`;
}

function productForm(product, variants, full) {
  return `<form class="product-form" data-product-form data-handle="${escapeAttr(product.handle)}" data-title="${escapeAttr(product.title)}" data-image="${escapeAttr(product.image)}">
    <select name="variant" aria-label="Choose option" ${product.available ? "" : "disabled"}>
      ${variants.map((variant) => `<option value="${variant.id}" data-title="${escapeAttr(variant.title)}" data-sku="${escapeAttr(variant.sku || "")}" data-price="${Number(variant.price || 0)}">${escapeHtml(variant.title)}${variant.sku ? ` | SKU: ${escapeHtml(variant.sku)}` : ""}</option>`).join("")}
    </select>
    ${full ? '<div class="qty-row"><label for="quantity">Quantity</label><input id="quantity" name="quantity" type="number" min="1" value="1"></div>' : '<input name="quantity" type="hidden" value="1">'}
    <button type="submit" ${product.available ? "" : "disabled"}>${product.available ? "Add to Cart" : "Sold Out"}</button>
    ${full ? `<button type="submit" data-buy-now ${product.available ? "" : "disabled"}>Order on WhatsApp</button>` : ""}
  </form>`;
}

function sectionHeading(title, subtitle, extraClass = "") {
  const className = `global-section section-tight${extraClass ? ` ${extraClass}` : ""}`;
  return `<section class="${className}"><h2 class="section-title">${escapeHtml(title)}</h2><h4 class="section-subtitle"><strong>${escapeHtml(subtitle)}</strong></h4></section>`;
}

function slideshow(slides) {
  return `<section class="slideshow" data-slideshow>${slides.map(([src, href], index) => `<a class="slide ${index === 0 ? "active" : ""}" data-slide href="${href}"><span class="slide-media image-shell"><img src="${src}" alt="" loading="eager" fetchpriority="${index === 0 ? "high" : "low"}" decoding="async"></span></a>`).join("")}<div class="slide-dots">${slides.map((_, index) => `<button type="button" class="${index === 0 ? "active" : ""}" data-slide-dot aria-label="Slide ${index + 1}"></button>`).join("")}</div></section>`;
}

function categoryIcon(href, src, label) {
  return `<a href="${href}"><img src="${src}" alt="${escapeAttr(label)}"><p>${escapeHtml(label)}</p></a>`;
}

function imageLink(href, src) {
  return `<a class="image-shell" href="${href}">${lazyImg(src, "", 'class="image"')}</a>`;
}

function pressSection() {
  return `${sectionHeading("As Seen On", "")}<section class="global-section section-tight"><div class="press-row">
    ${["/assets/images/mint_money-52fc1c15a6.png", "/assets/images/ys_c1c2d5c5-7e7a-40fe-bf24-1e8f259a469e-eeab0bf67a.png", "/assets/images/rajasthan_mirror-ad37d1704b.png", "/assets/images/daily_hunt-048873453f.png", "/assets/images/pink_city_now-e41a02a98c.png", "/assets/images/he-535b26d40f.png"].map((src) => lazyImg(src, "")).join("")}
  </div></section>`;
}

function storyStrip(images) {
  const doubled = images.concat(images);
  return `<section class="story-strip section-tight"><ul>${doubled.map((src) => `<li>${lazyImg(src, "")}</li>`).join("")}</ul></section>`;
}

function contactCopy() {
  return `<section class="page-hero page-hero-contact">
    <div>
      <p class="page-kicker">Contact</p>
      <h1>Roohaniyat Jaipur</h1>
      <p>Reach the team for order support, wholesale queries, and product availability.</p>
      <a class="button" href="https://wa.me/919829027413">WhatsApp Us</a>
    </div>
  </section>
  <section class="info-grid">
    <article><span>Email</span><strong>roohaniyatjaipur@gmail.com</strong></article>
    <article><span>Phone</span><strong>+918560904132</strong></article>
    <article><span>WhatsApp Orders</span><strong>+919829027413</strong></article>
  </section>
  <section class="contact-panel">
    <div>
      <h2>Manufactured by Vastraa Exports</h2>
      <p>80/435, Shankaracharya Marg, Mansarovar, Jaipur, 302020</p>
      <p>Jaipur, Rajasthan, India</p>
    </div>
    <form class="contact-form">
      <input type="text" placeholder="Name">
      <input type="email" placeholder="Email">
      <textarea rows="5" placeholder="Message"></textarea>
      <a class="button" href="mailto:roohaniyatjaipur@gmail.com">Send Email</a>
    </form>
  </section>`;
}

function aboutCopy() {
  return `<section class="page-hero page-hero-about">
    <div>
      <p class="page-kicker">About Us</p>
      <h1>Rooted in Jaipur, made for modern celebrations</h1>
      <p>Roohaniyat Jaipur brings traditional prints, embroidery, and festive silhouettes to contemporary ethnic wardrobes.</p>
    </div>
  </section>
  <section class="about-story">
    <div>
      <h2>Our Story</h2>
      <p>Pratiksha Akar is the visionary founder behind the Jaipur-based label Roohaniyat. The brand celebrates craft, color, and effortless Indian dressing through collections that feel festive, wearable, and soulful.</p>
      <p>Every outfit carries a little of Rajasthan's textile language, from hand-inspired motifs and rich palettes to everyday cottons and occasion-ready silhouettes.</p>
    </div>
    <div class="image-shell">${lazyImg("/assets/images/15_7a203569-4e4d-439a-a810-bcc42aaee14d-6e62b59ef5.jpg", "Roohaniyat Jaipur story")}</div>
  </section>
  <section class="info-grid">
    <article><span>Craft</span><strong>Traditional dyeing and tailoring techniques</strong></article>
    <article><span>Fabric</span><strong>Cotton, muslin, silk, chanderi, chiffon and organza</strong></article>
    <article><span>Design</span><strong>Ethnic wear for daily, festive and wedding moods</strong></article>
  </section>`;
}

function blogCopy() {
  const posts = [
    ["Embracing Diversity: Roohaniyat's Fashion Revolution", "Roohaniyat Jaipur celebrates timeless Indian craft with contemporary silhouettes made for modern wardrobes.", "/assets/images/IMG-20240305-WA0034-ca98e474bb.jpg"],
    ["Exploring the Indian block print's rich cultural history", "From Jaipur to Bagru and Sanganer, traditional motifs continue to inspire handcrafted ethnic wear.", "/assets/images/IMG-20240305-WA0032-8b4067c895.jpg"],
    ["How to style ethnic wear for every celebration", "A quiet guide to festive dressing, easy layering, and silhouettes that move beautifully through the day.", "/assets/images/IMG-20231130-WA0025-4e1119ad3d.jpg"],
  ];
  return `<section class="page-hero page-hero-blog">
    <div>
      <p class="page-kicker">Blogs</p>
      <h1>Stories of craft, color and celebration</h1>
      <p>Notes from the world of Roohaniyat Jaipur.</p>
    </div>
  </section>
  <section class="blog-grid">${posts.map(([title, excerpt, image]) => `<article>
    <div class="image-shell">${lazyImg(image, title)}</div>
    <div>
      <span>Roohaniyat Journal</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(excerpt)}</p>
    </div>
  </article>`).join("")}</section>`;
}

function lazyImg(src, alt, attrs = "") {
  return `<img ${attrs} src="${placeholder()}" data-lazy-src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy" decoding="async">`;
}

function placeholder() {
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='36' viewBox='0 0 24 36'%3E%3C/svg%3E";
}

function brandLongCopy() {
  return `<h3>ROOHANIYAT JAIPUR: ELEVATING TRADITIONAL ELEGANCE WITH AFFORDABLE EXCELLENCE</h3>
  <p>Dive into the enchanting realm of Indian ethnic wear with Roohaniyat Jaipur, where timeless tradition meets contemporary affordability. Drawing inspiration from the cultural tapestry of Jaipur, our collection is a celebration of artistry and refined fashion.</p>
  <h3>SIGNATURE STYLE: AFFORDABLE ELEGANCE THROUGH HANDCRAFTED BEAUTY</h3>
  <p>Discover the essence of Roohaniyat Jaipur through our signature style, an ode to affordable elegance achieved through meticulous craftsmanship. Every motif tells a story through layers of colors and patterns.</p>
  <h3>DIVERSE FABRICS AND CRAFTSMANSHIP</h3>
  <p>At Roohaniyat Jaipur, we prioritize style without compromising on comfort. Our treasure trove of fabrics includes cotton, chanderi, kota doria, silk, chiffon, and organza.</p>`;
}

function hamburger() {
  return `<svg class="hamburger" viewBox="0 0 49.6 20" aria-hidden="true"><rect width="49.6" height="1.5"></rect><rect y="9.2" width="49.6" height="1.5"></rect><rect y="18.4" width="49.6" height="1.5"></rect></svg>`;
}

function bag() {
  return `<svg class="bag-icon" viewBox="0 0 22 20" aria-hidden="true"><path d="M21.9,4.2C21.8,4.1,21.6,4,21.5,4H15c0-2.2-1.8-4-4-4C8.8,0,7,1.8,7,4v2.2C6.7,6.3,6.5,6.6,6.5,7c0,0.6,0.4,1,1,1s1-0.4,1-1c0-0.4-0.2-0.7-0.5-0.8V5h5V4H8c0-1.7,1.3-3,3-3s3,1.3,3,3v2.2c-0.3,0.2-0.5,0.5-0.5,0.8c0,0.6,0.4,1,1,1s1-0.4,1-1c0-0.4-0.2-0.7-0.5-0.8V5h5.9l-2.3,13.6c0,0.2-0.2,0.4-0.5,0.4H3.8c-0.2,0-0.5-0.2-0.5-0.4L1.1,5H6V4H0.5C0.4,4,0.2,4.1,0.1,4.2C0,4.3,0,4.4,0,4.6l2.4,14.2C2.5,19.5,3.1,20,3.8,20h14.3c0.7,0,1.4-0.5,1.5-1.3L22,4.6C22,4.4,22,4.3,21.9,4.2z"></path></svg>`;
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function currency(value) {
  return `&#8377; ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}.00`;
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

function write(file, html) {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, relativizeRootUrls(file, html), "utf8");
}

function relativizeRootUrls(file, html) {
  const depth = path.dirname(file) === "." ? 0 : path.dirname(file).split(/[\\/]/).length;
  const prefix = depth === 0 ? "" : "../".repeat(depth);
  return html.replace(/\b(href|src|action|poster|data-lazy-src|data-primary|data-hover|data-image|data-thumb|data-video-src)="\/(?!\/)([^"]*)"/g, (_, attr, value) => {
    const relative = value ? `${prefix}${value}` : (prefix || "./");
    return `${attr}="${relative}"`;
  });
}
