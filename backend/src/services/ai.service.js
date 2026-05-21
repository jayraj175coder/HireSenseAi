import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const fallbackQuestions = {
  "Frontend Developer": ["How would you design a resilient React component architecture for a dashboard?", "Explain how you diagnose and improve Core Web Vitals.", "Describe a time you handled complex state without making the UI brittle."],
  "Backend Developer": ["How would you design rate-limited REST APIs for a high-traffic product?", "Explain your approach to MongoDB schema design and indexes.", "How do you structure error handling and observability in Node.js services?"],
  "Full Stack Developer": ["Walk through designing an end-to-end interview analytics feature.", "How do you keep frontend and backend contracts reliable as a product grows?", "Describe tradeoffs between server-side validation and client-side validation."],
  "AI Engineer": ["How would you evaluate an LLM-powered answer scoring system?", "Explain prompt grounding and hallucination mitigation strategies.", "How do you design a production AI workflow with retries and fallbacks?"],
  "Data Analyst": ["How would you investigate a sudden drop in user activation?", "Explain how you communicate uncertainty in a dashboard.", "Describe your process for cleaning messy business data."]
};

function cleanJson(text) {
  return text.replace(/```json|```/g, "").trim();
}

async function callOpenAI(prompt) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    response_format: { type: "json_object" }
  });
  return JSON.parse(cleanJson(response.choices[0].message.content));
}

async function callGemini(prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });
  const response = await model.generateContent(`${prompt}\nReturn only valid JSON.`);
  return JSON.parse(cleanJson(response.response.text()));
}

async function aiJson(prompt, fallback) {
  try {
    if (process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY) return await callOpenAI(prompt);
    if (process.env.GEMINI_API_KEY) return await callGemini(prompt);
    return fallback;
  } catch (error) {
    console.warn("AI provider failed, using fallback:", error.message);
    return fallback;
  }
}

export function analyzeResume(resumeText) {
  return aiJson(
    `Analyze this resume for interview readiness. Resume:\n${resumeText.slice(0, 7000)}\nJSON keys: summary, topSkills array, missingSkills array, senioritySignal, improvementTips array.`,
    {
      summary: "Resume parsed successfully. Add an AI key for deeper personalized analysis.",
      topSkills: ["React", "Node.js", "Communication"],
      missingSkills: ["System design", "Testing depth"],
      senioritySignal: "mid",
      improvementTips: ["Quantify impact with metrics.", "Add project outcomes and ownership scope."]
    }
  );
}

export function generateQuestions({ role, difficulty, resumeText = "" }) {
  const seeds = fallbackQuestions[role] || fallbackQuestions["Full Stack Developer"];
  return aiJson(
    `Generate 6 ${difficulty} mock interview questions for a ${role}. Personalize using resume text if relevant:\n${resumeText.slice(0, 5000)}\nJSON shape: {"questions":[{"prompt":"","category":"","expectedSignals":[""],"timeLimitSeconds":120}]}`,
    {
      questions: seeds.concat([
        "Tell me about a technical decision you would make differently today.",
        "How do you debug production issues under time pressure?",
        "What signals show that your solution is ready to ship?"
      ]).map((prompt, index) => ({
        prompt,
        category: index % 2 ? "behavioral" : "technical",
        expectedSignals: ["specific examples", "tradeoff awareness", "clear communication"],
        timeLimitSeconds: 120
      }))
    }
  );
}

export function evaluateAnswer({ role, question, answer }) {
  return aiJson(
    `Evaluate this ${role} interview answer.\nQuestion: ${question}\nAnswer: ${answer}\nJSON keys: score number 0-100, strengths array, weaknesses array, suggestions array, confidence number 0-100.`,
    {
      score: Math.min(88, Math.max(52, answer.length / 8)),
      strengths: ["Clear attempt at addressing the question", "Shows relevant domain awareness"],
      weaknesses: ["Could include more concrete metrics", "Tradeoffs need sharper explanation"],
      suggestions: ["Use a structured answer format: context, action, result.", "Name risks and how you would validate them."],
      confidence: answer.length > 180 ? 78 : 58
    }
  );
}

export function generateRoadmap({ role, feedback }) {
  return aiJson(
    `Create a concise career improvement roadmap for a ${role} based on this feedback: ${JSON.stringify(feedback)}. JSON shape: {"roadmap":[""]}`,
    {
      roadmap: [
        "Practice concise STAR answers twice a week.",
        "Build one portfolio project that demonstrates production tradeoffs.",
        "Review fundamentals for the weakest scoring category.",
        "Run another timed mock interview and compare score movement."
      ]
    }
  );
}
