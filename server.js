// server.js - JSON 기반 랭킹 서버

require('dotenv').config(); // .env 파일에서 환경 변수 불러오기

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const RESET_PASSWORD = process.env.RESET_PASSWORD;
const RANKING_FILE = path.join(__dirname, 'ranking.json');

// 환경 변수 체크
if (!RESET_PASSWORD) {
    console.error("RESET_PASSWORD가 .env에 정의되어 있지 않습니다.");
    process.exit(1);
}

// 기본 미들웨어
app.use(cors());
app.use(express.json());

// JSON 파일에서 랭킹 읽기
function readRanking() {
    try {
        if (!fs.existsSync(RANKING_FILE)) {
            return [];
        }
        const raw = fs.readFileSync(RANKING_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('랭킹 파일 읽기 오류:', err);
        return [];
    }
}

// JSON 파일에 랭킹 저장
function saveRanking(data) {
    try {
        fs.writeFileSync(RANKING_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('랭킹 파일 저장 오류:', err);
    }
}

// ✅ 점수 저장
app.post('/api/ranking', (req, res) => {
    const { name, score } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '' || name.length > 10) {
        return res.status(400).json({ error: '이름은 필수이며 최대 10자까지 가능합니다.' });
    }
    if (typeof score !== 'number' || isNaN(score) || score < 0) {
        return res.status(400).json({ error: '점수는 0 이상의 숫자여야 합니다.' });
    }

    const cleanedName = name.trim();
    const now = new Date().toLocaleString();
    let ranking = readRanking();

    // 기존 이름 제거
    ranking = ranking.filter(entry => entry.name.toLowerCase() !== cleanedName.toLowerCase());

    // 새 항목 추가
    ranking.push({ name: cleanedName, score, date: now });

    // 점수 내림차순 정렬
    ranking.sort((a, b) => b.score - a.score);

    // 상위 10명까지만 유지
    ranking = ranking.slice(0, 10);

    saveRanking(ranking);
    res.status(201).json({ message: '랭킹이 성공적으로 저장되었습니다.' });
});

// ✅ 랭킹 가져오기
app.get('/api/ranking', (req, res) => {
    const ranking = readRanking();
    res.json(ranking);
});

// ✅ 랭킹 초기화 (비밀번호 필요)
app.delete('/api/ranking/reset', (req, res) => {
    const { password } = req.body;

    if (password !== RESET_PASSWORD) {
        return res.status(401).json({ error: '비밀번호가 틀렸습니다.' });
    }

    saveRanking([]);
    res.json({ message: '랭킹이 성공적으로 초기화되었습니다.' });
});

// ✅ 이름 중복 확인
app.get('/api/ranking/checkName/:name', (req, res) => {
    const name = req.params.name.trim().toLowerCase();
    const ranking = readRanking();
    const isTaken = ranking.some(entry => entry.name.toLowerCase() === name);
    res.json({ isTaken });
});

// ✅ 서버 실행
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
