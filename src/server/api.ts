import cors from "cors"
import express from "express"
import bodyParser from "body-parser"
import { soundGetAll, soundSave, soundSaveGuess } from "./sound"
import { sentenceGetAll, sentenceSave, sentenceGetById, Sentence, SoundSentenceUsage } from "./sentence"
import { getRupeeInnerValue, getRupeeOuterValue } from "@/models/Rupee"
import { settingGetAll, settingSave } from "./setting"

export const app = express()
app.use(cors())
app.use(bodyParser.json())
// app.use(express.json())


app.get("/setting", async (req, res) => res.json(await settingGetAll()))
app.post("/setting", async (req, res) => {
  await settingSave(req.body)
  res.sendStatus(200)
})

app.get("/sound", async (req, res) => res.json(await soundGetAll()))
app.post("/sound", async (req, res) => {
  await soundSave(req.body)
  res.sendStatus(200)
})
app.post("/sound/update-guess", async (req, res) => {
  await soundSaveGuess(req.body)
  res.sendStatus(200)
})

app.get("/sentence", async (req, res) => res.json(await sentenceGetAll()))
app.post("/sentence", async (req, res) => {
  try {
    const id = await sentenceSave(req.body);
    res.status(200).json({ id });
  } catch (err) {
    console.error("Failed to save sentence", err);
    res.status(500).json({ error: "Failed to save sentence" });
  }
});

app.get("/sentence/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid sentence ID" });

  try {
    const sentence = await sentenceGetById(id);
    if (!sentence) {
      return res.status(404).json({ error: "Sentence not found" });
    }
    res.json(sentence);
  } catch (err) {
    console.error("Error fetching sentence:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/sound-sentence-catalog", async function(req, res) {
  try {
    const sentenceList = await sentenceGetAll();

    // Get each sentence that contains the symbol and the rupee they are a part of
    const soundCatalog: Record<number, Record<number, Array<SoundSentenceUsage>>> = {}; // {sound_id: {sentence_id: [usage]}}
    for (const sentence of sentenceList) {
      if (sentence.id === undefined) {
        continue;
      }

      // Get a list of all the rupee words that are in the sentence
      const fullWordList: Array<[number, Array<number>]> = [];
      let currentWord: Array<number> = [];
      let currentWordStartIndex = 0;
      for (const [i, rupeeId] of Object.entries(sentence.word_list)) {
        if (typeof rupeeId !== "number") {
          // A word is a continueous array of numbers
          if (currentWord.length) {
            fullWordList.push([currentWordStartIndex, currentWord])
          }
          currentWordStartIndex = -1;
          currentWord = [];
          continue;
        }

        if (currentWordStartIndex == -1) {
          currentWordStartIndex = parseInt(i);
        }

        currentWord.push(rupeeId);
      }

      // Account for ending on a rupee word
      if (currentWord.length) {
        fullWordList.push([currentWordStartIndex, currentWord])
      }

      // Catalog all the sounds in the list of words
      for (const [wordStartIndex, fullWord] of fullWordList) {
        for (const rupeeId of fullWord) {
          const addToSoundSentenceCatalog = (subRepresentation: number) => {
            if (sentence.id === undefined) {
              return;
            }

            let sentenceCatalog = soundCatalog[subRepresentation];
            if (sentenceCatalog === undefined) {
              sentenceCatalog = {};
              soundCatalog[subRepresentation] = sentenceCatalog;
            }

            let usageList: Array<SoundSentenceUsage> = sentenceCatalog[sentence.id];
            if (usageList === undefined) {
              usageList = [];
              sentenceCatalog[sentence.id] = usageList;
            }

            usageList.push({
              rupeeId,
              wordStartIndex,
              word: fullWord,
            });
          }

          if (rupeeId === 0) {
            addToSoundSentenceCatalog(rupeeId);
          }

          const inner = getRupeeInnerValue(rupeeId);
          const outer = getRupeeOuterValue(rupeeId);
          for (const subRepresentation of [inner, outer]) {
            if (subRepresentation === 0) {
              continue;
            }

            addToSoundSentenceCatalog(subRepresentation);
          }
        }
      }
    }

    res.json(soundCatalog);
  } catch (err) {
    console.error("Error fetching sentence catalog:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app
