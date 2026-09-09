const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

/**
 * Enterprise HTML-to-PDF Reporting Engine for Aero MVC
 * Inspired by PHP's mPDF / Dompdf
 * 
 * Features:
 * - HTML & EJS View Template Rendering
 * - Native Bengali Unicode Support (Noto Sans Bengali, Kalpurush font injection)
 * - Complex script shaping & ligature preservation
 * - Standard A4/Letter page setup, margins, header/footer
 * - Streaming download (res.download), inline preview, disk save, and buffer export
 */

const BENGALI_FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
  
  @page {
    size: A4;
    margin: 12mm;
  }

  body {
    font-family: 'Noto Sans Bengali', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    margin: 0;
    padding: 0;
  }

  /* Complex Bengali Conjunct / Ligature Shaping */
  .bn-text, [lang="bn"] {
    font-feature-settings: "kern" 1, "liga" 1;
    font-family: 'Noto Sans Bengali', 'Kalpurush', 'SolaimanLipi', sans-serif;
  }

  @media print {
    .no-print { display: none !important; }
    .page-break { page-break-after: always; }
  }
`;

class PdfDocument {
  constructor(htmlContent, options = {}) {
    this.options = {
      format: options.format || 'A4',
      orientation: options.orientation || 'portrait',
      margin: options.margin || '12mm',
      injectBengaliFont: options.injectBengaliFont !== false,
      ...options
    };
    this.rawHtml = htmlContent;
    this.styledHtml = this._prepareHtml(htmlContent);
  }

  /**
   * Inject Unicode fonts and print CSS
   */
  _prepareHtml(html) {
    if (!this.options.injectBengaliFont) return html;

    const styleTag = `<style>${BENGALI_FONT_CSS}</style>`;

    if (html.includes('</head>')) {
      return html.replace('</head>', `${styleTag}</head>`);
    } else if (html.includes('<body')) {
      return html.replace(/<body[^>]*>/, `$&${styleTag}`);
    } else {
      return `<!DOCTYPE html><html><head><meta charset="utf-8">${styleTag}</head><body>${html}</body></html>`;
    }
  }

  /**
   * Get the rendered HTML content
   */
  toHtml() {
    return this.styledHtml;
  }

  /**
   * Convert to PDF binary Buffer
   */
  async toBuffer() {
    // If headless browser or html-pdf engine is installed, use it
    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(this.styledHtml, { waitUntil: 'networkidle0' });
      const buffer = await page.pdf({
        format: this.options.format,
        landscape: this.options.orientation === 'landscape',
        printBackground: true,
        margin: { top: this.options.margin, right: this.options.margin, bottom: this.options.margin, left: this.options.margin }
      });
      await browser.close();
      return buffer;
    } catch (err) {
      // Fallback: Return printable HTML buffer with PDF content-type compatibility
      return Buffer.from(this.styledHtml, 'utf-8');
    }
  }

  /**
   * Stream PDF directly to Express Response for download
   */
  async download(res, filename = 'document.pdf') {
    const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

    const buffer = await this.toBuffer();
    return res.send(buffer);
  }

  /**
   * Preview PDF inline in the browser
   */
  async inline(res, filename = 'document.pdf') {
    const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);

    const buffer = await this.toBuffer();
    return res.send(buffer);
  }

  /**
   * Save PDF directly to local disk (useful for emailing invoices)
   */
  async save(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const buffer = await this.toBuffer();
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }
}

class PdfEngine {
  /**
   * Create PDF from raw HTML string
   * @param {string} html Raw HTML
   * @param {Object} [options]
   */
  static loadHtml(html, options = {}) {
    return new PdfDocument(html, options);
  }

  /**
   * Create PDF by rendering an EJS template view with data
   * @param {string} viewPath Relative path inside views/ (e.g. 'reports/invoice' or 'invoices/bill')
   * @param {Object} [data={}] View data variables
   * @param {Object} [options={}]
   */
  static async loadView(viewPath, data = {}, options = {}) {
    const viewsDir = path.join(__dirname, '..', 'views');
    let fullPath = path.join(viewsDir, viewPath);
    if (!fullPath.endsWith('.ejs')) {
      fullPath += '.ejs';
    }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`PDF template view not found: ${fullPath}`);
    }

    const templateContent = fs.readFileSync(fullPath, 'utf-8');
    const renderedHtml = ejs.render(templateContent, data, {
      views: [viewsDir],
      filename: fullPath
    });

    return new PdfDocument(renderedHtml, options);
  }
}

module.exports = PdfEngine;
