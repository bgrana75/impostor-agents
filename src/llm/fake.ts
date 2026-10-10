import type { GenerateRequest, GenerateResult, Llm } from "../core/types.js";

export type Script = (req: GenerateRequest, callIndex: number) => string;

/** Scripted LLM for tests; records every request it receives. */
export class FakeLlm implements Llm {
  readonly requests: GenerateRequest[] = [];
  constructor(private script: Script) {}

  async generate(req: GenerateRequest): Promise<GenerateResult> {
    const text = this.script(req, this.requests.length);
    this.requests.push(req);
    const promptTokens = req.messages.reduce((n, m) => n + Math.ceil(m.content.length / 4), 0);
    return { text, promptTokens, generatedTokens: Math.ceil(text.length / 4), ms: 0 };
  }
}
