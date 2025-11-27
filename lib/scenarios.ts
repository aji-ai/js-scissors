import marketing from "../data/scenarios/marketing.json";
import hr from "../data/scenarios/hr.json";
import leadership from "../data/scenarios/leadership.json";
import news from "../data/scenarios/news.json";
import cybersecurity from "../data/scenarios/cybersecurity.json";
import chatbot from "../data/scenarios/chatbot.json";
import type { ScenarioPack } from "./types";

export const SCENARIOS: ScenarioPack[] = [
  marketing as ScenarioPack,
  hr as ScenarioPack,
  leadership as ScenarioPack,
  news as ScenarioPack,
  cybersecurity as ScenarioPack,
  chatbot as ScenarioPack
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


