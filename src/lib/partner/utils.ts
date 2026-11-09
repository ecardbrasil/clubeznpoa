export const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
};

export const getOfferStatusLabel = (_offer: { id: string }) => "Publicada";

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Falha ao carregar imagem."));
    reader.readAsDataURL(file);
  });

type OptimizeImageOptions = {
  /** Maior lado da imagem final, em pixels. */
  maxSize?: number;
  /** Qualidade de 0 a 1 (WebP/JPEG). */
  quality?: number;
};

const loadImageElement = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Falha ao carregar imagem."));
    };
    image.src = url;
  });

/**
 * Redimensiona e converte a imagem para WebP antes de salvar (as imagens são guardadas como data URL).
 * SVG e GIF animado são mantidos como estão. Se algo falhar, cai para o arquivo original.
 */
export const readImageAsOptimizedDataUrl = async (file: File, options: OptimizeImageOptions = {}) => {
  const { maxSize = 1200, quality = 0.8 } = options;

  if (typeof document === "undefined" || file.type === "image/svg+xml" || file.type === "image/gif") {
    return readFileAsDataUrl(file);
  }

  try {
    const image = await loadImageElement(file);
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return readFileAsDataUrl(file);
    context.drawImage(image, 0, 0, width, height);

    const webp = canvas.toDataURL("image/webp", quality);
    const optimized = webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", quality);

    // Nunca devolver algo maior que o original (ex.: imagem já pequena e otimizada).
    return optimized.length < file.size * 1.37 ? optimized : readFileAsDataUrl(file);
  } catch {
    return readFileAsDataUrl(file);
  }
};
