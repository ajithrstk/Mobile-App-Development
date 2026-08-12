import type {
  AccessibilityPreference,
  AiInsight,
  AnalyticsMetric,
  CollaborationTask,
  DeploymentItem,
  DeviceSession,
  EnterpriseSearchFilter,
  EnterpriseSearchResult,
  SecurityControl,
  SharedFile,
  TransferItem,
} from './domain';
import { mockEnterpriseRepository } from './mockEnterpriseRepository';

export class DeviceSessionService {
  async listSessions(): Promise<DeviceSession[]> {
    return (await mockEnterpriseRepository.loadDashboard()).devices;
  }
}

export class CollaborationService {
  async listTasks(): Promise<CollaborationTask[]> {
    return (await mockEnterpriseRepository.loadDashboard()).tasks;
  }
}

export class EnterpriseAiService {
  async getInsights(): Promise<AiInsight[]> {
    return (await mockEnterpriseRepository.loadDashboard()).aiInsights;
  }
}

export class EnterpriseSearchService {
  async search(filter: EnterpriseSearchFilter): Promise<EnterpriseSearchResult[]> {
    return mockEnterpriseRepository.search(filter);
  }
}

export class FileManagementService {
  async listFiles(): Promise<SharedFile[]> {
    return (await mockEnterpriseRepository.loadDashboard()).files;
  }

  async listTransfers(): Promise<TransferItem[]> {
    return (await mockEnterpriseRepository.loadDashboard()).transfers;
  }
}

export class SecurityComplianceService {
  async listControls(): Promise<SecurityControl[]> {
    return (await mockEnterpriseRepository.loadDashboard()).securityControls;
  }
}

export class AccessibilityPreferenceService {
  async listPreferences(): Promise<AccessibilityPreference[]> {
    return (await mockEnterpriseRepository.loadDashboard()).accessibilityPreferences;
  }
}

export class EnterpriseAnalyticsService {
  async listMetrics(): Promise<AnalyticsMetric[]> {
    return (await mockEnterpriseRepository.loadDashboard()).analytics;
  }
}

export class DeploymentReadinessService {
  async listChecklist(): Promise<DeploymentItem[]> {
    return (await mockEnterpriseRepository.loadDashboard()).deployment;
  }
}

export const enterpriseServices = {
  accessibility: new AccessibilityPreferenceService(),
  ai: new EnterpriseAiService(),
  analytics: new EnterpriseAnalyticsService(),
  collaboration: new CollaborationService(),
  deployment: new DeploymentReadinessService(),
  devices: new DeviceSessionService(),
  files: new FileManagementService(),
  search: new EnterpriseSearchService(),
  security: new SecurityComplianceService(),
};
