export async function getImgCompressed(img: ImageData) {
  const blob = new Blob([img.data.buffer]);
  const stream = blob.stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('deflate-raw'));
  const buffer = await new Response(compressedStream).arrayBuffer();
  return new Uint8Array(buffer);
}
export async function getImgDecompressed(data: Uint8Array) {
  const blob = new Blob([data]);
  const stream = blob.stream();
  const decompressedStream = stream.pipeThrough(new DecompressionStream('deflate-raw'));
  const buffer = await new Response(decompressedStream).arrayBuffer();
  return new Uint8ClampedArray(buffer);
}
