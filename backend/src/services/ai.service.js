import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const fallbackQuestions = {
  "Frontend Developer": ["How would you design a resilient React component architecture for a dashboard?", "Explain how you diagnose and improve Core Web Vitals.", "Describe a time you handled complex state without making the UI brittle."],
  "Backend Developer": ["How would you design rate-limited REST APIs for a high-traffic product?", "Explain your approach to MongoDB schema design and indexes.", "How do you structure error handling and observability in Node.js services?"],
  "Full Stack Developer": ["Walk through designing an end-to-end interview analytics feature.", "How do you keep frontend and backend contracts reliable as a product grows?", "Describe tradeoffs between server-side validation and client-side validation."],
  "AI Engineer": ["How would you evaluate an LLM-powered answer scoring system?", "Explain prompt grounding and hallucination mitigation strategies.", "How do you design a production AI workflow with retries and fallbacks?"],
  "Data Analyst": ["How would you investigate a sudden drop in user activation?", "Explain how you communicate uncertainty in a dashboard.", "Describe your process for cleaning messy business data."]
};

const interviewerStyles = {
  friendly_hr: {
    label: "Friendly HR",
    tone: "warm, encouraging, conversational, focused on communication, motivation, teamwork, and clarity",
    challenge: "softly probe vague answers and ask for examples without sounding harsh"
  },
  faang_technical: {
    label: "FAANG Technical Interviewer",
    tone: "precise, structured, technical, calm, and evidence-driven",
    challenge: "push on scale, complexity, edge cases, correctness, and tradeoffs"
  },
  startup_founder: {
    label: "Startup Founder",
    tone: "fast-moving, product-minded, practical, direct, and ownership-focused",
    challenge: "probe bias for action, ambiguity, customer impact, speed, and ownership"
  },
  strict_senior: {
    label: "Strict Senior Engineer",
    tone: "direct, rigorous, skeptical but fair, focused on depth and production readiness",
    challenge: "challenge weak logic, ask for exact bottlenecks, failure modes, and operational details"
  }
};

function styleConfig(style) {
  return interviewerStyles[style] || interviewerStyles.friendly_hr;
}

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

function scoreFromAnswer(answer) {
  const lengthScore = Math.min(30, Math.floor(answer.length / 12));
  const evidenceBonus = /\b(project|built|implemented|designed|deployed|users|team|database|api|react|node|mongodb|result)\b/i.test(answer) ? 12 : 0;
  const tradeoffBonus = /\b(tradeoff|because|challenge|issue|problem|improve|optimize|debug|tested)\b/i.test(answer) ? 10 : 0;
  return Math.min(88, Math.max(45, 45 + lengthScore + evidenceBonus + tradeoffBonus));
}

function stageFromScore(score, turnNumber) {
  if (score >= 82 && turnNumber >= 4) return "Expert";
  if (score >= 72 && turnNumber >= 3) return "Advanced";
  if (score >= 60 || turnNumber >= 2) return "Intermediate";
  return "Beginner";
}

function liveFallbackTurn({ role, answer, turnNumber, maxTurns, interviewerStyle = "friendly_hr" }) {
  const score = scoreFromAnswer(answer);
  const weak = score < 62;
  const strict = interviewerStyle === "strict_senior" || interviewerStyle === "faang_technical";
  const founder = interviewerStyle === "startup_founder";
  const replies = strict
    ? [
        weak ? "I am going to stop you there because the answer is too high-level. Give me the exact implementation details." : "Good. Now I want to test whether that reasoning holds under real constraints.",
        weak ? "That still does not prove depth. Let us move into architecture and be specific." : "Reasonable. Now describe the architecture decision as if this had to survive production traffic.",
        weak ? "I need a clearer debugging path. Start from symptoms, then isolate the layer." : "Good. Let us pressure-test your debugging process.",
        weak ? "The tradeoff is not clear yet. Compare two options and defend one." : "Now I want the tradeoff, not just the solution.",
        weak ? "Last area: identify your weakest gap and make the improvement plan concrete." : "Final area. Show me how you evaluate and improve your own engineering judgment.",
        "That completes the interview. I am preparing your report."
      ]
    : founder
      ? [
          weak ? "I get the idea, but I need to know what you owned and what impact it had." : "Good. Now let us connect that to user impact and speed.",
          weak ? "Make it practical. If I gave you two weeks to ship it, what would you build first?" : "Nice. Now tell me how you would ship the next version faster.",
          weak ? "When it breaks in front of users, what do you check first?" : "Good. Let us talk about real production pressure.",
          weak ? "What did you trade off to move faster?" : "Useful. Now tell me what you would sacrifice and what you would protect.",
          weak ? "What would you learn next to become more useful to a small team?" : "Final question. Show me how you grow when the work is ambiguous.",
          "Great, I have enough signal. I am preparing your report."
        ]
      : [
          weak ? "Thanks, that gives me a start. I would like one more concrete example so I can understand your real contribution." : "Good start. I can see the direction, so I will go one level deeper.",
          weak ? "That is still a bit broad. Let us make it practical and talk through implementation." : "Nice, that gives me project context. Now I want to understand your technical decision-making.",
          weak ? "Okay. Let us walk through how you would handle a real issue when something breaks." : "Good. Let us move from design to debugging and production thinking.",
          weak ? "I understand. Now I want to hear how you think about tradeoffs with a team." : "That is useful. Let us talk about tradeoffs and collaboration.",
          weak ? "Thanks. For the last area, I want to understand how you learn and improve after feedback." : "Good, final stretch. I want to understand your growth mindset and readiness.",
          "Thanks, that completes the interview. I am preparing your report now."
        ];
  const questions = [
    `Pick one ${role} project from your resume. What problem were you solving, what exactly did you build, and what was your personal contribution?`,
    "Imagine you have to rebuild that project for real users. What architecture would you choose, and why?",
    "Suppose users report that the app is slow or failing. How would you debug it step by step?",
    "Tell me about one technical tradeoff you made. What options did you compare, and what did you give up?",
    "If I joined your project team tomorrow, what part of your code or design would you improve first, and why?",
    "What is one skill gap you are actively working on for this role, and how are you practicing it?"
  ];
  const categories = ["resume_deep_dive", "system_design", "technical", "behavioral", "role_scenario", "behavioral"];
  const index = Math.min(Math.max(turnNumber - 1, 0), maxTurns - 1);

  return {
    score,
    rubricScores: [
      { criterion: "Role depth", score: Math.max(45, score - 4), note: weak ? "Needs more role-specific detail." : "Shows relevant role understanding." },
      { criterion: "Evidence", score: Math.max(42, score - 10), note: weak ? "Needs concrete project evidence." : "Includes some usable project evidence." },
      { criterion: "Communication", score: Math.min(90, score + 3), note: "Answer is understandable; structure can still improve." }
    ],
    strengths: weak ? ["Attempted to answer directly"] : ["Relevant project direction", "Clear enough to continue probing"],
    weaknesses: weak ? ["Too general", "Missing concrete implementation details"] : ["Could quantify impact more clearly", "Could name tradeoffs more sharply"],
    suggestions: ["Use a simple structure: context, action, tradeoff, result.", "Add exact technologies, constraints, and measurable outcome."],
    evidence: [answer.slice(0, 140) || "No detailed evidence provided."],
    communicationSignals: {
      clarity: Math.min(90, score + 4),
      structure: Math.max(45, score - 5),
      specificity: Math.max(40, score - 12),
      concision: answer.length > 900 ? 55 : 76
    },
    interviewerReply: replies[Math.min(turnNumber - 1, replies.length - 1)],
    nextQuestion: questions[index],
    nextQuestionCategory: categories[index],
    nextQuestionReason: "Fallback interviewer selected the next competency area in a natural live-interview sequence.",
    difficultyStage: stageFromScore(score, turnNumber),
    hireSignal: score >= 78 ? "lean_yes" : score >= 62 ? "mixed" : "lean_no",
    confidence: 70
  };
}

function extractEmail(text) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
}

function extractPhone(text) {
  return text.match(/(?:\+?\d[\s-]?){8,14}\d/)?.[0];
}

function uniqueMatches(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
}

function buildResumeFallback(resumeText) {
  const text = resumeText.replace(/\s+/g, " ").trim();
  const nameLine = resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.includes("@") && !/\d{6,}/.test(line));
  const skills = uniqueMatches(text, [
    "React", "JavaScript", "TypeScript", "Node.js", "Express", "MongoDB", "Python", "Java", "SQL", "HTML", "CSS",
    "Tailwind", "Redux", "REST API", "Git", "Docker", "AWS", "Machine Learning", "Data Analysis", "Excel", "Power BI"
  ]);
  const tools = uniqueMatches(text, ["Git", "GitHub", "VS Code", "Postman", "Figma", "Docker", "Vercel", "Render", "MongoDB Atlas"]);
  const hasProjects = /\b(project|projects|built|developed|implemented|created)\b/i.test(text);
  const hasMetrics = /\b\d+%|\b\d+\s*(users|clients|seconds|ms|projects|members)\b/i.test(text);
  const suggestedRoles = [];
  if (skills.some((skill) => ["React", "HTML", "CSS", "Tailwind", "Redux"].includes(skill))) suggestedRoles.push("Frontend Developer");
  if (skills.some((skill) => ["Node.js", "Express", "MongoDB", "REST API", "SQL"].includes(skill))) suggestedRoles.push("Backend Developer");
  if (suggestedRoles.includes("Frontend Developer") && suggestedRoles.includes("Backend Developer")) suggestedRoles.unshift("Full Stack Developer");
  if (skills.some((skill) => ["Machine Learning", "Python"].includes(skill))) suggestedRoles.push("AI Engineer");
  if (skills.some((skill) => ["Data Analysis", "Excel", "Power BI", "SQL"].includes(skill))) suggestedRoles.push("Data Analyst");

  return {
    summary: `${nameLine || "Candidate"} resume parsed locally. Found ${skills.length || "some"} skill signals${extractEmail(text) ? " and contact details" : ""}. Add Gemini/OpenAI key for deeper semantic analysis.`,
    candidateHeadline: `${suggestedRoles[0] || "Software"} candidate${skills.length ? ` with ${skills.slice(0, 4).join(", ")} signals` : " with project experience"}`,
    roleFitScore: Math.min(92, 48 + skills.length * 5 + (hasProjects ? 12 : 0) + (hasMetrics ? 8 : 0)),
    topSkills: skills.slice(0, 8),
    missingSkills: ["Impact metrics", "Testing details", "System design explanation"].filter((item) => !(item === "Impact metrics" && hasMetrics)),
    senioritySignal: hasMetrics && skills.length > 6 ? "mid" : "entry-to-mid",
    improvementTips: ["Add measurable project impact.", "Mention testing, deployment, and debugging experience.", "Explain personal contribution for each project."],
    technicalSkills: skills,
    domainSignals: hasProjects ? ["Project-based experience", "Application development"] : ["Resume content detected"],
    tools,
    projectHighlights: hasProjects ? text.split(/(?=project|built|developed|implemented|created)/i).slice(0, 3).map((item) => item.trim().slice(0, 180)).filter(Boolean) : [],
    riskFlags: hasMetrics ? ["Validate depth behind listed skills"] : ["Missing measurable impact", "Validate depth behind listed skills"],
    suggestedRoles: [...new Set(suggestedRoles)].slice(0, 5),
    interviewFocusAreas: ["Project ownership", "Technical depth", "Debugging", "Tradeoffs", "Deployment readiness"],
    personalizationContext: `Candidate name signal: ${nameLine || "unknown"}. Email found: ${extractEmail(text) ? "yes" : "no"}. Phone found: ${extractPhone(text) ? "yes" : "no"}. Probe projects and exact contribution.`
  };
}

export function analyzeResume(resumeText) {
  const fallback = buildResumeFallback(resumeText);
  return aiJson(
    `You are a senior technical recruiter and interview designer. Analyze this resume for an AI mock interview system.

Resume:
${resumeText.slice(0, 9000)}

Return JSON with:
summary, candidateHeadline, roleFitScore 0-100, topSkills array, missingSkills array, senioritySignal,
improvementTips array, technicalSkills array, domainSignals array, tools array, projectHighlights array,
riskFlags array, suggestedRoles array, interviewFocusAreas array, personalizationContext string.
Be specific to the resume. Do not invent employers or credentials.`,
    fallback
  );
}

export function generateInterviewPlan({ role, difficulty, resumeAnalysis, interviewerStyle = "friendly_hr" }) {
  const style = styleConfig(interviewerStyle);
  return aiJson(
    `Create an adaptive interview plan for a ${difficulty} ${role} mock interview.

Interviewer personality: ${style.label}
Tone: ${style.tone}
Challenge behavior: ${style.challenge}

Resume intelligence:
${JSON.stringify(resumeAnalysis || {})}

Return JSON:
{
  "openingMessage":"",
  "greetingTransition":"",
  "strategy":"",
  "personalityLabel":"${style.label}",
  "competencies":[{"name":"","weight":25,"whyItMatters":""}],
  "resumeBasedProbes":[""],
  "riskAreasToValidate":[""]
}
Make it feel like a real interviewer who has read the resume. openingMessage must greet the candidate warmly. greetingTransition must bridge into the introduction without asking a technical question yet.`,
    {
      openingMessage: `Hi, I am your ${style.label} interviewer for this ${role} mock interview. Thanks for joining me today — I am glad you are here.`,
      greetingTransition: `We will keep this conversational: one question at a time, and I will adapt based on your answers. When you are ready, we will start with a brief introduction.`,
      strategy: `${style.label} style: ${style.challenge}. Start with a short intro, probe resume claims, then increase depth based on answer quality.`,
      personalityLabel: style.label,
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

export function conductLiveInterviewTurn({ role, difficulty, resumeAnalysis, interviewPlan, transcript, currentQuestion, answer, turnNumber, maxTurns, interviewerStyle = "friendly_hr" }) {
  const style = styleConfig(interviewerStyle);
  const fallback = liveFallbackTurn({ role, answer, turnNumber, maxTurns, interviewerStyle });
  return aiJson(
    `You are a calm, professional live AI interviewer for a ${difficulty} ${role} mock interview, similar to a real placement-prep interview.

Interviewer personality: ${style.label}
Tone: ${style.tone}
Challenge behavior: ${style.challenge}

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
  "difficultyStage":"Beginner|Intermediate|Advanced|Expert",
  "hireSignal":"strong_no|lean_no|mixed|lean_yes|strong_yes",
  "confidence":0
}

Behavior rules:
- Do not reveal rubric details inside interviewerReply.
- interviewerReply must be brief and natural, like: "Good, I see the direction. Let me push a little deeper..."
- interviewerReply must match the selected personality.
- nextQuestion must be one clear spoken interview question.
- Adapt nextQuestion to the candidate answer, resume risks, and interview progress.
- Early turns can ask follow-ups. Later turns should cover missing competencies.
- If the answer is weak, ask a supportive probing question. If strong, increase difficulty.
- Increase difficultyStage when the candidate gives specific, technical, evidence-backed answers.
- Avoid generic quiz questions. Ask scenario, project, debugging, design, or decision-making questions.
- Never repeat a previous question from the transcript.`,
    fallback
  );
}

export function generateRoadmap({ role, feedback }) {
  return aiJson(
    `Create a career improvement report for a ${role} candidate based on this interview feedback:
${JSON.stringify(feedback)}

Return JSON:
{
  "readinessSummary":"",
  "hiringRecommendation":"",
  "roadmap":[""],
  "practicePlan":[""],
  "recommendedResources":[""],
  "competencyScores":[{"name":"","score":0}],
  "insightTimeline":[{"label":"","value":"","severity":"positive|neutral|warning"}]
}
Make the advice actionable, prioritized, and specific to interview performance.`,
    {
      readinessSummary: "Candidate shows usable role knowledge but needs more concrete evidence, tighter structure, and deeper tradeoff analysis.",
      hiringRecommendation: "Practice more before a final technical round",
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
      ],
      insightTimeline: [
        { label: "Strongest answer", value: "Best signal came when the candidate used concrete project context.", severity: "positive" },
        { label: "Weakest answer", value: "Lowest signal came from broad answers without metrics or constraints.", severity: "warning" },
        { label: "Communication trend", value: "Clear but needs tighter answer structure.", severity: "neutral" }
      ]
    }
  );
}
