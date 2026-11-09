export type StepStatus = "done" | "active" | "pending";

export interface AgentStep {
  id: string;
  title: string;
  detail: string;
  status: StepStatus;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: AgentStep[];
}

export type TemplateCategory = "E-commerce" | "Landing page";

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  prompt: string;
  swatch: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  brief: string;
  createdAt: number;
  updatedAt: number;
  builds: number;
}
