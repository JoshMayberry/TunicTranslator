

export interface SoundSentenceUsage {
  rupeeId: number,
  wordStartIndex: number,
  word: Array<number>,
}

export interface PageOverlay {
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface Sentence {
  id?: number
  order: number,
  title: string
  word_list: Array<number | string | null>
  translation: string
  confidence: number
  picture: string
  page_number: string
  page_overlay: PageOverlay
  comment: string
  tags: Array<string>
}

export interface DbSentence {
  id: number
  order: number,
  title?: string
  word_list?: string
  translation?: string
  confidence?: number
  picture?: string
  page_number?: string
  page_overlay: string
  comment?: string
  tags?: string
}

export type SoundType = "inner" | "outer" | "mixed" | "empty"

export interface Sound {
  id: number
  type: SoundType | ""
  guessed_sound: string
  alternate_guesses: Array<string>
  confidence: number
  comment: string
}

export interface DbSound {
  id: number
  type?: string
  guessed_sound?: string
  alternate_guesses?: string
  confidence?: number
  comment?: string
}


export const circleTheoryOptions = [
  "Nothing",
  "Outer First",
] as const;

export type CircleTheory = typeof circleTheoryOptions[number];

export interface Settings {
  id?: number,
  circle_theory: CircleTheory
  found_pages: Record<string, boolean>,
}

export interface DbSettings {
  id: number,
  found_pages?: string,
  circle_theory?: string
}
