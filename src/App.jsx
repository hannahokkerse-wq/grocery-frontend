import { useEffect, useMemo, useState } from "react";
import "./style.css";

const API_BASE = "https://grocery-discount-api.onrender.com";

export default function App() {
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [basketResult, setBasketResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [budget, setBudget] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingBasket, setLoadingBasket] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hoi 👋 Ik ben je Grocery Discount AI. Zoek producten, vergelijk winkels en ontdek waar je het goedkoopst uit bent.",
    },
  ]);

  const fetchProducts = async (query = "") => {
    setLoadingProducts(true);
    try {
      const url = query.trim()
        ? `${API_BASE}/products?q=${encodeURIComponent(query)}`
        : `${API_BASE}/products`;

      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedIds.includes(p.id));
  }, [products, selectedIds]);

  const toggleProduct = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
          location: "Nederland",
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
          location: "Nederland",
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

    const userMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
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
          content: "Er ging iets mis bij het ophalen van AI-advies.",
        },
      ]);
    } finally {
      setLoadingChat(false);
      setChatInput("");
    }
  };

  const handleSearch = () => {
    fetchProducts(searchQuery);
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>🛒 Grocery Discount AI</h1>
        <p>
          Vergelijk supermarktprijzen, optimaliseer je boodschappenmandje en
          krijg AI-bespaartips.
        </p>
      </header>

      <div className="layout">
        <section className="card">
          <h2>Zoek producten</h2>

          <div className="search-row">
            <input
              type="text"
              placeholder="Zoek bijvoorbeeld: melk, eieren, kipfilet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onClick={handleSearch}>Zoeken</button>
            <button className="secondary-btn" onClick={() => {
              setSearchQuery("");
              fetchProducts("");
            }}>
              Reset
            </button>
          </div>

          <div className="results-info">
            {loadingProducts ? (
              <p>Producten laden...</p>
            ) : (
              <p>{products.length} producten gevonden</p>
            )}
          </div>

          <div className="product-grid">
            {products.map((product) => {
              const cheapest = Math.min(...Object.values(product.prices || {}));
              const isSelected = selectedIds.includes(product.id);

              return (
                <button
                  key={product.id}
                  className={`product-card ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <h3>{product.name}</h3>
                  <p className="category">{product.category}</p>
                  <span className="price">Vanaf €{cheapest.toFixed(2)}</span>

                  {product.tags?.length > 0 && (
                    <div className="tag-row">
                      {product.tags.map((tag, idx) => (
                        <span key={idx} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="actions">
            <button onClick={optimizeBasket} disabled={!selectedIds.length}>
              {loadingBasket ? "Bezig..." : "Optimize Basket"}
            </button>
            <button onClick={getAIRecommendations} disabled={!selectedIds.length}>
              {loadingAI ? "AI denkt na..." : "Get AI Savings Tips"}
            </button>
          </div>

          <div className="budget-box">
            <label>Optioneel budget (€)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Bijv. 25"
            />
          </div>
        </section>

        <section className="card">
          <h2>Geselecteerde producten</h2>

          {selectedProducts.length === 0 ? (
            <p>Nog geen producten geselecteerd.</p>
          ) : (
            <ul className="selected-list">
              {selectedProducts.map((p) => (
                <li key={p.id}>
                  <strong>{p.name}</strong>
                  <br />
                  <span>{p.category}</span>
                </li>
              ))}
            </ul>
          )}

          {basketResult?.basket && (
            <div className="result-box">
              <h3>Basket Optimization</h3>
              <p>
                <strong>Beste winkel:</strong>{" "}
                {basketResult.basket.singleStoreBest.name} (€
                {basketResult.basket.singleStoreBest.total})
              </p>
              <p>
                <strong>Split total:</strong> €{basketResult.basket.splitTotal}
              </p>
              <p>
                <strong>Besparing:</strong> €
                {basketResult.basket.savingsVsSingleStore}
              </p>

              <h4>Goedkoopste verdeling</h4>
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
                <p>
                  <strong>Budget:</strong>{" "}
                  {aiResult.budgetStatus.withinBudget
                    ? `Binnen budget met €${aiResult.budgetStatus.difference}`
                    : `Over budget met €${Math.abs(aiResult.budgetStatus.difference)}`}
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      <section className="card chat-card">
        <h2>AI Grocery Chat</h2>

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
            placeholder="Bijv. Hoe maak ik deze boodschappen goedkoper?"
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
          />
          <button onClick={sendChat}>Verstuur</button>
        </div>
      </section>
    </div>
  );
}
