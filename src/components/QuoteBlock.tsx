import type { Quote } from '../data'

export function QuoteBlock({ text, author }: Quote) {
  return (
    <figure className="text-center">
      <blockquote className="font-serif text-[18px] leading-relaxed text-ink-muted italic text-pretty">
        “{text}”
      </blockquote>
      {author && (
        <figcaption className="mt-2 text-[12px] tracking-wide text-ink-faint">— {author}</figcaption>
      )}
    </figure>
  )
}
