import type Konva from 'konva';

export function exportStageToPng(stage: Konva.Stage, filename = 'framelab.png'): void {
  const dataURL = stage.toDataURL({ mimeType: 'image/png', quality: 1 });
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  a.click();
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
