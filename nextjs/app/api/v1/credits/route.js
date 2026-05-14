import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import { getBalance, getTransactions, INITIAL_CREDITS } from '@/lib/credits.js';

// GET /api/v1/credits — balance + recent transactions
export async function GET(request) {
  try {
    const { user } = await requireUser(request);
    const [balance, transactions] = await Promise.all([
      getBalance(user.id),
      getTransactions(user.id, 50),
    ]);
    return NextResponse.json({ balance, transactions });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
