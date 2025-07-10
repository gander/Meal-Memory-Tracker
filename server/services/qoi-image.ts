import QOI from 'qoijs';
import sharp from 'sharp';

interface QOIImageData {
  data: string; // base64 encoded QOI data
  width: number;
  height: number;
}

interface ImageProcessingResult {
  qoiData: string;
  width: number;
  height: number;
}

class QOIImageService {
  /**
   * Convert uploaded image file to QOI format for database storage
   */
  async processImageForStorage(imageBuffer: Buffer): Promise<ImageProcessingResult> {
    try {
      // Use Sharp to get image metadata and convert to raw RGBA data
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Could not determine image dimensions');
      }

      // Convert to RGBA format (4 channels) with max width/height of 1920px to save space
      const maxDimension = 1920;
      let { width, height } = metadata;
      
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const { data } = await image
        .resize(width, height)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Encode to QOI format - QOI expects Uint8Array
      const uint8Data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      const qoiArrayBuffer = QOI.encode(uint8Data, {
        width,
        height,
        channels: 4, // RGBA
        colorspace: 0 // sRGB
      });

      // Convert ArrayBuffer to base64 string for database storage
      const qoiBuffer = Buffer.from(qoiArrayBuffer);
      const qoiData = qoiBuffer.toString('base64');

      return {
        qoiData,
        width,
        height
      };
    } catch (error) {
      console.error('Error processing image for QOI storage:', error);
      throw new Error('Failed to process image for storage');
    }
  }

  /**
   * Convert QOI data from database back to web-compatible format (PNG)
   */
  async convertQOIToWebFormat(qoiData: string, width: number, height: number): Promise<Buffer> {
    try {
      // Decode base64 QOI data
      const qoiBuffer = Buffer.from(qoiData, 'base64');
      const arrayBuffer = qoiBuffer.buffer.slice(
        qoiBuffer.byteOffset,
        qoiBuffer.byteOffset + qoiBuffer.byteLength
      );

      // Decode QOI to raw RGBA data
      const decoded = QOI.decode(arrayBuffer);
      
      if (!decoded || !decoded.data) {
        throw new Error('Failed to decode QOI data');
      }

      // Convert raw RGBA data back to PNG using Sharp
      const pngBuffer = await sharp(Buffer.from(decoded.data), {
        raw: {
          width: decoded.width || width,
          height: decoded.height || height,
          channels: decoded.channels || 4
        }
      })
      .png()
      .toBuffer();

      return pngBuffer;
    } catch (error) {
      console.error('Error converting QOI to web format:', error);
      throw new Error('Failed to convert image for display');
    }
  }

  /**
   * Generate data URL for direct use in frontend
   */
  async getImageDataURL(qoiData: string, width: number, height: number): Promise<string> {
    try {
      const pngBuffer = await this.convertQOIToWebFormat(qoiData, width, height);
      const base64PNG = pngBuffer.toString('base64');
      return `data:image/png;base64,${base64PNG}`;
    } catch (error) {
      console.error('Error generating image data URL:', error);
      throw new Error('Failed to generate image data URL');
    }
  }
}

export const qoiImageService = new QOIImageService();