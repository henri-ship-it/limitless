/**
 * Plays a Google Drive recording in place rather than sending the member off
 * to Drive. Any Drive file URL works: the id is pulled out and swapped onto
 * the preview endpoint, which is the only one that embeds.
 *
 * The link underneath is not decoration. Drive's player is being framed by
 * another site here, and it fails that way more often than it has any right
 * to: signed into two Google accounts, or with third party cookies turned off,
 * it returns "Unable to load video. Try again." on a file that plays perfectly
 * well when opened on its own. Nothing on this side can prevent that, so the
 * page carries a way through it rather than leaving a black box and a member
 * who thinks the recording is missing.
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
    <div>
      {/*
       * No overflow clipping, and a floor on the height: Drive's player crops
       * its own video rather than scaling it when the frame gets small.
       */}
      <div className="aspect-video w-full min-h-[240px] border border-line bg-ink-5">
        <iframe
          className="h-full w-full"
          src={`https://drive.google.com/file/d/${id}/preview`}
          title={title}
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
      <p className="!mt-3 !mb-0 text-[0.8125rem] !text-ink-56">
        Not playing?{' '}
        <a href={`https://drive.google.com/file/d/${id}/view`} target="_blank" rel="noreferrer">
          Open it in Drive
        </a>
        . Being signed in to more than one Google account is the usual reason.
      </p>
    </div>
  )
}
