import {
  IconArrowLeft,
  IconArrowUpRight,
  IconCheck,
  IconChevronDown,
  IconMinus,
  IconPackage,
  IconPlus,
  IconSearch,
  IconShoppingBag,
  IconTruck,
  IconX,
} from "@tabler/icons-react";
import { signOut } from "@agent-native/core/client";
import { useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
import { useMemo, useState } from "react";

const money = (amount: number) => `KSh ${amount.toLocaleString("en-KE")}`;
const categories = ["All products", "Mobiles", "Computing", "Audio", "Accessories"];
const categoryColors: Record<string, string> = {
  Mobiles: "mobile",
  Computing: "computer",
  Audio: "audio",
  Accessories: "accessory",
};

function ProductArt({ category }: { category: string }) {
  return (
    <div className={`product-art art-${categoryColors[category] ?? "mobile"}`} aria-hidden="true">
      <div className="art-glow" />
      {category === "Mobiles" && <div className="phone-shape"><span /><i /></div>}
      {category === "Computing" && <div className="laptop-shape"><span /><i /></div>}
      {category === "Audio" && <div className="headphone-shape"><span /><i /><b /></div>}
      {category === "Accessories" && <div className="watch-shape"><span /><i /></div>}
      <span className="art-category">{category}</span>
    </div>
  );
}

export default function HomeRoute() {
  const { data: catalog, isPending } = useActionQuery("list-products", {});
  const [category, setCategory] = useState("All products");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const products = catalog?.products ?? [];
  const cartItems = products.filter((product) => cart[product.id]);
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const total = cartItems.reduce((sum, product) => sum + product.price * cart[product.id], 0);
  const filteredProducts = useMemo(
    () => products.filter((product) =>
      (category === "All products" || catalog?.categories.find((item) => item.id === product.categoryId)?.name === category) &&
      product.name.toLowerCase().includes(search.toLowerCase()),
    ),
    [products, category, search],
  );
  const createOrder = useActionMutation("create-order", {
    onSuccess: (result) => {
      setCart({});
      setCheckoutOpen(false);
      setCartOpen(false);
      setNotice(`Order ${result.orderNumber} confirmed. We’ll be in touch shortly.`);
    },
  });

  function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createOrder.mutate({
      customerName: String(form.get("name")),
      email: String(form.get("email")),
      phone: String(form.get("phone")),
      address: String(form.get("address")),
      items: cartItems.map((product) => ({ productId: product.id, quantity: cart[product.id] })),
    });
  }

  function changeQuantity(id: string, amount: number) {
    setCart((current) => {
      const next = { ...current, [id]: Math.max(0, (current[id] ?? 0) + amount) };
      if (!next[id]) delete next[id];
      return next;
    });
  }

  return (
    <div className="store-shell">
      <aside className="store-sidebar">
        <a className="brand-lockup" href="#top">
          <span className="brand-mark">s</span>
          <span>SOKO<span className="brand-light">FLEX</span><small>TECH FOR EVERY DAY</small></span>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <a className="side-link side-active" href="#catalog"><IconShoppingBag size={18} /> Shop electronics</a>
        <div className="sidebar-bottom">
          <div className="secure-note"><span><IconCheck size={15} /></span><div><b>Shopping made safe</b><small>Secure checkout · Local support</small></div></div>
          <div className="sidebar-foot">© 2026 Sokoflex Kenya · loosukdevs</div>
        </div>
      </aside>

      <main className="store-main" id="top">
        <header className="store-header">
          <div className="crumb"><span>Home</span><b>/</b>Shop</div>
          <div className="header-actions">
            <label className="searchbox"><IconSearch size={17} /><input aria-label="Search products" placeholder="Search products" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label>
            <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${cartCount} items`}><IconShoppingBag size={19} /><span>Cart</span>{cartCount > 0 && <i>{cartCount}</i>}</button>
            <div className="user-chip"><span className="avatar">S</span><span><b>Welcome</b><small>Shopper</small></span><IconChevronDown size={14} /></div>
            <button className="shop-signout" onClick={() => void signOut({ redirectTo: "/" })}>Sign out</button>
          </div>
        </header>

          <div className="page-content">
            <section className="hero-banner">
              <div className="hero-copy"><span className="eyebrow"><i /> THE SMARTER WAY TO SHOP</span><h1>Good tech.<br /><em>Good living.</em></h1><p>Discover the devices that make every day a little better. Delivered right to your door.</p><button className="hero-cta" onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}>Explore the collection <IconArrowUpRight size={17} /></button><div className="hero-proof"><span><IconCheck size={14} /> Quality checked</span><span><IconTruck size={15} /> Kenya-wide delivery</span></div></div>
              <div className="hero-orbit"><div className="hero-circle"><div className="hero-device"><span /><i /></div><div className="floating-chip chip-one"><span>✦</span> Just landed</div><div className="floating-chip chip-two"><b>01</b> Made for your day</div></div></div>
              <div className="hero-number">01 <span>— 04</span></div>
            </section>

            <section className="value-strip"><div><span className="value-icon"><IconTruck size={18} /></span><p><b>Fast delivery</b><small>Across Kenya</small></p></div><div><span className="value-icon"><IconCheck size={18} /></span><p><b>Genuine products</b><small>Quality guaranteed</small></p></div><div><span className="value-icon"><IconShoppingBag size={18} /></span><p><b>Easy checkout</b><small>Pay on delivery</small></p></div><div><span className="value-icon"><IconPackage size={18} /></span><p><b>Here to help</b><small>Friendly local support</small></p></div></section>

            <section className="category-showcase" aria-labelledby="category-title">
              <div className="section-heading"><div><span className="eyebrow">BROWSE YOUR WAY</span><h2 id="category-title">Find your kind of tech.</h2></div><button className="view-all" onClick={() => { setCategory("All products"); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }}>Shop everything <IconArrowUpRight size={16} /></button></div>
              <div className="category-tiles">{categories.slice(1).map((item) => {
                const matchingProducts = products.filter((product) => catalog?.categories.find((entry) => entry.id === product.categoryId)?.name === item);
                return <button className={`category-tile tile-${categoryColors[item]}`} key={item} onClick={() => { setCategory(item); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }}>
                  <span className="tile-art"><ProductArt category={item} /></span><span className="tile-copy"><b>{item}</b><small>{matchingProducts.length} {matchingProducts.length === 1 ? "essential" : "essentials"}</small></span><span className="tile-arrow"><IconArrowUpRight size={16} /></span>
                </button>;
              })}</div>
            </section>

            <section className="catalog-section" id="catalog">
              <div className="section-heading"><div><span className="eyebrow">CURATED FOR YOU</span><h2>Find your next favourite.</h2><p>Thoughtful tech, selected for the way you live.</p></div><button className="view-all" onClick={() => setCategory("All products")}>View all products <IconArrowUpRight size={16} /></button></div>
              <div className="category-row" role="tablist" aria-label="Filter by category">{categories.map((item) => <button key={item} className={category === item ? "category-active" : ""} onClick={() => setCategory(item)}>{item}{item === "All products" && <span>{products.length}</span>}</button>)}</div>
              {notice && <div className="success-banner"><IconCheck size={18} /><span>{notice}</span><button aria-label="Dismiss" onClick={() => setNotice("")}><IconX size={17} /></button></div>}
              {isPending ? <div className="loading-state">Preparing the collection…</div> : filteredProducts.length ? <div className="product-grid">{filteredProducts.map((product, index) => {
                const productCategory = catalog?.categories.find((item) => item.id === product.categoryId)?.name ?? "Accessories";
                return <article className="product-card" key={product.id}>
                  <div className="product-image-wrap"><ProductArt category={productCategory} /><span className={`stock-pill ${product.stock < 10 ? "stock-low" : ""}`}>{product.stock > 0 ? `${product.stock} in stock` : "Sold out"}</span><button className="quick-add" disabled={!product.stock} onClick={() => changeQuantity(product.id, 1)} aria-label={`Add ${product.name} to cart`}><IconPlus size={19} /></button></div>
                  <div className="product-meta"><span>{productCategory}</span><span className="product-rating">★★★★★ <i>4.9</i></span></div>
                  <h3>{product.name}</h3><p className="product-description">{product.description}</p>
                  <div className="product-bottom"><b>{money(product.price)}</b><button disabled={!product.stock} onClick={() => changeQuantity(product.id, 1)}>{cart[product.id] ? `Added · ${cart[product.id]}` : "Add to bag"}<IconArrowUpRight size={15} /></button></div>
                </article>;
              })}</div> : <div className="empty-state">No products match that search. Try another name or category.</div>}
            </section>
            <section className="home-prompt"><div><span className="eyebrow">A LITTLE MORE EVERYDAY</span><h2>Good tech should feel<br />easy from the start.</h2><p>Choose what you need, place your order, and we’ll take it from there.</p></div><button onClick={() => { setCategory("All products"); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }}>Find your next essential <IconArrowUpRight size={17} /></button><span className="prompt-mark">s</span></section>
            <footer className="store-footer"><span className="footer-brand"><b>SOKOFLEX</b><small>Made for everyday moments in Kenya.</small></span><span>Prices shown in Kenyan Shillings (KSh)</span><span className="footer-copy">© 2026 loosukdevs</span></footer>
          </div>
      </main>

      {(cartOpen || checkoutOpen) && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) { setCartOpen(false); setCheckoutOpen(false); } }}><section className="cart-panel" aria-label={checkoutOpen ? "Checkout" : "Shopping bag"}><div className="cart-heading"><div><span className="eyebrow">SOKOFLEX CHECKOUT</span><h2>{checkoutOpen ? "Delivery details" : `Your bag (${cartCount})`}</h2></div><button className="close-button" onClick={() => { setCartOpen(false); setCheckoutOpen(false); }} aria-label="Close"><IconX size={20} /></button></div>
        {checkoutOpen ? <form className="checkout-form" onSubmit={submitOrder}><p>Almost yours. Tell us where to deliver your order.</p><label>Full name<input name="name" required minLength={2} placeholder="e.g. Amina Wanjiku" /></label><label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>Phone number<input name="phone" type="tel" required minLength={7} placeholder="07xx xxx xxx" /></label><label>Delivery address<textarea name="address" required minLength={5} placeholder="Street, area, town" rows={3} /></label><div className="checkout-total"><span>Total to pay on delivery</span><b>{money(total)}</b></div><button className="checkout-submit" type="submit" disabled={createOrder.isPending}>{createOrder.isPending ? "Placing your order…" : "Place order · Pay on delivery"}<IconArrowUpRight size={17} /></button>{createOrder.error && <p className="form-error">Please check availability and try again.</p>}<button className="back-to-bag" type="button" onClick={() => setCheckoutOpen(false)}><IconArrowLeft size={15} /> Back to bag</button></form> : <>{cartItems.length ? <><div className="cart-items">{cartItems.map((product) => <div className="cart-item" key={product.id}><div className="cart-art"><ProductArt category={catalog?.categories.find((item) => item.id === product.categoryId)?.name ?? "Accessories"} /></div><div className="cart-item-info"><span>{catalog?.categories.find((item) => item.id === product.categoryId)?.name}</span><b>{product.name}</b><strong>{money(product.price)}</strong><div className="quantity-control"><button onClick={() => changeQuantity(product.id, -1)} aria-label="Decrease quantity"><IconMinus size={14} /></button><span>{cart[product.id]}</span><button onClick={() => changeQuantity(product.id, 1)} aria-label="Increase quantity"><IconPlus size={14} /></button></div></div><button className="remove-item" onClick={() => setCart((current) => { const next = { ...current }; delete next[product.id]; return next; })} aria-label="Remove item"><IconX size={16} /></button></div>)}</div><div className="cart-bottom"><div className="cart-total"><span>Subtotal</span><b>{money(total)}</b></div><small>Delivery details are collected at checkout.</small><button className="checkout-submit" onClick={() => setCheckoutOpen(true)}>Continue to checkout <IconArrowUpRight size={17} /></button><div className="pay-later"><IconCheck size={14} /> No online payment required</div></div></> : <div className="cart-empty"><div><IconShoppingBag size={25} /></div><h3>Your bag is taking a breather.</h3><p>Find something useful and it’ll be waiting right here.</p><button onClick={() => { setCartOpen(false); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }}>Browse the collection <IconArrowUpRight size={15} /></button></div>}</>}
      </section></div>}
    </div>
  );
}
