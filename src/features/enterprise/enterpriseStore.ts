import { createStore, useStore } from '../../state/createStore';
import type {
  DeviceSession,
  EnterpriseDashboardData,
  EnterpriseFeatureKey,
  EnterpriseSearchFilter,
  EnterpriseSearchResult,
  TransferItem,
} from './domain';
import { mockEnterpriseRepository } from './mockEnterpriseRepository';

type EnterpriseStatus = 'idle' | 'loading' | 'ready' | 'error';

type EnterpriseState = {
  status: EnterpriseStatus;
  error: string | null;
  selectedFeature: EnterpriseFeatureKey;
  filter: EnterpriseSearchFilter;
  searchResults: EnterpriseSearchResult[];
  data: EnterpriseDashboardData | null;
};

const initialFilter: EnterpriseSearchFilter = {
  dateRange: 'any',
  department: 'All',
  entity: 'all',
  query: '',
  starredOnly: false,
};

const initialState: EnterpriseState = {
  data: null,
  error: null,
  filter: initialFilter,
  searchResults: [],
  selectedFeature: 'devices',
  status: 'idle',
};

export const enterpriseStore = createStore<EnterpriseState>(initialState);

function setDataPatch(patch: Partial<EnterpriseDashboardData>) {
  const current = enterpriseStore.getState().data;

  if (!current) {
    return;
  }

  enterpriseStore.setState({ data: { ...current, ...patch } });
}

export const enterpriseActions = {
  async initialize(force = false): Promise<void> {
    const current = enterpriseStore.getState();

    if (!force && current.data) {
      return;
    }

    try {
      enterpriseStore.setState({ error: null, status: 'loading' });
      const data = await mockEnterpriseRepository.loadDashboard();
      enterpriseStore.setState({ data, error: null, searchResults: data.searchResults, status: 'ready' });
    } catch {
      enterpriseStore.setState({ error: 'Could not load enterprise workspace.', status: 'error' });
    }
  },

  async refresh(): Promise<void> {
    await this.initialize(true);
  },

  selectFeature(selectedFeature: EnterpriseFeatureKey): void {
    enterpriseStore.setState({ selectedFeature });
  },

  async updateSearchFilter(patch: Partial<EnterpriseSearchFilter>): Promise<void> {
    const filter = { ...enterpriseStore.getState().filter, ...patch };
    enterpriseStore.setState({ filter });
    const searchResults = await mockEnterpriseRepository.search(filter);
    enterpriseStore.setState({ searchResults });
  },

  async logoutDevice(device: DeviceSession): Promise<void> {
    const current = enterpriseStore.getState().data?.devices ?? [];
    const devices = await mockEnterpriseRepository.logoutDevice(device.id, current);
    setDataPatch({ devices });
  },

  async approveDevice(device: DeviceSession): Promise<void> {
    const current = enterpriseStore.getState().data?.devices ?? [];
    const devices = await mockEnterpriseRepository.approveDevice(device.id, current);
    setDataPatch({ devices });
  },

  async updateTransfer(transfer: TransferItem, status: TransferItem['status']): Promise<void> {
    const current = enterpriseStore.getState().data?.transfers ?? [];
    const transfers = await mockEnterpriseRepository.updateTransfer(transfer.id, status, current);
    setDataPatch({ transfers });
  },
};

export function useEnterprise<Selected>(selector: (state: EnterpriseState) => Selected): Selected {
  return useStore(enterpriseStore, selector);
}
