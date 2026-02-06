const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Compression para todas las respuestas
app.use(compression());

// CORS
app.use(cors());

// Body parser con límite de tamaño
app.use(express.json({ limit: "10kb" }));

// Rate limiting para proteger la API
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 1000, // máximo 1000 requests por IP
  message: "Demasiadas solicitudes desde esta IP, intenta nuevamente en 5 minutos",
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting solo a las rutas de API
app.use("/api/", apiLimiter);

const cache = {
  leaderboard: null,
  leaderboardExpiry: 0,
  artistsCount: null,
  artistsCountExpiry: 0,
};

const CACHE_TTL = 60000; // 1 minuto

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.VITE_MONGODB_URI ||
  "mongodb://localhost:27017/spotify_artists";

mongoose
  .connect(mongoUri, {
    maxPoolSize: 10, // Pool de conexiones
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
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
  { suppressReservedKeysWarning: true }
);

// Índices para mejor performance
artistSchema.index({ spotifyId: 1 });

const Artist = mongoose.model("Artist", artistSchema);

// Schema para el leaderboard
const leaderboardSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  score: { type: Number, required: true },
});

// Índices para mejor performance
leaderboardSchema.index({ score: -1 });
leaderboardSchema.index({ userId: 1 }, { unique: true });

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);

// Schema para recomendaciones de artistas
const artistRecommendationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  artistName: { type: String, required: true },
  recommendedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
});

// Índices para mejor performance
artistRecommendationSchema.index({ userId: 1 }, { unique: true });
artistRecommendationSchema.index({ status: 1 });
artistRecommendationSchema.index({ recommendedAt: -1 });

const ArtistRecommendation = mongoose.model("ArtistRecommendation", artistRecommendationSchema);

// Ruta para obtener un artista aleatorio (OPTIMIZADA)
app.post("/api/artists/random", async (req, res) => {
  try {
    const { excludeIds = [], includeListeners = true } = req.body;

    // Definir la proyección
    const projection = {
      _id: 0,
      artist: 1,
      image_url: 1,
      spotifyId: 1,
      ...(includeListeners && { listeners: 1 }),
    };

    // Contar artistas disponibles
    const count = await Artist.countDocuments({
      spotifyId: { $nin: excludeIds },
    });

    if (count === 0) {
      // Si no hay artistas disponibles, resetear y obtener cualquier artista
      const totalCount = await Artist.countDocuments();
      const randomSkip = Math.floor(Math.random() * totalCount);
      const artist = await Artist.findOne()
        .skip(randomSkip)
        .select(projection)
        .lean();

      console.log("[API] Reseteando lista de artistas");
      return res.json({ ...artist, reset: true });
    }

    // Obtener artista aleatorio usando skip 
    const randomSkip = Math.floor(Math.random() * count);
    const artist = await Artist.findOne({
      spotifyId: { $nin: excludeIds },
    })
      .skip(randomSkip)
      .select(projection)
      .lean();

    console.log(`[API] Enviando artista aleatorio: ${artist.artist}`);
    res.json(artist);
  } catch (error) {
    console.error("[API] Error al obtener artista aleatorio:", error);
    res.status(500).json({ error: "Error al obtener artista aleatorio" });
  }
});

// Ruta para obtener listeners de un artista 
app.post("/api/artists/listeners", async (req, res) => {
  try {
    const { spotifyId } = req.body;

    // Validar que spotifyId esté presente
    if (!spotifyId || typeof spotifyId !== "string") {
      return res.status(400).json({ error: "Se requiere un spotifyId válido" });
    }

    // Buscar el artista por spotifyId
    const artist = await Artist.findOne(
      { spotifyId },
      { _id: 0, listeners: 1 }
    ).lean();

    if (!artist) {
      return res.status(404).json({ error: "Artista no encontrado" });
    }

    // Convertir listeners a número
    const listeners = parseInt(artist.listeners, 10);

    if (isNaN(listeners)) {
      return res
        .status(500)
        .json({ error: "Error al procesar los listeners del artista" });
    }

    console.log(`[API] Enviando listeners para spotifyId: ${spotifyId} - ${listeners}`);

    // Devolver solo los listeners 
    res.json({
      listeners,
    });
  } catch (error) {
    console.error("[API] Error al obtener listeners:", error);
    res.status(500).json({ error: "Error al obtener listeners" });
  }
});

// Ruta para obtener todos los puntajes del leaderboard
app.get("/api/leaderboard", async (req, res) => {
  try {
    const now = Date.now();

    // Usar caché si está disponible y no ha expirado
    if (cache.leaderboard && cache.leaderboardExpiry > now) {
      console.log("[API] Usando leaderboard desde caché");
      return res.json(cache.leaderboard);
    }

    // Si no hay caché válido, consultar la base de datos
    const scores = await Leaderboard.find().sort({ score: -1 }).limit(10).lean();
    const formattedScores = scores.map((doc) => ({
      userId: doc.userId.toString(),
      username: doc.username,
      score: doc.score,
    }));

    // Obtener todos los scores para calcular posiciones
    const allScores = await Leaderboard.find().sort({ score: -1 }).lean();
    
    // Si se proporciona userId, calcular su posición y estado de recomendación
    const { userId } = req.query;
    let userInfo = null;
    
    if (userId) {
      const userIndex = allScores.findIndex(score => score.userId.toString() === userId);
      
      if (userIndex !== -1) {
        const userPosition = userIndex + 1;
        const userScore = allScores[userIndex];
        const isInTop10 = userPosition <= 10;
        
        // Verificar si puede recomendar
        let canRecommend = false;
        if (isInTop10) {
          const existingRecommendation = await ArtistRecommendation.findOne({ userId: userId });
          canRecommend = !existingRecommendation;
        }
        
        userInfo = {
          position: userPosition,
          totalPlayers: allScores.length,
          score: userScore.score,
          username: userScore.username,
          isInTop10: isInTop10,
          canRecommend: canRecommend
        };
      }
    }

    const responseData = {
      leaderboard: formattedScores,
      userInfo: userInfo
    };

    // Guardar en caché 
    cache.leaderboard = { leaderboard: formattedScores };
    cache.leaderboardExpiry = now + CACHE_TTL;

    console.log(
      `[API] Enviando ${formattedScores.length} puntajes del leaderboard (guardado en caché)`
    );
    res.json(responseData);
  } catch (error) {
    console.error("[API] Error al obtener leaderboard:", error);
    res.status(500).json({ error: "Error al obtener el leaderboard" });
  }
});

// Ruta para actualizar o crear un puntaje en el leaderboard 
app.post("/api/leaderboard", async (req, res) => {
  const { userId, username, score } = req.body;

  if (!userId || !username || score === undefined) {
    console.log("[API] Solicitud incompleta:", req.body);
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  try {
    // Buscar si ya existe un registro para este userId
    const existingScore = await Leaderboard.findOne({ userId: userId });

    if (existingScore) {
      // Si el nuevo score es mayor, actualizar el registro existente
      if (score > existingScore.score) {
        await Leaderboard.updateOne(
          { userId: userId }, 
          { score: score, username: username }
        );
        console.log(`[API] Puntaje actualizado para userId: ${userId} (${existingScore.score} -> ${score})`);
      } else {
        console.log(
          `[API] Puntaje no supera el existente para userId: ${userId} (${score} <= ${existingScore.score})`
        );
      }
    } else {
      // Si no existe, crear un nuevo registro
      await Leaderboard.create({ userId: userId, username, score });
      console.log(`[API] Nueva entrada creada para userId: ${userId} con score: ${score}`);
    }

    // Invalidar caché del leaderboard
    cache.leaderboard = null;
    cache.leaderboardExpiry = 0;

    // Obtener el leaderboard actualizado
    const updatedScores = await Leaderboard.find().sort({ score: -1 }).limit(10).lean();
    const formattedScores = updatedScores.map((doc) => ({
      userId: doc.userId.toString(),
      username: doc.username,
      score: doc.score,
    }));

    // Actualizar caché con los nuevos datos
    cache.leaderboard = { leaderboard: formattedScores };
    cache.leaderboardExpiry = Date.now() + CACHE_TTL;

    // Calcular información del usuario actualizado
    const allScores = await Leaderboard.find().sort({ score: -1 }).lean();
    const userIndex = allScores.findIndex(score => score.userId.toString() === userId);
    
    let userInfo = null;
    if (userIndex !== -1) {
      const userPosition = userIndex + 1;
      const userScore = allScores[userIndex];
      const isInTop10 = userPosition <= 10;
      
      // Verificar si puede recomendar
      let canRecommend = false;
      if (isInTop10) {
        const existingRecommendation = await ArtistRecommendation.findOne({ userId: userId });
        canRecommend = !existingRecommendation;
      }
      
      userInfo = {
        position: userPosition,
        totalPlayers: allScores.length,
        score: userScore.score,
        username: userScore.username,
        isInTop10: isInTop10,
        canRecommend: canRecommend
      };
    }

    const responseData = {
      leaderboard: formattedScores,
      userInfo: userInfo
    };

    console.log(
      `[API] Enviando ${formattedScores.length} puntajes actualizados con información del usuario`
    );
    res.json(responseData);
  } catch (error) {
    console.error("[API] Error al actualizar leaderboard:", error);
    res.status(500).json({ error: "Error al actualizar el leaderboard" });
  }
});

// Ruta para guardar recomendaciones de artistas
app.post("/api/recommendations", async (req, res) => {
  const { userId, username, artistName } = req.body;

  if (!userId || !username || !artistName) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  try {
    // Verificar si el usuario ya ha recomendado antes
    const existingRecommendation = await ArtistRecommendation.findOne({ userId: userId });
    if (existingRecommendation) {
      return res.status(403).json({ error: "Ya has enviado una recomendación anteriormente" });
    }

    // Verificar si el usuario está en el top 10 
    const topScores = await Leaderboard.find().sort({ score: -1 }).limit(10).lean();
    const isInTop10 = topScores.some(score => score.userId.toString() === userId);
    
    if (!isInTop10) {
      return res.status(403).json({ error: "Debes estar en el top 10 para recomendar artistas" });
    }

    // Limpiar el nombre del artista 
    const cleanArtistName = artistName.replace(/^["']|["']$/g, '').trim();

    // Crear la recomendación
    const recommendation = await ArtistRecommendation.create({
      userId,
      username,
      artistName: cleanArtistName
    });

    console.log(`[API] Recomendación creada: ${username} recomendó ${cleanArtistName}`);
    
    res.status(201).json({
      message: "Recomendación guardada exitosamente",
      recommendation: {
        artistName: cleanArtistName,
        status: recommendation.status,
        recommendedAt: recommendation.recommendedAt
      }
    });
  } catch (error) {
    // Manejar error de duplicado
    if (error.code === 11000) {
      return res.status(403).json({ error: "Ya has enviado una recomendación anteriormente" });
    }
    
    console.error("[API] Error al guardar recomendación:", error);
    res.status(500).json({ error: "Error al guardar la recomendación" });
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