<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
import { useEffect, useMemo, useState } from "react";
import "./style.css";
>>>>>>> dcad7695c63856b2a6513cd55e9df65fa211f3a2

const API_URL = "http://localhost:8000"; // of je Vercel backend

export default function App() {
  const [products, setProducts] = useState([]);
<<<<<<< HEAD
  const [basket, setBasket] = useState([]);
  const [result, setResult] = useState(null);

  // 🔹 producten ophalen
  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then(res => res.json())
      .then(data => setProducts(data.products));
  }, []);

  // 🔹 toevoegen aan basket
  const addToBasket = (product) => {
    setBasket(prev => [...prev, product]);
=======
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
        "Hoi — ik ben je Grocery Discount AI. Zoek producten, vergelijk winkels en ontdek waar je goedkoper uit bent.",
    },
  ]);

  const storeNameMap = {
    ah: "Albert Heijn",
    jumbo: "Jumbo",
    lidl: "Lidl",
    aldi: "Aldi",
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (query = "") => {
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

  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedIds.includes(p.id));
  }, [products, selectedIds]);

  const toggleProduct = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
>>>>>>> dcad7695c63856b2a6513cd55e9df65fa211f3a2
  };

  // 🔹 totaal berekenen (voor display)
  const getTotal = () => {
    return basket.reduce((sum, item) => {
      const cheapest = Math.min(...Object.values(item.prices));
      return sum + cheapest;
    }, 0).toFixed(2);
  };

  // 🔹 optimize call naar backend
  const optimizeBasket = async () => {
<<<<<<< HEAD
    const product_ids = basket.map(p => p.id);

    const res = await fetch(`${API_URL}/basket/optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ product_ids })
    });

    const data = await res.json();
    setResult(data.basket);
  };

  return (
    <div style={{ display: "flex", padding: 20 }}>
      
      {/* LEFT SIDE */}
      <div style={{ flex: 1 }}>
        <h2>Select Grocery Items</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {products.map(product => (
            <div
              key={product.id}
              onClick={() => addToBasket(product)}
              style={{
                border: "1px solid #ccc",
                padding: 10,
                cursor: "pointer",
                borderRadius: 8
              }}
            >
              <h4>{product.category}</h4>
              <p>{product.name}</p>
              <strong>
                From €{Math.min(...Object.values(product.prices))}
              </strong>
            </div>
          ))}
        </div>

        <button onClick={optimizeBasket} style={{ marginTop: 20 }}>
          Optimize Basket
        </button>
      </div>

      {/* RIGHT SIDE */}
      <div style={{ flex: 1, marginLeft: 20 }}>
        <h2>Selected Basket</h2>

        {basket.length === 0 && <p>No products selected yet.</p>}

        {basket.map((item, index) => (
          <div key={index}>
            {item.name}
          </div>
        ))}

        <hr />

        <strong>Total (estimate): €{getTotal()}</strong>

        {/* 🔥 RESULT */}
        {result && (
          <div style={{ marginTop: 20 }}>
            <h3>💰 Savings Result</h3>

            <p>
              Best store: {result.singleStoreBest.name}
            </p>

            <p>
              Single store total: €{result.singleStoreBest.total}
            </p>

            <p>
              Split total: €{result.splitTotal}
            </p>

            <h4>
              You save: €{result.savingsVsSingleStore}
            </h4>
          </div>
        )}
      </div>
=======
    if (!selectedIds.length) return;

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
    if (!selectedIds.length) return;

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

    const messageToSend = chatInput;

    const newUserMessage = { role: "user", content: messageToSend };
    setChatMessages((prev) => [...prev, newUserMessage]);
    setLoadingChat(true);
    setChatInput("");

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: "demo-session",
          message: messageToSend,
          product_ids: selectedIds,
        }),
      });

      const data = await res.json();

      const reply =
        data.reply ||
        (data.fallback ? data.fallback.join(" ") : "Geen antwoord van AI.");

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
          content: "Sorry, er ging iets mis bij het ophalen van AI-advies.",
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>🛒 Grocery Discount AI</h1>
        <p>
          Vergelijk supermarktprijzen in Nederland, zoek producten en ontdek
          waar je het goedkoopst boodschappen doet.
        </p>
      </header>

      <div className="layout">
        <section className="card left-panel">
          <div className="section-header">
            <h2>Zoek producten</h2>
            <p>Zoek op naam, categorie of type product.</p>
          </div>

          <div className="search-row">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek bijv. melk, brood, kip, cola..."
            />
            <button onClick={() => loadProducts(searchQuery)}>Zoeken</button>
            <button
              className="secondary-btn"
              onClick={() => {
                setSearchQuery("");
                loadProducts("");
              }}
            >
              Reset
            </button>
          </div>

          <div className="results-info">
            {loadingProducts ? (
              <span>Producten laden...</span>
            ) : (
              <span>{products.length} producten gevonden</span>
            )}
          </div>

          <div className="product-grid">
            {products.map((product) => {
              const cheapest = Math.min(...Object.values(product.prices || {}));
              const selected = selectedIds.includes(product.id);

              return (
                <button
                  key={product.id}
                  className={`product-card ${selected ? "selected" : ""}`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <div className="product-top">
                    <span className="category-badge">{product.category}</span>
                    {product.tags?.[0] && (
                      <span className="tag-badge">{product.tags[0]}</span>
                    )}
                  </div>

                  <h3 className="product-name">{product.name}</h3>

                  <p className="substitute">
                    Alternatief: {product.substitute}
                  </p>

                  <div className="price-line">
                    <strong>Vanaf €{cheapest.toFixed(2)}</strong>
                  </div>

                  <div className="store-prices">
                    {Object.entries(product.prices || {}).map(([store, price]) => (
                      <div key={store} className="store-price-item">
                        <span>{storeNameMap[store] || store}</span>
                        <span>€{price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="actions">
            <button onClick={optimizeBasket} disabled={!selectedIds.length}>
              {loadingBasket ? "Bezig..." : "Optimaliseer mandje"}
            </button>
            <button onClick={getAIRecommendations} disabled={!selectedIds.length}>
              {loadingAI ? "AI denkt..." : "Vraag AI bespaartips"}
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

        <section className="card right-panel">
          <h2>Geselecteerde producten</h2>

          {selectedProducts.length === 0 ? (
            <p className="empty-text">Nog geen producten geselecteerd.</p>
          ) : (
            <ul className="selected-list">
              {selectedProducts.map((p) => (
                <li key={p.id}>
                  <strong>{p.name}</strong>
                  <span>{p.category}</span>
                </li>
              ))}
            </ul>
          )}

          {basketResult?.basket && (
            <div className="result-box">
              <h3>Mandje optimalisatie</h3>

              {basketResult.basket.singleStoreBest && (
                <>
                  <p>
                    <strong>Beste 1 winkel:</strong>{" "}
                    {basketResult.basket.singleStoreBest.name} (
                    €{basketResult.basket.singleStoreBest.total})
                  </p>

                  <p>
                    <strong>Goedkoopste totaal:</strong> €
                    {basketResult.basket.splitTotal}
                  </p>

                  <p>
                    <strong>Besparing:</strong> €
                    {basketResult.basket.savingsVsSingleStore}
                  </p>
                </>
              )}

              <h4>Beste combinatie per winkel</h4>
              <ul>
                {basketResult.basket.splitPlan.map((item, idx) => (
                  <li key={idx}>
                    <strong>{item.item}</strong> →{" "}
                    {storeNameMap[item.storeId] || item.storeId} (€{item.price})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aiResult && (
            <div className="result-box">
              <h3>AI bespaaradvies</h3>
              <ul>
                {aiResult.insights?.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <section className="card chat-card">
        <h2>AI boodschappencoach</h2>

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
            placeholder="Bijv. Hoe maak ik dit mandje goedkoper?"
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
          />
          <button onClick={sendChat}>Versturen</button>
        </div>
      </section>
>>>>>>> dcad7695c63856b2a6513cd55e9df65fa211f3a2
    </div>
  );
}
