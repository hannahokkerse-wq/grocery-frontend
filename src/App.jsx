import { useEffect, useMemo, useState } from "react";
import "./style.css";

import ahLogo from "./assets/ah.png";
import jumboLogo from "./assets/jumbo.png";
import lidlLogo from "./assets/lidl.png";
import aldiLogo from "./assets/aldi.png";

const API_BASE = "https://grocery-discount-api.onrender.com";

const STORE_META = {
  all: { label: "Alle winkels", short: "ALL", logo: null },
  ah: { label: "Albert Heijn", short: "AH", logo: ahLogo },
  jumbo: { label: "Jumbo", short: "Jumbo", logo: jumboLogo },
  lidl: { label: "Lidl", short: "Lidl", logo: lidlLogo },
  aldi: { label: "Aldi", short: "Aldi", logo: aldiLogo },
};

const FAVORITES_KEY = "grocery-favorites";
const SAVED_BASKET_KEY = "grocery-saved-basket";

export default function App() {
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [basketResult, setBasketResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [budget, setBudget] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStore, setActiveStore] = useState("all");
  const [darkMode, setDarkMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Alle");
  const [sortMode, setSortMode] = useState("price-asc");
  const [favorites, setFavorites] = useState([]);
  const [savedMessage, setSavedMessage] = useState("");

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingBasket, setLoadingBasket] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hoi 👋 Ik ben je Grocery Discount AI. Ik help je besparen, maar ook slim kiezen op kwaliteit.",
    },
  ]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    return () => document.body.classList.remove("dark-mode");
  }, [darkMode]);

  useEffect(() => {
    try {
      const storedFavorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      setFavorites(Array.isArray(storedFavorites) ? storedFavorites : []);
    } catch {
      setFavorites([]);
    }
  }, []);

  async function fetchProducts(query = "") {
    try {
      setLoadingProducts(true);
      const url = query
        ? `${API_BASE}/products?q=${encodeURIComponent(query)}`
        : `${API_BASE}/products`;

      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Fout bij ophalen producten:", error);
    } finally {
      setLoadingProducts(false);
    }
  }

  function toggleProduct(productId) {
    setSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }

  function toggleFavorite(productId) {
    const next = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];

    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  }

  function saveBasketLocal() {
    const payload = {
      selectedIds,
      budget,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVED_BASKET_KEY, JSON.stringify(payload));
    setSavedMessage("Mandje opgeslagen");
    setTimeout(() => setSavedMessage(""), 2000);
  }

  function loadBasketLocal() {
    try {
      const raw = localStorage.getItem(SAVED_BASKET_KEY);
      if (!raw) {
        setSavedMessage("Geen opgeslagen mandje gevonden");
        setTimeout(() => setSavedMessage(""), 2000);
        return;
      }

      const parsed = JSON.parse(raw);
      setSelectedIds(parsed.selectedIds || []);
      setBudget(parsed.budget || "");
      setSavedMessage("Mandje geladen");
      setTimeout(() => setSavedMessage(""), 2000);
    } catch {
      setSavedMessage("Kon mandje niet laden");
      setTimeout(() => setSavedMessage(""), 2000);
    }
  }

  function clearBasket() {
    setSelectedIds([]);
    setBasketResult(null);
    setAiResult(null);
  }

  async function optimizeBasket() {
    try {
      setLoadingBasket(true);
      const res = await fetch(`${API_BASE}/basket/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_ids: selectedIds,
          location: "Amsterdam",
        }),
      });

      const data = await res.json();
      setBasketResult(data);
    } catch (error) {
      console.error("Fout bij basket optimize:", error);
    } finally {
      setLoadingBasket(false);
    }
  }

  async function getAiTips() {
    try {
      setLoadingAI(true);
      const res = await fetch(`${API_BASE}/ai/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_ids: selectedIds,
          budget: budget ? Number(budget) : null,
          location: "Amsterdam",
        }),
      });

      const data = await res.json();
      setAiResult(data);
    } catch (error) {
      console.error("Fout bij AI tips:", error);
    } finally {
      setLoadingAI(false);
    }
  }

  async function sendChat() {
    if (!chatInput.trim()) return;

    const userMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput("");

    try {
      setLoadingChat(true);

      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: "frontend-session",
          message: currentInput,
          product_ids: selectedIds,
        }),
      });

      const data = await res.json();

      let replyText = "";
      if (data.reply) {
        replyText = data.reply;
      } else if (data.fallback && Array.isArray(data.fallback)) {
        replyText = data.fallback.join("\n");
      } else {
        replyText = "Geen antwoord ontvangen.";
      }

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: replyText },
      ]);
    } catch (error) {
      console.error("Fout bij AI chat:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Er ging iets mis met de chat. Probeer opnieuw.",
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  }

  const categories = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.category))];
    return ["Alle", ...unique];
  }, [products]);

  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedIds.includes(p.id));
  }, [products, selectedIds]);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        (product.tags || []).some((tag) => tag.toLowerCase().includes(q)) ||
        (product.reviewLabel || "").toLowerCase().includes(q) ||
        (product.brandType || "").toLowerCase().includes(q);

      const matchesStore =
        activeStore === "all"
          ? true
          : product.prices && product.prices[activeStore] !== undefined;

      const matchesCategory =
        activeCategory === "Alle" ? true : product.category === activeCategory;

      return matchesQuery && matchesStore && matchesCategory;
    });

    if (sortMode === "price-asc") {
      filtered.sort((a, b) => getLowestPrice(a) - getLowestPrice(b));
    } else if (sortMode === "price-desc") {
      filtered.sort((a, b) => getLowestPrice(b) - getLowestPrice(a));
    } else if (sortMode === "name-asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === "favorites") {
      filtered.sort((a, b) => {
        const aFav = favorites.includes(a.id) ? 1 : 0;
        const bFav = favorites.includes(b.id) ? 1 : 0;
        return bFav - aFav;
      });
    } else if (sortMode === "quality-desc") {
      filtered.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
    } else if (sortMode === "value-desc") {
      filtered.sort((a, b) => (b.valueScore || 0) - (a.valueScore || 0));
    }

    return filtered;
  }, [products, searchQuery, activeStore, activeCategory, sortMode, favorites]);

  function getLowestPrice(product) {
    if (!product.prices) return 0;
    return Math.min(...Object.values(product.prices));
  }

  function getCheapestStore(product) {
    return product.cheapestOption?.storeId || null;
  }

  function getStorePrice(product, storeId) {
    if (!product.prices) return null;
    return product.prices[storeId];
  }

  function formatEuro(value) {
    if (value === null || value === undefined) return "-";
    return `€${Number(value).toFixed(2)}`;
  }

  function renderTagBadge(tag) {
    const lower = tag.toLowerCase();

    if (lower.includes("bonus")) {
      return <span className="tag-badge bonus">🔥 Bonus</span>;
    }
    if (lower.includes("actie")) {
      return <span className="tag-badge actie">💸 Actie</span>;
    }
    if (lower.includes("populair")) {
      return <span className="tag-badge populair">⭐ Populair</span>;
    }
    if (lower.includes("gezond")) {
      return <span className="tag-badge gezond">🥗 Gezond</span>;
    }
    if (lower.includes("vers")) {
      return <span className="tag-badge vers">🍎 Vers</span>;
    }
    return <span className="tag-badge">{tag}</span>;
  }

  function qualityLabel(score) {
    if (score >= 8.5) return "Topkwaliteit";
    if (score >= 7.5) return "Goede kwaliteit";
    if (score >= 6.5) return "Redelijk";
    return "Basisniveau";
  }

  const budgetStatus = aiResult?.budgetStatus;
  const selectedLowestTotal = selectedProducts.reduce(
    (sum, p) => sum + (getLowestPrice(p) || 0),
    0
  );
  const possibleSavings = basketResult?.basket?.savingsVsSingleStore || 0;
  const savingsPercent =
    basketResult?.basket?.singleStoreBest?.total > 0
      ? Math.min(
          100,
          Math.round(
            (basketResult.basket.savingsVsSingleStore /
              basketResult.basket.singleStoreBest.total) *
              100
          )
        )
      : 0;

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-topbar">
          <div className="hero-badge">🛒 Smart Grocery Savings + Quality</div>
          <button
            className="mode-toggle"
            onClick={() => setDarkMode((prev) => !prev)}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        <h1>Grocery Discount AI</h1>
        <p>
          Vergelijk supermarktprijzen, kwaliteit en prijs-kwaliteit in één overzicht.
        </p>

        <div className="top-stats">
          <div className="stat-card">
            <span>Producten</span>
            <strong>{products.length}</strong>
          </div>
          <div className="stat-card">
            <span>Geselecteerd</span>
            <strong>{selectedIds.length}</strong>
          </div>
          <div className="stat-card highlight">
            <span>Laagste totaal</span>
            <strong>{formatEuro(selectedLowestTotal)}</strong>
          </div>
          <div className="stat-card">
            <span>Favorieten</span>
            <strong>{favorites.length}</strong>
          </div>
        </div>
      </header>

      <div className="main-grid">
        <section className="panel left-panel">
          <div className="panel-header">
            <div>
              <h2>Select Grocery Items</h2>
              <p className="panel-subtitle">
                Kies producten op prijs, kwaliteit en prijs-kwaliteit.
              </p>
            </div>
            <div className="product-counter">
              {selectedIds.length} geselecteerd
            </div>
          </div>

          <div className="search-row">
            <input
              type="text"
              className="search-input"
              placeholder="Zoek producten, reviews of brand type..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchProducts(e.target.value);
              }}
            />
          </div>

          <div className="toolbar-grid">
            <div className="toolbar-block">
              <label>Winkel</label>
              <div className="store-tabs">
                {Object.entries(STORE_META).map(([storeId, store]) => (
                  <button
                    key={storeId}
                    className={`store-tab ${
                      activeStore === storeId ? "active" : ""
                    }`}
                    onClick={() => setActiveStore(storeId)}
                  >
                    {store.logo ? (
                      <img src={store.logo} alt={store.label} className="store-logo" />
                    ) : (
                      <span className="store-emoji">🛒</span>
                    )}
                    {store.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="toolbar-inline">
              <div className="select-wrap">
                <label>Categorie</label>
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="select-wrap">
                <label>Sorteren</label>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value)}
                >
                  <option value="price-asc">Goedkoopste eerst</option>
                  <option value="price-desc">Duurste eerst</option>
                  <option value="name-asc">Naam A-Z</option>
                  <option value="favorites">Favorieten eerst</option>
                  <option value="quality-desc">Beste kwaliteit</option>
                  <option value="value-desc">Beste prijs-kwaliteit</option>
                </select>
              </div>
            </div>
          </div>

          {loadingProducts ? (
            <p className="loading-text">Producten laden...</p>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => {
                const selected = selectedIds.includes(product.id);
                const displayPrice =
                  activeStore === "all"
                    ? getLowestPrice(product)
                    : getStorePrice(product, activeStore);
                const cheapestStore = getCheapestStore(product);
                const isFavorite = favorites.includes(product.id);

                return (
                  <div
                    key={product.id}
                    className={`product-card ${selected ? "selected" : ""} ${
                      cheapestStore === "aldi" ? "best-deal" : ""
                    }`}
                  >
                    <button
                      className={`favorite-btn ${isFavorite ? "active" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}
                    >
                      {isFavorite ? "❤️" : "🤍"}
                    </button>

                    <div
                      className="product-click-area"
                      onClick={() => toggleProduct(product.id)}
                    >
                      <div className="product-top">
                        <h3>{product.name}</h3>
                        <div className="product-tags">
                          {(product.tags || []).slice(0, 2).map((tag) => (
                            <span key={tag}>{renderTagBadge(tag)}</span>
                          ))}
                        </div>
                      </div>

                      <p className="category">{product.category}</p>

                      <div className="price-line">
                        <span className="price-label">
                          {activeStore === "all" ? "Vanaf" : "Prijs"}
                        </span>
                        <strong>{formatEuro(displayPrice)}</strong>
                      </div>

                      <div className="score-row">
                        <div className="score-pill quality">
                          Kwaliteit: <strong>{product.qualityScore}/10</strong>
                        </div>
                        <div className="score-pill value">
                          Waarde: <strong>{product.valueScore}/10</strong>
                        </div>
                      </div>

                      <div className="review-label">
                        {qualityLabel(product.qualityScore)} • {product.reviewLabel}
                      </div>

                      <div className="best-store-chip">
                        {cheapestStore && STORE_META[cheapestStore]?.logo && (
                          <img
                            src={STORE_META[cheapestStore].logo}
                            alt={STORE_META[cheapestStore].label}
                            className="best-store-logo"
                          />
                        )}
                        Beste deal bij:{" "}
                        <strong>
                          {STORE_META[cheapestStore]?.short || cheapestStore}
                        </strong>
                      </div>

                      <div className="mini-price-row">
                        <span>AH {formatEuro(product.prices?.ah)}</span>
                        <span>Jumbo {formatEuro(product.prices?.jumbo)}</span>
                        <span>Lidl {formatEuro(product.prices?.lidl)}</span>
                        <span>Aldi {formatEuro(product.prices?.aldi)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="action-row">
            <button
              className="primary-btn"
              onClick={optimizeBasket}
              disabled={!selectedIds.length || loadingBasket}
            >
              {loadingBasket ? "Bezig..." : "Optimize Basket"}
            </button>

            <button
              className="secondary-btn"
              onClick={getAiTips}
              disabled={!selectedIds.length || loadingAI}
            >
              {loadingAI ? "Bezig..." : "Get AI Savings Tips"}
            </button>

            <button className="ghost-btn" onClick={saveBasketLocal}>
              Save Basket
            </button>

            <button className="ghost-btn" onClick={loadBasketLocal}>
              Load Basket
            </button>

            <button className="ghost-btn danger" onClick={clearBasket}>
              Clear
            </button>
          </div>

          {savedMessage && <div className="saved-message">{savedMessage}</div>}

          <div className="budget-box">
            <label>Optional budget (€)</label>
            <input
              type="number"
              placeholder="bijv. 20"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
        </section>

        <section className="panel right-panel">
          <div className="panel-header">
            <div>
              <h2>Selected Basket</h2>
              <p className="panel-subtitle">
                Gekozen producten inclusief kwaliteitsscore en waarde.
              </p>
            </div>
          </div>

          {selectedProducts.length === 0 ? (
            <p className="empty-text">Nog geen producten geselecteerd.</p>
          ) : (
            <div className="selected-list">
              {selectedProducts.map((product) => {
  const cheapestStoreId = product.cheapestOption?.storeId;
  const cheapestStoreName = product.cheapestOption?.storeName || getStoreName(cheapestStoreId);

  return (
    <div key={product.id} className="selected-item">
      <div className="selected-item-info">
        <strong>{product.name}</strong>
        <p>{product.category}</p>

        <small>
          Kwaliteit {product.qualityScore}/10 • Waarde {product.valueScore}/10
        </small>

        <div className="selected-store-chip">
          <span>{getStoreIcon(cheapestStoreId)}</span>
          <span>Beste deal bij: <strong>{cheapestStoreName || "Onbekend"}</strong></span>
        </div>
      </div>

      <div className="selected-meta">
        <span>{formatEuro(getLowestPrice(product))}</span>
        {favorites.includes(product.id) && (
          <span className="fav-chip">Favoriet</span>
        )}
      </div>
    </div>
  );
})}
         </div>
          )}

          {basketResult?.basket && (
            <div className="result-card">
              <h3>Basket Optimization</h3>

              <div className="summary-grid">
                <div className="summary-pill">
                  <span>Beste winkel</span>
                  <strong>{basketResult.basket.singleStoreBest?.name}</strong>
                  <small>
                    {formatEuro(basketResult.basket.singleStoreBest?.total)}
                  </small>
                </div>

                <div className="summary-pill">
                  <span>Gem. kwaliteit</span>
                  <strong>{basketResult.basket.averageQualityScore}/10</strong>
                </div>

                <div className="summary-pill savings">
                  <span>Gem. waarde</span>
                  <strong>{basketResult.basket.averageValueScore}/10</strong>
                </div>
              </div>

              <div className="savings-meter-wrap">
                <div className="savings-meter-label">
                  Bespaarscore <strong>{savingsPercent}%</strong>
                </div>
                <div className="savings-meter">
                  <div
                    className="savings-meter-fill"
                    style={{ width: `${savingsPercent}%` }}
                  />
                </div>
              </div>

              <div className="plan-list">
                <h4>Beste split plan</h4>
                {basketResult.basket.splitPlan.map((item, index) => (
                  <div key={index} className="plan-item">
                    <span>{item.item}</span>
                    <span className="plan-item-right">
                      {STORE_META[item.storeId]?.logo && (
                        <img
                          src={STORE_META[item.storeId].logo}
                          alt={STORE_META[item.storeId].label}
                          className="plan-store-logo"
                        />
                      )}
                      {item.storeId.toUpperCase()} • {formatEuro(item.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiResult && (
            <div className="result-card">
              <h3>AI Savings Advice</h3>

              {budgetStatus && (
                <div
                  className={`budget-status ${
                    budgetStatus.withinBudget ? "good" : "bad"
                  }`}
                >
                  {budgetStatus.withinBudget ? (
                    <>
                      ✅ Binnen budget — verschil:{" "}
                      <strong>{formatEuro(budgetStatus.difference)}</strong>
                    </>
                  ) : (
                    <>
                      ⚠️ Over budget — verschil:{" "}
                      <strong>{formatEuro(Math.abs(budgetStatus.difference))}</strong>
                    </>
                  )}
                </div>
              )}

              <ul className="ai-list">
                {(aiResult.insights || []).map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>

              <div className="mini-insight">
                Mogelijke besparing nu: <strong>{formatEuro(possibleSavings)}</strong>
              </div>
            </div>
          )}

          <div className="chat-card">
            <h3>AI Grocery Chat</h3>

            <div className="chat-window">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-bubble ${
                    msg.role === "user" ? "user" : "assistant"
                  }`}
                >
                  {msg.content}
                </div>
              ))}

              {loadingChat && (
                <div className="chat-bubble assistant">AI is aan het typen...</div>
              )}
            </div>

            <div className="chat-input-row">
              <input
                type="text"
                placeholder="Vraag bv: Welke keuze is goedkoop én goed?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendChat();
                }}
              />
              <button onClick={sendChat}>Send</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
