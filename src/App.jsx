import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000"; // of je Vercel backend

export default function App() {
  const [products, setProducts] = useState([]);
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
    </div>
  );
}