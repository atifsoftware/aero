const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Image Processor Service
 * Handles image files management, resizing, center-cropping, and conversion to WebP format.
 */
class ImageProcessor {
  /**
   * @param {Buffer|object|string|null} fileInput File data input (Express file object, buffer, or file path)
   */
  constructor(fileInput = null) {
    this.sharpInstance = null;
    if (fileInput) {
      this.load(fileInput);
    }
  }

  /**
   * Load image source into sharp instance
   * 
   * @param {Buffer|object|string} fileInput 
   * @returns {ImageProcessor}
   */
  load(fileInput) {
    // If it is an express-fileupload object, load from the .data buffer
    if (fileInput && typeof fileInput === 'object' && Buffer.isBuffer(fileInput.data)) {
      this.sharpInstance = sharp(fileInput.data);
    } else {
      this.sharpInstance = sharp(fileInput);
    }
    return this;
  }

  /**
   * Resize image maintaining aspect ratio (fit inside boundaries)
   * 
   * @param {number} maxWidth 
   * @param {number} maxHeight 
   * @returns {ImageProcessor}
   */
  resize(maxWidth, maxHeight) {
    if (!this.sharpInstance) return this;
    this.sharpInstance = this.sharpInstance.resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true
    });
    return this;
  }

  /**
   * Crop image from center to match exactly target width and height
   * 
   * @param {number} width 
   * @param {number} height 
   * @returns {ImageProcessor}
   */
  cropCenter(width, height) {
    if (!this.sharpInstance) return this;
    this.sharpInstance = this.sharpInstance.resize({
      width: width,
      height: height,
      fit: 'cover',
      position: 'center'
    });
    return this;
  }

  /**
   * Save current image state as a compressed WebP image
   * 
   * @param {string} subfolder The target subfolder inside public/uploads/
   * @param {string|null} filename Custom filename (optional)
   * @param {number} quality Compression quality (1-100)
   * @returns {Promise<string|boolean>} Database-ready relative URL path on success, false on failure
   */
  async saveAsWebp(subfolder = 'products', filename = null, quality = 80) {
    if (!this.sharpInstance) return false;

    try {
      const publicDir = path.join(__dirname, '../../public');
      const physicalDir = path.join(publicDir, 'uploads', subfolder);
      const dbDir = `uploads/${subfolder}`;

      // Ensure upload physical directory exists
      if (!fs.existsSync(physicalDir)) {
        fs.mkdirSync(physicalDir, { recursive: true });
      }

      if (!filename) {
        // Generate unique filename
        filename = `${subfolder}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webp`;
      } else if (!filename.endsWith('.webp')) {
        filename = filename.replace(/\.[^/.]+$/, "") + '.webp';
      }

      const fullDestination = path.join(physicalDir, filename);
      const dbPath = `${dbDir}/${filename}`;

      await this.sharpInstance
        .webp({ quality })
        .toFile(fullDestination);

      return dbPath;
    } catch (err) {
      console.error('ImageProcessor WebP save error:', err);
      return false;
    }
  }

  /**
   * Static helper for direct single image uploads
   * 
   * @param {object|Buffer|string} file Express file object, buffer, or path
   * @param {string} subfolder Subfolder inside public/uploads/
   * @param {number|null} width Optional resize width
   * @param {number|null} height Optional resize height
   * @returns {Promise<string|boolean>}
   */
  static async upload(file, subfolder = 'products', width = null, height = null) {
    try {
      const processor = new ImageProcessor(file);
      if (width && height) {
        processor.cropCenter(width, height);
      } else if (width || height) {
        processor.resize(width, height);
      }
      return await processor.saveAsWebp(subfolder);
    } catch (e) {
      console.error('Static image upload helper failed:', e);
      return false;
    }
  }
}

module.exports = ImageProcessor;
