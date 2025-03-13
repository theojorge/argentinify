const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Conexión a MongoDB
const mongoUri = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI || "mongodb://localhost:27017/spotify_artists";

mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB conectada"))
  .catch((err) => console.error("Error de conexión a MongoDB:", err));

// Schema para los artistas
const artistSchema = new mongoose.Schema({
  spotifyId: {
    type: String,
    required: true,
    unique: true,
  },
  artist: {
    type: String,
    required: true,
  },
  listeners: {
    type: String,
    required: true,
  },
  image_url: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Artist = mongoose.model("Artist", artistSchema);

// Ruta para obtener todos los artistas
app.get("/api/artists", async (req, res) => {
  try {
    const artists = await Artist.find(
      {},
      {
        _id: 0,
        artist: 1,
        listeners: 1,
        image_url: 1,
      }
    ).lean();

    res.json(artists);
  } catch (error) {
    console.error("Error al obtener artistas:", error);
    res.status(500).json({ error: "Error al obtener artistas" });
  }
});

// Servir archivos estáticos de React
app.use(express.static(path.join(__dirname, 'dist')));

// Ruta catch-all para React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
