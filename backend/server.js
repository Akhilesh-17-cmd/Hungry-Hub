
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/hungryHub")
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection error:", error.message));

// Food schema
const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  emoji: { type: String, default: "🍽️" },
});

const Food = mongoose.model("Food", foodSchema);

// Order schema
const orderSchema = new mongoose.Schema({
  items: [
    {
      foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  total: { type: Number, required: true },
  status: { type: String, default: "Placed" },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

// Home route
app.get("/", (req, res) => {
  res.send("Welcome to the Hungry Hub API!");
});

// Get all foods
app.get("/api/foods", async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch foods" });
  }
});

// Get one food by ID
app.get("/api/foods/:id", async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    res.json(food);
  } catch (error) {
    res.status(400).json({ message: "Invalid food ID" });
  }
});

// Add a food
app.post("/api/foods", async (req, res) => {
  try {
    const { name, description, price, emoji } = req.body;

    if (!name || price == null || Number(price) < 0) {
      return res.status(400).json({
        message: "A food name and valid price are required",
      });
    }

    const food = await Food.create({
      name,
      description,
      price: Number(price),
      emoji,
    });

    res.status(201).json(food);
  } catch (error) {
    res.status(400).json({ message: "Failed to add food" });
  }
});

// Update a food
app.put("/api/foods/:id", async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    res.json(food);
  } catch (error) {
    res.status(400).json({ message: "Failed to update food" });
  }
});

// Delete a food
app.delete("/api/foods/:id", async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);

    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    res.json({ message: "Food deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete food" });
  }
});

// Place an order
app.post("/api/orders", async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Your order is empty" });
    }

    let total = 0;
    const verifiedItems = [];

    for (const item of items) {
      const food = await Food.findById(item.foodId);
      const quantity = Number(item.quantity);

      if (!food || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          message: "Invalid food item or quantity",
        });
      }

      verifiedItems.push({
        foodId: food._id,
        name: food.name,
        price: food.price,
        quantity,
      });

      total += food.price * quantity;
    }

    const order = await Order.create({
      items: verifiedItems,
      total,
    });

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    res.status(400).json({ message: "Failed to place order" });
  }
});

// Get all orders
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Hungry Hub API running at http://localhost:${PORT}`);
});
