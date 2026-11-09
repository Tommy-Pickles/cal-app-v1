export async function prepareFoodImage(file: File): Promise<string> {
  if (!/image\/(jpeg|png|webp)/.test(file.type)) throw Error("Choose a JPEG, PNG or WebP image. For HEIC, take a screenshot first.");
  if (file.size > 20000000) throw Error("Choose an image under 20 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw Error();
    const ratio = Math.min(1, 2500 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error();
    ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL("image/jpeg", 0.9);
    if (result.length > 7000000) throw Error("Image is too large. Crop to the meal or nutrition panel.");
    return result;
  } catch (e) {
    throw Error(e instanceof Error && e.message.startsWith("Image is") ? e.message : "Could not open this image. Try a screenshot instead.");
  } finally { URL.revokeObjectURL(url); }
}
