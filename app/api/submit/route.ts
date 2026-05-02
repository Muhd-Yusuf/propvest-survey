import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db('propvest-survey');

    // 1. Save full survey response
    await db.collection('responses').insertOne({
      ...body,
      submittedAt: new Date(),
    });

    // 2. Save email to waitlist (separate collection for easy launch-day email)
    const email = body.email;
    const name = body.fullName || '';
    const userType = 'investor';

    if (email) {
      await db.collection('waitlist').updateOne(
        { email },
        {
          $set: { email, name, userType, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );

      // 3. Add to Brevo contact list (non-blocking — don't fail if this errors)
      addToBrevo(email, name, userType).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Submit error:', e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

async function addToBrevo(email: string, name: string, userType: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  const [firstName, ...rest] = name.split(' ');
  const lastName = rest.join(' ');

  await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email,
      attributes: {
        FIRSTNAME: firstName || '',
        LASTNAME: lastName || '',
        USER_TYPE: userType,
      },
      updateEnabled: true,
    }),
  });
}
