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
    { group: "第三阶段：法庭辩论", name: "被告人最后陈述", duration: 5 * 60 },
    { group: "第四阶段：点评与总结", name: "老师点评", duration: null },
    { group: "第四阶段：点评与总结", name: "结束语", duration: null }
];

let currentPhase = 0;
let timeLeft = phases[0].duration;
let totalTime = phases[0].duration;
let timerInterval = null;
let isRunning = false;
let alertPlayed = false;
let elapsedTime = 0;
let phaseStartTime = null;
let phaseElapsedTimes = new Array(phases.length).fill(0);

const timeDisplay = document.getElementById('timeDisplay');
const phaseNumber = document.getElementById('phaseNumber');
const phaseName = document.getElementById('phaseName');
const progressFill = document.getElementById('progressFill');
const totalTimeEl = document.getElementById('totalTime');
const remainingTimeEl = document.getElementById('remainingTime');
const alertSound = document.getElementById('alertSound');
const timerDisplay = document.getElementById('timerDisplay');
const endingPage = document.getElementById('endingPage');

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

function updatePhaseControls() {
    document.querySelectorAll('.phase-item').forEach((item, index) => {
        const playBtn = item.querySelector('.btn-play');
        const pauseBtn = item.querySelector('.btn-pause');

        if (!playBtn || !pauseBtn) return;

        if (index === currentPhase && isRunning) {
            playBtn.disabled = true;
            pauseBtn.disabled = false;
        } else if (index === currentPhase && !isRunning && timeLeft !== totalTime && timeLeft >= 0) {
            playBtn.disabled = false;
            playBtn.querySelector('.btn-label').textContent = '继续计时';
            pauseBtn.disabled = true;
        } else {
            playBtn.disabled = false;
            playBtn.querySelector('.btn-label').textContent = '开始计时';
            pauseBtn.disabled = true;
        }
    });
}

function updateDisplay() {
    timeDisplay.textContent = formatTime(timeLeft);
    phaseNumber.textContent = phases[currentPhase].group;
    phaseName.textContent = phases[currentPhase].name;

    if (totalTime !== null) {
        const progress = (timeLeft / totalTime) * 100;
        progressFill.style.width = `${progress}%`;
        totalTimeEl.textContent = `总时长: ${formatTimeChinese(totalTime)}`;
        remainingTimeEl.textContent = `剩余: ${formatTimeChinese(timeLeft)}`;
    } else {
        progressFill.style.width = '100%';
        totalTimeEl.textContent = '总时长: 不限时';
        remainingTimeEl.textContent = `已用时: ${formatTimeChinese(phaseElapsedTimes[currentPhase])}`;
    }

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

    updatePhaseControls();

    // 视觉警告效果
    timeDisplay.classList.remove('warning', 'danger');
    if (totalTime !== null) {
        if (timeLeft <= 10 && timeLeft > 0) {
            timeDisplay.classList.add('danger');
        } else if (timeLeft <= 60 && timeLeft > 10) {
            timeDisplay.classList.add('warning');
        }
    }
}

function playAlert() {
    if (alertSound && alertSound.readyState >= 2) {
        alertSound.currentTime = 0;
        alertSound.play().catch(e => {
            console.log('音频播放失败:', e);
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
    if (totalTime !== null) {
        if (timeLeft > 0) {
            timeLeft--;
            phaseElapsedTimes[currentPhase]++;
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
    } else {
        // 不限时阶段
        phaseElapsedTimes[currentPhase]++;
        updateDisplay();
    }
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timerInterval = setInterval(tick, 1000);
        updatePhaseControls();
    }
}

function pauseTimer() {
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
        updatePhaseControls();
    }
}

function resetTimer() {
    pauseTimer();
    if (totalTime !== null) {
        timeLeft = totalTime;
    }
    phaseElapsedTimes[currentPhase] = 0;
    alertPlayed = false;
    updatePhaseControls();
    updateDisplay();
}

function nextPhase() {
    if (currentPhase < phases.length - 1) {
        currentPhase++;
        totalTime = phases[currentPhase].duration;
        if (totalTime !== null) {
            timeLeft = totalTime;
        } else {
            timeLeft = 0;
        }
        alertPlayed = false;
        pauseTimer();
        updateDisplay();
    } else {
        alert('已经是最后一个阶段了！');
    }
}

function jumpToPhase(index) {
    if (index >= 0 && index < phases.length) {
        currentPhase = index;
        totalTime = phases[currentPhase].duration;
        if (totalTime !== null) {
            timeLeft = totalTime;
        } else {
            timeLeft = 0;
        }
        alertPlayed = false;
        pauseTimer();
        updateDisplay();
    }
}

// 阶段卡片控制函数
function playPhase(index) {
    if (index !== currentPhase) {
        jumpToPhase(index);
    }
    startTimer();
}

function pausePhase(index) {
    if (index === currentPhase) {
        pauseTimer();
    }
}

function resetPhase(index) {
    if (index === currentPhase) {
        resetTimer();
    } else {
        jumpToPhase(index);
    }
}

// 显示结束页面
function showEnding() {
    pauseTimer();
    timerDisplay.style.display = 'none';
    endingPage.style.display = 'block';

    // 生成统计信息
    const statsContainer = document.getElementById('endingStats');
    let statsHTML = '<h3>庭审用时统计</h3>';

    let totalUsedTime = 0;
    phases.forEach((phase, index) => {
        if (phase.duration !== null) {
            const used = phaseElapsedTimes[index];
            totalUsedTime += used;
            const percent = Math.round((used / phase.duration) * 100);
            statsHTML += `
                <div class="stat-item">
                    <span class="stat-label">${phase.name}</span>
                    <span class="stat-value">${formatTimeChinese(used)} / ${formatTimeChinese(phase.duration)} (${percent}%)</span>
                </div>
            `;
        } else if (phaseElapsedTimes[index] > 0) {
            statsHTML += `
                <div class="stat-item">
                    <span class="stat-label">${phase.name}</span>
                    <span class="stat-value">${formatTimeChinese(phaseElapsedTimes[index])}</span>
                </div>
            `;
        }
    });

    statsHTML += `
        <div class="stat-item" style="border-top: 2px solid rgba(201, 162, 39, 0.3); margin-top: 10px; padding-top: 15px;">
            <span class="stat-label">总计用时</span>
            <span class="stat-value">${formatTimeChinese(totalUsedTime)}</span>
        </div>
    `;

    statsContainer.innerHTML = statsHTML;
}

// 重新开始
function restartAll() {
    currentPhase = 0;
    totalTime = phases[0].duration;
    timeLeft = totalTime;
    isRunning = false;
    alertPlayed = false;
    phaseElapsedTimes = new Array(phases.length).fill(0);

    timerDisplay.style.display = 'block';
    endingPage.style.display = 'none';

    updateDisplay();
}

// 上一阶段
function prevPhase() {
    if (currentPhase > 0) {
        currentPhase--;
        totalTime = phases[currentPhase].duration;
        if (totalTime !== null) {
            timeLeft = totalTime;
        } else {
            timeLeft = 0;
        }
        alertPlayed = false;
        pauseTimer();
        updateDisplay();
    } else {
        alert('已经是第一个阶段了！');
    }
}

// 全屏功能
function toggleFullscreen() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    const fullscreenLabel = document.getElementById('fullscreenLabel');

    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
        // 进入全屏
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
            docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen();
        }
        fullscreenIcon.textContent = '⛶';
        fullscreenLabel.textContent = '退出全屏';
    } else {
        // 退出全屏
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        fullscreenIcon.textContent = '⛶';
        fullscreenLabel.textContent = '全屏';
    }
}

// 监听全屏变化事件
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
document.addEventListener('mozfullscreenchange', updateFullscreenButton);
document.addEventListener('MSFullscreenChange', updateFullscreenButton);

function updateFullscreenButton() {
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    const fullscreenLabel = document.getElementById('fullscreenLabel');

    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        fullscreenIcon.textContent = '⛶';
        fullscreenLabel.textContent = '退出全屏';
    } else {
        fullscreenIcon.textContent = '⛶';
        fullscreenLabel.textContent = '全屏';
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
    } else if (e.code === 'ArrowLeft') {
        prevPhase();
    } else if (e.code === 'KeyR') {
        resetTimer();
    } else if (e.code === 'KeyF') {
        toggleFullscreen();
    }
});

// 初始化显示
updateDisplay();
