import { logInfo } from "./log.ts";

/**
 * Worker のエントリポイント。現在時刻（now）と env を読んでよいのはここだけ。
 * 以降のロジックへは引数として渡す（project.md Mandated）。
 */
export default {
  // Worker は HTTP で何も公開しない（RSS-02, C-06）。公開面は Pages にある。
  fetch(): Response {
    return new Response("Not Found", { status: 404 });
  },

  scheduled(controller: ScheduledController): void {
    // TODO(COL-*): 収集（docs/spec/03-behavior.md）を実装するまでは起動の記録だけを残す。
    logInfo("collect.skipped", { durationMs: Date.now() - controller.scheduledTime });
  },
} satisfies ExportedHandler<Env>;
