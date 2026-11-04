// Upload da foto da avaliação direto no bucket S3.
// Usa a API REST do S3 (PUT Object) via fetch nativo do React Native:
// o @aws-sdk/client-s3 não resolve no Metro/Expo (depende de APIs Node
// e de dependências transitivas que o Metro não empacota).
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

// Envia a imagem escolhida na galeria direto para o S3 (PUT Object via
// fetch, que funciona nativamente no React Native) e devolve a URL
// pública para gravar em `photoUrl` do POST /reviews.
// O bucket precisa permitir PUT e expor `publicBaseUrl` (ex.: CORS +
// política de bucket com PutObject público, ou presigned URL via backend).
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
  const url = `${cfg.publicBaseUrl.replace(/\/$/, "")}/${key}`;

  const putRes = await fetch(url, {
    method: "PUT",
    body: blob,
    headers: {
      "Content-Type": blob.type ?? "application/octet-stream",
    },
  });

  if (!putRes.ok) {
    throw new Error(`upload falhou (${putRes.status})`);
  }

  return url;
}
