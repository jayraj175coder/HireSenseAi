import { interviewers } from "../data/interviewers";

export function buildIntroPrompt(role) {
  return `Please introduce yourself briefly — your background, what draws you to this ${role} role, and one project you are proud of.`;
}

export function buildGreetingMessages(interview, resumeAnalysis) {
  const style = interviewers.find((item) => item.id === interview.interviewerStyle) || interviewers[0];
  const role = interview.role;
  const candidateName = resumeAnalysis?.candidateHeadline?.split(" ")[0] || resumeAnalysis?.summary?.split(" ")[0];
  const nameBit = candidateName && candidateName.length > 2 && !/^(candidate|resume|parsed)$/i.test(candidateName)
    ? ` ${candidateName}`
    : "";

  const opening =
    interview.interviewPlan?.openingMessage ||
    `Hi${nameBit}, I am ${style.name}. Thanks for joining this ${role} mock interview today.`;

  const welcome =
    interview.interviewPlan?.greetingTransition ||
    `I will keep this conversational — one question at a time, and I will adapt based on what you share. Take a breath, and when you are ready, we will start with a short introduction.`;

  const intro = buildIntroPrompt(role);

  return {
    styleName: style.name,
    messages: [
      { speaker: "interviewer", text: opening, meta: "Greeting" },
      { speaker: "interviewer", text: welcome, meta: "Greeting" },
      { speaker: "interviewer", text: intro, meta: "Warm-up" }
    ],
    introPrompt: intro
  };
}
