// Optional live conversation through the Claude API (Anthropic TypeScript/JS SDK, loaded from a CDN).
// The player supplies their own API key (stored only on this device) or a proxy URL.
// Without it, the game falls back to the local procedural generator.

let sdkPromise = null;
function loadSDK() {
  if (!sdkPromise) sdkPromise = import('https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@latest/+esm').then(m => m.default || m.Anthropic);
  return sdkPromise;
}

export const DEFAULT_MODEL = 'claude-opus-5-5';

export class LLM {
  constructor(settings) {
    this.settings = settings; // { apiKey, baseURL, model, enabled }
    this.client = null; this.key = null;
    this.failures = 0;
    this.lastError = null;
  }
  get available() {
    const s = this.settings;
    return !!(s.llmEnabled && (s.apiKey || s.baseURL) && navigator.onLine && this.failures < 3);
  }
  async getClient() {
    const s = this.settings;
    const k = (s.apiKey || '') + '|' + (s.baseURL || '');
    if (this.client && this.key === k) return this.client;
    const Anthropic = await loadSDK();
    this.Anthropic = Anthropic;
    const opts = { apiKey: s.apiKey || 'proxy', dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 45000 };
    if (s.baseURL) opts.baseURL = s.baseURL;
    this.client = new Anthropic(opts); this.key = k;
    return this.client;
  }
  // system: string; messages: [{role, content}] (must start with user). Returns text or null.
  async reply(system, messages) {
    if (!this.available) return null;
    try {
      const client = await this.getClient();
      const res = await client.beta.messages.create({
        model: this.settings.model || DEFAULT_MODEL,
        max_tokens: 2000,
        system,
        messages,
        output_config: { effort: 'low' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      });
      if (res.stop_reason === 'refusal') return null;
      const text = (res.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
      this.failures = 0; this.lastError = null;
      return text || null;
    } catch (e) {
      const A = this.Anthropic;
      if (A && e instanceof A.AuthenticationError) { this.failures = 99; this.lastError = 'La API key no es válida.'; }
      else if (A && e instanceof A.RateLimitError) { this.failures++; this.lastError = 'Demasiadas peticiones; espera un momento.'; }
      else if (A && e instanceof A.APIConnectionError) { this.failures++; this.lastError = 'Sin conexión con el servidor.'; }
      else if (A && e instanceof A.APIError) { this.failures++; this.lastError = `Error del servidor (${e.status ?? '?'}).`; }
      else { this.failures++; this.lastError = String(e && e.message || e); }
      console.warn('LLM error', e);
      return null;
    }
  }
}
