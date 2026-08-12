import { useCallback, useMemo, useState } from 'react';
import { contactsActions, useContactsStore } from '../state/contacts/contactsStore';
import type { ContactProfile, ContactSection } from '../types/contact';

const PAGE_SIZE = 48;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function groupAlphabetically(contacts: ContactProfile[]): ContactSection[] {
  const groups = new Map<string, ContactProfile[]>();

  contacts.forEach((contact) => {
    const title = contact.name.charAt(0).toUpperCase();
    const currentGroup = groups.get(title) ?? [];
    currentGroup.push(contact);
    groups.set(title, currentGroup);
  });

  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}

export function useContacts() {
  const allContacts = useContactsStore((state) => state.contacts);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const normalizedQuery = normalize(query);

  const searchedContacts = useMemo(() => {
    if (!normalizedQuery) {
      return allContacts;
    }

    return allContacts.filter((contact) => {
      const searchableText = `${contact.name} ${contact.phone}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [allContacts, normalizedQuery]);

  const visibleContacts = useMemo(() => {
    if (normalizedQuery) {
      return searchedContacts;
    }

    return searchedContacts.slice(0, visibleCount);
  }, [normalizedQuery, searchedContacts, visibleCount]);

  const sections = useMemo(() => groupAlphabetically(visibleContacts), [visibleContacts]);

  const favoriteContacts = useMemo(() => allContacts.filter((contact) => contact.favorite).slice(0, 10), [allContacts]);

  const recentContacts = useMemo(
    () => allContacts.filter((contact) => contact.recent).slice(refreshToken % 2, refreshToken % 2 + 8),
    [allContacts, refreshToken],
  );

  const loadMoreContacts = useCallback(() => {
    if (normalizedQuery || visibleCount >= allContacts.length) {
      return;
    }

    setVisibleCount((currentCount) => Math.min(currentCount + PAGE_SIZE, allContacts.length));
  }, [allContacts.length, normalizedQuery, visibleCount]);

  const refreshContacts = useCallback(() => {
    setRefreshing(true);

    void contactsActions.initialize().finally(() => {
      setVisibleCount(PAGE_SIZE);
      setRefreshToken((currentToken) => currentToken + 1);
      setRefreshing(false);
    });
  }, []);

  return {
    allContactsCount: allContacts.length,
    favoriteContacts,
    hasMoreContacts: !normalizedQuery && visibleCount < allContacts.length,
    loadMoreContacts,
    query,
    recentContacts,
    refreshing,
    refreshContacts,
    resultCount: searchedContacts.length,
    sections,
    setQuery,
  };
}
