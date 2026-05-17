const phases = [
    { group: "第一阶段", name: "开庭准备", duration: 5 * 60 },
    { group: "第一阶段", name: "身份核对、告知权力", duration: 5 * 60 },
    { group: "第二阶段：法庭调查", name: "公诉人宣读起诉书", duration: 5 * 60 },
    { group: "第二阶段：法庭调查", name: "被告人自行供述和辩解", duration: 5 * 60 },
    { group: "第二阶段：法庭调查", name: "公诉人讯问被告人", duration: 10 * 60 },
    { group: "第二阶段：法庭调查", name: "辩护人发问被告人", duration: 10 * 60 },
    { group: "第二阶段：法庭调查", name: "举证质证", duration: 25 * 60 },
    { group: "第三阶段：法庭辩论", name: "公诉人发表公诉意见", duration: 10 * 60 },
    { group: "第三阶段：法庭辩论", name: "辩护人发表辩护意见", duration: 10 * 60 },
    { group: "第三阶段：法庭辩论", name: "第二轮辩论", duration: 20 * 60 },
    { group: "第三阶段：法庭辩论", name: "被告人最后陈述", duration: 5 * 60 }
];

let currentPhase = 0;
let timeLeft = phases[0].duration;
let totalTime = phases[0].duration;
let timerInterval = null;
let isRunning = false;
let alertPlayed = false;

const timeDisplay = document.getElementById('timeDisplay');
const phaseNumber = document.getElementById('phaseNumber');
const phaseName = document.getElementById('phaseName');
const progressFill = document.getElementById('progressFill');
const totalTimeEl = document.getElementById('totalTime');
const remainingTimeEl = document.getElementById('remainingTime');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const alertSound = document.getElementById('alertSound');

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatTimeChinese(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
        return `${mins}分${secs}秒`;
    }
    return `${secs}秒`;
}

function updateDisplay() {
    timeDisplay.textContent = formatTime(timeLeft);
    phaseNumber.textContent = phases[currentPhase].group;
    phaseName.textContent = phases[currentPhase].name;

    const progress = (timeLeft / totalTime) * 100;
    progressFill.style.width = `${progress}%`;

    totalTimeEl.textContent = `总时长: ${formatTimeChinese(totalTime)}`;
    remainingTimeEl.textContent = `剩余: ${formatTimeChinese(timeLeft)}`;

    // 更新阶段列表高亮
    document.querySelectorAll('.phase-item').forEach((item, index) => {
        item.classList.remove('active');
        if (index < currentPhase) {
            item.classList.add('completed');
        } else if (index === currentPhase) {
            item.classList.add('active');
            item.classList.remove('completed');
        } else {
            item.classList.remove('completed');
        }
    });

    // 视觉警告效果
    timeDisplay.classList.remove('warning', 'danger');
    if (timeLeft <= 10 && timeLeft > 0) {
        timeDisplay.classList.add('danger');
    } else if (timeLeft <= 60 && timeLeft > 10) {
        timeDisplay.classList.add('warning');
    }
}

function playAlert() {
    if (alertSound && alertSound.readyState >= 2) {
        alertSound.currentTime = 0;
        alertSound.play().catch(e => {
            console.log('音频播放失败:', e);
            // 备用：使用Web Audio API生成提示音
            playBeep();
        });
    } else {
        playBeep();
    }
}

function playBeep() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Web Audio API播放失败:', e);
    }
}

function tick() {
    if (timeLeft > 0) {
        timeLeft--;
        updateDisplay();

        // 最后10秒响铃提醒
        if (timeLeft <= 10 && timeLeft > 0 && !alertPlayed) {
            playAlert();
            alertPlayed = true;
        }
    } else {
        // 时间到
        pauseTimer();
        playAlert();
        setTimeout(() => playAlert(), 1000);
        setTimeout(() => playAlert(), 2000);
        alert('当前阶段时间已到！');
    }
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timerInterval = setInterval(tick, 1000);
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        startBtn.textContent = '进行中';
    }
}

function pauseTimer() {
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        startBtn.textContent = '继续';
    }
}

function resetTimer() {
    pauseTimer();
    timeLeft = totalTime;
    alertPlayed = false;
    startBtn.textContent = '开始';
    updateDisplay();
}

function nextPhase() {
    if (currentPhase < phases.length - 1) {
        currentPhase++;
        totalTime = phases[currentPhase].duration;
        timeLeft = totalTime;
        alertPlayed = false;
        pauseTimer();
        startBtn.textContent = '开始';
        updateDisplay();
    } else {
        alert('已经是最后一个阶段了！');
    }
}

function jumpToPhase(index) {
    if (index >= 0 && index < phases.length) {
        currentPhase = index;
        totalTime = phases[currentPhase].duration;
        timeLeft = totalTime;
        alertPlayed = false;
        pauseTimer();
        startBtn.textContent = '开始';
        updateDisplay();
    }
}

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    } else if (e.code === 'ArrowRight') {
        nextPhase();
    } else if (e.code === 'KeyR') {
        resetTimer();
    }
});

// 初始化显示
updateDisplay();
