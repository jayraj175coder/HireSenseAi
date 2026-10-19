// tests/atsSkillScorer.test.ts
import { extractAndScore } from "../src/ats/atsSkillScorer";

const sample = `
  Senior Software Engineer with 6+ years of experience building frontend applications in React and TypeScript.
  Worked extensively with Node.js and Express for backend APIs. Experience with PostgreSQL, Docker, and AWS.
  Built machine learning prototypes in Python and used TensorFlow.
`;

test("extracts skills and scores them", () => {
  const { skills, overallScore } = extractAndScore(sample);
  expect(skills.find(s => s.name === "React")).toBeDefined();
  const tsSkill = skills.find(s => s.name === "TypeScript");
  expect(tsSkill).toBeDefined();
  if (tsSkill) expect(tsSkill.score).toBeGreaterThanOrEqual(80);
  expect(overallScore).toBeGreaterThan(60);
});
