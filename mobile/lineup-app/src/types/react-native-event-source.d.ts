declare module 'react-native-event-source' {
  type EventListener = (event: { data?: string }) => void;

  interface EventSourceOptions {
    headers?: Record<string, string>;
    withCredentials?: boolean;
    method?: string;
    body?: string;
  }

  export default class EventSource {
    constructor(url: string, options?: EventSourceOptions);
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
    close(): void;
    onerror?: (event?: any) => void;
    onopen?: (event?: any) => void;
  }
}
