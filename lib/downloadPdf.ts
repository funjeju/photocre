'use client'

export interface PdfFromElementOptions {
  element: HTMLElement
  filename: string
  scale?: number
}

export async function downloadPdfFromElement({
  element,
  filename,
  scale = 2,
}: PdfFromElementOptions): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (doc) => {
      // html2canvas can't parse modern CSS color functions (lab(), oklch() etc.)
      // Strip all <link rel="stylesheet"> and <style> from the cloned doc
      // so only inline styles (which we write safely) are used
      doc.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => el.remove())
    },
  })

  const imgData = canvas.toDataURL('image/png')
  const pxToMm = 0.264583 // 1px = 0.264583mm at 96dpi

  const pageW = 210   // A4 mm
  const pageH = 297   // A4 mm
  const marginMm = 14

  const printableW = pageW - marginMm * 2
  const contentH = (canvas.height / canvas.width) * printableW

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let y = marginMm

  if (contentH <= pageH - marginMm * 2) {
    // Fits on a single page
    pdf.addImage(imgData, 'PNG', marginMm, y, printableW, contentH)
  } else {
    // Multi-page: slice canvas into A4-height chunks
    const pageContentH = pageH - marginMm * 2
    const sliceH = (pageContentH / printableW) * canvas.width

    let srcY = 0
    while (srcY < canvas.height) {
      const sliceCanvas = document.createElement('canvas')
      const actualSliceH = Math.min(sliceH, canvas.height - srcY)
      sliceCanvas.width = canvas.width
      sliceCanvas.height = actualSliceH
      sliceCanvas.getContext('2d')!.drawImage(
        canvas, 0, srcY, canvas.width, actualSliceH,
        0, 0, canvas.width, actualSliceH
      )
      const sliceData = sliceCanvas.toDataURL('image/png')
      const sliceMmH = (actualSliceH / canvas.width) * printableW
      if (srcY > 0) { pdf.addPage(); y = marginMm }
      pdf.addImage(sliceData, 'PNG', marginMm, y, printableW, sliceMmH)
      srcY += actualSliceH
    }
  }

  pdf.save(filename)
}
