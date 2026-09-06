const https = require('https');

/**
 * Gemini AI Helper Service
 * Handles communication with Google Gemini 2.0 Flash API using native Node.js HTTPS client.
 */
class Gemini {
  /**
   * @param {string|null} apiKey Optional API Key (falls back to process.env.GEMINI_API_KEY)
   */
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
  }

  /**
   * Send a prompt to Gemini and get the resulting text response
   * 
   * @param {string} prompt The text prompt to send
   * @param {string} systemInstruction Optional system persona/instruction
   * @returns {Promise<string>} AI generated text or error details
   */
  generateResponse(prompt, systemInstruction = '') {
    return new Promise((resolve, reject) => {
      if (!this.apiKey || this.apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        return resolve('Error: GEMINI_API_KEY is missing. Please configure it in your .env file.');
      }

      const url = `${this.apiUrl}?key=${this.apiKey}`;
      
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
          'Content-Length': Buffer.byteLength(dataString)
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
}

module.exports = Gemini;
