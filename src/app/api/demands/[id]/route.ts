import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Demand } from '@/types';

// GET - Fetch a single demand by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const demandDoc = await db.collection('demands').doc(id).get();

    if (!demandDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Demand not found' },
        { status: 404 }
      );
    }

    const data = demandDoc.data();
    const demand: Demand = {
      id: demandDoc.id,
      title: data?.title,
      category: data?.category,
      description: data?.description,
      resolutionItems: data?.resolutionItems || [],
      targetCompany: data?.targetCompany,
      targetCompanyKey: data?.targetCompanyKey,
      authorId: data?.authorId,
      authorName: data?.authorName,
      authorPhotoURL: data?.authorPhotoURL,
      coSignCount: data?.coSignCount || 0,
      commentCount: data?.commentCount || 0,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
      status: data?.status || 'active',
    };

    return NextResponse.json({ success: true, data: demand });
  } catch (error) {
    console.error('Failed to fetch demand:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch demand' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a demand (only by author)
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

    const demandDoc = await db.collection('demands').doc(id).get();

    if (!demandDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Demand not found' },
        { status: 404 }
      );
    }

    const data = demandDoc.data();
    if (data?.authorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Only the author can delete this demand' },
        { status: 403 }
      );
    }

    // Delete all co-signers
    const coSignersSnapshot = await db.collection('demands').doc(id).collection('coSigners').get();
    const batch = db.batch();
    coSignersSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete all comments
    const commentsSnapshot = await db.collection('demands').doc(id).collection('comments').get();
    commentsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the demand itself
    batch.delete(db.collection('demands').doc(id));

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete demand:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete demand' },
      { status: 500 }
    );
  }
}
