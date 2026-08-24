import type { DigestNode } from '@/content/digests'

/**
 * Renders a digest as Chris wrote it. The headings vary week to week, so the
 * importer keeps the order rather than mapping onto fixed sections.
 */
export function DigestBody({ nodes }: { nodes: DigestNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        if (node.type === 'h') return <h3 key={i}>{node.text}</h3>
        if (node.type === 'sub')
          return (
            <p key={i} className="!mb-2 !text-ink font-medium">
              {node.text}
            </p>
          )
        if (node.type === 'ul')
          return (
            <ul key={i}>
              {node.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )
        return <p key={i}>{node.text}</p>
      })}
    </>
  )
}
