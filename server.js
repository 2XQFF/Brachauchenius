// server.js

require('dotenv').config(); // .env 파일에서 환경 변수를 로드

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; // 환경 변수에서 포트를 가져오거나 기본값 3000 사용
const RESET_PASSWORD = process.env.RESET_PASSWORD; // 환경 변수에서 비밀번호를 가져옴

// 환경 변수 로드 확인 (개발 시 유용)
if (!RESET_PASSWORD) {
    console.error("오류: RESET_PASSWORD 환경 변수가 설정되지 않았습니다.");
    console.error("서버를 실행하기 전에 .env 파일에 RESET_PASSWORD를 설정해주세요.");
    process.exit(1); // 서버 시작 중지
} else {
    console.log("RESET_PASSWORD가 성공적으로 로드되었습니다.");
}

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// SQLite 데이터베이스 연결
const db = new sqlite3.Database('./data.db', (err) => {
    if (err) {
        console.error('데이터베이스 연결 오류:', err.message);
    } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.');
        // 랭킹 테이블 생성 (만약 없다면)
        db.run(`CREATE TABLE IF NOT EXISTS ranking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            score INTEGER NOT NULL,
            date TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error('테이블 생성 오류:', err.message);
            } else {
                console.log('랭킹 테이블이 준비되었습니다.');
            }
        });
    }
});

// -------------------- API 엔드포인트 --------------------

// 1. 랭킹 데이터 저장 (POST 요청)
app.post('/api/ranking', (req, res) => {
    const { name, score } = req.body;

    // 입력 값 유효성 검사 (서버 측)
    if (!name || typeof name !== 'string' || name.trim() === '' || name.length > 10) {
        return res.status(400).json({ error: '유효한 이름을 제공해야 합니다 (최대 10자).' });
    }
    if (typeof score !== 'number' || isNaN(score) || score < 0) {
        return res.status(400).json({ error: '유효한 점수를 제공해야 합니다.' });
    }

    const cleanedName = name.trim(); // 공백 제거
    const date = new Date().toLocaleString();

    // 트랜잭션을 사용하여 원자성 보장 (선택 사항이지만 안전성 증가)
    db.serialize(() => {
        db.run("BEGIN TRANSACTION;");
        db.run(`DELETE FROM ranking WHERE LOWER(name) = LOWER(?)`, [cleanedName], function(err) {
            if (err) {
                console.error('기존 랭킹 삭제 오류:', err.message);
                db.run("ROLLBACK;");
                return res.status(500).json({ error: '서버 오류 발생 (삭제)' });
            }

            db.run(`INSERT INTO ranking (name, score, date) VALUES (?, ?, ?)`, [cleanedName, score, date], function(err) {
                if (err) {
                    console.error('랭킹 삽입 오류:', err.message);
                    db.run("ROLLBACK;");
                    return res.status(500).json({ error: '랭킹 저장 중 오류 발생 (삽입)' });
                }
                db.run("COMMIT;");
                console.log(`새로운 랭킹 저장: ${cleanedName} - ${score}점 (ID: ${this.lastID})`);
                res.status(201).json({ message: '랭킹이 성공적으로 저장되었습니다.', id: this.lastID });
            });
        });
    });
});

// 2. 모든 랭킹 데이터 가져오기 (GET 요청)
app.get('/api/ranking', (req, res) => {
    db.all(`SELECT name, score, date FROM ranking ORDER BY score DESC, id ASC LIMIT 10`, [], (err, rows) => {
        if (err) {
            console.error('랭킹 조회 오류:', err.message);
            return res.status(500).json({ error: '서버 오류 발생' });
        }
        res.json(rows);
    });
});

// 3. 랭킹 초기화 (DELETE 요청 - 비밀번호 확인 포함)
app.delete('/api/ranking/reset', (req, res) => {
    const { password } = req.body;

    if (password !== RESET_PASSWORD) {
        return res.status(401).json({ error: '비밀번호가 틀렸습니다.' });
    }

    db.run(`DELETE FROM ranking`, [], function(err) {
        if (err) {
            console.error('랭킹 초기화 오류:', err.message);
            return res.status(500).json({ error: '서버 오류 발생' });
        }
        console.log('랭킹이 성공적으로 초기화되었습니다.');
        res.json({ message: '랭킹이 성공적으로 초기화되었습니다.' });
    });
});

// 4. 이름 중복 확인 (GET 요청)
app.get('/api/ranking/checkName/:name', (req, res) => {
    const nameToCheck = req.params.name;
    if (!nameToCheck || typeof nameToCheck !== 'string' || nameToCheck.trim() === '') {
        return res.status(400).json({ error: '확인할 이름을 제공해야 합니다.' });
    }
    
    // 대소문자 구분 없이 이름 확인
    db.get(`SELECT COUNT(*) AS count FROM ranking WHERE LOWER(name) = LOWER(?)`, [nameToCheck.trim()], (err, row) => {
        if (err) {
            console.error('이름 중복 확인 오류:', err.message);
            return res.status(500).json({ error: '서버 오류 발생' });
        }
        const isTaken = row.count > 0;
        res.json({ isTaken: isTaken });
    });
});


// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log(`랭킹 초기화 비밀번호: ${RESET_PASSWORD} (이 메시지는 개발 환경에서만 보이고 실제 배포에서는 숨겨야 합니다!)`);
});
