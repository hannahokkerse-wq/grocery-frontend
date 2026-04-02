import { useEffect, useMemo, useState } from "react";

const API_BASE = "https://grocery-discount-api.onrender.com";

export default function App() {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [basketResult, setBasketResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [budget, setBudget] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hoi — ik ben je Grocery Discount AI. Vraag me hoe je slimmer en goedkoper boodschappen kunt doen.",
    },
  ]);

  const [loadingBasket, setLoadingBasket] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch((err) => console.error("Failed to load products", err));

    fetch(`${API_BASE}/stores`)
      .then((res) => res.json())
      .then((data) => setStores(data.stores || []))
      .catch((err) => console.error("Failed to load stores", err));
  }, []);

  const categories = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.category))];
    return unique.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.category.toLowerCase().includes(search.toLowerCase()) ||
        (product.tags || []).some((tag) =>
          tag.toLowerCase().includes(search.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;

      const matchesStore =
        selectedStore === "all" || product.prices?.[selectedStore] !== undefined;

      return matchesSearch && matchesCategory && matchesStore;
    });
  }, [products, search, selectedCategory, selectedStore]);

  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedIds.includes(p.id));
  }, [products, selectedIds]);

  const toggleProduct = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getCheapestInfo = (product) => {
    const entries = Object.entries(product.prices || {});
    if (!entries.length) return null;

    const cheapest = entries.reduce((min, curr) =>
      curr[1] < min[1] ? curr : min
    );

    return {
      storeId: cheapest[0],
      price: cheapest[1],
    };
  };

  const optimizeBasket = async () => {
    setLoadingBasket(true);
    setBasketResult(null);

    try {
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
    } catch (err) {
      console.error("Basket optimize failed", err);
    } finally {
      setLoadingBasket(false);
    }
  };

  const getAIRecommendations = async () => {
    setLoadingAI(true);
    setAiResult(null);

    try {
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
    } catch (err) {
      console.error("AI recommendations failed", err);
    } finally {
      setLoadingAI(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;

    const newUserMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, newUserMessage]);
    setLoadingChat(true);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: "demo-session",
          message: chatInput,
          product_ids: selectedIds,
        }),
      });

      const data = await res.json();

      const reply =
        data.reply ||
        (data.fallback ? data.fallback.join(" ") : "Geen reactie van AI.");

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
    } catch (err) {
      console.error("Chat failed", err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, er ging iets mis bij de AI chat.",
        },
      ]);
    } finally {
      setLoadingChat(false);
      setChatInput("");
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>🛒 Grocery Discount AI</h1>
        <p>
          Vergelijk supermarktprijzen in Nederland, optimaliseer je mandje en
          krijg slimme bespaartips.
        </p>
      </header>

      <section className="filters card">
        <div className="filters-grid">
          <div className="filter-box">
            <label>Zoek product</label>
            <input
              type="text"
              placeholder="Bijv. melk, brood, pasta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-box">
            <label>Filter supermarkt</label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              <option value="all">Alle winkels</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-box">
            <label>Filter categorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Alle categorieën</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="layout">
        <section className="card">
          <div className="section-header">
            <h2>Supermarkt Producten</h2>
            <span>{filteredProducts.length} producten</span>
          </div>

          <div className="product-list">
            {filteredProducts.map((product) => {
              const cheapest = getCheapestInfo(product);
              const isSelected = selectedIds.includes(product.id);

              return (
                <div
                  key={product.id}
                  className={`product-row ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <div className="product-main">
                    <div className="product-top">
                      <h3>{product.name}</h3>
                      {product.tags?.[0] && (
                        <span className="tag-badge">{product.tags[0]}</span>
                      )}
                    </div>

                    <p className="product-category">{product.category}</p>

                    <p className="substitute">
                      Slim alternatief: {product.substitute}
                    </p>

                    <div className="price-grid">
                      {stores.map((store) => (
                        <div key={store.id} className="price-pill">
                          <span>{store.name}</span>
                          <strong>
                            €
                            {product.prices?.[store.id] !== undefined
                              ? product.prices[store.id].toFixed(2)
                              : "-"}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="product-side">
                    <div className="cheapest-box">
                      <small>Goedkoopst</small>
                      <strong>
                        {stores.find((s) => s.id === cheapest?.storeId)?.name ||
                          "-"}
                      </strong>
                      <span>€{cheapest?.price?.toFixed(2) || "-"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card sidebar">
          <h2>Geselecteerde Boodschappen</h2>

          {selectedProducts.length === 0 ? (
            <p className="empty-state">Nog geen producten geselecteerd.</p>
          ) : (
            <ul className="selected-list">
              {selectedProducts.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <span className="category-chip">{p.category}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="actions">
            <button onClick={optimizeBasket} disabled={!selectedIds.length}>
              {loadingBasket ? "Berekenen..." : "Mandje Optimaliseren"}
            </button>
            <button onClick={getAIRecommendations} disabled={!selectedIds.length}>
              {loadingAI ? "Analyseren..." : "AI Bespaartips"}
            </button>
          </div>

          <div className="budget-box">
            <label>Budget (€)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Bijv. 25"
            />
          </div>

          {basketResult?.basket && (
            <div className="result-box">
              <h3>Mandje Optimalisatie</h3>
              <p>
                <strong>Beste 1 winkel:</strong>{" "}
                {basketResult.basket.singleStoreBest?.name} (€
                {basketResult.basket.singleStoreBest?.total})
              </p>
              <p>
                <strong>Gesplitste totaalprijs:</strong> €
                {basketResult.basket.splitTotal}
              </p>
              <p>
                <strong>Besparing:</strong> €
                {basketResult.basket.savingsVsSingleStore}
              </p>

              <h4>Beste verdeling</h4>
              <ul>
                {basketResult.basket.splitPlan.map((item, idx) => (
                  <li key={idx}>
                    {item.item} → {item.storeId.toUpperCase()} (€{item.price})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aiResult && (
            <div className="result-box">
              <h3>AI Bespaaradvies</h3>
              <ul>
                {aiResult.insights?.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>

              {aiResult.budgetStatus && (
                <p className="budget-status">
                  <strong>Budgetcheck:</strong>{" "}
                  {aiResult.budgetStatus.withinBudget
                    ? `Binnen budget met €${aiResult.budgetStatus.difference}`
                    : `Over budget met €${Math.abs(
                        aiResult.budgetStatus.difference
                      )}`}
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      <section className="card chat-card">
        <h2>AI Boodschappen Assistent</h2>
        <div className="chat-box">
          {chatMessages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.role}`}>
              <strong>{msg.role === "user" ? "Jij" : "AI"}:</strong>{" "}
              {msg.content}
            </div>
          ))}
          {loadingChat && (
            <div className="chat-message assistant">AI is aan het typen...</div>
          )}
        </div>

        <div className="chat-input-row">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Vraag bijv.: Waar koop ik dit mandje het goedkoopst?"
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
          />
          <button onClick={sendChat}>Verstuur</button>
        </div>
      </section>
    </div>
  );
}
