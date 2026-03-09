const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello dari backend 🚀");
});

app.listen(3000, () => {
  console.log("Server jalan di http://localhost:3000");
});