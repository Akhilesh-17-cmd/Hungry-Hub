
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  emoji: { type: String, default: "🍽️" },
});

const Food = mongoose.model("Food", foodSchema);

const orderSchema = new mongoose.Schema({
  items: [
    {
      foodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Food",
      },
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

app.get("/", (req, res) => {
  res.send("Welcome to the Hungry Hub API!");
});

app.get("/api/foods", async (req, res) => {
  try {
    res.json(await Food.find());
  } catch (error) {
    console.error("Fetch foods error:", error.message);
    res.status(500).json({ message: "Failed to fetch foods" });
  }
});

app.get("/api/foods/:id", async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: "Food not found" });
    res.json(food);
  } catch (error) {
    res.status(400).json({ message: "Invalid food ID" });
  }
});

app.post("/api/foods", async (req, res) => {
  try {
    const { name, description, price, emoji } = req.body;

    if (!name || price == null || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: "A food name and valid price are required" });
    }

    const food = await Food.create({
      name,
      description,
      price: Number(price),
      emoji,
    });

    res.status(201).json(food);
  } catch (error) {
    console.error("Create food error:", error.message);
    res.status(400).json({ message: "Failed to add food" });
  }
});

app.put("/api/foods/:id", async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!food) return res.status(404).json({ message: "Food not found" });
    res.json(food);
  } catch (error) {
    res.status(400).json({ message: "Failed to update food" });
  }
});

app.delete("/api/foods/:id", async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ message: "Food not found" });
    res.json({ message: "Food deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid food ID" });
  }
});

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
        return res.status(400).json({ message: "Invalid food item or quantity" });
      }

      verifiedItems.push({
        foodId: food._id,
        name: food.name,
        price: food.price,
        quantity,
      });

      total += food.price * quantity;
    }

    const order = await Order.create({ items: verifiedItems, total });

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error("Place order error:", error.message);
    res.status(400).json({ message: "Failed to place order" });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    res.json(await Order.find().sort({ createdAt: -1 }));
  } catch (error) {
    console.error("Fetch orders error:", error.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Start the web server first so the hosting platform can detect its port.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Hungry Hub API running on port ${PORT}`);
});

// Connect to MongoDB separately and print any connection error.
async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("MONGODB_URI is missing. Check the hosting environment variables.");
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
}

connectDatabase();
