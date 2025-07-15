import cors from 'cors'
import express from 'express'
import bodyParser from 'body-parser'
import { getAllSymbols, saveSymbol } from './symbols'
// import { getAllWords, saveWord } from './backend/words'
// import { getAllSentences, saveSentence } from './backend/words'
// import { getAllInstances, saveInstance } from './backend/words'

export const app = express()
app.use(cors())
app.use(bodyParser.json())
// app.use(express.json())

app.get('/symbols', async (req, res) => res.json(await getAllSymbols()))
app.post('/symbols', async (req, res) => {
  await saveSymbol(req.body)
  res.sendStatus(200)
})
// app.get('/words', async (req, res) => res.json(await getAllWords()))
// app.post('/words', async (req, res) => {
//   await saveWord(req.body)
//   res.sendStatus(200)
// })
// app.get('/sentences', async (req, res) => res.json(await getAllSentences()))
// app.post('/sentences', async (req, res) => {
//   await saveSentence(req.body)
//   res.sendStatus(200)
// })
// app.get('/instances', async (req, res) => res.json(await getAllInstances()))
// app.post('/instances', async (req, res) => {
//   await saveInstance(req.body)
//   res.sendStatus(200)
// })

export default app
