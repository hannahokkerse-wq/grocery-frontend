import { useEffect, useMemo, useState } from "react";
import "./style.css";

const API_BASE = "https://grocery-discount-api.onrender.com";

const STORE_META = {
  all: { label: "Alle winkels", emoji: "🛒" },
  ah: { label: "Albert Heijn", emoji: "🟦" },
  jumbo: { label: "Jumbo", emoji: "🟨" },
  lidl: { label: "Lidl", emoji: "🟦" },
  aldi: { label: "Aldi", emoji: "🟦" },
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [basketResult, setBasketResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [budget, setBudget] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStore, setActiveStore] = useState("all");

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingBasket, setLoadingBasket] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hoi 👋 Ik ben je Grocery Discount AI. Vraag me hoe je kunt besparen op je mandje.",
    },
  ]);

  useEffect(() => {
    fetchProducts();
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
          message: chatInput,
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

  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedIds.includes(p.id));
  }, [products, selectedIds]);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const q = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        (product.tags || []).some((tag) => tag.toLowerCase().includes(q))
      );
    });

    if (activeStore !== "all") {
      filtered = filtered.filter(
        (product) => product.prices && product.prices[activeStore] !== undefined
      );
    }

    return filtered;
  }, [products, searchQuery, activeStore]);

  function getLowestPrice(product) {
    if (!product.prices) return null;
    return Math.min(...Object.values(product.prices));
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

  const budgetStatus = aiResult?.budgetStatus;

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-badge">🛒 Smart Grocery Savings</div>
        <h1>Grocery Discount AI</h1>
        <p>
          Vergelijk supermarktprijzen, optimaliseer je mandje en krijg slimme
          AI-bespaartips.
        </p>
      </header>

      <div className="main-grid">
        <section className="panel left-panel">
          <div className="panel-header">
            <div>
              <h2>Select Grocery Items</h2>
              <p className="panel-subtitle">
                Kies producten en vergelijk direct prijzen tussen winkels.
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
              placeholder="Zoek producten (bijv. melk, rijst, yoghurt...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchProducts(e.target.value);
              }}
            />
          </div>

          <div className="store-tabs">
            {Object.entries(STORE_META).map(([storeId, store]) => (
              <button
                key={storeId}
                className={`store-tab ${
                  activeStore === storeId ? "active" : ""
                }`}
                onClick={() => setActiveStore(storeId)}
              >
                <span>{store.emoji}</span> {store.label}
              </button>
            ))}
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

                return (
                  <div
                    key={product.id}
                    className={`product-card ${selected ? "selected" : ""}`}
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

                    <div className="mini-price-row">
                      <span>AH {formatEuro(product.prices?.ah)}</span>
                      <span>Jumbo {formatEuro(product.prices?.jumbo)}</span>
                      <span>Lidl {formatEuro(product.prices?.lidl)}</span>
                      <span>Aldi {formatEuro(product.prices?.aldi)}</span>
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
          </div>

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
                Jouw gekozen producten en slimme aanbevelingen.
              </p>
            </div>
          </div>

          {selectedProducts.length === 0 ? (
            <p className="empty-text">Nog geen producten geselecteerd.</p>
          ) : (
            <div className="selected-list">
              {selectedProducts.map((product) => (
                <div key={product.id} className="selected-item">
                  <div>
                    <strong>{product.name}</strong>
                    <p>{product.category}</p>
                  </div>
                  <span>{formatEuro(getLowestPrice(product))}</span>
                </div>
              ))}
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
                  <span>Split totaal</span>
                  <strong>{formatEuro(basketResult.basket.splitTotal)}</strong>
                </div>

                <div className="summary-pill savings">
                  <span>Besparing</span>
                  <strong>
                    {formatEuro(basketResult.basket.savingsVsSingleStore)}
                  </strong>
                </div>
              </div>

              <div className="plan-list">
                <h4>Beste split plan</h4>
                {basketResult.basket.splitPlan.map((item, index) => (
                  <div key={index} className="plan-item">
                    <span>{item.item}</span>
                    <span>
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
                placeholder="Vraag bv: Hoe kan ik goedkoper boodschappen doen?"
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
