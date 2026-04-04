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
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// DEBUG GEMINI
app.get("/debug-gemini", async (req, res) => {
  try {
    const hasKey = !!process.env.GEMINI_API_KEY;
    const keyPrefix = hasKey ? process.env.GEMINI_API_KEY.slice(0, 6) : null;

    const completion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: "Sadəcə 'ok' yaz." }],
    });

    return res.json({
      ok: true,
      hasKey,
      keyPrefix,
      content: completion.choices?.[0]?.message?.content ?? null,
    });
  } catch (e) {
    console.error("DEBUG GEMINI ERROR:", e);
    return res.status(500).json({
      ok: false,
      hasKey: !!process.env.GEMINI_API_KEY,
      keyPrefix: process.env.GEMINI_API_KEY
        ? process.env.GEMINI_API_KEY.slice(0, 6)
        : null,
      message: e.message,
      status: e.status,
      code: e.code,
      type: e.type,
      error: e.error,
    });
  }
});

// CHAT
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Sən ibtidai sinif uşaqları üçün sadə, mehriban və aydın izah edən AI müəllimsən.",
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
    });
  }
});

// QUIZ
app.post("/generate-quiz", async (req, res) => {
  try {
    const { classLevel, subject, topic } = req.body;

    console.log("=== GENERATE QUIZ START ===");
    console.log("REQUEST BODY:", req.body);

    const prompt = `
${classLevel}-ci sinif üçün "${subject}" fənnindən "${topic}" mövzusu üzrə 15 sual hazırla.

Qaydalar:
- Azərbaycan dilində yaz
- Uşaq üçün sadə olsun
- Hər sualda 4 cavab variantı olsun
- Yalnız 1 düzgün cavab olsun
- Hər sual üçün qısa izah ver
- Heç bir əlavə mətn yazma
- Cavabı yalnız JSON şəklində qaytar

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

    console.log("PROMPT READY");

    const completion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
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

    console.log("RAW COMPLETION:", JSON.stringify(completion, null, 2));

    const text = completion.choices?.[0]?.message?.content ?? "{}";
    console.log("RAW TEXT:", text);

    const cleanedText = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    console.log("CLEANED TEXT:", cleanedText);

    let parsed;

    try {
      parsed = JSON.parse(cleanedText);
      console.log("PARSED OK:", JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.error("JSON PARSE ERROR:", e.message);
      return res.status(500).json({
        error: "JSON parse error",
        step: "parse",
        raw: text,
        cleaned: cleanedText,
        details: e.message,
      });
    }

    let questions = [];

    if (Array.isArray(parsed)) {
      questions = parsed;
      console.log("FORMAT: ARRAY");
    } else if (parsed && Array.isArray(parsed.questions)) {
      questions = parsed.questions;
      console.log("FORMAT: OBJECT WITH QUESTIONS");
    } else {
      console.error("QUIZ FORMAT ERROR:", parsed);
      return res.status(500).json({
        error: "Quiz format error",
        step: "format",
        raw: parsed,
      });
    }

    console.log("QUESTIONS COUNT:", questions.length);

    if (!questions.length) {
      return res.status(500).json({
        error: "No questions returned",
        step: "empty_questions",
      });
    }

    console.log("=== GENERATE QUIZ SUCCESS ===");
    res.json({ questions });
  } catch (e) {
    console.error("QUIZ ERROR FULL:", e);
    res.status(500).json({
      error: "Quiz error",
      step: "outer_catch",
      details: e.message,
      status: e.status,
      code: e.code,
      type: e.type,
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
    "İki rəqəmli ədədlərin toplanması": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "İki rəqəmli ədədlərin çıxılması": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Vurma və bölməyə giriş": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Pullarımız": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Məsələ həlli": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "1000 dairəsində ədədlər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Sütunla toplama": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Sütunla çıxma": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Vurma cədvəli": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Qalıqlı bölmə": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Sahə və perimetr": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Kəsrlərə giriş": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Çoxrəqəmli ədədlər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Sürət məsələləri": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Mürəkkəb tənliklər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Bucaqlar": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Diaqramlar və cədvəllərlə iş": {
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
    "Sözlərin böyük hərflə yazılması": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Sadə cümlələr": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Sözün heca tərkibi": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Səsartımı və səs düşümü": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Ad bildirən sözlər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Əlamət bildirən sözlər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Hərəkət bildirən sözlər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Sözün kökü və şəkilçisi": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Mürəkkəb sözlər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Cümlənin növləri": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Mətni hissələrə ayırma": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "İsim": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Sifət": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Say": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Fel": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Orfoqrafiya qaydaları": {
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
    "Ailə üzvləri": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Heyvanlar": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Bədən üzvləri": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Oyuncaqlar": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "To be feli": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Have got / Has got": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Can / Can't": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Meyvə və tərəvəz": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Ev əşyaları": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Geyimlər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Present Continuous": {
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
    "Şəxsi gigiyena": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Azərbaycanın rəmzləri": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Ailə şəcərəsi": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Təbiət": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Heyvanlar": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Yol hərəkəti qaydaları": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Tarixi yerlər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Hüquq və vəzifələr": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Ekologiya": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Sağlamlıq və təhlükəsizlik": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Fövqəladə hallar": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Qəhrəmanlarımız": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Mən və cəmiyyət": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Günəş sistemi": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Ətraf mühitin qorunması": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Vətənimiz Azərbaycan": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Tarixi şəxsiyyətlər": {
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
    "Fiqurlar": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Plastilinlə iş": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Qarışıq rənglər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Simmetriya": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Sadə rəsmlər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Dekorativ işlər": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Natürmort": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Mənzərə janrı": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Portret": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Xalçaçılıq elementləri": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Mənzərə": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Dekorativ tətbiqi sənət": {
      video: "https://video.edu.az",
      book: "https://trims.edu.az",
    },
    "Xalçaçılıq": {
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