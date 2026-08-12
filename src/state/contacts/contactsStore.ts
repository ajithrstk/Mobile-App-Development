import type { ContactProfile } from '../../types/contact';
import { contactsService } from '../../services/chatService';
import { storageKeys } from '../../storage/storageKeys';
import { storageService } from '../../storage/storageService';
import { createStore, useStore } from '../createStore';

type ContactsState = {
  contacts: ContactProfile[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
};

export const contactsStore = createStore<ContactsState>({ contacts: [], error: null, status: 'idle' });

export const contactsActions = {
  async initialize(): Promise<void> {
    const cached = await storageService.get<ContactProfile[]>(storageKeys.contacts, []);
    contactsStore.setState({ contacts: cached, status: cached.length > 0 ? 'ready' : 'loading' });

    try {
      const contacts = await contactsService.fetchContacts();
      await storageService.set(storageKeys.contacts, contacts);
      contactsStore.setState({ contacts, error: null, status: 'ready' });
    } catch {
      contactsStore.setState({ error: 'Could not refresh contacts.', status: cached.length > 0 ? 'ready' : 'error' });
    }
  },
};

export function useContactsStore<Selected>(selector: (state: ContactsState) => Selected): Selected {
  return useStore(contactsStore, selector);
}
