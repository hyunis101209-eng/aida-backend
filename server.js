require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

app.get("/", (req, res) => {
  res.json({ message: "AIDA backend is running" });
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(prompt, schema = null, retries = 3) {
  let lastError = null;

  for (let i = 0; i < retries; i++) {
    try {
      const body = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2500,
          responseMimeType: "application/json",
        },
      };

      if (schema) {
        body.generationConfig.responseSchema = schema;
      }

      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (response.ok) return data;

      if (data?.error?.code === 503 || data?.error?.status === "UNAVAILABLE") {
        await sleep(2000 * (i + 1));
        continue;
      }

      throw new Error(JSON.stringify(data));
    } catch (e) {
      lastError = e;
      if (i === retries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }

  throw lastError;
}

function extractText(data) {
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

app.get("/debug-gemini", async (req, res) => {
  try {
    const result = await callGemini(
      `Sadəcə JSON qaytar: {"ok":true,"message":"ok"}`,
      {
        type: "OBJECT",
        properties: {
          ok: { type: "BOOLEAN" },
          message: { type: "STRING" }
        },
        required: ["ok", "message"]
      }
    );

    res.json({
      ok: true,
      extracted: extractText(result),
      raw: result
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e.message
    });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const prompt = `
Sən AIDA adlı AI müəllimsən.
Yalnız ibtidai sinif uşaqları üçün cavab ver.
Azərbaycan dilində yaz.
Sadə, aydın, qısa danış.
Lazım olsa balaca nümunə ver.

Sual:
${message}
`;

    const result = await callGemini(prompt, {
      type: "OBJECT",
      properties: {
        reply: { type: "STRING" }
      },
      required: ["reply"]
    });

    const text = extractText(result);
    const parsed = JSON.parse(text);

    res.json({ reply: parsed.reply });
  } catch (e) {
    res.status(500).json({
      error: "Chat error",
      details: e.message
    });
  }
});

app.post("/quiz", async (req, res) => {
  try {
    const { subject, topic, classLevel } = req.body;

    const languageRule =
      subject === "İngilis dili"
        ? `Sən sualları sadə İngilis dilində verə bilərsən, amma explanation hissəsini Azərbaycan dilində yaz.`
        : `Sən sualları və izahları yalnız Azərbaycan dilində yazmalısan.`;

    const subjectRule =
      subject === "Riyaziyyat"
        ? `Riyaziyyat sualları real hesab, sayma, toplama, çıxma, müqayisə və mövzuya uyğun düşünmə bacarığını yoxlasın.`
        : subject === "Ana dili"
        ? `Ana dili sualları hərf, heca, söz, cümlə və dil bacarığını yoxlasın.`
        : subject === "İngilis dili"
        ? `İngilis dili sualları mövzuya uyğun sadə söz ehtiyatı və ilkin dil bacarığını yoxlasın.`
        : subject === "Həyat bilgisi"
        ? `Həyat bilgisi sualları gündəlik həyat, ailə, təbiət və təhlükəsizlik biliklərini yoxlasın.`
        : `Suallar mövzuya uyğun real bilik və bacarığı yoxlasın.`;

    const prompt = `
Sən peşəkar ibtidai sinif müəllimisən.

Tapşırıq:
${classLevel}-ci sinif üçün "${subject}" fənnindən "${topic}" mövzusunda 12 test sualı hazırla.

Qaydalar:
- ${languageRule}
- ${subjectRule}
- Sual ${classLevel}-ci sinif səviyyəsinə uyğun olsun
- Mövzuya tam uyğun olsun
- Sual məntiqli olsun
- Hər sualda 4 real cavab variantı olsun
- Variantlar boş A, B, C, D olmasın
- Yalnız 1 düzgün cavab olsun
- correctIndex 0 ilə 3 arasında olsun
- Hər sual üçün qısa, sadə explanation yaz
- Yalnız JSON qaytar

Format:
{
  "questions": [
    {
      "question": "Sual mətni",
      "options": ["variant 1", "variant 2", "variant 3", "variant 4"],
      "correctIndex": 0,
      "explanation": "Sadə izah"
    }
  ]
}
`;

    const schema = {
      type: "OBJECT",
      properties: {
        questions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING" },
              options: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              correctIndex: { type: "INTEGER" },
              explanation: { type: "STRING" }
            },
            required: ["question", "options", "correctIndex", "explanation"]
          }
        }
      },
      required: ["questions"]
    };

    const result = await callGemini(prompt, schema);

    const text = extractText(result);
    const parsed = JSON.parse(text);

    const questions = (parsed.questions || []).filter((q) =>
      q &&
      typeof q.question === "string" &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correctIndex === "number" &&
      q.correctIndex >= 0 &&
      q.correctIndex <= 3 &&
      typeof q.explanation === "string"
    );

    if (!questions.length) {
      return res.status(500).json({
        error: "No valid questions returned",
        parsed
      });
    }

    res.json({ questions });
  } catch (e) {
    res.status(500).json({
      error: "Quiz error",
      details: e.message
    });
  }
});

app.post("/get-content", (req, res) => {
  res.json({
    video: "https://www.video.edu.az/",
    book: "https://www.trims.edu.az/"
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});