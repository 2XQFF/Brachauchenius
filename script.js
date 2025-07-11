document.addEventListener('DOMContentLoaded', () => {
    // 화면 요소들
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const rankingScreen = document.getElementById('ranking-screen');
    const startGameButton = document.getElementById('start-game-button');
    const viewRankingButton = document.getElementById('view-ranking-button');
    const backToStartButton = document.getElementById('back-to-start-button');
    const rankingList = document.getElementById('ranking-list');
    const resetRankingButton = document.getElementById('reset-ranking-button');

    // 기존 게임 요소들
    const aValueSpan = document.getElementById('a-value');
    const bValueSpan = document.getElementById('b-value');
    const cInput = document.getElementById('c-input');
    const checkButton = document.getElementById('check-button');
    const stopGameButton = document.getElementById('stop-game-button');
    const resultMessage = document.getElementById('result-message');
    const scoreDisplay = document.getElementById('score');
    const currentQuestionDisplay = document.getElementById('current-question');
    const totalQuestionsDisplay = document.getElementById('total-questions');
    const problemAreaParagraph = document.querySelector('.problem-area p');

    // 게임 설정 상수
    const TOTAL_QUESTIONS = 10;
    const MAX_SCORE_PER_QUESTION = 100;
    const MIN_SCORE_PER_QUESTION = 10;
    const TIME_LIMIT_FOR_MAX_SCORE = 2;
    const TIME_LIMIT_FOR_MIN_SCORE = 15;
    const MAX_RANKING_ENTRIES = 10;
    const RESET_PASSWORD = "إذا هَبَّتْ رياحك فاغتنمها"; // 랭킹 초기화 비밀번호

    // 게임 상태 변수
    let correctC = 0;
    let gameActive = false;
    let currentScore = 0;
    let questionCount = 0;
    let startTime = 0;
    let currentPlayerName = "Guest";

    // 최대공약수(GCD)를 구하는 헬퍼 함수 (유클리드 호제법)
    function gcd(a, b) {
        if (b === 0) return a;
        return gcd(b, a % b);
    }

    // 피타고라스 세 쌍을 생성하는 함수
    function generatePythagoreanTriple() {
        let a, b, c;
        let m, n;
        let skipTriple = false;

        do {
            skipTriple = false;

            m = Math.floor(Math.random() * (40 - 2 + 1)) + 2;
            n = Math.floor(Math.random() * (m - 1)) + 1;

            let tempA = m * m - n * n;
            let tempB = 2 * m * n;
            c = m * m + n * n;

            if (Math.random() < 0.5) {
                a = tempA;
                b = tempB;
            } else {
                a = tempB;
                b = tempA;
            }

            const commonDivisor = gcd(a, gcd(b, c));
            const primitiveA = a / commonDivisor;
            const primitiveB = b / commonDivisor;
            const primitiveC = c / commonDivisor;

            if ((primitiveA === 3 && primitiveB === 4 && primitiveC === 5) ||
                (primitiveA === 4 && primitiveB === 3 && primitiveC === 5)) {
                skipTriple = true;
            }
            else if ((primitiveA === 5 && primitiveB === 12 && primitiveC === 13) ||
                     (primitiveA === 12 && primitiveB === 5 && primitiveC === 13)) {
                skipTriple = true;
            }
            else if ((primitiveA === 7 && primitiveB === 24 && primitiveC === 25) ||
                     (primitiveA === 24 && primitiveB === 7 && primitiveC === 25)) {
                skipTriple = true;
            }

        } while (skipTriple || c < 10 || c > 600);

        return { a, b, c };
    }

    function loadNewProblem() {
        if (!gameActive) return;

        questionCount++;
        if (questionCount > TOTAL_QUESTIONS) {
            endGame();
            return;
        }

        problemAreaParagraph.innerHTML = '<span id="a-value"></span><sup>2</sup> + <span id="b-value"></span><sup>2</sup> = c<sup>2</sup>';
        document.getElementById('a-value').textContent = '';
        document.getElementById('b-value').textContent = '';
        problemAreaParagraph.classList.remove('final-score');

        const triple = generatePythagoreanTriple();
        document.getElementById('a-value').textContent = triple.a;
        document.getElementById('b-value').textContent = triple.b;
        correctC = triple.c;
        cInput.value = '';
        resultMessage.textContent = '';
        resultMessage.classList.remove('incorrect');
        cInput.focus();

        startTime = new Date().getTime();
        updateDisplay();
    }

    function updateDisplay() {
        scoreDisplay.textContent = currentScore;
        currentQuestionDisplay.textContent = questionCount > TOTAL_QUESTIONS ? TOTAL_QUESTIONS : questionCount;
        totalQuestionsDisplay.textContent = TOTAL_QUESTIONS;
    }

    function disableGameControls() {
        cInput.value = '';
        cInput.disabled = true;
        checkButton.disabled = true;
        stopGameButton.disabled = true;
    }

    function handleGameEnd() {
        gameActive = false;
        disableGameControls();

        problemAreaParagraph.innerHTML = `<span class="final-score">최종 점수: ${currentScore}점</span>`;
        resultMessage.textContent = `게임을 다시 시작하세요!`;
        resultMessage.classList.remove('incorrect');
        resultMessage.style.color = '#333';

        saveScoreToRanking(currentScore, currentPlayerName);

        setTimeout(() => {
            gameScreen.style.display = 'none';
            startScreen.style.display = 'flex';
        }, 3000);
    }

    function stopGame() {
        handleGameEnd();
    }

    function endGame() {
        handleGameEnd();
    }

    function checkAnswer() {
        if (!gameActive) return;

        const userC = parseInt(cInput.value);

        if (isNaN(userC)) {
            resultMessage.textContent = "숫자를 입력해주세요!";
            resultMessage.classList.add('incorrect');
            return;
        }

        const endTime = new Date().getTime();
        const timeTaken = (endTime - startTime) / 1000;

        let pointsAwarded = 0;
        if (userC === correctC) {
            resultMessage.textContent = "정답입니다! 🎉";
            resultMessage.classList.remove('incorrect');

            if (timeTaken <= TIME_LIMIT_FOR_MAX_SCORE) {
                pointsAwarded = MAX_SCORE_PER_QUESTION;
            } else if (timeTaken >= TIME_LIMIT_FOR_MIN_SCORE) {
                pointsAwarded = MIN_SCORE_PER_QUESTION;
            } else {
                const timeRange = TIME_LIMIT_FOR_MIN_SCORE - TIME_LIMIT_FOR_MAX_SCORE;
                const scoreRange = MAX_SCORE_PER_QUESTION - MIN_SCORE_PER_QUESTION;
                
                const timeRatio = (timeTaken - TIME_LIMIT_FOR_MAX_SCORE) / timeRange;
                
                pointsAwarded = Math.round(MAX_SCORE_PER_QUESTION - (scoreRange * timeRatio));
            }

            currentScore += pointsAwarded;
            updateDisplay();
            setTimeout(loadNewProblem, 1000);
        } else {
            resultMessage.textContent = `오답입니다. 정답은 ${correctC}였습니다. 😢`;
            resultMessage.classList.add('incorrect');
            setTimeout(loadNewProblem, 1500);
        }
    }

    // --- 랭킹 시스템 함수 ---

    function getRanking() {
        const rankingString = localStorage.getItem('pythagoreanRanking');
        return rankingString ? JSON.parse(rankingString) : [];
    }

    function isNameTaken(name) {
        const ranking = getRanking();
        return ranking.some(entry => entry.name.toLowerCase() === name.toLowerCase());
    }

    function saveScoreToRanking(score, playerName) {
        let ranking = getRanking();
        
        ranking = ranking.filter(entry => entry.name.toLowerCase() !== playerName.toLowerCase());

        ranking.push({ score: score, name: playerName, date: new Date().toLocaleString() });

        ranking.sort((a, b) => b.score - a.score);

        if (ranking.length > MAX_RANKING_ENTRIES) {
            ranking = ranking.slice(0, MAX_RANKING_ENTRIES);
        }

        localStorage.setItem('pythagoreanRanking', JSON.stringify(ranking));
    }

    function displayRanking() {
        const ranking = getRanking();
        rankingList.innerHTML = '';

        if (ranking.length === 0) {
            rankingList.innerHTML = '<li>아직 랭킹이 없습니다. 게임을 플레이하여 점수를 등록해보세요!</li>';
            return;
        }

        ranking.forEach((entry, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>${index + 1}. ${entry.name}</span>
                <span>${entry.score}점</span>
                <span>(${entry.date})</span>
            `;
            rankingList.appendChild(listItem);
        });
    }

    // 랭킹 데이터를 LocalStorage에서 제거하는 함수 (비밀번호 확인 추가)
    function clearRanking() {
        const confirmClear = confirm("정말로 랭킹을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
        if (!confirmClear) {
            return; // 사용자가 취소한 경우 함수 종료
        }

        const enteredPassword = prompt("랭킹을 초기화하려면 비밀번호를 입력하세요:");

        if (enteredPassword === null) { // 사용자가 비밀번호 입력 프롬프트에서 취소한 경우
            alert("랭킹 초기화가 취소되었습니다.");
            return;
        }

        if (enteredPassword === RESET_PASSWORD) {
            localStorage.removeItem('pythagoreanRanking');
            alert("랭킹이 성공적으로 초기화되었습니다.");
            displayRanking(); // 랭킹 화면이 열려 있다면 즉시 업데이트
        } else {
            alert("비밀번호가 틀렸습니다. 랭킹 초기화에 실패했습니다.");
        }
    }

    // --- 이벤트 리스너 설정 ---

    startGameButton.addEventListener('click', () => {
        let nameValid = false;
        let userName = "";

        while (!nameValid) {
            userName = prompt("플레이어 이름을 입력하세요 (최대 10자):", "이름");

            if (userName === null) {
                return;
            }

            userName = userName.trim();

            if (userName === "") {
                alert("이름은 비워둘 수 없습니다. 다시 입력해주세요.");
            } else if (userName.length > 10) {
                alert("이름은 최대 10자까지 입력할 수 있습니다. 다시 입력해주세요.");
            } else if (isNameTaken(userName)) {
                alert(`'${userName}'은(는) 이미 사용 중인 이름입니다. 다른 이름을 입력해주세요.`);
            } else {
                nameValid = true;
            }
        }

        currentPlayerName = userName;

        startScreen.style.display = 'none';
        gameScreen.style.display = 'flex';
        gameActive = true;
        currentScore = 0;
        questionCount = 0;
        updateDisplay();
        loadNewProblem();
    });

    viewRankingButton.addEventListener('click', () => {
        startScreen.style.display = 'none';
        rankingScreen.style.display = 'flex';
        displayRanking();
    });

    backToStartButton.addEventListener('click', () => {
        rankingScreen.style.display = 'none';
        startScreen.style.display = 'flex';
    });

    // 랭킹 초기화 버튼 이벤트 리스너
    resetRankingButton.addEventListener('click', clearRanking);

    checkButton.addEventListener('click', checkAnswer);

    cInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            checkAnswer();
        }
    });

    stopGameButton.addEventListener('click', stopGame);
});
