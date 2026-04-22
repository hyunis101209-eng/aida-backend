require("dotenv").config();
<<<<<<< HEAD
const express = require("express");
const cors = require("cors");
=======

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
>>>>>>> 51aceca25159aa95616f1bfbba70ab447c73c856

const app = express();
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

=======
>>>>>>> 51aceca25159aa95616f1bfbba70ab447c73c856
app.get("/", (req, res) => {
  res.json({ message: "AIDA backend is running" });
});

<<<<<<< HEAD
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
=======
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://aida-backend.onrender.com",
    "X-Title": "AIDA",
  },
});

// DEBUG
app.get("/debug-ai", async (req, res) => {
  try {
    const completion = await client.chat.completions.create({
      model: "openrouter/free",
      messages: [
        { role: "user", content: "Sadəcə 'ok' yaz." }
      ],
    });

    res.json({
      ok: true,
      model: completion.model,
      content: completion.choices?.[0]?.message?.content ?? null,
    });
  } catch (e) {
    console.error("DEBUG AI ERROR:", e);
    res.status(500).json({
      ok: false,
      message: e.message,
      status: e.status,
      code: e.code,
      type: e.type,
>>>>>>> 51aceca25159aa95616f1bfbba70ab447c73c856
    });
  }
});

<<<<<<< HEAD
=======
// CHAT
>>>>>>> 51aceca25159aa95616f1bfbba70ab447c73c856
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

<<<<<<< HEAD
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
=======
    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "Sən AIDA adlı mehriban AI müəllimsən. Sən yalnız ibtidai sinif uşaqları ilə işləyirsən. Cavabların çox sadə, aydın, qısa və uşaq üçün başadüşülən olsun. Azərbaycan dilində yaz. Çətin sözləri sadələşdir. Lazım olsa nümunə ver.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.json({
      reply: completion.choices?.[0]?.message?.content ?? "Cavab yoxdur",
    });
  } catch (e) {
    console.error("CHAT ERROR:", e);
    res.status(500).json({
      error: "Chat error",
      details: e.message,
      status: e.status,
>>>>>>> 51aceca25159aa95616f1bfbba70ab447c73c856
    });
  }
});

<<<<<<< HEAD
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
=======
// QUIZ
app.post("/generate-quiz", async (req, res) => {
  try {
    const { classLevel, subject, topic } = req.body;

    const prompt = `
${classLevel}-ci sinif üçün "${subject}" fənnindən "${topic}" mövzusu üzrə 15 sual hazırla.

Qaydalar:
- Azərbaycan dilində yaz
- Uşaq üçün sadə olsun
- Hər sualda 4 cavab variantı olsun
- Yalnız 1 düzgün cavab olsun
- Hər sual üçün qısa və aydın izah ver
- Sual səviyyəsi ibtidai sinif üçün uyğun olsun
- Heç bir əlavə mətn yazma
- Yalnız JSON qaytar

Cavab formatı mütləq belə olsun:
>>>>>>> 51aceca25159aa95616f1bfbba70ab447c73c856
{
  "questions": [
    {
      "question": "Sual mətni",
<<<<<<< HEAD
      "options": ["variant 1", "variant 2", "variant 3", "variant 4"],
      "correctIndex": 0,
      "explanation": "Sadə izah"
=======
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Qısa izah"
>>>>>>> 51aceca25159aa95616f1bfbba70ab447c73c856
    }
  ]
}
`;

<<<<<<< HEAD
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
=======
    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "Sən yalnız düzgün JSON qaytaran sistemsən. Heç bir əlavə mətn, markdown, ```json bloku və ya izah yazma.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = completion.choices?.[0]?.message?.content ?? "{}";

    const cleanedText = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleanedText);
    } catch (e) {
      console.error("QUIZ JSON ERROR RAW:", text);
      return res.status(500).json({
        error: "JSON parse error",
        raw: text,
        cleaned: cleanedText,
        details: e.message,
      });
    }

    let questions = [];

    if (Array.isArray(parsed)) {
      questions = parsed;
    } else if (parsed && Array.isArray(parsed.questions)) {
      questions = parsed.questions;
    } else {
      return res.status(500).json({
        error: "Quiz format error",
        raw: parsed,
>>>>>>> 51aceca25159aa95616f1bfbba70ab447c73c856
      });
    }

    res.json({ questions });
  } catch (e) {
<<<<<<< HEAD
    res.status(500).json({
      error: "Quiz error",
      details: e.message
=======
    console.error("QUIZ ERROR:", e);
    res.status(500).json({
      error: "Quiz error",
      details: e.message,
      status: e.status,
>>>>>>> 51aceca25159aa95616f1bfbba70ab447c73c856
    });
  }
});

<<<<<<< HEAD
app.post("/get-content", (req, res) => {
  res.json({
    video: "https://www.video.edu.az/",
    book: "https://www.trims.edu.az/"
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
=======
// CONTENT MAP
const contentMap = {
  "Riyaziyyat": {
    "20 dairəsində ədədlər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Toplama və çıxma": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Həndəsi fiqurlar": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Ölçmə": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Vaxt (saat)": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "100 dairəsində ədədlər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Sahə və perimetr": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
  },
  "Ana dili": {
    "Əlifba": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Səs və hərf": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Heca": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Sadə cümlələr": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
  },
  "İngilis dili": {
    "Salamlaşma": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Rənglər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "1-20 ədədlər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
  },
  "Həyat bilgisi": {
    "Mən və ailəm": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Fəsillər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Canlılar və cansızlar": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
  },
  "Təsviri incəsənət": {
    "Əsas rənglər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Boyama": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Rəsm": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
  },
};

app.post("/get-content", async (req, res) => {
  try {
    const { subject, topic } = req.body;

    const subjectData = contentMap[subject] || {};
    const topicData = subjectData[topic] || {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    };

    res.json(topicData);
  } catch (e) {
    console.error("CONTENT ERROR:", e);
    res.status(500).json({
      error: "Content error",
      details: e.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server işləyir: http://0.0.0.0:${PORT}`);
>>>>>>> 51aceca25159aa95616f1bfbba70ab447c73c856
});