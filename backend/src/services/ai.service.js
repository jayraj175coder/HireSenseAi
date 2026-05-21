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
    `You are a senior technical recruiter and interview designer. Analyze this resume for an AI mock interview system.

Resume:
${resumeText.slice(0, 9000)}

Return JSON with:
summary, candidateHeadline, roleFitScore 0-100, topSkills array, missingSkills array, senioritySignal,
improvementTips array, technicalSkills array, domainSignals array, tools array, projectHighlights array,
riskFlags array, suggestedRoles array, interviewFocusAreas array, personalizationContext string.
Be specific to the resume. Do not invent employers or credentials.`,
    {
      summary: "Resume parsed successfully. Add an AI key for deeper personalized analysis.",
      candidateHeadline: "Software candidate with full-stack project signals",
      roleFitScore: 72,
      topSkills: ["React", "Node.js", "Communication"],
      missingSkills: ["System design", "Testing depth"],
      senioritySignal: "mid",
      improvementTips: ["Quantify impact with metrics.", "Add project outcomes and ownership scope."],
      technicalSkills: ["React", "Node.js", "MongoDB"],
      domainSignals: ["Web applications", "User-facing product work"],
      tools: ["Git", "REST APIs"],
      projectHighlights: ["Full-stack application experience"],
      riskFlags: ["Impact metrics are not explicit"],
      suggestedRoles: ["Full Stack Developer", "Frontend Developer"],
      interviewFocusAreas: ["System design", "API design", "Debugging", "Project ownership"],
      personalizationContext: "Ask for concrete project tradeoffs, shipped impact, and testing decisions."
    }
  );
}

export function generateInterviewPlan({ role, difficulty, resumeAnalysis }) {
  return aiJson(
    `Create an adaptive interview plan for a ${difficulty} ${role} mock interview.

Resume intelligence:
${JSON.stringify(resumeAnalysis || {})}

Return JSON:
{
  "openingMessage":"",
  "strategy":"",
  "competencies":[{"name":"","weight":25,"whyItMatters":""}],
  "resumeBasedProbes":[""],
  "riskAreasToValidate":[""]
}
Make it feel like a real interviewer who has read the resume.`,
    {
      openingMessage: `I reviewed your resume context and will run this like a realistic ${role} interview: technical depth, project judgment, communication, and role fit.`,
      strategy: "Start with role fundamentals, probe resume claims, then increase depth based on answer quality.",
      competencies: [
        { name: "Technical depth", weight: 35, whyItMatters: "Shows whether the candidate can solve role-specific problems." },
        { name: "Problem structure", weight: 25, whyItMatters: "Strong candidates reason clearly before jumping to implementation." },
        { name: "Experience evidence", weight: 25, whyItMatters: "Resume claims need concrete proof and outcomes." },
        { name: "Communication", weight: 15, whyItMatters: "Interview performance depends on clarity and concision." }
      ],
      resumeBasedProbes: ["Ask for a project tradeoff from the resume.", "Validate depth behind listed technologies."],
      riskAreasToValidate: ["Specific impact metrics", "Testing and production readiness"]
    }
  );
}

export function generateQuestions({ role, difficulty, resumeText = "" }) {
  const seeds = fallbackQuestions[role] || fallbackQuestions["Full Stack Developer"];
  return aiJson(
    `Generate a realistic 6-question adaptive interview for a ${difficulty} ${role}. Personalize using this resume text if relevant:
${resumeText.slice(0, 7000)}

JSON shape:
{"questions":[{"prompt":"","category":"technical|behavioral|system_design|resume_deep_dive","source":"resume|role","difficultyReason":"","expectedSignals":[""],"evaluationRubric":[{"criterion":"","weight":25}],"timeLimitSeconds":120}]}

Rules:
- Mix resume deep-dives, role fundamentals, practical scenarios, and communication probes.
- Questions should be interview-grade, not quiz trivia.
- Include expected signals and rubric criteria for objective evaluation.`,
    {
      questions: seeds.concat([
        "Tell me about a technical decision you would make differently today.",
        "How do you debug production issues under time pressure?",
        "What signals show that your solution is ready to ship?"
      ]).map((prompt, index) => ({
        prompt,
        category: index % 2 ? "behavioral" : "technical",
        source: index === 0 ? "resume" : "role",
        difficultyReason: "Balances practical experience, role fundamentals, and communication quality.",
        expectedSignals: ["specific examples", "tradeoff awareness", "clear communication"],
        evaluationRubric: [
          { criterion: "Correctness and role depth", weight: 35 },
          { criterion: "Structure and clarity", weight: 25 },
          { criterion: "Specific evidence", weight: 25 },
          { criterion: "Tradeoff awareness", weight: 15 }
        ],
        timeLimitSeconds: 120
      }))
    }
  );
}

export function evaluateAnswer({ role, question, answer, resumeAnalysis, previousFeedback = [] }) {
  return aiJson(
    `You are an expert ${role} interviewer. Evaluate this candidate answer as part of a real mock interview.

Resume intelligence:
${JSON.stringify(resumeAnalysis || {})}

Previous feedback summary:
${JSON.stringify(previousFeedback.slice(-3))}

Question:
${question}

Candidate answer:
${answer}

Return JSON:
{
  "score":0,
  "rubricScores":[{"criterion":"","score":0,"note":""}],
  "strengths":[""],
  "weaknesses":[""],
  "suggestions":[""],
  "evidence":["short quoted or paraphrased evidence from answer"],
  "communicationSignals":{"clarity":0,"structure":0,"specificity":0,"concision":0},
  "interviewerReply":"",
  "followUpQuestion":"",
  "nextQuestionAdjustment":"",
  "hireSignal":"strong_no|lean_no|mixed|lean_yes|strong_yes",
  "confidence":0
}

Scoring must reward correctness, concrete experience, structured thinking, role fit, and communication.
The interviewerReply should sound like a human interviewer giving a brief transition, not a long lecture.
The followUpQuestion should adapt to a gap or strong signal in this exact answer.`,
    {
      score: Math.min(88, Math.max(52, answer.length / 8)),
      rubricScores: [
        { criterion: "Correctness and role depth", score: 68, note: "Relevant, but needs more technical precision." },
        { criterion: "Structure and clarity", score: 72, note: "Understandable answer with room for sharper sequencing." },
        { criterion: "Specific evidence", score: 58, note: "Could include metrics, constraints, or outcomes." },
        { criterion: "Tradeoff awareness", score: 64, note: "Some tradeoffs implied, few explicitly compared." }
      ],
      strengths: ["Clear attempt at addressing the question", "Shows relevant domain awareness"],
      weaknesses: ["Could include more concrete metrics", "Tradeoffs need sharper explanation"],
      suggestions: ["Use a structured answer format: context, action, result.", "Name risks and how you would validate them."],
      evidence: ["The answer addresses the prompt but stays broad."],
      communicationSignals: { clarity: 72, structure: 66, specificity: 58, concision: 70 },
      interviewerReply: "Good direction. I want to make the evidence more concrete before we move on.",
      followUpQuestion: "Can you give one specific example with the constraints, tradeoffs, and measurable result?",
      nextQuestionAdjustment: "Probe for production impact and testing depth next.",
      hireSignal: answer.length > 220 ? "lean_yes" : "mixed",
      confidence: answer.length > 180 ? 78 : 58
    }
  );
}

export function conductLiveInterviewTurn({ role, difficulty, resumeAnalysis, interviewPlan, transcript, currentQuestion, answer, turnNumber, maxTurns }) {
  return aiJson(
    `You are a calm, professional live AI interviewer for a ${difficulty} ${role} mock interview, similar to a real placement-prep interview.

Interview plan:
${JSON.stringify(interviewPlan || {})}

Resume intelligence:
${JSON.stringify(resumeAnalysis || {})}

Recent transcript:
${JSON.stringify((transcript || []).slice(-10))}

Current interviewer question:
${currentQuestion}

Candidate answer:
${answer}

Turn ${turnNumber} of ${maxTurns}.

Return JSON:
{
  "score":0,
  "rubricScores":[{"criterion":"","score":0,"note":""}],
  "strengths":[""],
  "weaknesses":[""],
  "suggestions":[""],
  "evidence":[""],
  "communicationSignals":{"clarity":0,"structure":0,"specificity":0,"concision":0},
  "interviewerReply":"",
  "nextQuestion":"",
  "nextQuestionCategory":"resume_deep_dive|technical|system_design|behavioral|role_scenario",
  "nextQuestionReason":"",
  "hireSignal":"strong_no|lean_no|mixed|lean_yes|strong_yes",
  "confidence":0
}

Behavior rules:
- Do not reveal rubric details inside interviewerReply.
- interviewerReply must be brief and natural, like: "Good, I see the direction. Let me push a little deeper..."
- nextQuestion must be one clear spoken interview question.
- Adapt nextQuestion to the candidate answer, resume risks, and interview progress.
- Early turns can ask follow-ups. Later turns should cover missing competencies.
- If the answer is weak, ask a supportive probing question. If strong, increase difficulty.
- Avoid generic quiz questions. Ask scenario, project, debugging, design, or decision-making questions.`,
    {
      score: Math.min(88, Math.max(50, answer.length / 9)),
      rubricScores: [
        { criterion: "Role depth", score: 68, note: "Shows some relevant understanding." },
        { criterion: "Evidence", score: 60, note: "Needs more concrete project detail." },
        { criterion: "Communication", score: 72, note: "Mostly clear and understandable." }
      ],
      strengths: ["Shows relevant direction", "Communicates the main idea clearly"],
      weaknesses: ["Needs more concrete evidence", "Could explain tradeoffs more deeply"],
      suggestions: ["Answer with situation, action, tradeoff, and result.", "Use metrics or constraints where possible."],
      evidence: ["Candidate addressed the question but stayed broad."],
      communicationSignals: { clarity: 72, structure: 66, specificity: 58, concision: 70 },
      interviewerReply: "Good, I understand your direction. I want to test the depth behind that with a practical follow-up.",
      nextQuestion: "Can you walk me through one real project where you made this kind of decision, including the tradeoffs and final result?",
      nextQuestionCategory: "resume_deep_dive",
      nextQuestionReason: "The previous answer needs stronger evidence and project-level detail.",
      hireSignal: answer.length > 220 ? "lean_yes" : "mixed",
      confidence: answer.length > 180 ? 78 : 60
    }
  );
}

export function generateRoadmap({ role, feedback }) {
  return aiJson(
    `Create a career improvement report for a ${role} candidate based on this interview feedback:
${JSON.stringify(feedback)}

Return JSON:
{
  "readinessSummary":"",
  "roadmap":[""],
  "practicePlan":[""],
  "recommendedResources":[""],
  "competencyScores":[{"name":"","score":0}]
}
Make the advice actionable, prioritized, and specific to interview performance.`,
    {
      readinessSummary: "Candidate shows usable role knowledge but needs more concrete evidence, tighter structure, and deeper tradeoff analysis.",
      roadmap: [
        "Practice concise STAR answers twice a week.",
        "Build one portfolio project that demonstrates production tradeoffs.",
        "Review fundamentals for the weakest scoring category.",
        "Run another timed mock interview and compare score movement."
      ],
      practicePlan: ["Record three two-minute project explanations.", "Write one system design answer using requirements, tradeoffs, and validation."],
      recommendedResources: ["Role-specific system design checklist", "Behavioral answer bank with metrics"],
      competencyScores: [
        { name: "Technical depth", score: 68 },
        { name: "Problem structure", score: 66 },
        { name: "Experience evidence", score: 58 },
        { name: "Communication", score: 72 }
      ]
    }
  );
}
