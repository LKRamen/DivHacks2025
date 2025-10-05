import dotenv from "dotenv";
dotenv.config({ override: true });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
console.log("Key prefix/len:", (OPENAI_API_KEY || "").slice(0, 12), (OPENAI_API_KEY || "").length);

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// 1) Hard-require the key at startup
if (!OPENAI_API_KEY) {
  console.error(
    "ERROR: OPENAI_API_KEY is missing. Create server/.env with OPENAI_API_KEY=sk-... and restart."
  );
}

app.post("/api/chat", async (req, res) => {
  const { system, messages } = req.body || {};

  // 2) If key is missing, fail clearly (no fallback)
  if (!OPENAI_API_KEY) {
    return res
      .status(503)
      .json({ error: "Server missing OPENAI_API_KEY. Add it to server/.env and restart." });
  }

  try {
    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: system || "You are a helpful assistant. Be concise and accurate.",
        },
        ...(Array.isArray(messages) ? messages : []),
      ],
      temperature: 0.4,
      max_tokens: 500,
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // 3) If OpenAI errors, pass the error back (no manual messages)
    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: `OpenAI error ${r.status}: ${text}` });
    }

    const json = await r.json();
    const reply = json?.choices?.[0]?.message?.content?.trim() || "";
    return res.json({ reply });
  } catch (e) {
    return res.status(500).json({ error: `Server exception: ${e?.message || e}` });
  }
});

app.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});
