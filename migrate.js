require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// 1. 기존 Supabase 접속 정보 (과거 클라우드 버전)
const SUPABASE_URL = "https://dzgefktebqklyvgiwxcm.supabase.co";
const SUPABASE_KEY = "sb_publishable_LfF00_JnpL5inF9pkZB7QQ_uiSsdv1L";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. 새로운 로컬 PostgreSQL 접속 정보 (.env 파일에서 가져옴)
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function migrateData() {
  console.log("🚚 데이터 이사(Migration)를 시작합니다...");
  
  try {
    // 1. 테이블 자동 생성 (방 만들기)
    console.log("🛠️ 새 데이터베이스에 테이블(방)을 준비하는 중...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS memos (
          username TEXT PRIMARY KEY,
          datalist JSONB DEFAULT '[]'::jsonb
      );
      CREATE TABLE IF NOT EXISTS todos (
          username TEXT PRIMARY KEY,
          datalist JSONB DEFAULT '[]'::jsonb
      );
      CREATE TABLE IF NOT EXISTS events (
          username TEXT PRIMARY KEY,
          datalist JSONB DEFAULT '[]'::jsonb
      );
    `);
    console.log("✅ 테이블 준비 완료!");

    const tables = ['memos', 'todos', 'events'];
    let totalRows = 0;
    for (const table of tables) {
      console.log(`\n📦 [${table}] 테이블에서 데이터를 가져오는 중...`);
      const { data, error } = await supabase.from(table).select('*');
      
      if (error) {
        console.error(`❌ ${table} 데이터를 가져오는 데 실패했습니다:`, error);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`- ${table} 테이블에 가져올 데이터가 없습니다.`);
        continue;
      }

      console.log(`- ${data.length}명의 사용자 데이터를 발견했습니다! 새 집으로 옮깁니다...`);
      
      for (const row of data) {
        // 기존 Supabase의 컬럼명은 datalist 또는 dataList 일 수 있음
        const jsonData = row.datalist || row.dataList || [];
        
        await pool.query(`
          INSERT INTO ${table} (username, datalist) 
          VALUES ($1, $2) 
          ON CONFLICT (username) 
          DO UPDATE SET datalist = EXCLUDED.datalist
        `, [row.username, JSON.stringify(jsonData)]);
      }
      totalRows += data.length;
      console.log(`✅ [${table}] 이사 완료!`);
    }

    console.log(`\n🎉 모든 데이터 이사가 완료되었습니다! (총 ${totalRows}건)`);
    process.exit(0);

  } catch (err) {
    console.error("🚨 이사 중 예상치 못한 에러가 발생했습니다:", err);
    process.exit(1);
  }
}

migrateData();
