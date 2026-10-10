import {
  getLlama,
  JinjaTemplateChatWrapper,
  LlamaChat,
  type ChatHistoryItem,
  type ChatWrapper,
  type Llama,
  type LlamaContextSequence,
  type LlamaGrammar,
  type LlamaModel,
} from "node-llama-cpp";
import type { GenerateRequest, GenerateResult, Llm, OutputShape } from "../core/types.js";
import { gbnf } from "./grammars.js";

/**
 * One context, one sequence, calls strictly sequential: llama.cpp keeps the KV cache
 * for the longest prefix shared with the previous call, which is what we measure.
 */
export class LlamaCppLlm implements Llm {
  private grammars = new Map<string, LlamaGrammar>();

  private constructor(
    private llama: Llama,
    private model: LlamaModel,
    private sequence: LlamaContextSequence,
    private chat: LlamaChat,
    readonly wrapper: ChatWrapper,
  ) {}

  static async load(modelPath: string, contextSize = 4096): Promise<LlamaCppLlm> {
    const llama = await getLlama();
    const model = await llama.loadModel({ modelPath });
    const context = await model.createContext({ contextSize });
    const sequence = context.getSequence();
    const template = model.fileInfo.metadata.tokenizer.chat_template;
    if (!template) throw new Error("model has no chat template");
    // The model's own Jinja template, as llama.rn does with `jinja: true`.
    const wrapper = new JinjaTemplateChatWrapper({ template });
    const chat = new LlamaChat({ contextSequence: sequence, chatWrapper: wrapper });
    return new LlamaCppLlm(llama, model, sequence, chat, wrapper);
  }

  get gpu(): string | false {
    return this.llama.gpu;
  }

  private async grammar(shape: OutputShape): Promise<LlamaGrammar> {
    const src = gbnf(shape);
    let g = this.grammars.get(src);
    if (!g) {
      g = await this.llama.createGrammar({ grammar: src });
      this.grammars.set(src, g);
    }
    return g;
  }

  async generate(req: GenerateRequest): Promise<GenerateResult> {
    const history: ChatHistoryItem[] = [
      ...req.messages.map((m): ChatHistoryItem => ({ type: m.role, text: m.content })),
      { type: "model", response: [] },
    ];
    const prompt = this.wrapper
      .generateContextState({ chatHistory: history })
      .contextText.tokenize(this.model.tokenizer);
    const meter = this.sequence.tokenMeter.getState();

    const start = performance.now();
    const res = await this.chat.generateResponse(history, {
      maxTokens: req.maxTokens,
      temperature: req.temperature,
      seed: req.seed,
      grammar: req.shape ? await this.grammar(req.shape) : undefined,
    });
    const ms = performance.now() - start;

    const used = this.sequence.tokenMeter.diff(meter);
    return {
      text: res.response.trim(),
      promptTokens: prompt.length,
      // Input tokens actually run through the model; the rest of the prompt was reused
      // from the KV cache (checked against the shared-prefix length: within 1 token).
      evaluatedTokens: used.usedInputTokens,
      generatedTokens: used.usedOutputTokens,
      ms,
    };
  }

  async dispose(): Promise<void> {
    await this.model.dispose();
    await this.llama.dispose();
  }
}
