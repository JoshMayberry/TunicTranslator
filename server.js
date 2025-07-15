const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs')

// Setup
const app = express()
const PORT = 3000
const DB_PATH = path.join(__dirname, 'tunic.sqlite')
const db = new sqlite3.Database(DB_PATH)

app.use(cors())
app.use(bodyParser.json())

// ================================
// Initialize Tables
// ================================

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS symbols (
      id TEXT PRIMARY KEY,
      type TEXT,
      guessed_sound TEXT,
      alternate_guesses TEXT,
      confidence INTEGER,
      notes TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS words (
      id TEXT PRIMARY KEY,
      rupee_count INTEGER,
      rupees TEXT,
      symbol_refs TEXT,
      translation_guess TEXT,
      notes TEXT,
      confidence INTEGER,
      screenshot_path TEXT,
      tags TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS sentences (
      id TEXT PRIMARY KEY,
      notes TEXT,
      confidence INTEGER,
      screenshot_path TEXT,
      tags TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS instances (
      word_id TEXT,
      sentence_id TEXT,
      notes TEXT,
      speaker TEXT,
      emphasis TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS symbol_history (
      symbol_id TEXT,
      type TEXT,
      timestamp TEXT,
      guessed_sound TEXT,
      alternate_guesses TEXT,
      confidence INTEGER,
      notes TEXT
    )
  `)
})

// ================================
// Utility
// ================================
function saveSymbolHistory(symbol) {
  db.run(`
    INSERT INTO symbol_history
    (symbol_id, type, timestamp, guessed_sound, alternate_guesses, confidence, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    symbol.id,
    symbol.type,
    new Date().toISOString(),
    symbol.guessed_sound,
    JSON.stringify(symbol.alternate_guesses || []),
    symbol.confidence,
    symbol.notes || ''
  ])
}

// ================================
// API Routes
// ================================

// Symbols
app.get('/symbols', (_, res) => {
  db.all(`SELECT * FROM symbols`, [], (err, rows) => {
    if (err) return res.status(500).send(err)
    res.json(rows.map(row => ({
      ...row,
      alternate_guesses: JSON.parse(row.alternate_guesses || '[]')
    })))
  })
})

app.post('/symbols', (req, res) => {
  const s = req.body
  db.get(`SELECT * FROM symbols WHERE id = ? AND type = ?`, [s.id, s.type], (err, existing) => {
    if (!existing || JSON.stringify(existing) !== JSON.stringify(s)) {
      saveSymbolHistory(s)
    }
  })

  db.run(`
    INSERT OR REPLACE INTO symbols
    (id, type, guessed_sound, alternate_guesses, confidence, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    s.id, s.type, s.guessed_sound,
    JSON.stringify(s.alternate_guesses || []),
    s.confidence, s.notes
  ], err => {
    if (err) return res.status(500).send(err)
    res.sendStatus(200)
  })
})

app.get('/symbol-history/:id/:type', (req, res) => {
  const { id, type } = req.params
  db.all(`
    SELECT * FROM symbol_history
    WHERE symbol_id = ? AND type = ?
    ORDER BY timestamp DESC
  `, [id, type], (err, rows) => {
    if (err) return res.status(500).send(err)
    res.json(rows.map(row => ({
      ...row,
      alternate_guesses: JSON.parse(row.alternate_guesses || '[]')
    })))
  })
})

// Words
app.get('/words', (_, res) => {
  db.all(`SELECT * FROM words`, [], (err, rows) => {
    if (err) return res.status(500).send(err)
    res.json(rows.map(r => ({
      ...r,
      rupees: JSON.parse(r.rupees),
      symbol_refs: JSON.parse(r.symbol_refs),
      tags: JSON.parse(r.tags || '[]')
    })))
  })
})

app.post('/words', (req, res) => {
  const w = req.body
  db.run(`
    INSERT OR REPLACE INTO words
    (id, rupee_count, rupees, symbol_refs, translation_guess, notes, confidence, screenshot_path, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    w.id,
    w.rupee_count,
    JSON.stringify(w.rupees),
    JSON.stringify(w.symbol_refs),
    w.translation_guess,
    w.notes,
    w.confidence,
    w.screenshot_path,
    JSON.stringify(w.tags || [])
  ], err => {
    if (err) return res.status(500).send(err)
    res.sendStatus(200)
  })
})

// Sentences
app.get('/sentences', (_, res) => {
  db.all(`SELECT * FROM sentences`, [], (err, rows) => {
    if (err) return res.status(500).send(err)
    db.all(`SELECT * FROM instances`, [], (e, instances) => {
      if (e) return res.status(500).send(e)

      const full = rows.map(s => ({
        ...s,
        tags: JSON.parse(s.tags || '[]'),
        word_instances: instances.filter(i => i.sentence_id === s.id)
      }))
      res.json(full)
    })
  })
})

app.post('/sentences', (req, res) => {
  const s = req.body
  db.run(`
    INSERT OR REPLACE INTO sentences
    (id, notes, confidence, screenshot_path, tags)
    VALUES (?, ?, ?, ?, ?)
  `, [
    s.id,
    s.notes,
    s.confidence,
    s.screenshot_path,
    JSON.stringify(s.tags || [])
  ], err => {
    if (err) return res.status(500).send(err)
    // Remove old instances and insert new ones
    db.run(`DELETE FROM instances WHERE sentence_id = ?`, [s.id], () => {
      const stmt = db.prepare(`
        INSERT INTO instances (word_id, sentence_id, notes, speaker, emphasis)
        VALUES (?, ?, ?, ?, ?)
      `)
      for (const i of s.word_instances || []) {
        stmt.run(i.wordId, s.id, i.notes || '', i.speaker || '', i.emphasis || '')
      }
      stmt.finalize()
      res.sendStatus(200)
    })
  })
})

// Instances (used separately sometimes)
app.post('/instances', (req, res) => {
  const i = req.body
  db.run(`
    INSERT INTO instances (word_id, sentence_id, notes, speaker, emphasis)
    VALUES (?, ?, ?, ?, ?)
  `, [i.wordId, i.sentenceId, i.notes || '', i.speaker || '', i.emphasis || ''], err => {
    if (err) return res.status(500).send(err)
    res.sendStatus(200)
  })
})

app.get('/instances', (_, res) => {
  db.all(`SELECT * FROM instances`, [], (err, rows) => {
    if (err) return res.status(500).send(err)
    res.json(rows)
  })
})

// ================================
// Start
// ================================
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})
