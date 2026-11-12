declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    OPENAI_API_KEY?: string;
    OPENAI_ORGANIZATION?: string;
    OPENAI_PROJECT?: string;
    OPENAI_MODEL?: string;
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
