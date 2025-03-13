const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose
  .connect("mongodb://localhost:27017/spotify_artists")
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

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
