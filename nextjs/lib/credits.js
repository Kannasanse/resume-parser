import supabase from './supabase.js';

export const CREDIT_COSTS = {
  ats_score:      3,
  resume_import:  5,
  writing_assist: 1,
};

export const CREDIT_LABELS = {
  ats_score:        'ATS Score Analysis',
  resume_import:    'Resume Import (AI)',
  writing_assist:   'AI Writing Assistant',
  admin_grant:      'Credits granted by admin',
  initial_grant:    'Welcome credits',
  request_approved: 'Credits from approved request',
};

export const INITIAL_CREDITS = 30;

// Ensure user has a credit record; create with INITIAL_CREDITS if missing.
// Returns current balance.
export async function ensureCredits(userId) {
  const { data, error } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (data) return data.balance;

  // Insert initial grant
  await supabase.from('user_credits').insert({ user_id: userId, balance: INITIAL_CREDITS });
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: INITIAL_CREDITS,
    type: 'initial_grant',
    description: CREDIT_LABELS.initial_grant,
  });

  return INITIAL_CREDITS;
}

// Get current balance (auto-initialises if missing)
export async function getBalance(userId) {
  return ensureCredits(userId);
}

// Attempt to deduct `cost` credits. Returns { ok, balance }.
// If insufficient returns { ok: false, balance }.
export async function deductCredits(userId, type) {
  const cost = CREDIT_COSTS[type];
  if (!cost) throw new Error(`Unknown credit type: ${type}`);

  await ensureCredits(userId);

  // Atomic decrement — only if balance >= cost
  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount:  cost,
  });

  // RPC returns new balance or -1 if insufficient
  if (error || data === null || data < 0) {
    const { data: row } = await supabase.from('user_credits').select('balance').eq('user_id', userId).single();
    return { ok: false, balance: row?.balance ?? 0 };
  }

  // Log transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -cost,
    type,
    description: CREDIT_LABELS[type] || type,
  });

  return { ok: true, balance: data };
}

// Grant credits (admin or system). Returns new balance.
export async function grantCredits(userId, amount, type = 'admin_grant', description = null) {
  await ensureCredits(userId);

  const { data } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount:  amount,
  });

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount,
    type,
    description: description || CREDIT_LABELS[type] || type,
  });

  return data;
}

// Recent transactions for a user
export async function getTransactions(userId, limit = 50) {
  const { data } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}
