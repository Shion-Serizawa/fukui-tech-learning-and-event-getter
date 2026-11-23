/** 外への HTTP 呼び出しの型。実体（fetch）はエントリポイントから注入する。テストでは偽物を渡す。 */
export type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

/** 打ち切りの信号を作る関数（本番は AbortSignal.timeout）。 */
export type TimeoutSignal = (ms: number) => AbortSignal;
