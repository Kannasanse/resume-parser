export const dynamic = 'force-dynamic';

export async function POST() {
  return Response.json(
    { error: 'Short answer grading has been removed.' },
    { status: 410 }
  );
}
