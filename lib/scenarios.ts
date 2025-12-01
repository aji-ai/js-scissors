import marketing from "../data/scenarios/marketing.json";
import basic from "../data/scenarios/basic.json";
import hr from "../data/scenarios/hr.json";
import leadership from "../data/scenarios/leadership.json";
import news from "../data/scenarios/news.json";
import cybersecurity from "../data/scenarios/cybersecurity.json";
import healthcarePHR from "../data/scenarios/healthcare-phr.json";
import legacyMigration from "../data/scenarios/legacy-migration.json";
import chatbot from "../data/scenarios/chatbot.json";
import landing from "../data/scenarios/landing.json";
import emailTriage from "../data/scenarios/email-triage.json";
import vendorSecurity from "../data/scenarios/vendor-security.json";
import feedbackAnalysis from "../data/scenarios/feedback-analysis.json";
import userResearch from "../data/scenarios/user-research.json";
import agentPlayground from "../data/scenarios/agent-playground.json";
import type { ScenarioPack } from "./types";

export const SCENARIOS: ScenarioPack[] = [
  // Foundations
  basic as ScenarioPack,
  chatbot as ScenarioPack,
  agentPlayground as ScenarioPack,
  // Domains
  marketing as ScenarioPack,
  hr as ScenarioPack,
  leadership as ScenarioPack,
  news as ScenarioPack,
  cybersecurity as ScenarioPack,
  healthcarePHR as ScenarioPack,
  // Applications
  userResearch as ScenarioPack,
  landing as ScenarioPack,
  emailTriage as ScenarioPack,
  vendorSecurity as ScenarioPack,
  feedbackAnalysis as ScenarioPack,
  legacyMigration as ScenarioPack
];

const scenarioMap: Record<string, ScenarioPack> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s])
);

export function getScenarioById(id: string): ScenarioPack | undefined {
  return scenarioMap[id];
}

export function getScenarioIds(): string[] {
  return SCENARIOS.map((s) => s.id);
}


