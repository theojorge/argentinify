import { spotifyArtistsList } from "./artists.js";
import SpotifyWebApi from "spotify-web-api-node";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { launch, Page } from "puppeteer";

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
    if (!mongoUri) {
        throw new Error("MONGODB_URI no está definida");
    }
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB conectada: ${conn.connection.host}`);
    return conn;
  } catch (e) {
    console.error("Error Mongo:", e);
    process.exit(1);
  }
};

const artistSchema = new mongoose.Schema(
  {
    spotifyId: { type: String, unique: true, required: true },
    artist: { type: String, required: true },
    followers: { type: Number, required: true },
    listeners: { type: Number, required: true },
    image_url: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { suppressReservedKeysWarning: true }
);

const ArtistModel = mongoose.model("Artist", artistSchema);

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

async function getSpotifyToken() {
  const data = await spotifyApi.clientCredentialsGrant();
  spotifyApi.setAccessToken(data.body.access_token);
  console.log("Token Spotify OK");
}

async function scrapeMonthlyListeners(
  url: string,
  page: Page
): Promise<number | null> {
  try {
    // console.log(`[OYENTES] Navegando a: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const result = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const match = bodyText.match(/(\d[\d,.\s]*\d)\s*oyentes\s*mensuales/i);

      if (match && match[1]) {
        const cleaned = match[1].replace(/[^\d]/g, "");

        if (cleaned.length >= 5 && cleaned.length <= 10) {
          return cleaned;
        }
      }

      return null;
    });

    if (result) {
      const listeners = parseInt(result, 10);
      console.log(`[OYENTES] ✅ ${listeners.toLocaleString()}`);
      return listeners;
    }

    console.log("[OYENTES] ❌ No encontrado");
    return null;
  } catch (err) {
    console.error(
      "[OYENTES] ❌ Error:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

async function getArtistFromAPI(url: string) {
  try {
    const id = url.split("/artist/")[1].split("?")[0];
    const data = await spotifyApi.getArtist(id);

    return {
      spotifyId: id,
      artist: data.body.name,
      followers: data.body.followers.total,
      image_url: data.body.images[0]?.url || "",
    };
  } catch (e) {
    console.error("API error:", e);
    return null;
  }
}

async function saveToDatabase(data: any) {
  await ArtistModel.findOneAndUpdate(
    { spotifyId: data.spotifyId },
    { $set: data, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  console.log(`Guardado: ${data.artist}`);
}

async function main() {
  let conn;
  let browser;

  try {
    conn = await connectDB();
    await getSpotifyToken();

    browser = await launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    for (const url of spotifyArtistsList) {
      const api = await getArtistFromAPI(url);
      if (!api) continue;

      const listeners = await scrapeMonthlyListeners(url, page);
      if (!listeners) {
        console.log("No oyentes ->", api.artist);
        continue;
      }

      await saveToDatabase({
        ...api,
        listeners,
      });

      await new Promise((res) => setTimeout(res, 1500));
    }

    console.log("Terminado.");
  } finally {
    if (browser) await browser.close();
    if (conn) await mongoose.connection.close();
  }
}

main();
