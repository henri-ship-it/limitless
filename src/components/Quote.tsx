export function Quote({ text, author }: { text: string; author: string }) {
  if (!text) return null
  return (
    <figure className="border-b border-line px-6 py-10 sm:px-10 sm:py-14">
      <blockquote className="max-w-2xl text-[1.375rem] font-medium leading-[1.4] tracking-[-0.015em] sm:text-[1.625rem]">
        {text}
      </blockquote>
      <figcaption className="label mt-5">{author}</figcaption>
    </figure>
  )
}
