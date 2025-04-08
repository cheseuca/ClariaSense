import * as admin from 'firebase-admin';
import { NextResponse } from 'next/server';

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Missing or invalid email' }, { status: 400 });
    }

    try {
        const snap = await db.collection('subscribers').where('email', '==', email).get();
        if (snap.empty) {
            return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
        }

        snap.forEach((doc) => {
            doc.ref.delete(); // or doc.ref.update({ subscribed: false })
        });

        return NextResponse.json({ message: 'Unsubscribed successfully' }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}