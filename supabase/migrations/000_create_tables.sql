-- 000_create_tables.sql
-- 이 스크립트를 Supabase 대시보드의 SQL Editor에 붙여넣고 실행(Run)해 주세요.

-- 1. memos 테이블 생성
CREATE TABLE IF NOT EXISTS memos (
    username TEXT PRIMARY KEY,
    dataList JSONB DEFAULT '[]'::jsonb
);

-- 2. todos 테이블 생성
CREATE TABLE IF NOT EXISTS todos (
    username TEXT PRIMARY KEY,
    dataList JSONB DEFAULT '[]'::jsonb
);

-- 3. events 테이블 생성
CREATE TABLE IF NOT EXISTS events (
    username TEXT PRIMARY KEY,
    dataList JSONB DEFAULT '[]'::jsonb
);

-- 4. 보안 설정 (RLS) 비활성화 (간편한 연동을 위해 임시 비활성화)
-- (만약 특정 사용자만 접근하게 하려면 Supabase Auth와 연동 후 RLS 정책을 세워야 합니다.)
ALTER TABLE memos DISABLE ROW LEVEL SECURITY;
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
