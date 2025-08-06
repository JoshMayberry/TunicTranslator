<template>
  <div class="p-4 bg-white rounded shadow space-y-2">
    <canvas
      ref="canvas"
      :width="imageWidth"
      :height="imageHeight"
      @mousedown="startDragging"
      @mousemove="onDrag"
      @mouseup="stopDragging"
      @mouseleave="stopDragging"
      @wheel="onWheel"
      @dblclick="zoom = 1; draw()"
    ></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { PageOverlay } from "@/server/types";

export default defineComponent({
  name: "ImageOverlayEditorCanvas",
  props: {
    src: { type: String, required: true },
    overlay: { type: Object as PropType<PageOverlay>, default: {x: 0, y: 0, width: 0, height: 0} },
    alt: { type: String, default: "Page Image" },
    applyOverlayMask: { type: Boolean, default: false },
  },
  emits: ["update:overlay"],
  data() {
    return {
        dragStart: { x: 0, y: 0 },
        dragEnd: { x: 0, y: 0 },
        isDragging: false,
        image: null as HTMLImageElement | null,
        imageWidth: 0,
        imageHeight: 0,
        internalOverlay: this.overlay,
        zoom: 1.0,
    };
  },
  watch: {
    applyOverlayMask() {
        this.draw();
    },
    overlay: {
      deep: true,
      handler(newVal) {
        this.internalOverlay = { ...newVal };
        this.draw();
      },
    },
    src: {
      handler(newVal) {
        this.loadImage();
        this.draw();
      },
    },
  },
  created() {
    this.loadImage();
  },
  mounted() {
    this.loadImage();
  },
  computed: {
    shouldApplyOverlayCrop(): boolean {
        return !!(this.applyOverlayMask && this.overlay?.height && this.overlay?.width);
    }
  },
  methods: {
    async loadImage() {
      this.image = null;
      const img = new Image();
      img.src = this.src;
      img.onload = () => {
        this.imageWidth = img.width;
        this.imageHeight = img.height;
        this.image = img;
        this.draw();
      };
      img.onerror = (err) => {
        console.error("@loadImage.IMAGE_LOAD_ERROR", {
          src: this.src,
          error: err,
        });
      };
    },
    draw() {
        const canvas = this.$refs.canvas as HTMLCanvasElement;
        const ctx = canvas.getContext("2d");
        if (!ctx || !this.image) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const { x = 0, y = 0, width = 1, height = 1 } = this.internalOverlay;

        if (this.shouldApplyOverlayCrop) {
            // Compute source crop area from image dimensions
            const sx = x * this.imageWidth;
            const sy = y * this.imageHeight;
            const sw = width * this.imageWidth;
            const sh = height * this.imageHeight;

            canvas.width = sw * this.zoom;
            canvas.height = sh * this.zoom;

            ctx.save();
            ctx.scale(this.zoom, this.zoom);
            ctx.drawImage(this.image, sx, sy, sw, sh, 0, 0, sw, sh);
        } else {
            // Normal full image draw
            canvas.width = this.imageWidth * this.zoom;
            canvas.height = this.imageHeight * this.zoom;

            ctx.save();
            ctx.scale(this.zoom, this.zoom);
            ctx.drawImage(this.image, 0, 0, this.imageWidth, this.imageHeight);
            ctx.restore();

            // Draw overlay rectangle
            ctx.save();
            ctx.scale(this.zoom, this.zoom);

            ctx.strokeStyle = "blue";
            ctx.lineWidth = 2;
            ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
            ctx.fillRect(x * this.imageWidth, y * this.imageHeight, width * this.imageWidth, height * this.imageHeight);
            ctx.strokeRect(x * this.imageWidth, y * this.imageHeight, width * this.imageWidth, height * this.imageHeight);

            ctx.restore();
        }
    },
    startDragging(event: MouseEvent) {
        if (this.shouldApplyOverlayCrop) return;
        const rect = (this.$refs.canvas as HTMLCanvasElement).getBoundingClientRect();
        const x = (event.clientX - rect.left) / this.zoom;
        const y = (event.clientY - rect.top) / this.zoom;

        this.dragStart = { x, y };
        this.dragEnd = { x, y };
        this.isDragging = true;
    },
    onDrag(event: MouseEvent) {
        if (!this.isDragging || this.shouldApplyOverlayCrop) return;

        const rect = (this.$refs.canvas as HTMLCanvasElement).getBoundingClientRect();
        const x = (event.clientX - rect.left) / this.zoom;
        const y = (event.clientY - rect.top) / this.zoom;

        this.dragEnd = { x, y };

        const x1 = Math.min(this.dragStart.x, this.dragEnd.x);
        const y1 = Math.min(this.dragStart.y, this.dragEnd.y);
        const x2 = Math.max(this.dragStart.x, this.dragEnd.x);
        const y2 = Math.max(this.dragStart.y, this.dragEnd.y);

        const overlay: PageOverlay = {
            x: x1 / this.imageWidth,
            y: y1 / this.imageHeight,
            width: (x2 - x1) / this.imageWidth,
            height: (y2 - y1) / this.imageHeight,
        };

        this.internalOverlay = overlay;
        this.draw();
    },
    stopDragging() {
        if (!this.isDragging || this.shouldApplyOverlayCrop) return;
        this.isDragging = false;
        this.$emit("update:overlay", { ...this.internalOverlay });
    },
    onWheel(event: WheelEvent) {
      event.preventDefault();

      const delta = Math.sign(event.deltaY);
      const zoomStep = 0.1;

      // Clamp zoom between 0.2 and 5
      if (delta > 0) {
        this.zoom = Math.max(0.2, this.zoom - zoomStep);
      } else {
        this.zoom = Math.min(5, this.zoom + zoomStep);
      }

      this.draw();
    },
  },
});
</script>
