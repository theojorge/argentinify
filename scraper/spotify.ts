import { launch, Browser, Page } from "puppeteer";
import { spotifyArtistsList } from "./artists.js";
import { Artist } from "@/utils/Types.js";
import SpotifyWebApi from "spotify-web-api-node";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Cargar variables de entorno
dotenv.config();

// Configurar Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET || process.env.VITE_SPOTIFY_CLIENT_SECRET,
});

// Configuración de MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI || "mongodb://localhost:27017/spotify_artists";
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB conectada: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error al conectar a MongoDB: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    process.exit(1);
  }
};

// Crear Schema y Modelo para los artistas
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
      index: false, // Asegurarnos de que no se cree un índice único
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

const ArtistModel = mongoose.model("Artist", artistSchema);

// Función para obtener token de acceso
async function getSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body["access_token"]);
    console.log("Token de acceso obtenido correctamente");
  } catch (error) {
    console.error("Error al obtener token de acceso:", error);
    throw error;
  }
}

// Función para obtener datos del artista desde la API de Spotify
async function getArtistFromAPI(spotifyUrl: string) {
  try {
    const artistId = spotifyUrl.split("/artist/")[1].split("?")[0];
    const artistData = await spotifyApi.getArtist(artistId);

    return {
      spotifyId: artistId,
      artist: artistData.body.name,
      image_url: artistData.body.images[0]?.url || null,
    };
  } catch (error) {
    console.error(`Error al obtener datos del artista desde la API:`, error);
    return null;
  }
}

// Función para hacer scraping de oyentes mensuales
async function scrapeMonthlyListeners(
  url: string,
  page: Page
): Promise<string | null> {
  try {
    await page.goto(url);
    await page.waitForSelector(".Ydwa1P5GkCggtLlSvphs", { timeout: 10000 });

    const listeners: string | null = await page.$eval(
      "span.Ydwa1P5GkCggtLlSvphs",
      (element: Element): string | null => {
        const text = element.textContent?.replace(/\D/g, "").trim();
        return text ? text : null;
      }
    );

    return listeners;
  } catch (error) {
    console.error(`Error al hacer scraping de oyentes mensuales:`, error);
    return null;
  }
}

// Función principal para obtener todos los datos
async function scrapeArtistData(
  link: string,
  page: Page
): Promise<Artist | null> {
  try {
    // Obtener nombre y foto desde la API
    const apiData = await getArtistFromAPI(link);
    if (!apiData) {
      console.log(`No se pudieron obtener datos de la API para ${link}`);
      return null;
    }

    // Hacer scraping de oyentes mensuales
    const listeners = await scrapeMonthlyListeners(link, page);
    if (!listeners) {
      console.log(`No se pudieron obtener oyentes mensuales para ${link}`);
      return null;
    }

    const artistData = {
      spotifyId: apiData.spotifyId,
      artist: apiData.artist,
      listeners,
      image_url: apiData.image_url || "",
    };

    console.log(
      `Datos de ${artistData.artist} obtenidos correctamente (${listeners} oyentes)`
    );
    return artistData;
  } catch (error) {
    console.error(`Error al procesar ${link}:`, error);
    return null;
  }
}

// Función para guardar los datos en MongoDB
async function saveToDatabase(data: Artist) {
  try {
    const result = await ArtistModel.findOneAndUpdate(
      { spotifyId: data.spotifyId },
      {
        $set: {
          spotifyId: data.spotifyId,
          artist: data.artist,
          listeners: data.listeners,
          image_url: data.image_url,
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    console.log(
      `Artista ${data.artist} actualizado/guardado en la base de datos`
    );
    return result;
  } catch (error) {
    console.error(`Error al guardar en la base de datos:`, error);
    throw error;
  }
}

async function main() {
  let connection;
  let browser;

  try {
    // Conectar a la base de datos
    connection = await connectDB();

    // Obtener token de acceso
    await getSpotifyToken();

    // Iniciar Puppeteer
    browser = await launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page: Page = await browser.newPage();

    // Configurar el user agent para evitar detección
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
    );

    let successCount = 0;
    let failCount = 0;

    // Procesar cada artista
    for (const link of spotifyArtistsList) {
      const artist: Artist | null = await scrapeArtistData(link, page);

      if (artist) {
        // Guardar en la base de datos en lugar de añadir al array
        await saveToDatabase(artist);
        successCount++;
      } else {
        failCount++;
      }

      // Pausa breve para evitar bloqueos
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log(
      `Proceso completado. Éxitos: ${successCount}, Fallos: ${failCount}`
    );
  } catch (error) {
    console.error("Error en el proceso principal:", error);
  } finally {
    // Cerrar el navegador y la conexión a la base de datos
    if (browser) await browser.close();
    if (connection) await mongoose.connection.close();
    console.log("Recursos liberados correctamente");
  }
}

main();
