export function VideoEmbed({
  youtubeId,
  title,
}: {
  youtubeId: string | null
  title: string
}) {
  if (!youtubeId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center border border-line bg-ink-3">
        <p className="label">Masterclass to follow</p>
      </div>
    )
  }

  return (
    <div className="aspect-video w-full overflow-hidden border border-line bg-ink-5">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
        title={title}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
