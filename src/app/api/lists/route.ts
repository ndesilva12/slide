import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

// GET - Fetch user's lists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ success: true, data: { support: [], oppose: [] } });
    }

    // Get or create user's lists document
    const userListsRef = db.collection('userLists').doc(userId);
    const userListsDoc = await userListsRef.get();

    if (!userListsDoc.exists) {
      // Create default lists structure
      const defaultLists = {
        support: [],
        oppose: [],
        custom: {},
        updatedAt: new Date(),
      };
      await userListsRef.set(defaultLists);
      return NextResponse.json({ success: true, data: defaultLists });
    }

    const data = userListsDoc.data();
    return NextResponse.json({
      success: true,
      data: {
        support: data?.support || [],
        oppose: data?.oppose || [],
        custom: data?.custom || {},
      },
    });
  } catch (error) {
    console.error('Failed to fetch lists:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lists' },
      { status: 500 }
    );
  }
}

// POST - Add company to a list
export async function POST(request: NextRequest) {
  try {
    const { userId, listType, companyKey, companyName } = await request.json();

    if (!userId || !listType || !companyKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    const userListsRef = db.collection('userLists').doc(userId);
    const userListsDoc = await userListsRef.get();

    let currentData = userListsDoc.exists ? userListsDoc.data() : { support: [], oppose: [], custom: {} };

    // Add to the specified list if not already there
    const listArray = currentData?.[listType] || [];
    const existingIndex = listArray.findIndex((item: { companyKey: string }) => item.companyKey === companyKey);

    if (existingIndex === -1) {
      // Add to the end of the list (lowest rank)
      listArray.push({
        companyKey,
        companyName,
        addedAt: new Date(),
        rank: listArray.length + 1,
      });
    }

    await userListsRef.set(
      {
        ...currentData,
        [listType]: listArray,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    // Also update global rankings
    await updateGlobalRankings(db, companyKey, listType, 'add');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to add to list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add to list' },
      { status: 500 }
    );
  }
}

// DELETE - Remove company from a list
export async function DELETE(request: NextRequest) {
  try {
    const { userId, listType, companyKey } = await request.json();

    if (!userId || !listType || !companyKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    const userListsRef = db.collection('userLists').doc(userId);
    const userListsDoc = await userListsRef.get();

    if (!userListsDoc.exists) {
      return NextResponse.json({ success: true });
    }

    const currentData = userListsDoc.data();
    const listArray = currentData?.[listType] || [];
    const updatedList = listArray.filter((item: { companyKey: string }) => item.companyKey !== companyKey);

    // Re-rank remaining items
    updatedList.forEach((item: { rank: number }, index: number) => {
      item.rank = index + 1;
    });

    await userListsRef.update({
      [listType]: updatedList,
      updatedAt: new Date(),
    });

    // Update global rankings
    await updateGlobalRankings(db, companyKey, listType, 'remove');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove from list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove from list' },
      { status: 500 }
    );
  }
}

// PUT - Reorder list
export async function PUT(request: NextRequest) {
  try {
    const { userId, listType, orderedCompanyKeys } = await request.json();

    if (!userId || !listType || !orderedCompanyKeys) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    const userListsRef = db.collection('userLists').doc(userId);
    const userListsDoc = await userListsRef.get();

    if (!userListsDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'List not found' },
        { status: 404 }
      );
    }

    const currentData = userListsDoc.data();
    const listArray = currentData?.[listType] || [];

    // Reorder based on the new order
    const reorderedList = orderedCompanyKeys.map((companyKey: string, index: number) => {
      const existing = listArray.find((item: { companyKey: string }) => item.companyKey === companyKey);
      return {
        ...existing,
        rank: index + 1,
      };
    }).filter(Boolean);

    await userListsRef.update({
      [listType]: reorderedList,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder list' },
      { status: 500 }
    );
  }
}

// Helper function to update global rankings
async function updateGlobalRankings(
  db: FirebaseFirestore.Firestore,
  companyKey: string,
  listType: 'support' | 'oppose',
  action: 'add' | 'remove'
) {
  const globalRef = db.collection('globalRankings').doc(companyKey);
  const globalDoc = await globalRef.get();

  const field = listType === 'support' ? 'supportCount' : 'opposeCount';
  const currentCount = globalDoc.exists ? (globalDoc.data()?.[field] || 0) : 0;
  const newCount = action === 'add' ? currentCount + 1 : Math.max(0, currentCount - 1);

  await globalRef.set(
    {
      companyKey,
      [field]: newCount,
      updatedAt: new Date(),
    },
    { merge: true }
  );
}
