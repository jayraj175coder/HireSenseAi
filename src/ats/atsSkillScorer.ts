// src/ats/atsSkillScorer.ts
/**
 * ATS Skill Extractor & Scorer
 * - Input: resume text
 * - Output: { skills: Array<{name, matchedText, score, evidence}>, overallScore }
 *
 * Uses: fuzzy matching (Fuse.js) + basic NLP heuristics for experience extraction.
 */

import Fuse from "fuse.js";
import nlp from "compromise";
import { uniq } from "lodash";
// Importing JSON. Ensure tsconfig has "resolveJsonModule": true when compiling TypeScript.
import skillsData from "../../data/skills.json";

export type SkillResult = {
  name: string;
  matchedText: string;
  score: number; // 0..100
  evidence: string[];
  years: number | null;
};

export function extractAndScore(resumeText: string, options?: { topN?: number }) {
  const topN = options?.topN ?? 100;
  if (!resumeText || resumeText.trim().length === 0) {
    return { skills: [] as SkillResult[], overallScore: 0 };
  }

  // 1) Preprocess
  const doc = nlp(resumeText);
  const sentences = doc.sentences().out("array");

  // 2) Build Fuse index from skills data
  const skillNames = skillsData.skills.map((s: string) => ({ name: s }));
  const fuse = new Fuse(skillNames, {
    keys: ["name"],
    threshold: 0.35, // fuzzy threshold: lower = stricter
    distance: 100,
    minMatchCharLength: 2,
  });

  // 3) Find candidate matches using direct string occurrences + fuse fuzzy search
  const directMatches = new Map<string, {
    name: string;
    matchedText: string;
    score: number; // 0..1
    evidence: string[];
    years?: number | null;
  }>();

  // direct substring match
  for (const s of skillsData.skills) {
    const regex = new RegExp("\\b" + escapeRegex(s) + "\\b", "i");
    const matched = regex.test(resumeText);
    if (matched) {
      const evidence = gatherEvidence(sentences, s);
      directMatches.set(s.toLowerCase(), {
        name: s,
        matchedText: s,
        score: 0.95, // high confidence for exact match
        evidence,
        years: extractYearsNear(resumeText, s),
      });
    }
  }

  // fuzzy matches
  const fuzzyCandidates = fuse.search(resumeText).slice(0, topN);
  for (const r of fuzzyCandidates) {
    const name: string = (r.item as any).name;
    const key = name.toLowerCase();
    const existing = directMatches.get(key);
    const fuseScore = 1 - (r.score ?? 0); // convert small->big
    const evidence = gatherEvidence(sentences, name);
    const years = extractYearsNear(resumeText, name);
    const combinedScore = existing ? Math.max(existing.score, fuseScore * 0.8) : Math.min(0.9, fuseScore * 0.9);
    directMatches.set(key, {
      name,
      matchedText: name,
      score: combinedScore,
      evidence: uniq([...(existing?.evidence ?? []), ...evidence]),
      years: existing?.years ?? years,
    });
  }

  // 4) Heuristic scoring adjustments (proficiency terms, years)
  const skillsArr: { name: string; matchedText: string; score: number; evidence: string[]; years?: number | null }[] = [];
  for (const m of directMatches.values()) {
    let sScore = m.score; // base 0..1
    // reward for explicit seniority terms near the evidence
    const prox = pickProximityText(m.evidence);
    if (prox && /senior|lead|expert|principal|manager|head/i.test(prox)) sScore += 0.08;
    if (m.years && m.years >= 5) sScore += 0.12;
    if (m.years && m.years >= 2 && m.years < 5) sScore += 0.06;

    // reward for multiple occurrences / many evidence lines
    const evidenceBonus = Math.min(0.1, (m.evidence?.length ?? 0) * 0.02);
    sScore += evidenceBonus;

    // clamp 0..1
    sScore = Math.max(0, Math.min(1, sScore));
    skillsArr.push({ ...m, score: sScore });
  }

  // 5) Final normalization to 0..100 and overall score
  skillsArr.sort((a, b) => b.score - a.score);
  const results: SkillResult[] = skillsArr.map((s) => ({
    name: s.name,
    matchedText: s.matchedText,
    score: Math.round(s.score * 100),
    evidence: s.evidence,
    years: s.years ?? null,
  }));

  const overallScore = computeOverallScore(skillsArr);

  return { skills: results, overallScore: Math.round(overallScore * 100) };
}

/* Helpers */

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function gatherEvidence(sentences: string[], skill: string) {
  const regex = new RegExp("\\b" + escapeRegex(skill) + "\\b", "i");
  return sentences.filter((s) => regex.test(s)).slice(0, 5);
}

function extractYearsNear(text: string, skill: string): number | null {
  // crude: find "X years" or "X+ years" within 120 chars of skill mention
  const idx = text.toLowerCase().indexOf(skill.toLowerCase());
  if (idx === -1) return null;
  const window = 120;
  const start = Math.max(0, idx - window);
  const snippet = text.slice(start, Math.min(text.length, idx + window));
  const m = snippet.match(/(\d+)\s*\+?\s*(?:years|yrs|year)/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

function pickProximityText(evidence: string[]) {
  return evidence.length > 0 ? evidence[0] : "";
}

function computeOverallScore(matches: { score: number }[]) {
  if (matches.length === 0) return 0;
  // Weighted mean emphasizing top skills
  const weights = matches.map((m, i) => 1 / (i + 1)); // decreasing weight
  const totalW = weights.reduce((a, b) => a + b, 0);
  let sum = 0;
  for (let i = 0; i < matches.length; i++) {
    sum += matches[i].score * weights[i];
  }
  return sum / totalW; // 0..1
}

export default { extractAndScore };
