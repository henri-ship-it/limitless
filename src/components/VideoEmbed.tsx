export function VideoEmbed({ youtubeId, title }: { youtubeId: string; title: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden border border-line bg-ink">
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
