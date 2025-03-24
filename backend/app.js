// app.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/authRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import diaryRoutes from './routes/diaryRoutes.js';
import pool from './db.js';

const app = express();
const port = process.env.PORT || 3001;

// CORS 설정
app.use(cors({
  origin: 'http://localhost:3000', // React 앱의 주소
  credentials: true
}));

app.use(bodyParser.json());

app.use('/api', authRoutes);
app.use('/api', questionRoutes);
app.use('/api', diaryRoutes);

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Test database connection on startup
pool.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the database');
  }
});