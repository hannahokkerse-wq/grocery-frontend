import { useEffect, useMemo, useState } from "react";

const API_BASE = "https://grocery-discount-api.onrender.com";

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
  const [loadingBasket, setLoadingBasket] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch((err) => console.error("Failed to load products", err));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = searchTerm.toLowerCase().trim();
      if (!query) return true;

      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.tags || []).some((tag) =>
          tag.toLowerCase().includes(query)
        )
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
          Compare grocery prices, optimize your basket, and get AI-powered
          savings tips.
        </p>
      </header>

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

          <div className="product-grid">
            {filteredProducts.map((product) => {
              const cheapest = Math.min(...Object.values(product.prices || {}));
              return (
                <button
                  key={product.id}
                  className={`product-card ${
                    selectedIds.includes(product.id) ? "selected" : ""
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <h3>{product.name}</h3>
                  <p className="category">{product.category}</p>
                  <span>From €{cheapest.toFixed(2)}</span>
                </button>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <p className="empty-text">No products found for this search.</p>
          )}

          <div className="actions">
            <button onClick={optimizeBasket} disabled={!selectedIds.length}>
              {loadingBasket ? "Optimizing..." : "Optimize Basket"}
            </button>
            <button onClick={getAIRecommendations} disabled={!selectedIds.length}>
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
            <ul className="selected-list">
              {selectedProducts.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          )}

          {basketResult?.basket && (
            <div className="result-box">
              <h3>Basket Optimization</h3>
              <p>
                <strong>Best single store:</strong>{" "}
                {basketResult.basket.singleStoreBest.name} (€
                {basketResult.basket.singleStoreBest.total})
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
                    {item.item} → {item.storeId} (€{item.price})
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
