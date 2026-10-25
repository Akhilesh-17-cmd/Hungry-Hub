
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = https://sonnet-insidious-parrot.abasthan.app/api;

function App() {
  const [foods, setFoods] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadFoods() {
      try {
        const response = await fetch(`${API_URL}/foods`);

        if (!response.ok) {
          throw new Error("Could not load the menu.");
        }

        const data = await response.json();
        setFoods(data);
      } catch {
        setError(
          "Unable to load food items. Make sure the backend and MongoDB are running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadFoods();
  }, []);

  const cartCount = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const total = foods.reduce(
    (sum, food) => sum + food.price * (cart[food._id] || 0),
    0
  );

  function addToCart(id) {
    setMessage("");
    setCart((previous) => ({
      ...previous,
      [id]: (previous[id] || 0) + 1,
    }));
  }

  function changeQuantity(id, amount) {
    setMessage("");
    setCart((previous) => {
      const next = { ...previous };
      const quantity = (next[id] || 0) + amount;

      if (quantity <= 0) {
        delete next[id];
      } else {
        next[id] = quantity;
      }

      return next;
    });
  }

  async function placeOrder() {
    if (cartCount === 0) {
      setMessage("Please add some food to your cart first.");
      return;
    }

    try {
      setMessage("Placing your order...");

      const items = foods
        .filter((food) => cart[food._id] > 0)
        .map((food) => ({
          foodId: food._id,
          quantity: cart[food._id],
        }));

      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not place your order.");
      }

      setMessage(
        `Order placed successfully! Order ID: ${data.order._id}`
      );
      setCart({});
    } catch (err) {
      setMessage(
        err.message || "Unable to place your order. Please try again."
      );
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="#home">
          Hungry <span>Hub.</span>
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#menu">Our Menu</a>
          <a href="#about">About</a>
        </nav>

        <a className="cart-button" href="#cart">
          🛒 Cart <span>{cartCount}</span>
        </a>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <p className="eyebrow">GOOD FOOD, GOOD MOOD</p>
            <h1>Your favourite food, just a click away.</h1>
            <p className="hero-description">
              Fresh flavours, delicious meals and more — find your next
              favourite dish at Hungry Hub.
            </p>
            <a className="primary-button" href="#menu">
              Explore Menu <span>→</span>
            </a>
          </div>

          <div className="hero-art" aria-label="Delicious burger">
            <div className="hero-circle">
              <span>🍔</span>
            </div>
            <div className="floating-note">Made fresh, served with love</div>
          </div>
        </section>

        <section className="menu-section" id="menu">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MADE FOR YOUR CRAVINGS</p>
              <h2>Popular dishes</h2>
            </div>
            <p>Fresh picks, just for you.</p>
          </div>

          {loading && <p>Loading menu...</p>}

          {!loading && error && (
            <p role="alert">{error}</p>
          )}

          {!loading && !error && foods.length === 0 && (
            <p>No food items found. We'll add the menu next.</p>
          )}

          {!loading && !error && foods.length > 0 && (
            <div className="food-grid">
              {foods.map((food) => (
                <article className="food-card" key={food._id}>
                  <div className={`food-image food-image-${(foods.indexOf(food) % 4) + 1}`}>
                    <span>{food.emoji || "🍽️"}</span>
                  </div>

                  <div className="food-details">
                    <h3>{food.name}</h3>
                    <p>{food.description}</p>

                    <div className="food-bottom">
                      <strong>₹{food.price}</strong>

                      {(cart[food._id] || 0) === 0 ? (
                        <button
                          className="add-button"
                          onClick={() => addToCart(food._id)}
                          aria-label={`Add ${food.name} to cart`}
                        >
                          +
                        </button>
                      ) : (
                        <div className="quantity-control">
                          <button
                            onClick={() => changeQuantity(food._id, -1)}
                            aria-label={`Remove one ${food.name}`}
                          >
                            −
                          </button>
                          <span>{cart[food._id]}</span>
                          <button
                            onClick={() => addToCart(food._id)}
                            aria-label={`Add one ${food.name}`}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="cart-section" id="cart">
          <div>
            <h2>Your order</h2>
            <p>
              {cartCount === 0
                ? "Your cart is empty. Add a dish to get started."
                : `${cartCount} item(s) in your cart`}
            </p>
          </div>

          <div className="order-total">
            <span>Total</span>
            <strong>₹{total}</strong>
            <button onClick={placeOrder} disabled={cartCount === 0}>
              Place Order
            </button>
          </div>
        </section>

        {message && (
          <p className="order-message" role="status">
            {message}
          </p>
        )}
      </main>

      <footer id="about">
        <a className="logo footer-logo" href="#home">
          Hungry <span>Hub.</span>
        </a>
        <p>Good food. Good mood. Every day.</p>
        <small>© 2026 Hungry Hub. All rights reserved.</small>
      </footer>
    </div>
  );
}

export default App;
