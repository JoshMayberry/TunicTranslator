<template>
  <div class="p-4 bg-white rounded shadow space-y-2">
    <canvas ref="emeraldCanvas" :class="isWord ? 'rupee-canvas--is-word' : ''" :width="width + margin*2" :height="height*1.3 + margin*2" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue"
import { getRupeeInnerValue, getRupeeOuterValue, Rupee } from "@/models/Rupee"

interface Coord {
    x: number
    y: number
}

interface Segment {
    a: Coord
    b: Coord
}

interface Circledo {
    center: Coord
    radius: number
}

export default defineComponent({
  name: "RupeeDisplay",
  data(): {
      ctx?: CanvasRenderingContext2D,
      segments: Segment[],
      circledo?: Circledo,
      word_segment?: Segment,
      highlighted_segment_index?: number,
      mouse_down: boolean,
      selected: boolean,
    } {
    return {
      segments: [],
      mouse_down: false,
      selected: false,
    }
  },
  emits: ["update:rupee", "update:rupee:value", "update:rupee"],
  props: {
    rupee: { type: Object as () => Rupee, default: Rupee.fromRepresentation(0) },
    width: { type: Number, default: 100 },
    margin: { type: Number, default: 10 },
    linewidth: { type: Number, default: 5 },
    clickRadius: { type: Number, default: 5 },
    outerColor: { type: String, default: "black" },
    innerColor: { type: String, default: "black" },
    emptyColor: { type: String, default: "lightgray" },
    isInteractive: { type: Boolean, default: true },
    isDebug: { type: Boolean, default: true },
    isWord: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    
    confidenceCatalog: { type: Object as () => Record<number, number>, default: {} },
    useThreholdColors: { type: Boolean, default: false },
    thresholdHigh: { type: Number, default: 80 },
    thresholdLow: { type: Number, default: 30 },
    colorHigh: { type: String, default: "green" },
    colorMedium: { type: String, default: "orange" },
    colorLow: { type: String, default: "red" },
  },
  mounted() {
    const canvas = this.getCanvas();

    if (this.isInteractive) {
       // Prevent the functions from being added multiple times for every remount
      canvas.removeEventListener("mousedown", this.mouse_start);
      canvas.removeEventListener("mousemove", this.mouse_start);
      canvas.removeEventListener("mouseup", this.mouse_start);
      canvas.removeEventListener("mouseleave", this.mouse_start);

      canvas.addEventListener(
          "mousedown",
          this.mouse_start,
          false
      );
      canvas.addEventListener(
          "mousemove",
          this.mouse_move,
          false
      );
      canvas.addEventListener(
          "mouseup",
          this.mouse_up,
          false
      );
      canvas.addEventListener(
          "mouseleave",
          this.mouse_leave,
          false
      );
    }

    this.updateCanvasContext();
    this.change_size();
    this.update();
  },
  computed: {
    height(): number {
       return this.width*2;
    }
  },
  watch: {
    rupee: {
      handler() {
        this.update();
      },
      immediate: false,  // Wait until mounted to listen
      deep: false
    }
  },
  methods: {
    reset() {
        this.selected = false;
        this.update();
    },
    updateCanvasContext() {
      const canvas = this.getCanvas();
      if (!canvas) {
        console.error("Missing Canvas!")
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Missing Canvas Context!")
        return;
      }
      this.ctx = ctx;
    },
    getCanvas(): HTMLCanvasElement {
        return this.$refs.emeraldCanvas as HTMLCanvasElement;
    },
    change_size() {
        this.segments = [];

        // Outer Segments clockwise from bottom, right
        this.segments.push(
          {
           a: {x: (this.width / 2) * 2, y: (this.height / 6) * 5},
            b: {x: (this.width / 2) * 1, y: (this.height / 6) * 6},
          }
        );

        this.segments.push(
          {
           a: {x: (this.width / 2) * 1, y: (this.height / 6) * 6},
            b: {x: (this.width / 2) * 0, y: (this.height / 6) * 5},
          }
        );

        this.segments.push(
          {
           a: {x: (this.width / 2) * 0, y: (this.height / 6) * 5},
            b: {x: (this.width / 2) * 0, y: (this.height / 6) * 1},
          }
        );

        this.segments.push(
          {
           a: {x: (this.width / 2) * 0, y: (this.height / 6) * 1},
            b: {x: (this.width / 2) * 1, y: (this.height / 6) * 0},
          }
        );

        this.segments.push(
          {
           a: {x: (this.width / 2) * 1, y: (this.height / 6) * 0},
            b: {x: (this.width / 2) * 2, y: (this.height / 6) * 1},
          }
        );

        // Inner segments clockwise from bottom right

        this.segments.push(
          {
           a: {x: (this.width / 2) * 1, y: (this.height / 6) * 4},
            b: {x: (this.width / 2) * 2, y: (this.height / 6) * 5},
          }
        );

        this.segments.push(
          {
           a: {x: (this.width / 2) * 1, y: (this.height / 6) * 4},
            b: {x: (this.width / 2) * 1, y: (this.height / 6) * 6},
          }
        );

        this.segments.push(
          {
           a: {x: (this.width / 2) * 1, y: (this.height / 6) * 4},
            b: {x: (this.width / 2) * 0, y: (this.height / 6) * 5},
          }
        );

        this.segments.push(
          {
           a: {x: (this.width / 2) * 1, y: (this.height / 6) * 2},
            b: {x: (this.width / 2) * 0, y: (this.height / 6) * 1},
          }
        );

        this.segments.push(
          {
           a: {x: (this.width / 2) * 1, y: (this.height / 6) * 2},
            b: {x: (this.width / 2) * 1, y: (this.height / 6) * 0},
          }
        );

        this.segments.push(
          {
           a: {x: (this.width / 2) * 1, y: (this.height / 6) * 2},
            b: {x: (this.width / 2) * 2, y: (this.height / 6) * 1},
          }
        );

        // Middle Segment

        this.segments.push(
          {
           a: {x: (this.width / 2) * 1, y: (this.height / 6) * 2},
            b: {x: (this.width / 2) * 1, y: (this.height / 6) * 4},
          }
        );

        // Circledo segment (not drawn, but used for indexing)
        this.segments.push(
          {
           a: {x: (this.width / 2) * 1, y: (this.height / 6) * 6},
            b: {x: (this.width / 2) * 1, y: (this.height / 6) * 7},
          }
        );

        // Word Segment

        this.word_segment = this.isWord ? {
          a: {x: (this.width / 2) * 0, y: (this.height / 6) * 3},
          b: {x: (this.width / 2) * 2, y: (this.height / 6) * 3},
        } : undefined;

        // Circledo

        this.circledo = {
          center: {x: (this.width / 2) * 1, y: (this.height / 6) * 6.5},
          radius: this.height / 6 / 2,
        };
    },
    clear() {
        const canvas = this.getCanvas(); 
        this.ctx!.clearRect(0, 0, canvas.width, canvas.height);
    },
    draw_circle(circledo: Circledo, color: string) {
        this.ctx!.strokeStyle = color;
        this.ctx!.lineWidth = this.linewidth;
        this.ctx!.beginPath();
        this.ctx!.arc(circledo.center.x, circledo.center.y, circledo.radius, 0, 2 * Math.PI);
        this.ctx!.stroke();
    },
    draw_background() {
        this.clear();
        for (let [i, segment] of this.segments.entries()) {
            if (i + 1 == this.segments.length) break; // Skip the last segment which is the circledo
            this.draw_line(segment, this.emptyColor);
        }

        if (this.circledo) {
            this.draw_circle(
                this.circledo,
                this.emptyColor
            );
        }
    },
    draw_line(segment: Segment, color: string) {
        this.ctx!.strokeStyle = color;
        this.ctx!.lineWidth = this.linewidth;
        this.ctx!.lineCap = "round";

        this.ctx!.beginPath();
        this.ctx!.moveTo(segment.a.x, segment.a.y);
        this.ctx!.lineTo(segment.b.x, segment.b.y);
        this.ctx!.stroke();
    },
    update() {
        const canvas = this.getCanvas();
        this.clear();

        this.ctx!.save();
        this.ctx!.translate(this.margin, this.margin);

        const colorInnerResolved = this.resolveColor(true);
        const colorOuterResolved = this.resolveColor(false);

        this.draw_background();

        const value = (this.disabled ? 0 : this.rupee.getRepresentation(true));
        // console.log("Drawing Rupee:", value)

        // Draw highlighted segments
        let i = 0;
        while (value >> i > 0) {
          if (((value >> i) & 0x1) == 1) {
            // If we encounter the circledo, do something special
            if (i + 1 == this.segments.length) {
                if (this.circledo) {
                    this.draw_circle(
                        this.circledo,
                        this.outerColor,
                    );
                }
              break;
            }

            const isOuter = i < 5;
            this.draw_line(this.segments[i], (isOuter ? colorOuterResolved : colorInnerResolved));
          }
          i++;
        }

         // Highlight where mouse is
        if (this.highlighted_segment_index !== undefined) {
            let highlight_color = "rgba(0,0,0,.1)";
            if (this.mouse_down == true)
                highlight_color = "#008800";

            if (this.highlighted_segment_index + 1 == this.segments.length) {
                if (this.circledo) {
                  this.draw_circle(
                      this.circledo,
                      highlight_color
                  );
                }
            }
            else
                this.draw_line(this.segments[this.highlighted_segment_index], highlight_color);
        }

        // Clear the word space and add line
        if (this.word_segment) {
          this.ctx!.clearRect(
            -this.margin,
            this.height / 2,
            canvas.width,
            this.height / 6
          );
          this.draw_line(this.word_segment, this.innerColor);
        }

        // Add debug text
        if (this.isDebug) {
          this.ctx!.font = this.height / 10 + "px Arial";
          this.ctx!.textAlign = "center";
          this.ctx!.fillStyle = colorInnerResolved;
          this.ctx!.fillText(
            `${value}`,
            this.width / 2,
            (this.height / 6) * 3.75
          );
        }

        this.ctx!.restore();
    },

    getCursorPosition(event: MouseEvent): Coord {
        // Determine where clicked
        const canvas = this.getCanvas(); 
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        return {x, y};
    },

    highlightNearest(e: MouseEvent) {
      let pos = this.getCursorPosition(e);
      this.highlighted_segment_index = this.closest_segment(pos);
      this.update();
    },

    mouse_start(e: MouseEvent) {
      if (this.disabled || (this.isInteractive != true)) {
        return;
      }
      e.preventDefault();
      this.mouse_down = true;
      this.highlightNearest(e);
    },

    mouse_move(e: MouseEvent) {
      if (this.disabled || (this.isInteractive != true)) {
        return;
      }
      e.preventDefault();
      this.highlightNearest(e);
    },

    mouse_up(e: MouseEvent) {
      if (this.disabled || (this.isInteractive != true)) {
        return;
      }
      e.preventDefault();
      this.mouse_down = false;
      let pos = this.getCursorPosition(e);
      this.toggle_segment(this.closest_segment(pos));
      this.update();
    },

    mouse_leave(e: MouseEvent) {
      e.preventDefault();
      this.highlighted_segment_index = undefined;
      this.mouse_down = false;
      this.update();
    },

    toggle_segment(i?: number) {
      if (i === undefined) {
        return;
      }

      let value = this.rupee.getRepresentation(true)
      value ^= 1 << i;

      // The parent will need to update it, which will trigger an update flow.
      const updated = Rupee.fromRepresentation(value);
      this.$emit('update:rupee', updated);
      this.$emit('update:rupee:value', value);
    },

    is_close(mouse: Coord, segment: Segment): boolean {
      // find middle of segment
      let d = this.distance_from_line(segment, mouse);

      // Correct input for margin
      //mouse.x -= this.margin;
      //mouse.y -= this.margin;

      if (d < 5) {
          // console.log("@is_close", segment, mouse, d);
          return true;
      }
      return false;
    },

    closest_segment(p: Coord): number | undefined {
      let closest = undefined;
      let distance = 999;

      for (let i = 0; i < this.segments.length; i++) {
          // Find the radius from the center of the line
          let mid_line = this.find_line_midpoint(this.segments[i]);
          let radial_distance = this.distance_from_point(mid_line, p);

          // Find the distance tangentially from line
          let tangent_distance = this.distance_from_line(this.segments[i], p);

          // Find closest tanget within radial bounds
          if (tangent_distance < distance && radial_distance < 30) {
              distance = tangent_distance;
              closest = i
          }
      }

      return closest
    },

    find_line_midpoint(l: Segment): Coord {
      return {x: (l.a.x + l.b.x) / 2, y: (l.a.y + l.b.y) / 2};
    },

    distance_from_line(segment: Segment, p: Coord): number {
      return ((Math.abs((segment.b.y - segment.a.y) * p.x -
        (segment.b.x - segment.a.x) * p.y +
        segment.b.x * segment.a.y -
        segment.b.y * segment.a.x)) /
      (Math.pow((Math.pow(segment.b.y - segment.a.y, 2) +
        Math.pow(segment.b.x - segment.a.x, 2)),
      0.5)));
    },

    distance_from_point(a: Coord, b: Coord): number {
        return Math.abs(Math.hypot(a.x - b.x, a.y - b.y));
    },

    resolveColor(isInner: boolean): string {
      if (!this.useThreholdColors || !Object.keys(this.confidenceCatalog).length) {
        if (isInner) {
          return this.innerColor;
        }
        return this.outerColor;
      }

      const rupeeId = this.rupee.getRepresentation(false)
      const soundId = (isInner ? getRupeeInnerValue(rupeeId) : getRupeeOuterValue(rupeeId))
      const confidence = this.confidenceCatalog[soundId];

      if (!confidence || (confidence < 0)) {
        if (isInner) {
          return this.innerColor;
        }
        return this.outerColor;
      }

      if (confidence > this.thresholdHigh) {
        return this.colorHigh;
      }

      if (confidence > this.thresholdLow) {
        return this.colorMedium;
      }
      
      return this.colorLow;
    },
  }
});
</script>

<style scoped>
.rupee-canvas--is-word {
  margin-left: -9px;
  margin-right: -9px;
}
</style>