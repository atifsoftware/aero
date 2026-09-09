const https = require('https');

/**
 * Gemini AI Helper Service
 * Handles communication with Google Gemini Flash API using native Node.js HTTPS client.
 */
class Gemini {
  /**
   * @param {string|null} apiKey Optional API Key (falls back to process.env.GEMINI_API_KEY)
   */
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  /**
   * Send a prompt to Gemini and get the resulting text response
   * 
   * @param {string} prompt The text prompt to send
   * @param {string} systemInstruction Optional system persona/instruction
   * @returns {Promise<string>} AI generated text or error details
   */
  generateResponse(prompt, systemInstruction = '') {
    return new Promise((resolve) => {
      if (!this.apiKey || this.apiKey.toLowerCase().includes('gemini_api_key')) {
        return resolve('Error: GEMINI_API_KEY is missing or using a placeholder. Please configure a valid key in your .env file.');
      }

      const url = this.apiUrl;
      
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      };

      if (systemInstruction) {
        payload.system_instruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const dataString = JSON.stringify(payload);

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataString),
          'x-goog-api-key': this.apiKey
        }
      };

      const req = https.request(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            
            if (res.statusCode !== 200) {
              const errMsg = result.error?.message || 'Unknown API Error';
              return resolve(`API Error (${res.statusCode}): ${errMsg}`);
            }

            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
              return resolve(result.candidates[0].content.parts[0].text);
            }
            
            resolve('Error: Could not parse AI response.');
          } catch (e) {
            resolve(`Error parsing response: ${e.message}`);
          }
        });
      });

      req.on('error', (err) => {
        resolve(`Connection Error: ${err.message}`);
      });

      req.write(dataString);
      req.end();
    });
  }

  /**
   * Interactive Assistant for Business Operations
   * @param {string} question
   * @param {object|string} [context={}]
   * @returns {Promise<string>}
   */
  async askAssistant(question, context = {}) {
    const systemPrompt = `You are Aero AI, an intelligent ERP and business operations assistant. 
Help the user analyze their data, understand financial summaries, and troubleshoot system queries in a polite, helpful, and concise manner. Provide responses in Bengali if asked in Bengali, or English otherwise.`;

    const contextStr = typeof context === 'string' ? context : JSON.stringify(context, null, 2);
    const userPrompt = `Context Data:\n${contextStr}\n\nUser Question:\n${question}`;

    return await this.generateResponse(userPrompt, systemPrompt);
  }

  /**
   * Summarize financial metrics and KPI data
   * @param {object} metrics
   * @returns {Promise<string>}
   */
  async summarizeMetrics(metrics) {
    const systemPrompt = `You are a financial advisor and executive business intelligence analyst for an ERP system. 
Generate a clear, 3-4 bullet point executive overview highlighting total revenue, expenses, net profit, and any notable risks or recommendations.`;

    const prompt = `Here are the business metrics for today/this period:\n${JSON.stringify(metrics, null, 2)}\n\nPlease provide an executive summary.`;

    return await this.generateResponse(prompt, systemPrompt);
  }
}

module.exports = Gemini;
