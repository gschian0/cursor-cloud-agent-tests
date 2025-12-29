'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Image as ImageIcon, Download, Loader2 } from 'lucide-react'

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [generatedImages, setGeneratedImages] = useState<Array<{ id: string; prompt: string; imageUrl: string; timestamp: Date }>>([])
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load saved images from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('generated-images')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setGeneratedImages(parsed.map((img: any) => ({
            ...img,
            timestamp: new Date(img.timestamp)
          })))
        } catch (e) {
          console.error('Failed to load saved images:', e)
        }
      }
    }
  }, [])

  // Save images to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && generatedImages.length > 0) {
      localStorage.setItem('generated-images', JSON.stringify(generatedImages))
    }
  }, [generatedImages])

  // Scroll to bottom when new images are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [generatedImages, loading])

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setError("")
    setCurrentImage(null)

    try {
      const res = await fetch('/api/images/generate-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Image generation failed')
        setLoading(false)
        return
      }

      if (data.imageUrl) {
        const newImage = {
          id: Date.now().toString(),
          prompt: prompt.trim(),
          imageUrl: data.imageUrl,
          timestamp: new Date(),
        }
        setGeneratedImages(prev => [...prev, newImage])
        setCurrentImage(data.imageUrl)
        setPrompt("")
      } else {
        setError('No image was generated')
      }
    } catch (e) {
      console.error(e)
      setError('Image generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (imageUrl: string, prompt: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `image-${prompt.substring(0, 20).replace(/\s+/g, '-')}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
          <ImageIcon className="w-8 h-8" style={{ color: 'var(--primary-color)' }} />
          Image Generator
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Generate images using Gemini 3 Pro Preview. Enter a prompt and watch the magic happen!
        </p>
      </div>

      {/* Input Area */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !loading) {
                e.preventDefault()
                handleGenerate()
              }
            }}
            placeholder="Describe the image you want to generate..."
            className="modern-input flex-1 px-4 py-3 focus:outline-none"
            style={{ color: 'var(--text-primary)' }}
            disabled={loading}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="modern-button flex items-center gap-2 px-6 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Generate
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm" style={{ color: '#dc2626' }}>{error}</p>
        )}
      </div>

      {/* Current Image Display */}
      {currentImage && (
        <div className="mb-6 embossed p-4">
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Latest Generated Image</h3>
          <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface-color)' }}>
            <img 
              src={currentImage} 
              alt="Generated"
              className="w-full h-auto max-h-[500px] object-contain"
            />
            <button
              onClick={() => handleDownload(currentImage, prompt)}
              className="absolute top-2 right-2 modern-button flex items-center gap-2 px-3 py-2 text-white text-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      )}

      {/* Generated Images History */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Generated Images ({generatedImages.length})
        </h3>
        
        {generatedImages.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
            <ImageIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No images generated yet</p>
            <p className="text-sm mt-2">Enter a prompt above to generate your first image!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedImages.slice().reverse().map((img) => (
              <div key={img.id} className="embossed p-4">
                <div className="relative rounded-lg overflow-hidden mb-3" style={{ backgroundColor: 'var(--surface-color)' }}>
                  <img 
                    src={img.imageUrl} 
                    alt={img.prompt}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>{img.prompt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {img.timestamp.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleDownload(img.imageUrl, img.prompt)}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors"
                    style={{
                      color: 'var(--primary-color)',
                      backgroundColor: 'var(--surface-color)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--border-color)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-color)'
                    }}
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

