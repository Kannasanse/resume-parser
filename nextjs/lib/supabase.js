import { createClient } from '@supabase/supabase-js';

let _client = null;

function getClient() {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );
  }
  return _client;
}

// Proxy so existing `supabase.from(...)` call sites work unchanged
const supabase = new Proxy({}, {
  get(_, prop) {
    return getClient()[prop];
  },
});

export default supabase;
