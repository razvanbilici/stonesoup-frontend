import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

const adapter = new JSONFile('db.json');
const db = new Low(adapter, { notes: [] });
await db.read();

// Upload a file
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
  });
});

// Delete a single uploaded file
app.delete('/upload/:filename', (req, res) => {
  const filepath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  res.sendStatus(204);
});

// GET all notes
app.get('/notes', async (_req, res) => {
  await db.read();
  res.json(db.data.notes);
});

// CREATE note
app.post('/notes', async (req, res) => {
  const now = new Date().toISOString();
  const newNote = {
    id: uuidv4(),
    title: req.body.title,
    description: req.body.description || '',
    type: req.body.type,
    content: req.body.content,
    attachments: req.body.attachments || [],
    createdAt: now,
    updatedAt: now,
  };
  db.data.notes.push(newNote);
  await db.write();
  res.json(newNote);
});

// UPDATE note
app.put('/notes/:id', async (req, res) => {
  const note = db.data.notes.find(n => n.id === req.params.id);
  if (!note) return res.sendStatus(404);
  Object.assign(note, req.body, { updatedAt: new Date().toISOString() });
  await db.write();
  res.json(note);
});

// DELETE note — also cleans up attached files
app.delete('/notes/:id', async (req, res) => {
  const note = db.data.notes.find(n => n.id === req.params.id);
  if (note?.attachments?.length) {
    note.attachments.forEach(att => {
      const filepath = path.join(uploadsDir, att.filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    });
  }
  db.data.notes = db.data.notes.filter(n => n.id !== req.params.id);
  await db.write();
  res.sendStatus(204);
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));