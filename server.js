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
const mongoUri =
  process.env.MONGODB_URI ||
  process.env.VITE_MONGODB_URI ||
  "mongodb://localhost:27017/spotify_artists";

mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB conectada"))
  .catch((err) => console.error("Error de conexión a MongoDB:", err));

// Schema para los artistas
const artistSchema = new mongoose.Schema(
  {
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
  },
  { suppressReservedKeysWarning: true } // Añadir esta opción
);

const Artist = mongoose.model("Artist", artistSchema);

// Schema para el leaderboard
const leaderboardSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  score: { type: Number, required: true },
});

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);

// Ruta para obtener un artista aleatorio
app.post("/api/artists/random", async (req, res) => {
  try {
    const { excludeIds = [], includeListeners = true } = req.body;

    // Definir la proyección base (sin listeners por defecto)
    const projection = {
      _id: 0,
      artist: 1,
      image_url: 1,
      spotifyId: 1,
    };

    // Si includeListeners es true, agregar listeners a la proyección
    if (includeListeners) {
      projection.listeners = 1;
    }
    // Obtener un artista aleatorio que no esté en excludeIds
    const artist = await Artist.aggregate([
      { $match: { spotifyId: { $nin: excludeIds } } },
      { $sample: { size: 1 } },
      { $project: { _id: 0, ...projection } },
    ]).exec();

    //console.log("[API] Resultado de artist:", JSON.stringify(artist, null, 2));

    if (!artist || artist.length === 0) {
      // Si no hay artistas disponibles, resetear y obtener cualquier artista
      const resetArtist = await Artist.aggregate([
        { $sample: { size: 1 } },
        { $project: { projection } },
      ]).exec();

      console.log("[API] Reseteando lista de artistas");
      res.json({ ...resetArtist[0], reset: true });
    } else {
      console.log(`[API] Enviando artista aleatorio: ${artist[0].artist}`);
      res.json(artist[0]);
    }
  } catch (error) {
    console.error("[API] Error al obtener artista aleatorio:", error);
    res.status(500).json({ error: "Error al obtener artista aleatorio" });
  }
});

// Ruta para comparar listeners de un artista con un número dado
app.post("/api/artists/compare", async (req, res) => {
  try {
    const { spotifyId, number, isHigher } = req.body;

    // Validar que todos los parámetros estén presentes y sean del tipo correcto
    if (!spotifyId || typeof spotifyId !== "string") {
      return res.status(400).json({ error: "Se requiere un spotifyId válido" });
    }
    if (number === undefined || typeof number !== "number") {
      return res.status(400).json({ error: "Se requiere un número válido" });
    }
    if (isHigher === undefined || typeof isHigher !== "boolean") {
      return res
        .status(400)
        .json({ error: "Se requiere un boolean para isHigher" });
    }

    // Buscar el artista por spotifyId
    const artist = await Artist.findOne(
      { spotifyId },
      { _id: 0, artist: 1, listeners: 1 }
    ).lean();

    if (!artist) {
      return res.status(404).json({ error: "Artista no encontrado" });
    }

    // Convertir listeners a número (ya que en el esquema es String)
    const listeners = parseInt(artist.listeners, 10);

    if (isNaN(listeners)) {
      return res
        .status(500)
        .json({ error: "Error al procesar los listeners del artista" });
    }

    // Comparar según isHigher
    const isCorrect = isHigher ? listeners > number : listeners < number;

    console.log(
      `[API] Comparando ${listeners} con ${number} (isHigher: ${isHigher}) - Resultado: ${isCorrect}`
    );

    // Devolver el resultado
    res.json({
      listeners,
      isCorrect,
    });
  } catch (error) {
    console.error("[API] Error al comparar listeners:", error);
    res.status(500).json({ error: "Error al comparar listeners" });
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
    console.log(
      `[API] Enviando ${formattedScores.length} puntajes del leaderboard`
    );
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
        await Leaderboard.updateOne({ userId: userId }, { score, username });
        console.log(`[API] Puntaje actualizado para userId: ${userId}`);
      } else {
        console.log(
          `[API] Puntaje no supera el existente para userId: ${userId}`
        );
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
    console.log(
      `[API] Enviando ${formattedScores.length} puntajes actualizados`
    );
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
