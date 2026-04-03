import { useEffect, useState } from "react";
import "./style.css";

const API_BASE = "https://grocery-discount-api.onrender.com";

export default function App() {
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [basket, setBasket] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [search, setSearch] = useState("");
  const [budget, setBudget] = useState("");

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products));
  }, []);

  const toggleProduct = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const optimize = async () => {
    const res = await fetch(`${API_BASE}/basket/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_ids: selectedIds }),
    });
    const data = await res.json();
    setBasket(data.basket);
  };

  const getAI = async () => {
    const res = await fetch(`${API_BASE}/ai/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_ids: selectedIds,
        budget: budget ? parseFloat(budget) : null,
      }),
    });
    const data = await res.json();
    setAiResult(data);
  };

  const sendChat = async () => {
    if (!chatInput) return;

    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: chatInput,
        product_ids: selectedIds,
      }),
    });

    const data = await res.json();

    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: chatInput },
      { role: "assistant", content: data.reply },
    ]);

    setChatInput("");
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getCheapest = (p) => {
    const entries = Object.entries(p.prices);
    return entries.reduce((min, curr) =>
      curr[1] < min[1] ? curr : min
    );
  };

  return (
    <div className="container">
      <h1>🛒 Grocery Discount AI</h1>

      <div className="grid">
        {/* LEFT */}
        <div className="left">
          <h2>Select Grocery Items</h2>

          <input
            className="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="products">
            {filtered.map((p) => {
              const [store, price] = getCheapest(p);
              const selected = selectedIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  className={`card ${selected ? "selected" : ""}`}
                  onClick={() => toggleProduct(p.id)}
                >
                  <h3>{p.name}</h3>
                  <p className="category">{p.category}</p>

                  <div className="badge">{p.tags[0]}</div>

                  <p className="price">€{price}</p>
                  <p className="store">Cheapest: {store}</p>
                </div>
              );
            })}
          </div>

          <button onClick={optimize}>Optimize Basket</button>
          <button onClick={getAI}>Get AI Tips</button>

          <input
            className="budget"
            placeholder="Budget (€)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>

        {/* RIGHT */}
        <div className="right">
          <h2>Basket</h2>

          {selectedIds.map((id) => {
            const p = products.find((x) => x.id === id);
            return <p key={id}>• {p?.name}</p>;
          })}

          {basket && (
            <div className="box">
              <h3>Optimization</h3>
              <p>
                Best store: {basket.singleStoreBest.name} (€{basket.singleStoreBest.total})
              </p>
              <p>Split total: €{basket.splitTotal}</p>
              <p>Savings: €{basket.savingsVsSingleStore}</p>
            </div>
          )}

          {aiResult && (
            <div className="box">
              <h3>AI Advice</h3>
              {aiResult.insights.map((i, idx) => (
                <p key={idx}>• {i}</p>
              ))}
            </div>
          )}

          {/* CHAT */}
          <div className="chat">
            <h3>AI Chat</h3>

            <div className="messages">
              {chatMessages.map((m, i) => (
                <p key={i} className={m.role}>
                  <b>{m.role}:</b> {m.content}
                </p>
              ))}
            </div>

            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask AI..."
            />
            <button onClick={sendChat}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
