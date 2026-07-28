import express from "express";
import dotenv from "dotenv";
import supabase from "./config/supabase.js";

dotenv.config();

const app = express();

app.get("/", (req, res) => {
  res.send("HemoConnect360 Backend Running 🚀");
});

// Test Supabase Connection
app.get("/test-db", async (req, res) => {
  const { data, error } = await supabase
    .from("donors") // we'll create this table next
    .select("*");
  
  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
  res.json({
    success: true,
    data,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});