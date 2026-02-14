'use client'

const stickers = [
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f917/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/2705/512.gif",
  "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4aa/512.gif",
]

interface StickerPickerProps {
  onSelect: (stickerUrl: string) => void
}

export function StickerPicker({ onSelect }: StickerPickerProps) {
  return (
    <div className="animate-scale-in mx-3 mt-2 grid max-h-40 grid-cols-6 gap-2 overflow-y-auto rounded-lg border border-border-default bg-surface p-3">
      {stickers.map((sticker, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(sticker)}
          className="flex items-center justify-center rounded-lg p-2 transition-all hover:scale-110 hover:bg-gray-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sticker} alt="Sticker" className="h-12 w-12" loading="lazy" />
        </button>
      ))}
    </div>
  )
}
