export type PrefixPair = {
  builtin: string
  override: string
  priority?: number
}

export type TextPart = {
  type: string
  text: string
}

export type MessageLike = {
  parts: TextPart[]
}

function isLineBreak(char: string) {
  return char === "\n" || char === "\r"
}

export function sortByLengthDesc(items: PrefixPair[]) {
  return [...items].sort(
    (a, b) => b.builtin.length - a.builtin.length || (b.priority ?? 0) - (a.priority ?? 0),
  )
}

export function replaceByPrefix(text: string, pairs: PrefixPair[]) {
  for (const pair of pairs) {
    if (text.startsWith(pair.builtin)) return `${pair.override}${text.slice(pair.builtin.length)}`
  }

  return text
}

export function replaceIntroBeforeMarker(text: string, override: string, markers: string[]): string | undefined {
  for (const marker of markers) {
    const index = text.indexOf(marker)
    if (index === -1) continue

    let start = index
    while (start > 0 && isLineBreak(text[start - 1])) start--

    return `${override}${text.slice(start)}`
  }

  return undefined
}

export function rewriteStringsInPlace(strings: string[], pairs: PrefixPair[]) {
  for (let index = 0; index < strings.length; index++) {
    const next = replaceByPrefix(strings[index], pairs)
    if (next !== strings[index]) strings[index] = next
  }
}

export function rewriteMessagePartsInPlace(messages: MessageLike[], pairs: PrefixPair[]) {
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type !== "text") continue

      const next = replaceByPrefix(part.text, pairs)
      if (next !== part.text) part.text = next
    }
  }
}
