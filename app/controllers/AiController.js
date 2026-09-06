const Gemini = require('../services/Gemini');
const DB = require('../../config/db');

class AiController {
  /**
   * POST /api/ai/ask
   * Query the AI assistant with optional context
   */
  static async ask(req, res) {
    try {
      const { prompt, context } = req.body;

      if (!prompt) {
        return res.error('Prompt is required', 422);
      }

      const gemini = new Gemini();
      const answer = await gemini.askAssistant(prompt, context || {});

      return res.success({
        prompt,
        response: answer
      }, 'AI response generated successfully');
    } catch (err) {
      console.error('AiController.ask error:', err);
      return res.error(`Failed to generate AI response: ${err.message}`, 500);
    }
  }

  /**
   * POST /api/ai/summarize
   * Generate an automated business intelligence summary
   */
  static async summarize(req, res) {
    try {
      let metrics = req.body?.metrics;

      // If no metrics provided in body, compile real-time metrics from database
      if (!metrics) {
        let totalUsers = 0;
        let totalLogs = 0;
        let totalVouchers = 0;

        try {
          const userRes = await DB.query("SELECT COUNT(*) as count FROM tbl_users");
          totalUsers = userRes[0]?.count || 0;
        } catch {}

        try {
          const logRes = await DB.query("SELECT COUNT(*) as count FROM activity_logs");
          totalLogs = logRes[0]?.count || 0;
        } catch {}

        try {
          const voucherRes = await DB.query("SELECT COUNT(*) as count FROM tbl_vouchers");
          totalVouchers = voucherRes[0]?.count || 0;
        } catch {}

        metrics = {
          totalUsers,
          totalLogs,
          totalVouchers,
          timestamp: new Date().toISOString()
        };
      }

      const gemini = new Gemini();
      const summary = await gemini.summarizeMetrics(metrics);

      return res.success({
        metrics,
        summary
      }, 'Executive summary generated successfully');
    } catch (err) {
      console.error('AiController.summarize error:', err);
      return res.error(`Failed to generate summary: ${err.message}`, 500);
    }
  }
}

module.exports = AiController;
