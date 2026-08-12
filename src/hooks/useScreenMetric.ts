import { useEffect } from 'react';
import { analyticsService } from '../observability/analyticsService';

export function useScreenMetric(screenName: string): void {
  useEffect(() => analyticsService.startScreenLoad(screenName), [screenName]);
}
