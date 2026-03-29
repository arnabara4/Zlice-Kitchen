import { printReceipt } from '@/lib/printer/pwa-printer';

export interface PrintJob {
  id: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  data: any; // ReceiptData
  created_at: number;
  retry_count: number;
  error?: string;
}

export const printQueue = {
  async addJob(receiptData: any) {
    // Simplified direct printing - no queue persistence
    try {
      await printReceipt(receiptData);
      console.log('✅ Print job completed successfully');
      return crypto.randomUUID(); // Return a job ID for compatibility
    } catch (err: any) {
      console.error('❌ Print job failed:', err);
      throw err;
    }
  },

  async processQueue() {
    // No-op - direct printing doesn't need queue processing
    console.log('ℹ️ Print queue processing not needed (direct mode)');
  },

  async getPendingCount() {
    // Always return 0 - no persistent queue
    return 0;
  },

  async retryFailedJobs() {
    // No-op - no failed jobs to retry
    console.log('ℹ️ No failed jobs to retry (direct mode)');
  }
};
