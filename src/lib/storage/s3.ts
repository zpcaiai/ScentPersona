import crypto from "crypto";

/**
 * Minimal S3-compatible presigned-PUT generator (AWS SigV4, no SDK dependency).
 * Works with AWS S3, Cloudflare R2, MinIO, Backblaze B2 — any S3v4 endpoint.
 * All config from env; nothing secret is ever returned to the client except the
 * short-lived signed upload URL.
 */
export interface StorageConfig {
  endpoint: string; region: string; bucket: string;
  accessKeyId: string; secretAccessKey: string;
  publicBaseUrl: string; forcePathStyle: boolean;
}

export function getStorageConfig(): StorageConfig | null {
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/+$/, "");
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;
  return {
    endpoint, bucket, accessKeyId, secretAccessKey,
    region: process.env.S3_REGION || "auto",
    publicBaseUrl: (process.env.S3_PUBLIC_BASE_URL || `${endpoint}/${bucket}`).replace(/\/+$/, ""),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
  };
}

export function isStorageConfigured(): boolean {
  return getStorageConfig() !== null;
}

const enc = (s: string) => encodeURIComponent(s).replace(/[!*'()]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
const encPath = (key: string) => key.split("/").map(enc).join("/");
const sha256hex = (d: string) => crypto.createHash("sha256").update(d).digest("hex");
const hmac = (key: crypto.BinaryLike, d: string) => crypto.createHmac("sha256", key).update(d).digest();

/** Returns a short-lived presigned PUT URL + the eventual public URL, or null if unconfigured. */
export function presignPutUrl(key: string, expiresSeconds = 600): { uploadUrl: string; publicUrl: string; method: "PUT" } | null {
  const c = getStorageConfig();
  if (!c) return null;
  const url = new URL(c.endpoint);
  const host = url.host;
  const canonicalUri = c.forcePathStyle ? `/${c.bucket}/${encPath(key)}` : `/${encPath(key)}`;
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${c.region}/s3/aws4_request`;
  const params: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${c.accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSeconds),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQuery = Object.keys(params).sort().map((k) => `${enc(k)}=${enc(params[k])}`).join("&");
  const canonicalRequest = ["PUT", canonicalUri, canonicalQuery, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256hex(canonicalRequest)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac("AWS4" + c.secretAccessKey, dateStamp), c.region), "s3"), "aws4_request");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  return {
    uploadUrl: `${url.protocol}//${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`,
    publicUrl: `${c.publicBaseUrl}/${encPath(key)}`,
    method: "PUT",
  };
}

/**
 * Presigned POST with a size-enforcing policy (content-length-range). Unlike PUT,
 * S3/R2/MinIO reject the upload server-side if the body is outside [1, maxBytes].
 */
export function presignPost(key: string, opts: { maxBytes: number; contentType: string }): { url: string; fields: Record<string, string>; publicUrl: string } | null {
  const c = getStorageConfig();
  if (!c) return null;
  const u = new URL(c.endpoint);
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credential = `${c.accessKeyId}/${dateStamp}/${c.region}/s3/aws4_request`;
  const expiration = new Date(Date.now() + 600_000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const conditions: unknown[] = [
    { bucket: c.bucket },
    ["eq", "$key", key],
    ["content-length-range", 1, opts.maxBytes],
    ["eq", "$Content-Type", opts.contentType],
    { "x-amz-algorithm": "AWS4-HMAC-SHA256" },
    { "x-amz-credential": credential },
    { "x-amz-date": amzDate },
  ];
  const policy = Buffer.from(JSON.stringify({ expiration, conditions })).toString("base64");
  const signingKey = hmac(hmac(hmac(hmac("AWS4" + c.secretAccessKey, dateStamp), c.region), "s3"), "aws4_request");
  const signature = crypto.createHmac("sha256", signingKey).update(policy).digest("hex");
  return {
    url: c.forcePathStyle ? `${u.protocol}//${u.host}/${c.bucket}` : `${u.protocol}//${c.bucket}.${u.host}`,
    fields: {
      key, "Content-Type": opts.contentType,
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256", "X-Amz-Credential": credential, "X-Amz-Date": amzDate,
      Policy: policy, "X-Amz-Signature": signature,
    },
    publicUrl: `${c.publicBaseUrl}/${encPath(key)}`,
  };
}

/** Derive the thumbnail URL from an uploaded hero URL (same-ext ".thumb" convention). Non-uploaded (e.g. picsum) URLs pass through unchanged. */
export function deriveThumbUrl(hero?: string | null): string | undefined {
  if (!hero) return undefined;
  if (!hero.includes("/content/hero/")) return hero;
  return hero.replace(/(\.[a-z0-9]+)(\?|$)/i, ".thumb$1$2");
}
