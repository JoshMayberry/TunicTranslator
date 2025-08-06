// src/models/Rupee.ts

import { SoundType, CircleTheory } from '@/server/types'

export type PossibleRupeeValue = number | string | null;

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
}

export interface TranslationWord {
  word: Array<PossibleRupeeValue>,
  text: string,
  confidence?: number,
}

export interface SentenceWord {
  indexStart: number,
  indexEnd: number,
  word: Array<PossibleRupeeValue>,
}

export class Rupee {
  state: RupeeSegmentState

  constructor(state?: Partial<RupeeSegmentState>) {
    this.state = {
      outer: {
        bottomRight: false,
        bottomLeft: false,
        middleLeft: false,
        topLeft: false,
        topRight: false,
        ...(state?.outer || {})
      },
      inner: {
        bottomRight: false,
        bottomCenter: false,
        bottomLeft: false,
        topLeft: false,
        topCenter: false,
        topRight: false,
        center: false,
        ...(state?.inner || {})
      },
      bottomCircle: state?.bottomCircle ?? false,
    }
  }

  getRepresentation(includeCircle?: boolean): number {
    let value = 0

    // Outer bits
    if (this.state.outer?.bottomRight) value |= 1;                   // 2^0
    if (this.state.outer?.bottomLeft)  value |= 1 << 1;              // 2^1
    if (this.state.outer?.middleLeft)  value |= 1 << 2;              // 2^2
    if (this.state.outer?.topLeft)     value |= 1 << 3;              // 2^3
    if (this.state.outer?.topRight)    value |= 1 << 4;              // 2^4

    // Inner bits
    if (this.state.inner?.bottomRight)  value |= 1 << 5;             // 2^5
    if (this.state.inner?.bottomCenter) value |= 1 << 6;             // 2^6
    if (this.state.inner?.bottomLeft)   value |= 1 << 7;             // 2^7
    if (this.state.inner?.topLeft)      value |= 1 << 8;             // 2^8
    if (this.state.inner?.topCenter)    value |= 1 << 9;             // 2^9
    if (this.state.inner?.topRight)     value |= 1 << 10;            // 2^10
    if (this.state.inner?.center)       value |= 1 << 11;            // 2^11

    // Bottom circle
    if (includeCircle && this.state.bottomCircle) value |= 1 << 12; // 2^12

    return value;
  }

  static fromRepresentation(representation: number): Rupee {
    const state: RupeeSegmentState = {
      outer: {
        bottomRight: !!(representation & (1 << 0)),
        bottomLeft:  !!(representation & (1 << 1)),
        middleLeft:  !!(representation & (1 << 2)),
        topLeft:     !!(representation & (1 << 3)),
        topRight:    !!(representation & (1 << 4))
      },
      inner: {
        bottomRight:  !!(representation & (1 << 5)),
        bottomCenter: !!(representation & (1 << 6)),
        bottomLeft:   !!(representation & (1 << 7)),
        topLeft:      !!(representation & (1 << 8)),
        topCenter:    !!(representation & (1 << 9)),
        topRight:     !!(representation & (1 << 10)),
        center:       !!(representation & (1 << 11))
      },
      bottomCircle: !!(representation & (1 << 12)),
    }

    return new Rupee(state)
  }
}

export function getRupeeInnerValue(representation: number): number {
  return representation & 4064;
}

export function getRupeeOuterValue(representation: number, includeCircle?: boolean): number {
  if (includeCircle) {
    return representation & 4127;
  }
  return representation & 31;
}

export function getRupeeCircledo(representation: number): number {
  return representation >> 12;
}

export function getRupeeType(representation: number): SoundType {
  const inner = getRupeeInnerValue(representation);
  const outer = getRupeeOuterValue(representation);

  if (inner === 0) {
    if (outer === 0) {
      return "empty"
    }

    return "outer"
  }
  
  if (outer === 0) {
    return "inner"
  }

  return "mixed";
}

export function getSentence(rupeeIdList: Array<PossibleRupeeValue>): Array<SentenceWord> {
  let indexStart = 0
  let indexCurrent = -1
  let word = [] as Array<PossibleRupeeValue>
  const sentence = [] as Array<SentenceWord>
  for (const rupeeId of rupeeIdList) {
    indexCurrent++
    if ((rupeeId === undefined) || (rupeeId === null)) {
      if (word.length) {
        sentence.push({
          indexStart: indexStart,
          indexEnd: indexCurrent,
          word,
        });
      }
      sentence.push({
        indexStart: indexCurrent,
        indexEnd: indexCurrent,
        word: [],
      });

      indexStart = indexCurrent + 1;
      word = [];
      continue;
    }

    if (typeof rupeeId === "string") {
      if (word.length) {
        sentence.push({
          indexStart: indexStart,
          indexEnd: indexCurrent,
          word,
        });
      }
      sentence.push({
        indexStart: indexCurrent,
        indexEnd: indexCurrent,
        word: [rupeeId],
      });

      indexStart = indexCurrent + 1;
      word = [];
      continue;
    }

    word.push(rupeeId);
  }
  if (word.length) {
    sentence.push({
      indexStart: indexStart,
      indexEnd: indexCurrent,
      word,
    });
  }
  return sentence;
}

export function combineWord(word: Array<PossibleRupeeValue>): string {
  return word.map((item) => `${item}`).join("_");
}

export function getPheneticWord(soundCatalog: Record<number, string>, circleTheory: CircleTheory, word: PossibleRupeeValue[]): string {
  let pheneticWord = "";
  for (const rupeeId of word) {
    if ((rupeeId === undefined) || (rupeeId === null)) {
      pheneticWord += " ";
      continue
    }

    if (rupeeId === 0) {
        pheneticWord += (soundCatalog[rupeeId] || "?");
        continue;
    }

    if (typeof rupeeId === "string") {
        pheneticWord += rupeeId;
        continue;
    }

    let hasOther = false;
    const inner = getRupeeInnerValue(rupeeId);
    const outer = getRupeeOuterValue(rupeeId);
    const hasCircledo = getRupeeCircledo(rupeeId) === 1;
    const myList = ((circleTheory === "Outer First") && hasCircledo) ? [outer, inner] : [inner, outer];
    for (const soundId of myList) {
        if (soundId === 0) {
          continue;
        }

        if (pheneticWord != "") {
          pheneticWord += (hasOther ? "•" : "-");
        }
        pheneticWord += (soundCatalog[soundId] || "?");
        hasOther = true
    }
  }
  
  return pheneticWord;
}

export function getColorFromConfidence(confidence?: number): string {
  if (confidence === undefined || confidence === null) {
    return "black";
  }

  // Clamp to 0–100
  confidence = Math.max(0, Math.min(100, confidence));

  // Optional: use a nonlinear scale (e.g., logarithmic) if desired
  // confidence = Math.log(confidence + 1) / Math.log(101) * 100;

  // Map 0-100 confidence to hue range 0 (red) to 120 (green)
  const hue = (confidence / 100) * 120;

  // Return HSL color
  return `hsl(${hue}, 100%, 40%)`;
}