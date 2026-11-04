import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export type S3PhotoConfig = {
  bucket: string;
  region: string;
  publicBaseUrl: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function s3PhotoConfig(): S3PhotoConfig {
  return {
    bucket: process.env.EXPO_PUBLIC_S3_BUCKET ?? "",
    region: process.env.EXPO_PUBLIC_S3_REGION ?? "us-east-1",
    publicBaseUrl: process.env.EXPO_PUBLIC_S3_PUBLIC_BASE_URL ?? "",
    accessKeyId: process.env.EXPO_PUBLIC_S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.EXPO_PUBLIC_S3_SECRET_ACCESS_KEY ?? "",
  };
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Envia a imagem escolhida na galeria direto para o S3 (AWS SDK mantido
// na tela de composição) e devolve a URL pública para gravar em
// `photoUrl` do POST /reviews. O bucket precisa permitir PUT com o ACL
// usado abaixo e expor `publicBaseUrl` (ex.: `${bucket}.s3.amazonaws.com`).
export async function uploadPhoto(uri: string): Promise<string> {
  const cfg = s3PhotoConfig();
  if (!cfg.bucket || !cfg.publicBaseUrl) {
    throw new Error(
      "S3 não configurado para upload de foto. Defina EXPO_PUBLIC_S3_BUCKET e EXPO_PUBLIC_S3_PUBLIC_BASE_URL.",
    );
  }
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`não foi possível ler a imagem (${res.status})`);
  }
  const blob = await res.blob();
  const ext = EXT_BY_MIME[blob.type] ?? ".bin";
  const key = `reviews/${crypto.randomUUID()}${ext}`;
  const client = new S3Client({
    region: cfg.region,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: blob,
      ContentType: blob.type ?? "application/octet-stream",
      ACL: "public-read",
    }),
  );
  return `${cfg.publicBaseUrl.replace(/\/$/, "")}/${key}`;
}
