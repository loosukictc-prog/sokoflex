import {
  IconArrowLeft,
  IconArrowUpRight,
  IconBox,
  IconCheck,
  IconChevronDown,
  IconCircleCheck,
  IconLayoutDashboard,
  IconPackage,
  IconPencil,
  IconPlus,
  IconSearch,
  IconShoppingBag,
  IconTrash,
  IconTruck,
  IconX,
} from "@tabler/icons-react";
import { signOut } from "@agent-native/core/client";
import { actionErrorMessage, useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
import { useMemo, useState } from "react";
import { Link } from "react-router";

const money = (amount: number) => `KSh ${amount.toLocaleString("en-KE")}`;
const statuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"] as const;
type Section = "overview" | "products" | "categories" | "orders";

export function meta() {
  return [{ title: "Admin Dashboard · Sokoflex" }];
}

function ProductThumbnail({ category }: { category: string }) {
  const initials = category === "Computing" ? "PC" : category === "Mobiles" ? "MB" : category === "Audio" ? "AU" : "AC";
  return <span className={`admin-thumb admin-thumb-${category.toLowerCase()}`}>{initials}</span>;
}

export default function AdminRoute() {
  const [section, setSection] = useState<Section>("overview");
  const [search, setSearch] = useState("");
  const [editorId, setEditorId] = useState<string | "new" | null>(null);
  const [categoryNotice, setCategoryNotice] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const access = useActionQuery("get-store-admin-access", {});
  const catalogQuery = useActionQuery("list-products", {}, { enabled: access.data?.allowed === true });
  const ordersQuery = useActionQuery("list-orders", {}, { enabled: access.data?.allowed === true });
  const catalog = catalogQuery.data;
  const products = catalog?.products ?? [];
  const categories = catalog?.categories ?? [];
  const orderData = ordersQuery.data;
  const orders = orderData?.orders ?? [];
  const pendingOrders = orders.filter((order) => order.status === "Pending");
  const lowStockProducts = products.filter((product) => product.stock < 10);
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  const dailySales = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dailyTotal = orders.reduce((sum, order) =>
      new Date(order.createdAt).toDateString() === date.toDateString() ? sum + order.total : sum, 0);
    return { label: date.toLocaleDateString("en-KE", { weekday: "short" }), total: dailyTotal };
  }), [orders]);
  const maxDailySales = Math.max(1, ...dailySales.map((day) => day.total));
  const topSellingProducts = useMemo(() => {
    const quantities = new Map<string, number>();
    for (const item of orderData?.items ?? []) {
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    }
    return [...quantities.entries()]
      .map(([productId, sold]) => ({ product: products.find((item) => item.id === productId), sold }))
      .filter((item) => item.product)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [orderData?.items, products]);
  const filteredProducts = products.filter((product) =>
    `${product.name} ${categories.find((category) => category.id === product.categoryId)?.name ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredOrders = orders.filter((order) =>
    `${order.orderNumber} ${order.customerName} ${order.email} ${order.phone}`.toLowerCase().includes(search.toLowerCase()),
  );
  const editorProduct = editorId && editorId !== "new" ? products.find((product) => product.id === editorId) : undefined;
  const [notice, setNotice] = useState("");

  const createProduct = useActionMutation("create-product", { onSuccess: () => { setEditorId(null); setNotice("Product added to the catalog."); } });
  const updateProduct = useActionMutation("update-product", { onSuccess: () => { setEditorId(null); setNotice("Product changes saved."); } });
  const deleteProduct = useActionMutation("delete-product", { onSuccess: () => setNotice("Product removed from the catalog.") });
  const createCategory = useActionMutation("create-category", { onSuccess: () => { setCategoryNotice("Category added."); setCategoryError(""); } });
  const updateCategory = useActionMutation("update-category", { onSuccess: () => { setCategoryNotice("Category name saved."); setCategoryError(""); } });
  const deleteCategory = useActionMutation("delete-category", { onSuccess: () => { setCategoryNotice("Category removed."); setCategoryError(""); } });
  const updateOrderStatus = useActionMutation("update-order-status", { onSuccess: () => setNotice("Order status updated.") });

  function submitProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const values = {
      name: String(fields.get("name")),
      categoryId: String(fields.get("categoryId")),
      description: String(fields.get("description")),
      price: Number(fields.get("price")),
      stock: Number(fields.get("stock")),
      color: String(fields.get("color")),
    };
    if (editorId === "new") createProduct.mutate(values);
    else if (editorId) updateProduct.mutate({ id: editorId, ...values });
  }

  function submitCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createCategory.mutate({ name: String(form.get("name")) });
    event.currentTarget.reset();
  }

  function renameCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateCategory.mutate({ id: String(form.get("id")), name: String(form.get("name")) });
  }

  const mutationError = [createProduct.error, updateProduct.error, deleteProduct.error, updateOrderStatus.error]
    .map((error) => actionErrorMessage(error))
    .find(Boolean);
  const categoryMutationError = [createCategory.error, updateCategory.error, deleteCategory.error]
    .map((error) => actionErrorMessage(error))
    .find(Boolean);

  if (access.isPending) return <div className="admin-loading">Checking admin access…</div>;
  if (!access.data?.allowed) {
    return <div className="admin-access-page"><section className="admin-access-card"><span className="admin-brand-mark">s</span><p className="admin-breadcrumb">SOKOFLEX · ADMIN</p><h1>{access.data?.configured ? "Admin access required" : "Admin access needs setup"}</h1><p>{access.data?.configured ? "This account is not on the Sokoflex admin list." : "Set SOKOFLEX_ADMIN_EMAIL to the signed-in account that should manage this store."}</p><div className="admin-access-actions"><Link to="/">Back to storefront</Link><button onClick={() => void signOut({ redirectTo: "/" })}>Sign out</button></div></section></div>;
  }

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/" aria-label="Sokoflex storefront"><span className="admin-brand-mark">s</span><span>SOKO<span>FLEX</span><small>STORE ADMIN</small></span></Link>
        <div className="admin-nav-label">WORKSPACE</div>
        <nav className="admin-navigation" aria-label="Admin sections">
          <button className={`admin-nav-item ${section === "overview" ? "admin-nav-current" : ""}`} onClick={() => { setSection("overview"); setSearch(""); }}><IconLayoutDashboard size={17} /> Dashboard</button>
          <button className={`admin-nav-item ${section === "products" ? "admin-nav-current" : ""}`} onClick={() => { setSection("products"); setSearch(""); }}><IconPackage size={17} /> Products <span>{products.length}</span></button>
          <button className={`admin-nav-item ${section === "categories" ? "admin-nav-current" : ""}`} onClick={() => { setSection("categories"); setSearch(""); }}><IconBox size={17} /> Categories <span>{categories.length}</span></button>
          <button className={`admin-nav-item ${section === "orders" ? "admin-nav-current" : ""}`} onClick={() => { setSection("orders"); setSearch(""); }}><IconShoppingBag size={17} /> Orders <span>{orders.length}</span></button>
        </nav>
        <div className="admin-nav-spacer" />
        <Link className="admin-store-link" to="/"><IconArrowLeft size={16} /> Back to storefront</Link>
        <button className="admin-store-link admin-signout" onClick={() => void signOut({ redirectTo: "/" })}><IconArrowLeft size={16} /> Sign out</button>
        <div className="admin-sidebar-footer">Sokoflex Kenya</div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-label"><IconLayoutDashboard size={17} /><span>{section === "overview" ? "Store overview" : section[0].toUpperCase() + section.slice(1)}</span></div>
          <label className="admin-search"><IconSearch size={16} /><input aria-label={section === "orders" ? "Search orders" : "Search store records"} placeholder={section === "orders" ? "Search orders or customers" : "Search products or categories"} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <Link className="admin-header-store-link" to="/"><IconArrowLeft size={15} /> Storefront</Link>
        </header>

        <div className="admin-content">
          {notice && <div className="admin-notice"><IconCheck size={16} /><span>{notice}</span><button aria-label="Dismiss" onClick={() => setNotice("")}><IconX size={15} /></button></div>}
          {mutationError && <div className="admin-error" role="alert">{mutationError}</div>}
          {section === "overview" && <>
            <div className="admin-welcome"><div><div className="admin-breadcrumb">Sokoflex Store <span>/</span> Dashboard</div><h1>Dashboard</h1><p>A clear view of your store, orders, and inventory.</p></div><span className="admin-period">Last 7 days <IconChevronDown size={14} /></span></div>
            <div className="admin-stats"><div className="stat-card stat-sales"><span className="stat-icon"><IconArrowUpRight size={17} /></span><small>Total sales</small><b>{money(totalSales)}</b><span className="stat-caption">From {orders.length} orders</span></div><div className="stat-card stat-order"><span className="stat-icon"><IconShoppingBag size={17} /></span><small>Total orders</small><b>{orders.length}</b><span className="stat-caption">All recorded orders</span></div><div className="stat-card stat-inventory"><span className="stat-icon"><IconPackage size={17} /></span><small>Products in store</small><b>{products.length}</b><span className="stat-caption">Across {categories.length} categories</span></div><div className="stat-card stat-pending"><span className="stat-icon"><IconTruck size={17} /></span><small>Pending fulfilment</small><b>{pendingOrders.length}</b><span className="stat-caption">Orders to prepare</span></div><div className="stat-card stat-low"><span className="stat-icon"><IconCheck size={17} /></span><small>Low stock</small><b>{lowStockProducts.length}</b><span className="stat-caption">Fewer than 10 units</span></div></div>
            <section className="admin-panel sales-panel"><div className="panel-heading"><div><h2>Sales overview</h2><p>Daily order totals · KSh</p></div><div className="chart-legend"><i /> Sales</div></div>{orders.length ? <div className="sales-chart" role="img" aria-label="Daily sales chart for the last seven days">{dailySales.map((day, index) => <div className="sales-day" key={`${day.label}-${index}`}><span className="sales-value">{day.total ? `${(day.total / 1000).toFixed(0)}k` : ""}</span><div className="bar-track"><i style={{ height: `${Math.max(day.total ? 8 : 2, (day.total / maxDailySales) * 100)}%` }} /></div><small>{day.label}</small></div>)}</div> : <div className="chart-empty"><div className="sales-chart empty-chart">{dailySales.map((day, index) => <div className="sales-day" key={`${day.label}-${index}`}><div className="bar-track"><i style={{ height: "3px" }} /></div><small>{day.label}</small></div>)}</div></div>}</section>
            <div className="admin-panels"><section className="admin-panel inventory-panel"><div className="panel-heading"><div><h2>Top selling products</h2><p>Ranked by units sold</p></div><button className="admin-panel-link" onClick={() => setSection("products")}>View products <IconArrowUpRight size={15} /></button></div>{topSellingProducts.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Sold</th><th>Stock</th></tr></thead><tbody>{topSellingProducts.map(({ product, sold }) => <tr key={product!.id}><td><span className="table-product"><ProductThumbnail category={categories.find((item) => item.id === product!.categoryId)?.name ?? "Accessories"} /><b>{product!.name}</b></span></td><td>{categories.find((item) => item.id === product!.categoryId)?.name}</td><td>{money(product!.price)}</td><td>{sold}</td><td><span className={`table-stock ${product!.stock < 10 ? "table-stock-low" : ""}`}>{product!.stock} units</span></td></tr>)}</tbody></table></div> : <div className="admin-empty">Product sales will appear here after the first order.</div>}</section>
              <section className="admin-panel orders-panel"><div className="panel-heading"><div><h2>Recent orders</h2><p>Latest customer purchases</p></div><button className="admin-panel-link" onClick={() => setSection("orders")}>View orders <IconArrowUpRight size={15} /></button></div>{orders.length ? <div className="admin-table-wrap"><table className="admin-table order-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.slice(0, 5).map((order) => <tr key={order.id}><td><b className="order-number">{order.orderNumber}</b><small className="order-date">{new Date(order.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</small></td><td>{order.customerName}</td><td>{money(order.total)}</td><td><span className={`order-status status-${order.status.toLowerCase()}`}>{order.status}</span></td></tr>)}</tbody></table></div> : <div className="admin-empty order-empty"><span className="empty-bag"><IconShoppingBag size={20} /></span><b>No orders yet</b><span>Customer purchases will appear here.</span></div>}</section></div>
            {lowStockProducts.length > 0 && <div className="admin-note"><IconPackage size={15} /><span>{lowStockProducts.length} product{lowStockProducts.length === 1 ? " is" : "s are"} running low on stock.</span><button onClick={() => setSection("products")}>Review inventory <IconArrowUpRight size={14} /></button></div>}
          </>}

          {section === "products" && <section className="admin-panel management-panel"><div className="management-heading"><div><div className="admin-breadcrumb">Sokoflex Store <span>/</span> Products</div><h1>Products</h1></div><button className="admin-primary-button" onClick={() => setEditorId("new")}><IconPlus size={16} /> Add product</button></div><div className="admin-table-wrap"><table className="admin-table management-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Availability</th><th /></tr></thead><tbody>{filteredProducts.map((product) => { const categoryName = categories.find((item) => item.id === product.categoryId)?.name ?? "—"; return <tr key={product.id}><td><span className="table-product"><ProductThumbnail category={categoryName} /><b>{product.name}</b></span></td><td>{categoryName}</td><td>{money(product.price)}</td><td>{product.stock}</td><td><span className={`table-stock ${product.stock < 10 ? "table-stock-low" : ""}`}>{product.stock === 0 ? "Out of stock" : product.stock < 10 ? "Low stock" : "In stock"}</span></td><td><span className="row-actions"><button aria-label={`Edit ${product.name}`} onClick={() => setEditorId(product.id)}><IconPencil size={15} /></button><button aria-label={`Delete ${product.name}`} onClick={() => deleteProduct.mutate({ id: product.id })} disabled={deleteProduct.isPending}><IconTrash size={15} /></button></span></td></tr>; })}</tbody></table>{filteredProducts.length === 0 && <div className="admin-empty">{search ? "No products match your search." : "No products yet. Add the first product to the catalog."}</div>}</div></section>}

          {section === "categories" && <section className="admin-panel management-panel"><div className="management-heading"><div><div className="admin-breadcrumb">Sokoflex Store <span>/</span> Categories</div><h1>Categories</h1></div></div><form className="category-create-form" onSubmit={submitCategory}><label htmlFor="new-category">New category</label><input id="new-category" name="name" required minLength={2} maxLength={60} placeholder="e.g. Smart home" /><button className="admin-primary-button" type="submit" disabled={createCategory.isPending}><IconPlus size={16} /> Add category</button></form>{categoryNotice && <div className="admin-notice"><IconCheck size={16} /><span>{categoryNotice}</span></div>}{categoryMutationError && <div className="admin-error" role="alert">{categoryMutationError}</div>}<div className="category-admin-list">{categories.map((category) => <form className="category-admin-row" key={category.id} onSubmit={renameCategory}><input type="hidden" name="id" value={category.id} /><div className="category-admin-name"><b>{category.name}</b><small>{products.filter((product) => product.categoryId === category.id).length} products</small></div><input aria-label={`Rename ${category.name}`} name="name" required minLength={2} maxLength={60} defaultValue={category.name} /><button className="category-save" type="submit" disabled={updateCategory.isPending}>Save</button><button className="category-delete" aria-label={`Delete ${category.name}`} type="button" onClick={() => deleteCategory.mutate({ id: category.id })} disabled={deleteCategory.isPending}><IconTrash size={15} /></button></form>)}</div></section>}

          {section === "orders" && <section className="admin-panel management-panel"><div className="management-heading"><div><div className="admin-breadcrumb">Sokoflex Store <span>/</span> Orders</div><h1>Orders</h1></div><span className="orders-count">{orders.length} total orders</span></div><div className="admin-table-wrap"><table className="admin-table management-table orders-management-table"><thead><tr><th>Order</th><th>Customer</th><th>Delivery</th><th>Total</th><th>Status</th></tr></thead><tbody>{filteredOrders.map((order) => <tr key={order.id}><td><b className="order-number">{order.orderNumber}</b><small className="order-date">{new Date(order.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</small></td><td><b className="customer-name">{order.customerName}</b><small className="order-date">{order.email} · {order.phone}</small></td><td className="delivery-address">{order.address}</td><td>{money(order.total)}</td><td><select className={`order-status-select status-${order.status.toLowerCase()}`} aria-label={`Status for ${order.orderNumber}`} value={order.status} onChange={(event) => updateOrderStatus.mutate({ id: order.id, status: event.target.value as (typeof statuses)[number] })}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></td></tr>)}</tbody></table>{filteredOrders.length === 0 && <div className="admin-empty">{search ? "No orders match your search." : "Customer orders will appear here."}</div>}</div></section>}
        </div>
      </main>

      {editorId && <div className="admin-modal-backdrop"><section className="admin-editor" role="dialog" aria-modal="true" aria-labelledby="product-editor-title"><div className="admin-editor-heading"><div><div className="admin-breadcrumb">CATALOG</div><h2 id="product-editor-title">{editorProduct ? "Edit product" : "Add product"}</h2></div><button className="close-button" onClick={() => setEditorId(null)} aria-label="Close product editor"><IconX size={18} /></button></div><form className="admin-editor-form" onSubmit={submitProduct}><label>Product name<input name="name" required minLength={2} maxLength={120} defaultValue={editorProduct?.name ?? ""} /></label><label>Category<select name="categoryId" required defaultValue={editorProduct?.categoryId ?? categories[0]?.id ?? ""}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Description<textarea name="description" maxLength={600} rows={3} defaultValue={editorProduct?.description ?? ""} /></label><div className="editor-pair"><label>Price (KSh)<input name="price" type="number" min="1" max="100000000" required defaultValue={editorProduct?.price ?? ""} /></label><label>Stock units<input name="stock" type="number" min="0" max="1000000" required defaultValue={editorProduct?.stock ?? ""} /></label></div><label>Color<input name="color" required maxLength={32} defaultValue={editorProduct?.color ?? "sage"} /></label><button className="admin-primary-button editor-submit" type="submit" disabled={createProduct.isPending || updateProduct.isPending}>{createProduct.isPending || updateProduct.isPending ? "Saving…" : "Save product"}<IconCheck size={16} /></button>{(createProduct.error || updateProduct.error) && <div className="admin-error" role="alert">{actionErrorMessage(createProduct.error ?? updateProduct.error) ?? "Could not save the product."}</div>}</form></section></div>}
    </div>
  );
}
