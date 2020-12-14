/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */
import { join } from 'path';

import { Bucket, Storage, UploadOptions } from '@google-cloud/storage';
import { NextFunction, Request, Response } from 'express';
import StorageBase, { Image, ReadOptions } from 'ghost-storage-base';

export type Config = {
  readonly keyFilename?: string;
  readonly bucket: string;
  readonly domain?: string;
  // eslint-disable-next-line functional/prefer-readonly-type
  insecure?: boolean;
  // eslint-disable-next-line functional/prefer-readonly-type
  maxAge?: number;
};

export class GoogleCloudStorageAdapter extends StorageBase {
  private readonly _storage: Storage;
  private readonly _bucket: Bucket;

  constructor(private readonly config: Config) {
    super();

    config.insecure = config.insecure == null || undefined ? false : config.insecure;
    config.maxAge = config.maxAge == null || undefined ? 2678400 : config.maxAge;

    this._storage = config.keyFilename ? new Storage({ keyFilename: config.keyFilename }) : new Storage();
    this._bucket = this._storage.bucket(config.bucket);
  }

  private get _storageURL(): string {
    const protocol = this.config.insecure ? 'http' : 'https';
    const url = this.config.domain || join('storage.googleapis.com', this.config.bucket);
    return `${protocol}://${url}`;
  }

  public async save(image: Image, targetDir?: string): Promise<string> {
    targetDir = targetDir || this.getTargetDir();

    const destination = await this.getUniqueFileName(image, targetDir);
    const uploadOptions: UploadOptions = {
      destination,
      metadata: {
        cacheControl: `public, max-age=${this.config.maxAge}`,
      },
      public: true,
    };

    await this._bucket.upload(image.path, uploadOptions);

    return `${this._storageURL}/${destination}`;
  }

  serve() {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  public async exists(fileName: string, targetDir?: string): Promise<boolean> {
    targetDir = targetDir || this.getTargetDir();
    const targetFile = join(targetDir, fileName);

    const data = await this._bucket.file(targetFile).exists();
    return data[0];
  }

  public async read(options: ReadOptions): Promise<Buffer> {
    const data = await this._bucket.file(options.path).download();
    return data[0];
  }

  public async delete(fileName: string, targetDir?: string): Promise<boolean> {
    targetDir = targetDir || this.getTargetDir();
    const targetFile = join(targetDir, fileName);

    try {
      await this._bucket.file(targetFile).delete();
      return true;
    } catch (e) {
      return false;
    }
  }
}
