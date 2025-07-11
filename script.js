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
    
    // 서버 API 주소
    const SERVER_URL = 'http://localhost:3000/api'; // 서버가 실행되는 주소와 포트를 맞춰야 함

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

        // 서버에 점수 저장 시도
        saveScoreToServer(currentScore, currentPlayerName);

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

    // --- 랭킹 시스템 함수 (서버 통신) ---

    // 이름 중복 확인 함수 (서버 API 사용)
    async function isNameTaken(name) {
        try {
            const response = await fetch(`${SERVER_URL}/ranking/checkName/${encodeURIComponent(name)}`);
            if (!response.ok) {
                // 서버에서 4xx 또는 5xx 오류가 발생한 경우
                const errorData = await response.json();
                throw new new Error(errorData.error || '이름 중복 확인 중 서버 오류 발생');
            }
            const data = await response.json();
            return data.isTaken;
        } catch (error) {
            console.error('이름 중복 확인 실패:', error);
            alert('이름 중복 확인 중 네트워크 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.');
            return true; // 네트워크 오류 발생 시 안전하게 중복으로 처리
        }
    }

    // 점수를 서버에 저장하는 함수
    async function saveScoreToServer(score, playerName) {
        try {
            const response = await fetch(`${SERVER_URL}/ranking`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: playerName, score: score }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '랭킹 저장 실패');
            }

            const data = await response.json();
            console.log(data.message);
            // alert('점수가 랭킹에 성공적으로 등록되었습니다!'); // 너무 자주 뜨면 불편하니 주석 처리
        } catch (error) {
            console.error('점수 서버 저장 실패:', error);
            alert(`점수 저장에 실패했습니다: ${error.message}. 서버를 확인해주세요.`);
        }
    }

    // 랭킹을 서버에서 가져와 표시하는 함수
    async function displayRanking() {
        rankingList.innerHTML = '<li>랭킹을 불러오는 중...</li>';
        try {
            const response = await fetch(`${SERVER_URL}/ranking`);
            if (!response.ok) {
                throw new Error('랭킹을 불러오지 못했습니다. 서버 오류.');
            }
            const ranking = await response.json();

            rankingList.innerHTML = ''; // 기존 내용 지우기

            if (ranking.length === 0) {
                rankingList.innerHTML = '<li>아직 랭킹이 없습니다. 게임을 플레이하여 점수를 등록해보세요!</li>';
                return;
            }

            ranking.forEach((entry, index) => {
                const listItem = document.createElement('li');
                // 아랍어 글꼴이 지원되는 환경이라면 아랍어가 정상적으로 보입니다.
                // 그렇지 않으면 네모나 깨진 글자로 보일 수 있습니다.
                listItem.innerHTML = `
                    <span>${index + 1}. ${entry.name}</span>
                    <span>${entry.score}점</span>
                    <span>(${entry.date})</span>
                `;
                rankingList.appendChild(listItem);
            });
        } catch (error) {
            console.error('랭킹 로드 실패:', error);
            rankingList.innerHTML = `<li>랭킹을 불러오는 데 실패했습니다: ${error.message}. 서버를 확인해주세요.</li>`;
        }
    }

    // 랭킹 데이터를 서버에서 초기화하는 함수
    async function clearRanking() {
        const confirmClear = confirm("정말로 랭킹을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
        if (!confirmClear) {
            return;
        }

        const enteredPassword = prompt("랭킹을 초기화하려면 비밀번호를 입력하세요:");

        if (enteredPassword === null) {
            alert("랭킹 초기화가 취소되었습니다.");
            return;
        }

        // 비밀번호는 클라이언트에서 직접 비교하지 않고, 서버로 전송하여 서버에서 비교하도록 함
        // (보안상 더 좋지만, 이 경우 SECRET_PASSWORD는 서버에만 존재하므로 클라이언트는 '무조건' 서버로 보내야 함)
        // 여기서는 편의를 위해 클라이언트에서도 SECRET_PASSWORD를 직접 가지고 있습니다.
        // 클라이언트 코드에 SECRET_PASSWORD가 노출되는 것은 보안상 좋지 않습니다.
        // 실제 배포시에는 클라이언트에서 비밀번호를 입력받아 서버로 보내고, 서버에서만 비밀번호를 검증해야 합니다.
        // 즉, script.js에서 RESET_PASSWORD 상수를 제거하고 서버로 무조건 보내는 방식이 좋습니다.
        
        // 현재는 편의상 클라이언트에도 비밀번호를 정의했으나, 실제 서비스에서는 클라이언트에서 서버로 '비밀번호'를 전송하고
        // 서버에서만 그 비밀번호의 유효성을 검사해야 합니다.
        // 따라서, 클라이언트의 RESET_PASSWORD는 제거하고, enteredPassword를 직접 서버로 보내는 것이 보안상 더 나은 방법입니다.
        // 아래 코드는 클라이언트에서 입력받은 비밀번호를 그대로 서버로 전송하여 서버에서만 검증하는 방식입니다.

        try {
            const response = await fetch(`${SERVER_URL}/ranking/reset`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: enteredPassword }), // 입력된 비밀번호를 서버로 전송
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '랭킹 초기화 실패');
            }

            const data = await response.json();
            alert(data.message);
            displayRanking(); // 랭킹 초기화 후 다시 랭킹 불러오기
        } catch (error) {
            console.error('랭킹 초기화 오류:', error);
            alert(`랭킹 초기화에 실패했습니다: ${error.message}`);
        }
    }

    // --- 이벤트 리스너 설정 ---

    startGameButton.addEventListener('click', async () => {
        let nameValid = false;
        let userName = "";

        while (!nameValid) {
            userName = prompt("플레이어 이름을 입력하세요 (최대 10자):", "이름");

            if (userName === null) { // 사용자가 '취소'를 누른 경우
                return;
            }

            userName = userName.trim(); // 앞뒤 공백 제거

            if (userName === "") {
                alert("이름은 비워둘 수 없습니다. 다시 입력해주세요.");
            } else if (userName.length > 10) {
                alert("이름은 최대 10자까지 입력할 수 있습니다. 다시 입력해주세요.");
            } else {
                // 서버에서 이름 중복 확인
                const isTaken = await isNameTaken(userName);
                if (isTaken) {
                    alert(`'${userName}'은(는) 이미 사용 중인 이름입니다. 다른 이름을 입력해주세요.`);
                } else {
                    nameValid = true;
                }
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
        displayRanking(); // 랭킹 화면으로 갈 때마다 서버에서 최신 랭킹 로드
    });

    backToStartButton.addEventListener('click', () => {
        rankingScreen.style.display = 'none';
        startScreen.style.display = 'flex';
    });

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
