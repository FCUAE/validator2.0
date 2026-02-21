import { inngest } from './inngest-client';
import { updateScanProgress, completeScan, failScan } from '@/lib/db/queries';
import { runAllAdapters } from '@/lib/sources/index';
import { synthesizeReport } from '@/lib/ai/synthesize';
import { SOURCE_LIST } from '@/types/report';

export const processScan = inngest.createFunction(
  {
    id: 'process-scan',
    name: 'Process Validation Scan',
    retries: 1,
  },
  { event: 'scan/process' },
  async ({ event }) => {
    const { scanId, idea, audience, timeframe } = event.data;

    try {
      // Update status to scanning
      await updateScanProgress(scanId, 5, 'initializing');

      // Run all source adapters in parallel
      let completedCount = 0;
      const sourceResults = await runAllAdapters(
        idea,
        audience,
        timeframe,
        async (sourceId) => {
          completedCount++;
          const progress = Math.round((completedCount / SOURCE_LIST.length) * 70) + 5;
          await updateScanProgress(scanId, progress, sourceId);
        }
      );

      // Update progress for AI synthesis
      await updateScanProgress(scanId, 80, 'ai_synthesis');

      // Run AI synthesis
      const report = await synthesizeReport(idea, audience, timeframe, sourceResults);

      // Complete the scan
      await completeScan(scanId, report);

      return { success: true, scanId };
    } catch (error) {
      console.error('Scan processing error:', error);
      await failScan(scanId);
      throw error;
    }
  }
);
