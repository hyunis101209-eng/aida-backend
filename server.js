require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "AIDA backend is running" });
});

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
    });
  }
});

// CHAT
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await client.chat.completions.create({
      model: "openrouter/free",
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
    });
  }
});

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
{
  "questions": [
    {
      "question": "Sual mətni",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Qısa izah"
    }
  ]
}
`;

    const completion = await client.chat.completions.create({
      model: "openrouter/free",
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
      });
    }

    res.json({ questions });
  } catch (e) {
    console.error("QUIZ ERROR:", e);
    res.status(500).json({
      error: "Quiz error",
      details: e.message,
      status: e.status,
    });
  }
});

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
});