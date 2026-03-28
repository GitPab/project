declare module 'sql.js' {
  export interface SqlValue {
    toString(): string;
    toNumber(): number;
    toArray(): any[];
  }

  export interface QueryResult {
    columns: string[];
    values: SqlValue[][];
  }

  export interface Database {
    run(sql: string, params?: any[]): Database;
    exec(sql: string): QueryResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export interface Statement {
    bind(values: any[]): Statement;
    step(): boolean;
    get(): SqlValue[];
    getAsObject(): Record<string, SqlValue>;
    free(): void;
  }

  export interface SqlJsConfig {
    locateFile?: (file: string) => string;
    wasmBinary?: Uint8Array;
  }

  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }

  function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
  export default initSqlJs;
}
