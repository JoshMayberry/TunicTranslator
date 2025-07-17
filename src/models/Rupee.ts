// src/models/Rupee.ts

import { SoundType } from '@/server/sound'
import type { RupeeSegmentState } from '../types/models'

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

  representation(includeCircle?: boolean): number {
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

  getType(): SoundType {
    return "mixed";
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
