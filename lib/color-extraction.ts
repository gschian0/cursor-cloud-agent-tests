/**
 * Extract dominant colors from an image
 * Returns an array of color hex codes sorted by frequency
 */
export async function extractColorsFromImage(imageUrl: string, colorCount: number = 5): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Set canvas size to image size (or limit for performance)
        const maxSize = 200
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Count color frequencies
        const colorMap = new Map<string, number>()
        
        // Sample pixels (every nth pixel for performance)
        const sampleRate = 4
        for (let i = 0; i < data.length; i += sampleRate * 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]
          
          // Skip transparent pixels
          if (a < 128) continue
          
          // Quantize colors to reduce noise (group similar colors)
          const quantizedR = Math.round(r / 10) * 10
          const quantizedG = Math.round(g / 10) * 10
          const quantizedB = Math.round(b / 10) * 10
          
          const colorKey = `${quantizedR},${quantizedG},${quantizedB}`
          colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1)
        }
        
        // Convert to hex and sort by frequency
        const colors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1]) // Sort by frequency
          .slice(0, colorCount) // Take top N colors
          .map(([rgb]) => {
            const [r, g, b] = rgb.split(',').map(Number)
            return `#${[r, g, b].map(x => {
              const hex = x.toString(16)
              return hex.length === 1 ? '0' + hex : hex
            }).join('')}`
          })
        
        resolve(colors)
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = imageUrl
  })
}

/**
 * Convert image file to data URL
 */
export function imageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(new Error('File read error'))
    reader.readAsDataURL(file)
  })
}

