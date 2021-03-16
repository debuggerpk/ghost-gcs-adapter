# Google Cloud Storage Adapter for Ghost

Storage adapter to upload your media (images, videos) to [Google Cloud Storage](https://cloud.google.com/storage/) (in short, GCS).

Read more about Ghost's storage adapters in
[the official documentation](https://ghost.org/docs/concepts/storage-adapters/).

## Installation

```sh
cd [your/ghost/root/directory]

# Create the GCS storage adapter directory
mkdir -p content/adapters/storage/gcs

# No need for --save as we will move the content to a different folder
npm install @maher.pk/ghost-v3-google-storage

# Move the GCS storage adapter to the correct location so Ghost can find it
mv node_modules/@maher.pk/ghost-v3-google-storage/* content/adapters/storage/gcs/
```

Note: We named the storage adapter **gcs**; it's simpler to work with.

## Configuration

### Create a Google Cloud Storage bucket

Please refer to [the official documentation](https://cloud.google.com/storage/docs/creating-buckets).

### Ghost config file

Open your `config.[env].json` in the Ghost root directory and add a `storage` section.

```json
"storage": {
  "active": "gcs",
  "gcs": {
    "bucket": "your-gcs-bucket-name",
    "keyFilename": "path-to-your-service-account.json",
    "cdn": "optional-cdn-domain"
  }
}
```

**bucket**: Required.

**keyFilename**: Not required if Ghost is hosted on GCP.

**cdn**: Optional. If you use a CDN, this is the CDN base URL.
