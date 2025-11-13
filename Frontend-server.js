// ================================
// 🌐 FRONTEND SERVER + KAFKA PRODUCER
// ================================

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { Kafka } from "kafkajs";

// --- Création du serveur Express ---
const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Sert les fichiers du dossier "public" ---
app.use(express.static("public"));

// --- Configuration Kafka ---
const kafka = new Kafka({
  clientId: "frontend",
  brokers: ["localhost:9092"], // ⚠️ adapte selon ton docker-compose (par ex. "kafka:9092")
});

const producer = kafka.producer();

// --- Connexion Kafka au démarrage ---
await producer.connect();
console.log("✅ Kafka connecté");

// --- Endpoint principal : POST /buy ---
app.post("/buy", async (req, res) => {
  try {
    // 1️⃣ Récupère les infos du panier envoyées depuis app.js
    const { items, total } = req.body;

    // 2️⃣ Crée l'événement à publier
    const event = {
      event: "commande.initialisee",
      data: {
        idCommande: `cmd-${Date.now()}`,
        idUtilisateur: "user1",
        produits: items || [],
        prixTotal: total || 0,
      },
      timestamp: new Date().toISOString(),
    };

    // 3️⃣ Publie dans le topic Kafka
    await producer.send({
      topic: "commande.initialisee",
      messages: [{ value: JSON.stringify(event) }],
    });

    console.log("📤 Événement Kafka envoyé :", event);
    res.json({ success: true, event });
  } catch (err) {
    console.error("❌ Erreur Kafka :", err);
    res.status(500).json({ error: "Erreur lors de l'envoi Kafka" });
  }
});

// --- Lancement du serveur HTTP ---
const PORT = 8081;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Frontend en ligne sur http://localhost:${PORT}`);
});
