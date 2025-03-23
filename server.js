const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

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

// Schema para el leaderboard
const leaderboardSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  score: { type: Number, required: true },
});

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);

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
    console.log(`[API] Enviando ${artists.length} artistas`);
    res.json(artists);
  } catch (error) {
    console.error("[API] Error al obtener artistas:", error);
    res.status(500).json({ error: "Error al obtener artistas" });
  }
});

// Ruta para obtener todos los puntajes del leaderboard
app.get("/api/leaderboard", async (req, res) => {
  try {
    const scores = await Leaderboard.find().sort({ score: -1 }).lean();
    const formattedScores = scores.map((doc) => ({
      userId: doc.userId.toString(),
      username: doc.username,
      score: doc.score,
    }));
    console.log(`[API] Enviando ${formattedScores.length} puntajes del leaderboard`);
    res.json(formattedScores);
  } catch (error) {
    console.error("[API] Error al obtener leaderboard:", error);
    res.status(500).json({ error: "Error al obtener el leaderboard" });
  }
});

// Ruta para actualizar o crear un puntaje en el leaderboard
app.post("/api/leaderboard", async (req, res) => {
  const { userId, username, score } = req.body;

  if (!userId || !username || !score) {
    console.log("[API] Solicitud incompleta:", req.body);
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  try {
    const existingScore = await Leaderboard.findOne({ userId: userId });

    if (existingScore) {
      if (score > existingScore.score) {
        await Leaderboard.updateOne(
          { userId: userId },
          { score, username }
        );
        console.log(`[API] Puntaje actualizado para userId: ${userId}`);
      } else {
        console.log(`[API] Puntaje no supera el existente para userId: ${userId}`);
      }
    } else {
      await Leaderboard.create({ userId: userId, username, score });
      console.log(`[API] Nueva entrada creada para userId: ${userId}`);
    }

    const updatedScores = await Leaderboard.find().sort({ score: -1 }).lean();
    const formattedScores = updatedScores.map((doc) => ({
      userId: doc.userId.toString(),
      username: doc.username,
      score: doc.score,
    }));
    console.log(`[API] Enviando ${formattedScores.length} puntajes actualizados`);
    res.json(formattedScores);
  } catch (error) {
    console.error("[API] Error al actualizar leaderboard:", error);
    res.status(500).json({ error: "Error al actualizar el leaderboard" });
  }
});

// Servir archivos estáticos de React
app.use(express.static(path.join(__dirname, "dist")));

// Ruta catch-all para React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});