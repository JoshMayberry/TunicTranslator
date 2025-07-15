export interface RupeeSegmentState {
  outer?: {
    bottomRight?: boolean // 1
    bottomLeft?: boolean  // 10
    middleLeft?: boolean  // 100
    topLeft?: boolean     // 1000
    topRight?: boolean    // 10000
  }
  inner?: {
    bottomRight?: boolean  // 100000
    bottomCenter?: boolean // 1000000
    bottomLeft?: boolean   // 10000000
    topLeft?: boolean      // 100000000
    topCenter?: boolean    // 1000000000
    topRight?: boolean     // 10000000000
    center?: boolean       // 100000000000
  }
  bottomCircle?: boolean   // 1000000000000
  joiner?: boolean
}

export interface SymbolMeaning {
  id: string
  type: 'inner' | 'outer'
  guessedSound: string
  alternateGuesses: string[]
  confidence: number
  notes?: string
}

export interface Word {
  id: string
  rupeeCount: number
  rupees: RupeeSegmentState[]
  symbolRefs: { innerId: string; outerId: string }[]
  translationGuess: string
  notes?: string
  confidence: number
  screenshotPath?: string
  tags?: string[]
}

export interface WordInstance {
  wordId: string
  sentenceId: string
  notes?: string
  speaker?: string
  emphasis?: string
}

export interface Sentence {
  id: string
  notes: string
  confidence: number
  screenshotPath?: string
  tags?: string[]
  wordInstances: WordInstance[]
}
