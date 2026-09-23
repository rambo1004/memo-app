require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '50mb' })); // 이미지 저장을 위해 용량 늘림
app.use(express.static(path.join(__dirname, 'public'))); // 프론트엔드 정적 파일 서빙

// PostgreSQL 연결 설정
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.connect((err) => {
  if (err) {
    console.error('DB 연결 실패:', err.stack);
  } else {
    console.log('✅ PostgreSQL DB 연결 성공!');
  }
});

// API 엔드포인트: 데이터 조회 (GET)
app.get('/api/data/:type/:username', async (req, res) => {
  const { type, username } = req.params;
  const allowedTypes = ['memos', 'todos', 'events'];

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: '유효하지 않은 데이터 타입입니다.' });
  }

  try {
    const query = `SELECT datalist as "dataList" FROM ${type} WHERE username = $1`;
    const result = await pool.query(query, [username]);

    if (result.rows.length > 0) {
      res.json(result.rows[0].dataList);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('조회 오류:', error);
    res.status(500).json({ error: '데이터 조회에 실패했습니다.' });
  }
});

// API 엔드포인트: 데이터 저장 (POST - Upsert)
app.post('/api/data/:type/:username', async (req, res) => {
  const { type, username } = req.params;
  const dataList = req.body;
  const allowedTypes = ['memos', 'todos', 'events'];

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: '유효하지 않은 데이터 타입입니다.' });
  }

  try {
    const query = `
      INSERT INTO ${type} (username, datalist)
      VALUES ($1, $2)
      ON CONFLICT (username)
      DO UPDATE SET datalist = EXCLUDED.datalist
    `;
    await pool.query(query, [username, JSON.stringify(dataList)]);
    res.json({ success: true, message: '저장 완료' });
  } catch (error) {
    console.error('저장 오류:', error);
    res.status(500).json({ error: '데이터 저장에 실패했습니다.' });
  }
});

// 서버 실행
app.listen(port, () => {
  console.log(`🚀 서버가 시작되었습니다: http://localhost:${port}`);
});
