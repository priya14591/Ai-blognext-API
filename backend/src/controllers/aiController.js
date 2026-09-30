const axios = require("axios");
const asyncHandler = require("../utils/asyncHandler");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const callGemini = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error("GEMINI_API_KEY is not configured on the server (.env)");
    err.statusCode = 500;
    throw err;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await axios.post(
    url,
    { contents: [{ parts: [{ text: prompt }] }] },
    { headers: { "Content-Type": "application/json" } }
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const err = new Error("AI service returned an empty response");
    err.statusCode = 502;
    throw err;
  }
  return text;
};

// POST /api/ai/generate-blog  body: { topic, tone, length }
const generateBlog = asyncHandler(async (req, res) => {
  const { topic, tone = "informative", length = "medium (500-700 words)" } = req.body;
  if (!topic) return res.status(400).json({ success: false, message: "topic is required" });

  const prompt = `Write a well-structured blog post about "${topic}".
Tone: ${tone}. Length: ${length}.
Return the result as:
Title: <catchy title>
Content:
<the full blog body in markdown, with headings and short paragraphs>`;

  const text = await callGemini(prompt);

  res.json({ success: true, data: { topic, generated: text } });
});

// POST /api/ai/summarize  body: { content }
const summarize = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ success: false, message: "content is required" });

  const prompt = `Summarize the following article in 3-5 concise sentences, then list 3 short SEO-friendly tags.
Article:
"""${content}"""`;

  const text = await callGemini(prompt);

  res.json({ success: true, data: { summary: text } });
});

// POST /api/ai/faq  body: { topic }  -- AI FAQ assistant
const generateFAQ = asyncHandler(async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ success: false, message: "topic is required" });

  const prompt = `Generate 5 frequently asked questions with short answers about "${topic}", formatted as a numbered list.`;
  const text = await callGemini(prompt);

  res.json({ success: true, data: { topic, faq: text } });
});

module.exports = { generateBlog, summarize, generateFAQ };
