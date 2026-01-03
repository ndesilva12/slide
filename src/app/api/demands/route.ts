import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Demand, DemandCategory } from '@/types';

// GET - Fetch demands with optional search/filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const category = searchParams.get('category') as DemandCategory | null;
    const status = searchParams.get('status') as Demand['status'] | null;
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, popular, trending
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ success: true, data: { demands: [], total: 0 } });
    }

    let query: FirebaseFirestore.Query = db.collection('demands');

    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }
    if (status) {
      query = query.where('status', '==', status);
    } else {
      // Default to active demands
      query = query.where('status', '==', 'active');
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        query = query.orderBy('coSignCount', 'desc');
        break;
      case 'trending':
        // For trending, we could use a combination of recency and co-signs
        // For now, order by recent activity
        query = query.orderBy('updatedAt', 'desc');
        break;
      case 'recent':
      default:
        query = query.orderBy('createdAt', 'desc');
        break;
    }

    const snapshot = await query.get();
    let demands: Demand[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      demands.push({
        id: doc.id,
        title: data.title,
        category: data.category,
        description: data.description,
        targetCompany: data.targetCompany,
        authorId: data.authorId,
        authorName: data.authorName,
        authorPhotoURL: data.authorPhotoURL,
        coSignCount: data.coSignCount || 0,
        commentCount: data.commentCount || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        status: data.status || 'active',
      });
    });

    // Apply text search (client-side filtering for simplicity)
    if (search) {
      demands = demands.filter(
        (d) =>
          d.title.toLowerCase().includes(search) ||
          d.description.toLowerCase().includes(search) ||
          d.targetCompany?.toLowerCase().includes(search)
      );
    }

    const total = demands.length;
    const paginatedDemands = demands.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        demands: paginatedDemands,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Failed to fetch demands:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch demands' },
      { status: 500 }
    );
  }
}

// POST - Create a new demand
export async function POST(request: NextRequest) {
  try {
    const { title, category, description, targetCompany, authorId, authorName, authorPhotoURL } =
      await request.json();

    if (!title || !category || !description || !authorId || !authorName) {
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

    const now = new Date();
    const demandData = {
      title,
      category,
      description,
      targetCompany: targetCompany || null,
      authorId,
      authorName,
      authorPhotoURL: authorPhotoURL || null,
      coSignCount: 1, // Author counts as first co-signer
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
      status: 'active',
    };

    const docRef = await db.collection('demands').add(demandData);

    // Also add author as first co-signer
    await db.collection('demands').doc(docRef.id).collection('coSigners').doc(authorId).set({
      demandId: docRef.id,
      userId: authorId,
      userName: authorName,
      userPhotoURL: authorPhotoURL || null,
      coSignedAt: now,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...demandData,
      },
    });
  } catch (error) {
    console.error('Failed to create demand:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create demand' },
      { status: 500 }
    );
  }
}
