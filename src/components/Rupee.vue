<template>
  <div class="p-4 bg-white rounded shadow space-y-2">
    <canvas ref="emeraldCanvas" class="" :width="width + margin*2" :height="height*1.3 + margin*2"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue"
import { Rupee } from "@/models/Rupee"

// const testRupee = new Rupee({
//     outer: {topLeft: true, middleLeft: true},
//     inner: {topCenter: true, center: true, bottomRight: true}
// })


const testRupee = Rupee.fromRepresentation(82)

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
  name: "Rupee",
  data(): { state: Rupee, ctx?: CanvasRenderingContext2D, segments: Segment[], circledo?: Circledo, word_segment?: Segment } {
    return {
      state: testRupee,
      segments: [],
    }
  },
  props: {
    width: {
      type: Number,
      default: 100
    },
    margin: {
      type: Number,
      default: 10
    },
    linewidth: {
      type: Number,
      default: 5
    },
    clickRadius: {
      type: Number,
      default: 5
    },
    outerColor: {
      type: String,
      default: "red"
    },
    innerColor: {
      type: String,
      default: "green"
    },
    emptyColor: {
      type: String,
      default: "lightgray"
    },
    isInteractive: {
      type: Boolean,
      default: true
    },
    isDebug: {
      type: Boolean,
      default: true
    },
  },
  mounted() {
    const canvas = this.getCanvas();
    canvas.addEventListener(
        "mousedown",
        this.mouse_start,
        false
    );

    this.updateCanvasContext();
    this.change_size();
    this.update();
  },
  computed: {
    height(): number {
       return this.width*2;
    }
  },
  methods: {
    updateCanvasContext() {
      const canvas = this.getCanvas();
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
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

        this.word_segment = {
          a: {x: (this.width / 2) * 0, y: (this.height / 6) * 3},
          b: {x: (this.width / 2) * 2, y: (this.height / 6) * 3},
        };

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

        this.draw_background();

        const value = this.state.representation(true, false);

        // Draw highlighted segments
        let i = 0;
        while (value >> i > 0) {
          if (((value >> i) & 0x1) == 1) {
            // If we encounter the circledo, do something special
            if (i + 1 == this.segments.length) {
                if (this.circledo) {
                    this.draw_circle(
                        this.circledo,
                        this.innerColor,
                    );
                }
              break;
            }

            const isInner = i < 5;
            this.draw_line(this.segments[i], (isInner ? this.innerColor : this.outerColor));
          }
          i++;
        }

        // Clear the word space and add line
        this.ctx!.clearRect(
          -this.margin,
          this.height / 2,
          canvas.width,
          this.height / 6
        );
        if (this.word_segment) {
            this.draw_line(this.word_segment, this.innerColor);
        }

        // Add debug text
        if (this.isDebug) {
          this.ctx!.font = this.height / 10 + "px Arial";
          this.ctx!.textAlign = "center";
          this.ctx!.fillStyle = this.innerColor;
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

    mouse_start(e: MouseEvent) {
        console.log("@mouse_start")
        if (this.isInteractive != true) return;
        e.preventDefault();
        let pos = this.getCursorPosition(e);
        this.toggle_segment(pos);
        },

        toggle_segment(p: Coord) {
        let value = this.state.representation()
        for (let i = 0; i < this.segments.length; i++) {
            if (this.is_close(p, this.segments[i])) {
            value ^= 1 << i;
            break;
            }
        }
        this.state = Rupee.fromRepresentation(value);
        this.update();
    },

    is_close(p: Coord, l: Segment) {
        // find middle of segment
        let m: Coord = {x:(l.a.x + l.b.x) / 2, y:(l.a.y + l.b.y) / 2};

        // Correct input for margin
        //p.x += this.margin;
        //p.y += this.margin;

        const distance = Math.abs(Math.hypot(p.x - m.x, p.y - m.y));
        if (distance< this.width / this.clickRadius) return true;
        return false;
    }
  }
});
</script>