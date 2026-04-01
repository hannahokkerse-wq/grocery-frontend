import { useEffect, useMemo, useState } from "react";
import "./style.css";

const API_BASE = "https://grocery-backend-fawn.vercel.app";

export default function App() {
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [basketResult, setBasketResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [budget, setBudget] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi — I’m your Grocery Discount AI assistant. Ask me how to save money on your basket.",
    },
  ]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingBasket, setLoadingBasket] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        setError("");

        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error("Failed to load products", err);
        setError("Could not load products from backend.");
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.tags || []).some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [products, searchTerm]);

  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedIds.includes(p.id));
  }, [products, selectedIds]);

  const toggleProduct = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const optimizeBasket = async () => {
    if (!selectedIds.length) return;

    setLoadingBasket(true);
    setBasketResult(null);
    setError("");

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

      if (!res.ok) throw new Error("Basket optimize failed");

      const data = await res.json();
      setBasketResult(data);
    } catch (err) {
      console.error("Basket optimize failed", err);
      setError("Basket optimization failed.");
    } finally {
      setLoadingBasket(false);
    }
  };

  const getAIRecommendations = async () => {
    if (!selectedIds.length) return;

    setLoadingAI(true);
    setAiResult(null);
    setError("");

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

      if (!res.ok) throw new Error("AI recommendations failed");

      const data = await res.json();
      setAiResult(data);
    } catch (err) {
      console.error("AI recommendations failed", err);
      setError("AI savings recommendations failed.");
    } finally {
      setLoadingAI(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;

    const newUserMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, newUserMessage]);
    setLoadingChat(true);
    setError("");

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

      if (!res.ok) throw new Error("Chat failed");

      const data = await res.json();

      const reply =
        data.reply ||
        (data.fallback ? data.fallback.join(" ") : "No response from AI.");

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
          content: "Sorry, something went wrong while contacting the AI.",
        },
      ]);
      setError("Chat request failed.");
    } finally {
      setLoadingChat(false);
      setChatInput("");
    }
  };

  const formatStoreName = (storeId) => {
    const map = {
      freshmart: "FreshMart",
      valuefoods: "ValueFoods",
      greenbasket: "GreenBasket",
    };
    return map[storeId] || storeId;
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>🛒 Grocery Discount AI</h1>
        <p>
          Compare grocery prices, optimize your basket, and get AI-powered
          savings tips.
        </p>
      </header>

      {error && (
        <div
          className="card"
          style={{
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#991b1b",
            marginBottom: "20px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="layout">
        <section className="card">
          <h2>Select Grocery Items</h2>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search products (e.g. milk, rice, yogurt...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loadingProducts ? (
            <p>Loading products...</p>
          ) : (
            <>
              <p style={{ marginBottom: "16px", color: "#64748b" }}>
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""} found
              </p>

              <div className="product-grid">
                {filteredProducts.map((product) => {
                  const prices = Object.values(product.prices || {});
                  const cheapest = Math.min(...prices);

                  return (
                    <button
                      key={product.id}
                      className={`product-card ${
                        selectedIds.includes(product.id) ? "selected" : ""
                      }`}
                      onClick={() => toggleProduct(product.id)}
                    >
                      <div>
                        <div className="badge-row">
                          {product.tags?.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="tag-badge">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <h3>{product.name}</h3>
                        <p className="category">{product.category}</p>

                        <div className="price-preview">
                          {Object.entries(product.prices || {}).map(
                            ([storeId, price]) => (
                              <div key={storeId} className="store-price-line">
                                <span>{formatStoreName(storeId)}</span>
                                <strong>€{price.toFixed(2)}</strong>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="cheapest-row">
                        <span className="cheapest-label">Lowest price</span>
                        <span className="cheapest-price">
                          €{cheapest.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {!loadingProducts && filteredProducts.length === 0 && (
            <p className="empty-text">No products found for this search.</p>
          )}

          <div className="actions">
            <button
              onClick={optimizeBasket}
              disabled={!selectedIds.length || loadingProducts}
            >
              {loadingBasket ? "Optimizing..." : "Optimize Basket"}
            </button>
            <button
              onClick={getAIRecommendations}
              disabled={!selectedIds.length || loadingProducts}
            >
              {loadingAI ? "Thinking..." : "Get AI Savings Tips"}
            </button>
          </div>

          <div className="budget-box">
            <label>Optional budget (€)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 20"
            />
          </div>
        </section>

        <section className="card">
          <h2>Selected Basket</h2>

          {selectedProducts.length === 0 ? (
            <p>No products selected yet.</p>
          ) : (
            <div className="selected-products-box">
              {selectedProducts.map((p) => (
                <div key={p.id} className="selected-product-pill">
                  {p.name}
                </div>
              ))}
            </div>
          )}

          {basketResult?.basket && (
            <div className="result-box">
              <h3>Basket Optimization</h3>
              <p>
                <strong>Best single store:</strong>{" "}
                {basketResult.basket.singleStoreBest?.name} (€
                {basketResult.basket.singleStoreBest?.total})
              </p>
              <p>
                <strong>Split total:</strong> €{basketResult.basket.splitTotal}
              </p>
              <p>
                <strong>Savings:</strong> €
                {basketResult.basket.savingsVsSingleStore}
              </p>

              <h4>Best split plan</h4>
              <ul>
                {basketResult.basket.splitPlan.map((item, idx) => (
                  <li key={idx}>
                    {item.item} → {formatStoreName(item.storeId)} (€{item.price})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aiResult && (
            <div className="result-box">
              <h3>AI Savings Advice</h3>
              <ul>
                {aiResult.insights?.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>

              {aiResult.budgetStatus && (
                <p>
                  <strong>Budget:</strong>{" "}
                  {aiResult.budgetStatus.withinBudget
                    ? `Within budget by €${aiResult.budgetStatus.difference}`
                    : `Over budget by €${Math.abs(
                        aiResult.budgetStatus.difference
                      )}`}
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
              <strong>{msg.role === "user" ? "You" : "AI"}:</strong>{" "}
              {msg.content}
            </div>
          ))}
          {loadingChat && (
            <div className="chat-message assistant">AI is typing...</div>
          )}
        </div>

        <div className="chat-input-row">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask: How can I make this basket cheaper?"
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
          />
          <button onClick={sendChat}>Send</button>
        </div>
      </section>
    </div>
  );
}
