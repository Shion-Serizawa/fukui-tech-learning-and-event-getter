import { runCollection } from "./collector/collect.ts";
import { checkHealthAndNotify } from "./collector/health.ts";
import { logError } from "./log.ts";

/**
 * Worker のエントリポイント。現在時刻（now）と env を読んでよいのはここだけ。
 * 以降のロジックへは引数として渡す（project.md Mandated）。
 */
export default {
  // Worker は HTTP で何も公開しない（RSS-02, C-06）。公開面は Pages にある。
  fetch(): Response {
    return new Response("Not Found", { status: 404 });
  },

  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    const now = controller.scheduledTime;
    const io = {
      fetch: fetch.bind(globalThis),
      timeoutSignal: (ms: number) => AbortSignal.timeout(ms),
    };

    if (env.CONNPASS_API_KEY === "") {
      // 収集回として記録しない。成功回が途絶えるので、停止通知（HLT-02）で気づける。
      logError("collect.misconfigured", { kind: "missing_api_key" });
    } else {
      await runCollection(
        {
          ...io,
          db: env.DB,
          apiKey: env.CONNPASS_API_KEY,
          sleep: (ms) => scheduler.wait(ms),
          clock: () => Date.now(),
        },
        now,
      );
    }

    await checkHealthAndNotify({ ...io, db: env.DB, webhookUrl: env.DISCORD_WEBHOOK_URL }, now);
  },
} satisfies ExportedHandler<Env>;
