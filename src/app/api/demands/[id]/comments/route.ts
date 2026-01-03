import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { DemandComment } from '@/types';

// GET - Fetch comments for a demand
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, oldest, popular

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ success: true, data: { comments: [], total: 0 } });
    }

    let query: FirebaseFirestore.Query = db
      .collection('demands')
      .doc(id)
      .collection('comments');

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        query = query.orderBy('createdAt', 'asc');
        break;
      case 'popular':
        query = query.orderBy('likeCount', 'desc');
        break;
      case 'recent':
      default:
        query = query.orderBy('createdAt', 'desc');
        break;
    }

    const snapshot = await query.get();
    const allComments: DemandComment[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      allComments.push({
        id: doc.id,
        demandId: id,
        authorId: data.authorId,
        authorName: data.authorName,
        authorPhotoURL: data.authorPhotoURL,
        content: data.content,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        parentId: data.parentId,
        likeCount: data.likeCount || 0,
      });
    });

    const total = allComments.length;
    const paginatedComments = allComments.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        comments: paginatedComments,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { authorId, authorName, authorPhotoURL, content, parentId } = await request.json();

    if (!authorId || !authorName || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Comment too long (max 2000 characters)' },
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

    const now = new Date();
    const commentData = {
      demandId: id,
      authorId,
      authorName,
      authorPhotoURL: authorPhotoURL || null,
      content,
      createdAt: now,
      updatedAt: now,
      parentId: parentId || null,
      likeCount: 0,
    };

    const commentRef = await db
      .collection('demands')
      .doc(id)
      .collection('comments')
      .add(commentData);

    // Increment comment count on demand
    await db.collection('demands').doc(id).update({
      commentCount: FieldValue.increment(1),
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: commentRef.id,
        ...commentData,
      },
    });
  } catch (error) {
    console.error('Failed to add comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a comment (only by author)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { commentId, userId } = await request.json();

    if (!commentId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Comment ID and User ID are required' },
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

    const commentRef = db.collection('demands').doc(id).collection('comments').doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    const commentData = commentDoc.data();
    if (commentData?.authorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Only the author can delete this comment' },
        { status: 403 }
      );
    }

    await commentRef.delete();

    // Decrement comment count
    await db.collection('demands').doc(id).update({
      commentCount: FieldValue.increment(-1),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
