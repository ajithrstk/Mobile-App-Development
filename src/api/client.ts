import axios, { AxiosHeaders, type AxiosAdapter, type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { analyticsService } from '../observability/analyticsService';
import { requestCoordinator } from '../services/reliability/requestCoordinator';
import { securityService } from '../security/securityService';
import { attachAuthorizationHeader, normalizeApiError, type ErrorInterceptor, type RequestInterceptor, type ResponseInterceptor } from './interceptors';
import { mockAdapter } from './mockAdapter';
import { ApiError, type ApiRequestConfig, type ApiResponse } from './types';

type MockAxiosConfig = InternalAxiosRequestConfig & {
  requiresAuth?: boolean;
  timeoutMs?: number;
};

function toApiRequestConfig(config: MockAxiosConfig): ApiRequestConfig {
  return {
    data: config.data,
    headers: AxiosHeaders.from(config.headers).toJSON() as Record<string, string>,
    method: config.method?.toUpperCase() as ApiRequestConfig['method'],
    requiresAuth: config.requiresAuth,
    timeoutMs: config.timeoutMs ?? config.timeout,
    url: config.url ?? '/',
  };
}

function toAxiosHeaders(headers?: Record<string, string>): AxiosHeaders {
  const nextHeaders = new AxiosHeaders();
  Object.entries(headers ?? {}).forEach(([key, value]) => nextHeaders.set(key, value));
  return nextHeaders;
}

const axiosMockAdapter: AxiosAdapter = async (config) => {
  const apiResponse = await mockAdapter.request(toApiRequestConfig(config as MockAxiosConfig));

  return {
    config,
    data: apiResponse,
    headers: {},
    request: { mocked: true },
    status: apiResponse.status,
    statusText: apiResponse.message,
  };
};

class ApiClient {
  private axiosInstance: AxiosInstance;
  private requestInterceptors: RequestInterceptor[] = [attachAuthorizationHeader];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [normalizeApiError];
  private retryDelaysMs = [250, 750];

  constructor() {
    this.axiosInstance = axios.create({
      adapter: axiosMockAdapter,
      baseURL: env.apiBaseUrl,
      timeout: env.requestTimeoutMs,
    });

    this.axiosInstance.interceptors.request.use(async (config) => {
      let apiConfig = toApiRequestConfig(config as MockAxiosConfig);

      for (const interceptor of this.requestInterceptors) {
        apiConfig = await interceptor(apiConfig);
      }

      return {
        ...config,
        data: apiConfig.data,
        headers: toAxiosHeaders(apiConfig.headers),
        method: apiConfig.method?.toLowerCase(),
        requiresAuth: apiConfig.requiresAuth,
        timeout: apiConfig.timeoutMs,
        timeoutMs: apiConfig.timeoutMs,
        url: apiConfig.url,
      } as MockAxiosConfig;
    });

    this.axiosInstance.interceptors.response.use(
      async (response) => {
        let apiResponse = response.data as ApiResponse<unknown>;

        for (const interceptor of this.responseInterceptors) {
          apiResponse = await interceptor(apiResponse);
        }

        return { ...response, data: apiResponse };
      },
      async (error) => {
        const apiError = error instanceof ApiError
          ? error
          : axios.isAxiosError(error) && error.code === 'ECONNABORTED'
            ? new ApiError('Request timed out', 'TIMEOUT', 408, true)
            : new ApiError('Something went wrong. Please try again.', 'MOCK_FAILURE', 500, true);

        for (const interceptor of this.errorInterceptors) {
          await interceptor(apiError);
        }

        throw apiError;
      },
    );
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  async request<T, Body = unknown>(config: ApiRequestConfig<Body>): Promise<ApiResponse<T>> {
    const method = config.method ?? 'GET';
    const requestKey = `${method}:${config.url}:${method === 'GET' ? '' : JSON.stringify(config.data ?? {})}`;

    if (method === 'GET') {
      return requestCoordinator.run(requestKey, () => this.executeRequest<T, Body>(config));
    }

    return this.executeRequest<T, Body>(config);
  }

  private async executeRequest<T, Body = unknown>(config: ApiRequestConfig<Body>): Promise<ApiResponse<T>> {
    if (!securityService.validatePinnedHost(env.apiBaseUrl)) {
      throw new ApiError('The API host failed the SSL pinning policy.', 'MOCK_FAILURE', 495, false);
    }

    const method = config.method ?? 'GET';
    const startedAt = Date.now();

    try {
      const axiosConfig: AxiosRequestConfig<Body> & { requiresAuth?: boolean; timeoutMs?: number } = {
        data: config.data,
        headers: config.headers,
        method,
        requiresAuth: config.requiresAuth,
        timeout: config.timeoutMs ?? env.requestTimeoutMs,
        timeoutMs: config.timeoutMs ?? env.requestTimeoutMs,
        url: config.url,
      };

      const response = await this.requestWithRetries<T, Body>(axiosConfig, 0);
      analyticsService.recordApiMetric({
        durationMs: Date.now() - startedAt,
        method,
        path: config.url,
        status: response.data.status,
      });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        analyticsService.recordApiMetric({
          durationMs: Date.now() - startedAt,
          method,
          path: config.url,
          status: error.status,
        });
        throw error;
      }

      throw new ApiError('Something went wrong. Please try again.', 'MOCK_FAILURE', 500, true);
    }
  }

  private async requestWithRetries<T, Body>(
    axiosConfig: AxiosRequestConfig<Body> & { requiresAuth?: boolean; timeoutMs?: number },
    attempt: number,
  ): Promise<{ data: ApiResponse<T> }> {
    try {
      return await this.axiosInstance.request<ApiResponse<T>>(axiosConfig);
    } catch (error) {
      if (error instanceof ApiError && error.retryable && attempt < this.retryDelaysMs.length) {
        await new Promise((resolve) => setTimeout(resolve, this.retryDelaysMs[attempt]));
        return this.requestWithRetries<T, Body>(axiosConfig, attempt + 1);
      }

      throw error;
    }
  }
}

export const apiClient = new ApiClient();
