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
        "Hoi — ik ben je Grocery Discount AI. Zoek producten, vergelijk winkels en vraag hoe je goedkoper boodschappen kunt doen.",
    },
  ]);

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
  };

  const optimizeBasket = async () => {
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

  const storeNameMap = {
    ah: "Albert Heijn",
    jumbo: "Jumbo",
    lidl: "Lidl",
    aldi: "Aldi",
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>🛒 Grocery Discount AI</h1>
        <p>
          Vergelijk supermarktprijzen in Nederland, optimaliseer je mandje en
          ontdek waar je het goedkoopst uit bent.
        </p>
      </header>

      <div className="layout">
        <section className="card left-panel">
          <div className="section-header">
            <h2>Zoek producten</h2>
            <p>Zoek op naam, categorie of soort product.</p>
          </div>

          <div className="search-row">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Bijv. melk, brood, kip, fruit..."
            />
            <button onClick={() => loadProducts(searchQuery)}>Zoeken</button>
            <button className="secondary-btn" onClick={() => {
              setSearchQuery("");
              loadProducts("");
            }}>
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

                  <h3>{product.name}</h3>

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

              {aiResult.budgetStatus && (
                <div className="budget-result">
                  <strong>Budgetcheck:</strong>{" "}
                  {aiResult.budgetStatus.withinBudget
                    ? `Je zit €${aiResult.budgetStatus.difference} onder budget`
                    : `Je zit €${Math.abs(
                        aiResult.budgetStatus.difference
                      )} boven budget`}
                </div>
              )}
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
    </div>
  );
}
