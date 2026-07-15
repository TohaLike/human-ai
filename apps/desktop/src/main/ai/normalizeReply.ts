export type CapitalizationStyle = 'lower' | 'upper'

export function detectCapitalizationStyle(
  texts: Array<{ text: string; isMine: boolean }>
): CapitalizationStyle {
  let lower = 0
  let upper = 0

  for (const message of texts) {
    if (!message.isMine) {
      continue
    }

    const firstLetter = message.text.trim().match(/\p{L}/u)?.[0]
    if (!firstLetter) {
      continue
    }

    if (firstLetter === firstLetter.toLocaleLowerCase('ru')) {
      lower += 1
    } else {
      upper += 1
    }
  }

  // Prefer chat-like lowercase when unclear — less "bookish"/detached.
  return upper > lower * 1.5 ? 'upper' : 'lower'
}

/** Mostly lowercase starts; uppercase only rarely. Used with custom env prompt. */
export function pickCapitalization(
  preferred: CapitalizationStyle = 'lower'
): CapitalizationStyle {
  const rareUpperChance = preferred === 'upper' ? 0.25 : 0.12
  return Math.random() < rareUpperChance ? 'upper' : 'lower'
}

export function normalizeReply(
  raw: string,
  capitalization: CapitalizationStyle = 'lower',
  options: { stripDashes?: boolean } = {}
): string {
  let text = raw
    .trim()
    .replace(/^["'«]+|["'»]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!text) {
    return ''
  }

  if (options.stripDashes) {
    text = text
      .replace(/[\u2014\u2013]/g, ' ')
      .replace(/\s*-\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Drop trailing periods (and periods before ending emoji). Keep ? ! …
  text = text
    .replace(/\.+(?=\s*[\p{Extended_Pictographic}]+$)/u, '')
    .replace(/\.+$/u, '')
    .trim()

  // Soften mid-reply sentence dots: "Ок. А ты?" -> "ок, а ты?"
  text = text.replace(
    /\.(\s+)(\p{L})/gu,
    (_, spaces: string, letter: string) => `,${spaces}${letter.toLocaleLowerCase('ru')}`
  )

  const firstLetterIndex = text.search(/\p{L}/u)
  if (firstLetterIndex === -1) {
    return text
  }

  const letter = text[firstLetterIndex]
  const replacement =
    capitalization === 'lower'
      ? letter.toLocaleLowerCase('ru')
      : letter.toLocaleUpperCase('ru')

  return (
    text.slice(0, firstLetterIndex) + replacement + text.slice(firstLetterIndex + 1)
  )
}
