declare module 'pg' {
  import { EventEmitter } from 'events';

  export interface PoolConfig {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    ssl?: boolean | { rejectUnauthorized: boolean };
    max?: number;
    min?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
    statement_timeout?: number;
  }

  export interface Pool extends EventEmitter {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
    options: PoolConfig;
    query(text: string, params?: any[]): Promise<{ rows: any[] }>;
    connect(): Promise<any>;
    end(): Promise<void>;
    on(event: 'connect' | 'acquire' | 'remove' | 'error', listener: (client: any) => void): this;
  }

  export class Pool extends EventEmitter {
    constructor(config?: PoolConfig);
  }
}
