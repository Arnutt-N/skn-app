'use client'

const emojiList = [
  "😀","😂","😍","🥰","😎","🤔","👍","👎","❤️","🔥",
  "🎉","✨","💯","🙏","👏","🤝","💪","😊","😢","😮",
  "🚀","⭐","💡","📌","✅","❌","⏰","📎","🎯","💬",
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
    <div className="animate-scale-in mx-3 mt-2 grid max-h-36 grid-cols-10 gap-1 overflow-y-auto rounded-lg border border-border-default bg-surface p-2">
      {emojiList.map((emoji, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(emoji)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-transform hover:scale-125 hover:bg-gray-100"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
