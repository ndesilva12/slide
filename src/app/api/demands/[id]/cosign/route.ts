import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Helper to generate company key from name
function generateCompanyKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// GET - Check if user has co-signed and get co-signer list with boycott info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({
        success: true,
        data: { hasCoSigned: false, coSigners: [], boycotters: [], boycotterCount: 0 }
      });
    }

    // Get the demand to find the target company
    const demandDoc = await db.collection('demands').doc(id).get();
    const demandData = demandDoc.data();
    const targetCompanyKey = demandData?.targetCompanyKey;

    // Check if user has co-signed
    let hasCoSigned = false;
    if (userId) {
      const coSignerDoc = await db
        .collection('demands')
        .doc(id)
        .collection('coSigners')
        .doc(userId)
        .get();
      hasCoSigned = coSignerDoc.exists;
    }

    // Get recent co-signers
    const coSignersSnapshot = await db
      .collection('demands')
      .doc(id)
      .collection('coSigners')
      .orderBy('coSignedAt', 'desc')
      .limit(limit)
      .get();

    const coSigners = coSignersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        demandId: data.demandId,
        userId: data.userId,
        userName: data.userName,
        userPhotoURL: data.userPhotoURL,
        coSignedAt: data.coSignedAt?.toDate() || new Date(),
      };
    });

    // If there's a target company, find co-signers who are also boycotting it
    let boycotters: typeof coSigners = [];
    let boycotterCount = 0;

    if (targetCompanyKey && coSigners.length > 0) {
      // Get all co-signer user IDs
      const allCoSignersSnapshot = await db
        .collection('demands')
        .doc(id)
        .collection('coSigners')
        .get();

      const allCoSignerIds = allCoSignersSnapshot.docs.map(doc => doc.data().userId);

      // Check each co-signer's boycott list (batch in groups of 10 for Firestore limits)
      const boycotterIds = new Set<string>();

      for (let i = 0; i < allCoSignerIds.length; i += 10) {
        const batch = allCoSignerIds.slice(i, i + 10);
        const userListsPromises = batch.map(uid =>
          db.collection('userLists').doc(uid).get()
        );
        const userListsDocs = await Promise.all(userListsPromises);

        userListsDocs.forEach((doc, idx) => {
          if (doc.exists) {
            const data = doc.data();
            const opposeList = data?.oppose || [];
            const hasBoycotted = opposeList.some(
              (item: { companyKey: string }) => item.companyKey === targetCompanyKey
            );
            if (hasBoycotted) {
              boycotterIds.add(batch[idx]);
            }
          }
        });
      }

      boycotterCount = boycotterIds.size;

      // Get boycotter details from our co-signers list
      boycotters = coSigners.filter(cs => boycotterIds.has(cs.userId)).slice(0, 10);
    }

    return NextResponse.json({
      success: true,
      data: { hasCoSigned, coSigners, boycotters, boycotterCount },
    });
  } catch (error) {
    console.error('Failed to fetch co-signers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch co-signers' },
      { status: 500 }
    );
  }
}

// POST - Co-sign a demand
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, userName, userPhotoURL } = await request.json();

    if (!userId || !userName) {
      return NextResponse.json(
        { success: false, error: 'User ID and name are required' },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Check if demand exists
    const demandDoc = await db.collection('demands').doc(id).get();
    if (!demandDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Demand not found' },
        { status: 404 }
      );
    }

    // Check if already co-signed
    const existingCoSign = await db
      .collection('demands')
      .doc(id)
      .collection('coSigners')
      .doc(userId)
      .get();

    if (existingCoSign.exists) {
      return NextResponse.json(
        { success: false, error: 'Already co-signed this demand' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Add co-signer
    await db.collection('demands').doc(id).collection('coSigners').doc(userId).set({
      demandId: id,
      userId,
      userName,
      userPhotoURL: userPhotoURL || null,
      coSignedAt: now,
    });

    // Increment co-sign count
    await db.collection('demands').doc(id).update({
      coSignCount: FieldValue.increment(1),
      updatedAt: now,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to co-sign demand:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to co-sign demand' },
      { status: 500 }
    );
  }
}

// DELETE - Remove co-sign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Check if co-signed
    const coSignerDoc = await db
      .collection('demands')
      .doc(id)
      .collection('coSigners')
      .doc(userId)
      .get();

    if (!coSignerDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Not co-signed' },
        { status: 400 }
      );
    }

    // Check if user is the author (authors can't un-cosign)
    const demandDoc = await db.collection('demands').doc(id).get();
    if (demandDoc.data()?.authorId === userId) {
      return NextResponse.json(
        { success: false, error: 'Authors cannot remove their co-sign' },
        { status: 400 }
      );
    }

    // Remove co-signer
    await db.collection('demands').doc(id).collection('coSigners').doc(userId).delete();

    // Decrement co-sign count
    await db.collection('demands').doc(id).update({
      coSignCount: FieldValue.increment(-1),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove co-sign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove co-sign' },
      { status: 500 }
    );
  }
}
