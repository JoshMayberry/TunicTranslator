<template>
  <div style="display: flex; flex-direction: column;">
    <div style="display: flex; flex-direction: row; flex: 1;">
      <div style="flex: 1">
        <mcw-textfield
          v-model="sentence.title"
          class="title-box"
        />
      </div>
      <mcw-button @click="onNewSentence">+</mcw-button>
    </div>
    <div style="display: flex; flex-direction: row; flex: 1;">
      <div style="display: flex; flex-direction: column; flex:1;">
        <RupeeSentence
          style="flex:2"
          :rupee-list="sentence.word_list"
          :selected-index="selectedRupeeIndex"
          :highlight-on-hover="true"
          :explode-rupee="explodeRupee"
          :use-threhold-colors="useThreholdColors"
          :confidence-catalog="confidenceCatalog"
          :sound-catalog="soundCatalog"
          :circle-theory="circleTheory"
          :tooltip-id="0"
          @select:rupee="onRupeeClick"
          @select:text="onTextClick"
          @select:space="onSpaceClick"
        />
        <mcw-textfield
          v-model="directTranslation"
          class="translation-box"
          label="Direct Translation"
          multiline
          aria-readonly="true"
          readonly
        />
        <mcw-textfield
          v-model="sentence.translation"
          class="translation-box"
          label="Translation"
          multiline
        />
        <mcw-textfield
          v-model="sentence.comment"
          class="translation-box"
          label="comment"
          multiline
        />
        <div style="display: flex; flex-direction: row;">
          <div style="display: flex; flex-direction: column;">
            <div style="font-size: 12px; color: gray; margin-left: auto; margin-right: auto;">
              <span v-if="isSaving">Saving…</span>
              <span v-else-if="lastSaved">Last saved at {{ lastSaved.toLocaleTimeString() }}</span>
            </div>
            <mcw-select
              v-model="sentence.page_number"
              :value="sentence.page_number"
              label="Page"
            >
              <template
                v-for="(page, key) in pageInfoList"
                :key="key"
              >
                <mcw-list-item
                  v-if="page.isFound"
                  :value="key"
                  :data-value="key"
                >{{ page.label || key }}</mcw-list-item>
              </template>
            </mcw-select>
            <mcw-button @click="doImageMask = !doImageMask">Toggle<br>Overlay</mcw-button>
          </div>
          <ImageOverlayEditor
            v-if="sentence.page_number && pageInfoList[sentence.page_number]?.imagePath && pageInfoList[sentence.page_number]?.isFound"
            :src="pageInfoList[sentence.page_number].imagePath || ''"
            :overlay="sentence.page_overlay"
            :apply-overlay-mask="doImageMask"
            @update:overlay="(val: PageOverlay) => sentence.page_overlay = val"
            alt="Page image"
            style="max-width: 100%; margin-top: 1rem;"
          />
        </div>
      </div>
      <div style="display: flex; flex-direction: column;">
        <RupeeDisplay
          v-if="selectedRupee"
          :rupee="selectedRupee"
          :is-word="false"
          :is-debug="showDebugValue"
          :disabled="!selectedRupee"
          @update:rupee="onUpdateRupee($event)"
          :use-threhold-colors="useThreholdColors"
          :confidence-catalog="confidenceCatalog"
        />
        <mcw-textfield
          v-if="typeof selectedRupeeValue === 'string'"
          v-model="rupeePlainText"
          class="title-box"
        />
        <mcw-button @click="explodeRupee = !explodeRupee">Toggle<br>Explode</mcw-button>
        <mcw-button @click="useThreholdColors = !useThreholdColors">Toggle<br>Threshold</mcw-button>
        <mcw-button @click="onDeselect" :disabled="selectedRupeeIndex === undefined">Deselect</mcw-button>
        <mcw-button @click="showSoundEditor = !showSoundEditor" :disabled="!selectedRupee">Edit Sound</mcw-button>
        <mcw-button @click="onDuplicate" :disabled="selectedRupeeIndex === undefined">Duplicate</mcw-button>
        <mcw-button @click="onAddRupee">Add Rupee</mcw-button>
        <mcw-button @click="onAddSpace">Add Space</mcw-button>
        <mcw-button @click="onAddText('text')">Add Text</mcw-button>
        <mcw-menu-anchor class="emoji-selector" style="display: flex;">
          <mcw-button @click="openEmojiMenu = true" style="flex: 1;">Add Emoji</mcw-button>
          
          <mcw-menu v-model="openEmojiMenu" @select="onAddEmoji">
            <mcw-list-item v-for="(emoji, i) in emojiOptions" :key="i">
              {{ emoji }}
            </mcw-list-item>
          </mcw-menu>
        </mcw-menu-anchor>
        <div style="display: flex; margin-left: auto; margin-right: auto;">
          <mcw-button @click="onMove(true)" :disabled="selectedRupeeIndex === undefined"><-</mcw-button>
          <mcw-button @click="onMove(false)" :disabled="selectedRupeeIndex === undefined">-></mcw-button>
        </div>
        <mcw-button @click="onRemove" :disabled="selectedRupeeIndex === undefined">Remove</mcw-button>
      </div>
    </div>
  </div>

  <mcw-dialog
    v-model="showSoundEditor"
    v-if="selectedRupee"
    escape-key-action="close"
    scrim-click-action="close"
    :scrollable="true"
    @mdcdialog:opening="onOpenEditDialog"
    @mdcdialog:closing="onCloseEditDialog"
  >
    <mcw-dialog-title>Edit Sound</mcw-dialog-title>
    <mcw-dialog-content>
      <div style="display: flex; flex-direction: row;">
        <div style="display: flex; flex-direction: column;" v-if="getSoundInner(selectedRupee).getRepresentation() !== 0">
          <RupeeDisplay
            :rupee="getSoundInner(selectedRupee)"
            :is-interactive="false"
            :is-word="false"
            empty-color="transparent"
            :use-threhold-colors="useThreholdColors"
            :confidence-catalog="confidenceCatalog"
          />
          <mcw-textfield
            v-model="innerSoundValue"
            class="title-box"
            label="Sound"
            :disabled="!canEditSound"
          />
          <mcw-textfield
            v-model="innerSoundConfidence"
            type="number"
            class="title-box"
            label="Confidence"
            :disabled="!canEditSound"
            :step="10"
          />
          <mcw-button @click="goToSound(getSoundInner(selectedRupee).getRepresentation())">View Context</mcw-button>
        </div>
        <div style="display: flex; flex-direction: column;" v-if="getSoundOuter(selectedRupee).getRepresentation() !== 0">
          <RupeeDisplay
            :rupee="getSoundOuter(selectedRupee)"
            :is-interactive="false"
            :is-word="false"
            empty-color="transparent"
            :use-threhold-colors="useThreholdColors"
            :confidence-catalog="confidenceCatalog"
          />
          <mcw-textfield
            v-model="outerSoundValue"
            class="title-box"
            label="Sound"
            :disabled="!canEditSound"
          />
          <mcw-textfield
            v-model="outerSoundConfidence"
            type="number"
            class="title-box"
            label="Confidence"
            :disabled="!canEditSound"
            :step="10"
          />
          <mcw-button @click="goToSound(getSoundOuter(selectedRupee).getRepresentation())">View Context</mcw-button>
        </div>
      </div>
    </mcw-dialog-content>
  </mcw-dialog>

  <mcw-snackbar-queue
    ref="snackbarQueue"
    v-model:snack="snackbarNextMessage"
  />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useRoute, useRouter } from "vue-router";
import RupeeDisplay from './RupeeDisplay.vue';
import RupeeSentence from './RupeeSentence.vue';
import ImageOverlayEditor from './ImageOverlayEditor.vue';
import { getRupeeInnerValue, getRupeeOuterValue, getRupeeType, getTranslation, Rupee } from "@/models/Rupee";
import debounce from "lodash.debounce";
import { CircleTheory, PageOverlay, Sentence, Sound } from "@/server/types";
import { PageInfo } from "@/models/PageInfo";

const testSentence: Sentence = {
  id: undefined,
  order: 0,
  title: "test",
  word_list: [123, 7289, 8, null, 2, "lorem ipsum", 73, 83],
  translation: "lorem ipsum dolor sit amet",
  confidence: 30,
  picture: "",
  page_number: "",
  page_overlay: {},
  comment: "lorem ipsum",
  tags: ["lorem", "ipsum"],
};

export default defineComponent({
  name: "SentenceViewer",
  components: {
    RupeeDisplay,
    RupeeSentence,
    ImageOverlayEditor,
  },
  props: {
    showDebugValue: { type: Boolean, default: true },
    pageInfoList: { type: Object as () => Record<string, PageInfo>, required: true },
    circleTheory: { type: String as () => CircleTheory, required: true },
  },
  data(): {
      sentence: Sentence,
      selectedRupeeIndex?: number,
      snackbarShow: boolean,
      snackbarMessage: string,
      snackbarNextMessage: any,
      rupeePlainText: string,
      debouncedSave: Function,
      isSaving: boolean,
      lastSaved: Date | null,
      canSave: boolean,
      doImageMask: boolean,
      explodeRupee: boolean,
      soundCatalog: Record<number, string>,
      confidenceCatalog: Record<number, number>,
      useThreholdColors: boolean,
      showSoundEditor: boolean,
      openEmojiMenu: boolean,
      emojiOptions: Array<string>,
      innerSoundValue: string,
      outerSoundValue: string,
      innerSoundConfidence: number,
      outerSoundConfidence: number,
      soundEditedInner: boolean,
      soundEditedOuter: boolean,
      canEditSound: boolean,
    } {
      console.log(this)
    return {
      sentence: testSentence,
      rupeePlainText: "dolor sit",
      selectedRupeeIndex: 2,
      snackbarShow: false,
      snackbarMessage: "lorem ipsum",
      snackbarNextMessage: {},
      debouncedSave: () => {},
      isSaving: false,
      lastSaved: null,
      canSave: false,
      doImageMask: true,
      explodeRupee: false,
      showSoundEditor: false,
      soundCatalog: {},
      confidenceCatalog: {},
      useThreholdColors: true,
      openEmojiMenu: false,
      emojiOptions: ["📄", "🗡️", "🔑", "ℹ️", "➡️", "🔲"],
      innerSoundValue: "",
      outerSoundValue: "",
      soundEditedInner: false,
      soundEditedOuter: false,
      innerSoundConfidence: 0,
      outerSoundConfidence: 0,
      canEditSound: false,
    };
  },
  computed: {
    selectedRupeeValue() {
      if (this.selectedRupeeIndex === undefined) {
        return undefined;
      }
      return this.sentence.word_list[this.selectedRupeeIndex];
    },
    selectedRupee() {
      if (typeof this.selectedRupeeValue === "number") {
        return Rupee.fromRepresentation(this.selectedRupeeValue);
      }
    },
    directTranslation(): string {
      return this.getSentence(this.sentence.word_list);
    },
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    return { route, router };
  },
  async created() {
    this.debouncedSave = debounce(this.saveSentence, 500);

    const idParam = this.route.params.id;
    const preSelectParam = this.route.query["pre-select"];
    this.selectedRupeeIndex = preSelectParam && !isNaN(Number(preSelectParam as string))
      ? Number(preSelectParam)
      : undefined;

    if (idParam && !isNaN(Number(idParam))) {
      const id = Number(idParam);
      try {
        const res = await fetch(`/api/sentence/${id}`);
        const sentence = await res.json();
        this.sentence = sentence;
      } catch (err) {
        console.error(err);
        this.showAlert("Could not load sentence with id " + id);
      }
    } else {
      // New sentence mode
      this.sentence = {
        id: undefined,
        order: 0,
        title: "",
        word_list: [],
        translation: "",
        confidence: 0,
        picture: "",
        page_number: "n/a",
        page_overlay: {},
        comment: "",
        tags: []
      };
    }

    this.$nextTick(() => {
      this.canSave = true;
    });
  },
  async mounted() {
    const res = await fetch("/api/sound");
    const soundList = await res.json();
    this.soundCatalog = Object.fromEntries(soundList.map(function(sound: Sound): [number, string] {
      return [sound.id, sound.guessed_sound];
    }));
    this.confidenceCatalog = Object.fromEntries(soundList.map(function(sound: Sound): [number, number] {
      return [sound.id, sound.confidence];
    }));
  },
  watch: {
    rupeePlainText(val: string) {
      // console.log("rupeePlainText updated:", this.selectedRupeeIndex, val)
      if (
        this.selectedRupeeIndex !== undefined &&
        typeof this.sentence.word_list[this.selectedRupeeIndex] === "string"
      ) {
        this.sentence.word_list[this.selectedRupeeIndex] = val;
      }
    },
    selectedRupeeValue: {
      immediate: true,
      handler(val) {
        if (typeof val === "string") {
          this.rupeePlainText = val;
        }
      }
    },
    sentence: {
      handler() {
        if (!this.canSave) {
          return; // Sill loading
        }
        this.debouncedSave();
      },
      deep: true
    },
    innerSoundValue() {
      if (this.canEditSound) {
        this.soundEditedInner = true;
      }
    },
    outerSoundValue() {
      if (this.canEditSound) {
        this.soundEditedOuter = true;
      }
    },
    innerSoundConfidence() {
      if (this.canEditSound) {
        this.soundEditedInner = true;
      }
    },
    outerSoundConfidence() {
      if (this.canEditSound) {
        this.soundEditedOuter = true;
      }
    },
  },
  methods: {
    onDeselect() {
      this.selectedRupeeIndex = undefined;
    },
    onDuplicate() {
      if (this.selectedRupeeIndex === undefined) {
        return;
      }
      const newRupee = this.sentence.word_list[this.selectedRupeeIndex];
      const i = this.selectedRupeeIndex ?? this.sentence.word_list.length;
      this.sentence.word_list.splice(i + 1, 0, newRupee);
      this.selectedRupeeIndex = Math.min(i + 1, this.sentence.word_list.length - 1);
    },
    onAddRupee() {
      const newRupee = Rupee.fromRepresentation(0).getRepresentation(true);
      const i = this.selectedRupeeIndex ?? this.sentence.word_list.length;
      this.sentence.word_list.splice(i + 1, 0, newRupee);
      this.selectedRupeeIndex = Math.min(i + 1, this.sentence.word_list.length - 1);
    },
    onAddSpace() {
      const i = this.selectedRupeeIndex ?? this.sentence.word_list.length;
      this.sentence.word_list.splice(i + 1, 0, null);
      this.selectedRupeeIndex = Math.min(i + 1, this.sentence.word_list.length - 1);
    },
    onAddText(text: string) {
      const i = this.selectedRupeeIndex ?? this.sentence.word_list.length;
      this.sentence.word_list.splice(i + 1, 0, text);
      this.selectedRupeeIndex = Math.min(i + 1, this.sentence.word_list.length - 1);
    },
    onAddEmoji({ index }: { index: number }) {
      const emoji = this.emojiOptions[index];
      this.onAddText(emoji);
      this.openEmojiMenu  = false;
    },
    onRemove() {
      if (this.selectedRupeeIndex === undefined) {
        this.showAlert("Nothing selected to remove");
        return;
      }
      this.sentence.word_list.splice(this.selectedRupeeIndex, 1);
      this.selectedRupeeIndex = undefined;
    },
    onMove(goLeft: boolean) {
      const i = this.selectedRupeeIndex;
      if (i === undefined) {
        this.showAlert("Nothing selected to move")
        return;
      }

      const j = goLeft ? i - 1 : i + 1;
      if (j < 0 || j >= this.sentence.word_list.length) return;

      const temp = this.sentence.word_list[i];
      this.sentence.word_list[i] = this.sentence.word_list[j];
      this.sentence.word_list[j] = temp;
      this.selectedRupeeIndex = j;
    },
    onUpdateRupee(rupee: Rupee) {
      if (this.selectedRupeeIndex === undefined) {
        this.showAlert("Nothing selected to update");
        return;
      }
      this.sentence.word_list[this.selectedRupeeIndex] = rupee.getRepresentation(true)
    },
    onRupeeClick({ rupee, index }: {rupee: Rupee, index: number}) {
      this.selectedRupeeIndex = index;
    },
    onTextClick({ text, index }: {text: string, index: number}) {
      this.selectedRupeeIndex = index;
    },
    onSpaceClick({ index }: { index: number }) {
      this.selectedRupeeIndex = index;
    },
    showAlert(message: string) {
      if (!this.$refs.snackbarQueue) {
        return;
      }

      this.snackbarShow = !this.snackbarShow;
      
      (this.$refs.snackbarQueue as any).handleSnack({
        message,
        timeoutMs: 5000,
        stacked: true,
      });
    },
    async saveSentence() {
      if (!this.canSave) {
        return; // Sill loading
      }
      try {
        this.isSaving = true;
        const res = await fetch("/api/sentence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.sentence)
        });

        if (res.status !== 200) {
          console.error(res)
          throw new Error(res.statusText);
        }

        const result = await res.json();
        this.lastSaved = new Date();
        if (this.sentence.id === undefined) {
          this.sentence.id = result.id;
          // window.history.replaceState({}, '', `/sentence/${result.id}`); // Does not trigger the router, but messes up future routing?
        }

      } catch (err) {
        console.error("Failed to save sentence:", err);
        this.showAlert("Error saving sentence");
      } finally {
        this.isSaving = false;
      }
    },
    getSentence(rupeeIdList: Array<number | string | null>): string {
      return getTranslation(this.soundCatalog, rupeeIdList, this.circleTheory)
    },
    onNewSentence() {
      this.$router.push('/sentence-viewer'); // Navigate
      setTimeout(() => {
        this.$router.go(0); // Force reload
      }, 100);
    },
    getSoundInner(rupee: Rupee): Rupee {
      return Rupee.fromRepresentation(getRupeeInnerValue(rupee.getRepresentation()));
    },
    getSoundOuter(rupee: Rupee): Rupee {
      return Rupee.fromRepresentation(getRupeeOuterValue(rupee.getRepresentation()));
    },
    async goToSound(soundId: number) {
      await this.onCloseEditDialog();
      this.router.push(`/sound-list/${soundId}`);
    },
    onOpenEditDialog() {
      if (!this.selectedRupee) {
        return;
      }

      const soundIdInner = getRupeeInnerValue(this.selectedRupee.getRepresentation())
      const soundIdOuter = getRupeeOuterValue(this.selectedRupee.getRepresentation())
      this.innerSoundValue = this.soundCatalog[soundIdInner] || "";
      this.outerSoundValue = this.soundCatalog[soundIdOuter] || "";
      this.innerSoundConfidence = this.confidenceCatalog[soundIdInner] || 0;
      this.outerSoundConfidence = this.confidenceCatalog[soundIdOuter] || 0;
      this.soundEditedInner = false
      this.soundEditedOuter = false
      setTimeout(() => {
        this.canEditSound = true
      }, 300);
    },
    async onCloseEditDialog() {
      this.canEditSound = false
      if (!this.selectedRupee) {
        return;
      }

      if (this.soundEditedInner) {
        const soundId = getRupeeInnerValue(this.selectedRupee.getRepresentation());
        console.log("Updating Inner Sound");
        await fetch('/api/sound/update-guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: soundId,
            guessed_sound: this.innerSoundValue,
            confidence: this.innerSoundConfidence,
          }),
        });

        this.soundCatalog[soundId] = this.innerSoundValue;
        this.confidenceCatalog[soundId] = this.innerSoundConfidence;
      }

      if (this.soundEditedOuter) {
        const soundId = getRupeeOuterValue(this.selectedRupee.getRepresentation());
        console.log("Updating Outer Sound");
        await fetch('/api/sound/update-guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: soundId,
            guessed_sound: this.outerSoundValue,
            confidence: this.outerSoundConfidence,
          }),
        });

        this.soundCatalog[soundId] = this.outerSoundValue;
        this.confidenceCatalog[soundId] = this.outerSoundConfidence;
      }
    },
  }
});
</script>

<style>
.translation-box label, .title-box label {
  width: 100%;
}

.emoji-selector .mdc-list-item__content {
  display: flex;
}

.emoji-selector .mdc-list-item__primary-text {
  text-align: center;
  flex: 1;
}

.mdc-text-field__resizer {
  height: 10vh;
}

</style>