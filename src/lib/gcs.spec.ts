import { Storage } from '@google-cloud/storage';
import test from 'ava';
import * as sinon from 'sinon';

import { Config, GoogleCloudStorageAdapter } from './gcs';

const config: Config = {
  bucket: 'xyz',
};

test('it should create a storage adapter', (t) => {
  sinon.mock(Storage);
  t.notThrows(() => new GoogleCloudStorageAdapter(config));
});
