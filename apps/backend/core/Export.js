const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');

/**
 * Enterprise Memory-Safe Data Export Engine for Aero MVC
 * 
 * Supports:
 * - Direct HTTP streaming with minimal memory footprint
 * - Automatic UTF-8 Byte Order Mark (BOM) for native Excel Bengali/Unicode support
 * - Automatic CSV sanitization to prevent CSV Injection / Formula injection (=, +, -, @)
 * - Array of objects, AsyncIterators, or Readable streams
 */
class Export {
  /**
   * Escape and sanitize CSV cell value
   * @param {*} value
   * @returns {string}
   */
  static sanitizeCell(value) {
    if (value === null || value === undefined) return '""';
    
    let str = String(value);

    // Prevent CSV Formula Injection vulnerability in Excel/Calc
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }

    // Escape existing double quotes by doubling them
    str = str.replace(/"/g, '""');

    return `"${str}"`;
  }

  /**
   * Format a single row of values into CSV line
   * @param {Array<*>} values
   * @returns {string}
   */
  static formatRow(values) {
    return values.map(v => this.sanitizeCell(v)).join(',') + '\r\n';
  }

  /**
   * Stream CSV data directly to Express Response
   * 
   * @param {Array<Object>|AsyncIterable<Object>|Readable} dataSource Rows of data
   * @param {Array<{ key: string, label: string, formatter?: Function }>} columns Column definitions
   * @param {Object} res Express HTTP response object
   * @param {string} [filename='export.csv'] Filename for Content-Disposition
   */
  static async toCsvStream(dataSource, columns, res, filename = 'export.csv') {
    const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);

    // Write UTF-8 BOM for Excel native Unicode (Bengali) recognition
    res.write('\uFEFF');

    // Write Header row
    const headerRow = columns.map(c => c.label || c.key);
    res.write(this.formatRow(headerRow));

    const processRow = (item) => {
      const rowValues = columns.map(col => {
        let val = item[col.key];
        if (typeof col.formatter === 'function') {
          val = col.formatter(val, item);
        }
        return val;
      });
      return this.formatRow(rowValues);
    };

    // If dataSource is an Array
    if (Array.isArray(dataSource)) {
      for (const item of dataSource) {
        if (!res.write(processRow(item))) {
          await new Promise(resolve => res.once('drain', resolve));
        }
      }
      return res.end();
    }

    // If dataSource is an AsyncIterable or Stream
    if (dataSource[Symbol.asyncIterator]) {
      for await (const item of dataSource) {
        if (!res.write(processRow(item))) {
          await new Promise(resolve => res.once('drain', resolve));
        }
      }
      return res.end();
    }

    return res.end();
  }

  /**
   * Save CSV to disk directly
   * @param {Array<Object>} rows 
   * @param {Array<{ key: string, label: string, formatter?: Function }>} columns 
   * @param {string} filePath 
   */
  static async toCsvFile(rows, columns, filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const writeStream = fs.createWriteStream(filePath, { encoding: 'utf-8' });
    
    // Write UTF-8 BOM
    writeStream.write('\uFEFF');

    // Header
    const headerRow = columns.map(c => c.label || c.key);
    writeStream.write(this.formatRow(headerRow));

    for (const item of rows) {
      const rowValues = columns.map(col => {
        let val = item[col.key];
        if (typeof col.formatter === 'function') {
          val = col.formatter(val, item);
        }
        return val;
      });
      writeStream.write(this.formatRow(rowValues));
    }

    await new Promise(resolve => writeStream.end(resolve));
    return filePath;
  }
}

module.exports = Export;
