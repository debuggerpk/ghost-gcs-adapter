import { join } from 'path';

import { Bucket, Storage, UploadOptions } from '@google-cloud/storage';
import { NextFunction, Request, Response } from 'express';
import StorageBase, { Image, ReadOptions } from 'ghost-storage-base';

/**
 * Configuration for Google Cloud Storage
 */
export type Config = {
  readonly keyFilename?: string;
  readonly bucket: string;
  readonly domain?: string;
  insecure?: boolean;
  maxAge?: number;
};

/**
 * Google Cloud Storage Adapter for Ghost
 *
 * @export
 * @class GoogleCloudStorageAdapter
 * @extends {StorageBase}
 */
export class GoogleCloudStorageAdapter extends StorageBase {
  private _bucket: Bucket;
  private _url: string;

  constructor(private readonly config: Config) {
    super();

    config.insecure = config.insecure == null || undefined ? false : config.insecure;
    config.maxAge = config.maxAge == null || undefined ? 2678400 : config.maxAge;

    const storage = config.keyFilename ? new Storage({ keyFilename: config.keyFilename }) : new Storage();
    this.bucket = storage.bucket(config.bucket);
    this.url = config.bucket;
  }

  /**
   * Get the bucket
   *
   * @private
   * @type {Bucket}
   * @memberof GoogleCloudStorageAdapter
   */
  private get bucket(): Bucket {
    return this._bucket;
  }

  /**
   * Set the bucket
   *
   * @private
   * @memberof GoogleCloudStorageAdapter
   */
  private set bucket(_bucket: Bucket) {
    // eslint-disable-next-line functional/immutable-data
    this._bucket = _bucket;
  }

  /**
   * Get the url of the bucket
   *
   * @private
   * @type {string}
   * @memberof GoogleCloudStorageAdapter
   */
  private get url(): string {
    return this._url;
  }

  /**
   * Set the url of the bucket. If domain is not configured, it will use the default otherwise it will use the provided
   * domain
   *
   * @private
   * @memberof GoogleCloudStorageAdapter
   */
  private set url(_url: string) {
    const protocol = this.config.insecure ? 'http' : 'https';
    const url = this.config.domain || join('storage.googleapis.com', _url);
    // eslint-disable-next-line functional/immutable-data
    this._url = `${protocol}://${url}`;
  }

  /**
   * Save image to Google Cloud Storage
   *
   * @param {Image} image image to save
   * @param {string} [targetDir] directory to save image
   * @return {*}  {Promise<string>} the url of the saved image
   * @memberof GoogleCloudStorageAdapter
   */
  public async save(image: Image, targetDir?: string): Promise<string> {
    // eslint-disable-next-line no-param-reassign
    targetDir = targetDir || this.getTargetDir();

    const destination = this.getUniqueFileName(image, targetDir);
    const uploadOptions: UploadOptions = {
      destination,
      metadata: {
        cacheControl: `public, max-age=${this.config.maxAge}`,
      },
      public: true,
    };

    await this._bucket.upload(image.path, uploadOptions);

    return `${this.url}/${destination}`;
  }

  // `serve` is not required for GCS
  serve() {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  /**
   * Check if file exists in Google Cloud Storage
   *
   * @param {string} fileName name of the file
   * @param {string} [targetDir] directory to check
   * @return {*}  {Promise<boolean>} true if file exists
   * @memberof GoogleCloudStorageAdapter
   */
  public async exists(fileName: string, targetDir?: string): Promise<boolean> {
    // eslint-disable-next-line no-param-reassign
    targetDir = targetDir || this.getTargetDir();
    const targetFile = join(targetDir, fileName);

    const data = await this.bucket.file(targetFile).exists();
    return data[0];
  }

  /**
   * Read file from Google Cloud Storage
   *
   * @param {ReadOptions} options options to read file
   * @return {*}  {Promise<Buffer>} the file content
   * @memberof GoogleCloudStorageAdapter
   */
  public async read(options: ReadOptions): Promise<Buffer> {
    const data = await this.bucket.file(options.path).download();
    return data[0];
  }

  /**
   * Delete file from Google Cloud Storage
   *
   * @param {string} fileName name of the file
   * @param {string} [targetDir] directory to delete file
   * @return {*}  {Promise<boolean>} true if file is deleted
   * @memberof GoogleCloudStorageAdapter
   */
  public async delete(fileName: string, targetDir?: string): Promise<boolean> {
    // eslint-disable-next-line no-param-reassign
    targetDir = targetDir || this.getTargetDir();
    const targetFile = join(targetDir, fileName);

    try {
      await this.bucket.file(targetFile).delete();
      return true;
    } catch (e) {
      return false;
    }
  }
}
