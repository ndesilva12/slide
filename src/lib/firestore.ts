import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { CompanyReport, UserList, Company } from '@/types';

// Collection names
const COLLECTIONS = {
  REPORTS: 'reports',
  USERS: 'users',
  LISTS: 'lists',
  COMPANIES: 'companies',
} as const;

// Helper to convert Firestore timestamps
const convertTimestamps = <T extends DocumentData>(data: T): T => {
  const converted: Record<string, unknown> = { ...data };
  for (const key in converted) {
    const value = converted[key];
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      converted[key] = value.toDate();
    }
  }
  return converted as T;
};

// Company Reports
export async function getReportByCompanyName(companyName: string): Promise<CompanyReport | null> {
  if (!db) return null;

  const normalizedName = companyName.toLowerCase().trim();
  const reportsRef = collection(db, COLLECTIONS.REPORTS);
  const q = query(
    reportsRef,
    where('company.name', '==', normalizedName),
    orderBy('updatedAt', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...convertTimestamps(doc.data()) } as CompanyReport;
}

export async function getReportById(reportId: string): Promise<CompanyReport | null> {
  if (!db) return null;

  const docRef = doc(db, COLLECTIONS.REPORTS, reportId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...convertTimestamps(snapshot.data()) } as CompanyReport;
}

export async function saveReport(report: Omit<CompanyReport, 'id'>): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');

  const reportsRef = collection(db, COLLECTIONS.REPORTS);
  const docRef = doc(reportsRef);
  await setDoc(docRef, {
    ...report,
    createdAt: Timestamp.fromDate(report.createdAt),
    updatedAt: Timestamp.fromDate(report.updatedAt),
    'analysis.lastUpdated': Timestamp.fromDate(report.analysis.lastUpdated),
  });
  return docRef.id;
}

export async function getRecentReports(limitCount: number = 20): Promise<CompanyReport[]> {
  if (!db) return [];

  const reportsRef = collection(db, COLLECTIONS.REPORTS);
  const q = query(reportsRef, orderBy('updatedAt', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as CompanyReport[];
}

// User Lists
export async function getUserLists(userId: string): Promise<UserList[]> {
  if (!db) return [];

  const listsRef = collection(db, COLLECTIONS.LISTS);
  const q = query(listsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as UserList[];
}

export async function createUserList(list: Omit<UserList, 'id'>): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');

  const listsRef = collection(db, COLLECTIONS.LISTS);
  const docRef = doc(listsRef);
  await setDoc(docRef, {
    ...list,
    createdAt: Timestamp.fromDate(list.createdAt),
    updatedAt: Timestamp.fromDate(list.updatedAt),
  });
  return docRef.id;
}

export async function updateUserList(listId: string, updates: Partial<UserList>): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, COLLECTIONS.LISTS, listId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteUserList(listId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, COLLECTIONS.LISTS, listId);
  await deleteDoc(docRef);
}

export async function addCompanyToList(listId: string, companyId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, COLLECTIONS.LISTS, listId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) throw new Error('List not found');

  const list = snapshot.data() as UserList;
  if (!list.companyIds.includes(companyId)) {
    await updateDoc(docRef, {
      companyIds: [...list.companyIds, companyId],
      updatedAt: Timestamp.now(),
    });
  }
}

export async function removeCompanyFromList(listId: string, companyId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, COLLECTIONS.LISTS, listId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) throw new Error('List not found');

  const list = snapshot.data() as UserList;
  await updateDoc(docRef, {
    companyIds: list.companyIds.filter((id) => id !== companyId),
    updatedAt: Timestamp.now(),
  });
}

// Browse companies
export async function searchCompanies(searchTerm: string): Promise<Company[]> {
  if (!db) return [];

  const companiesRef = collection(db, COLLECTIONS.COMPANIES);
  const q = query(companiesRef, limit(50));
  const snapshot = await getDocs(q);

  const companies = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Company[];

  // Client-side filtering for now (Firestore doesn't support full-text search)
  const normalizedSearch = searchTerm.toLowerCase();
  return companies.filter(
    (c) =>
      c.name.toLowerCase().includes(normalizedSearch) ||
      c.ticker?.toLowerCase().includes(normalizedSearch) ||
      c.industry?.toLowerCase().includes(normalizedSearch)
  );
}
