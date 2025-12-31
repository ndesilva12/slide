'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface ListItem {
  companyKey: string;
  companyName: string;
  addedAt: Date;
  rank: number;
}

interface UserListsData {
  support: ListItem[];
  oppose: ListItem[];
  custom: Record<string, ListItem[]>;
}

interface UserListsContextType {
  lists: UserListsData;
  loading: boolean;
  isInSupport: (companyKey: string) => boolean;
  isInOppose: (companyKey: string) => boolean;
  addToList: (listType: 'support' | 'oppose', companyKey: string, companyName: string) => Promise<void>;
  removeFromList: (listType: 'support' | 'oppose', companyKey: string) => Promise<void>;
  reorderList: (listType: 'support' | 'oppose', orderedKeys: string[]) => Promise<void>;
  refreshLists: () => Promise<void>;
}

const UserListsContext = createContext<UserListsContextType | undefined>(undefined);

export function UserListsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [lists, setLists] = useState<UserListsData>({
    support: [],
    oppose: [],
    custom: {},
  });
  const [loading, setLoading] = useState(false);

  const fetchLists = useCallback(async () => {
    if (!user) {
      setLists({ support: [], oppose: [], custom: {} });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/lists?userId=${user.uid}`);
      const data = await response.json();

      if (data.success) {
        setLists({
          support: data.data.support || [],
          oppose: data.data.oppose || [],
          custom: data.data.custom || {},
        });
      }
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const isInSupport = useCallback(
    (companyKey: string) => {
      return lists.support.some((item) => item.companyKey === companyKey);
    },
    [lists.support]
  );

  const isInOppose = useCallback(
    (companyKey: string) => {
      return lists.oppose.some((item) => item.companyKey === companyKey);
    },
    [lists.oppose]
  );

  const addToList = useCallback(
    async (listType: 'support' | 'oppose', companyKey: string, companyName: string) => {
      if (!user) return;

      // Optimistic update
      setLists((prev) => {
        const otherList = listType === 'support' ? 'oppose' : 'support';
        return {
          ...prev,
          [listType]: [
            ...prev[listType],
            { companyKey, companyName, addedAt: new Date(), rank: prev[listType].length + 1 },
          ],
          [otherList]: prev[otherList].filter((item) => item.companyKey !== companyKey),
        };
      });

      try {
        // Remove from other list first if exists
        const otherList = listType === 'support' ? 'oppose' : 'support';
        const isInOther = lists[otherList].some((item) => item.companyKey === companyKey);
        if (isInOther) {
          await fetch('/api/lists', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid, listType: otherList, companyKey }),
          });
        }

        await fetch('/api/lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, listType, companyKey, companyName }),
        });
      } catch (error) {
        console.error('Failed to add to list:', error);
        // Revert on error
        await fetchLists();
      }
    },
    [user, lists, fetchLists]
  );

  const removeFromList = useCallback(
    async (listType: 'support' | 'oppose', companyKey: string) => {
      if (!user) return;

      // Optimistic update
      setLists((prev) => ({
        ...prev,
        [listType]: prev[listType].filter((item) => item.companyKey !== companyKey),
      }));

      try {
        await fetch('/api/lists', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, listType, companyKey }),
        });
      } catch (error) {
        console.error('Failed to remove from list:', error);
        await fetchLists();
      }
    },
    [user, fetchLists]
  );

  const reorderList = useCallback(
    async (listType: 'support' | 'oppose', orderedKeys: string[]) => {
      if (!user) return;

      // Optimistic update
      setLists((prev) => {
        const reordered = orderedKeys
          .map((key, index) => {
            const item = prev[listType].find((i) => i.companyKey === key);
            return item ? { ...item, rank: index + 1 } : null;
          })
          .filter(Boolean) as ListItem[];

        return {
          ...prev,
          [listType]: reordered,
        };
      });

      try {
        await fetch('/api/lists', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, listType, orderedCompanyKeys: orderedKeys }),
        });
      } catch (error) {
        console.error('Failed to reorder list:', error);
        await fetchLists();
      }
    },
    [user, fetchLists]
  );

  return (
    <UserListsContext.Provider
      value={{
        lists,
        loading,
        isInSupport,
        isInOppose,
        addToList,
        removeFromList,
        reorderList,
        refreshLists: fetchLists,
      }}
    >
      {children}
    </UserListsContext.Provider>
  );
}

export function useUserLists() {
  const context = useContext(UserListsContext);
  if (context === undefined) {
    throw new Error('useUserLists must be used within a UserListsProvider');
  }
  return context;
}
