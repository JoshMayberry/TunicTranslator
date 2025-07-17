import cors from "cors"
import express from "express"
import bodyParser from "body-parser"
import { soundGetAll, soundSave } from "./sound"
import { sentenceGetAll, sentenceSave, sentenceGetById } from "./sentence"

export const app = express()
app.use(cors())
app.use(bodyParser.json())
// app.use(express.json())


app.get("/sound", async (req, res) => res.json(await soundGetAll()))
app.post("/sound", async (req, res) => {
  await soundSave(req.body)
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


export default app
