/**
 * Plays a Google Drive recording in place rather than sending the member off
 * to Drive. Any Drive file URL works: the id is pulled out and swapped onto
 * the preview endpoint, which is the only one that embeds.
 */
export function DriveEmbed({ url, title }: { url: string; title: string }) {
  const id = /\/d\/([A-Za-z0-9_-]+)/.exec(url)?.[1]

  if (!id) {
    return (
      <p>
        <a href={url} target="_blank" rel="noreferrer">
          {title}
        </a>
      </p>
    )
  }

  return (
    /*
     * No overflow clipping, and a floor on the height: Drive's player crops
     * its own video rather than scaling it when the frame gets small.
     */
    <div className="aspect-video w-full min-h-[240px] border border-line bg-ink-5">
      <iframe
        className="h-full w-full"
        src={`https://drive.google.com/file/d/${id}/preview`}
        title={title}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    </div>
  )
}
