declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    OPENAI_API_KEY?: string;
    OPENAI_ORGANIZATION?: string;
    OPENAI_PROJECT?: string;
    OPENAI_MODEL?: string;
    BUCKET?: R2Bucket;
  }
}
