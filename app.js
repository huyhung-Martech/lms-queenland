/* ==========================================================================
   UniAcademy LMS - Interactive Application Logic
   ========================================================================== */

// Switch view between Landing Page and LMS Portal
function switchView(viewName, push = true) {
    if (viewName === 'portal' && !currentUser) {
        alert('BẢO MẬT NỘI BỘ:\nBạn cần Đăng Nhập bằng Mã Nhân Viên để vào phòng học video bài giảng!');
        openAuthModal('login');
        return;
    }

    const landingView = document.getElementById('view-landing');
    const portalView = document.getElementById('view-portal');
    const btnLanding = document.getElementById('btn-landing-view');
    const btnPortal = document.getElementById('btn-portal-view');

    if (viewName === 'landing') {
        landingView.classList.add('active');
        portalView.classList.remove('active');
        btnLanding.classList.add('active');
        btnPortal.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (push) {
            try {
                history.pushState({ view: 'catalog' }, '', '#catalog');
            } catch (e) {}
        }
    } else if (viewName === 'portal') {
        portalView.classList.add('active');
        landingView.classList.remove('active');
        btnPortal.classList.add('active');
        btnLanding.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        reloadCoursesCatalog();
        const course = currentSelectedCourse || coursesCatalog[0];
        if (course) {
            playCourseLesson(course.id, 1, 1);
            if (push) {
                try {
                    history.pushState({ view: 'portal', courseId: course.id, modNum: 1, lessonNum: 1 }, '', '#classroom');
                } catch (e) {}
            }
        }
    }
}

// Toggle Sidebar Accordions
function toggleAccordion(id) {
    const body = document.getElementById(id);
    if (body) {
        body.classList.toggle('open');
    }
}

// Select Lesson & Update Player Video / Title
function selectLesson(modNum, lessonNum) {
    switchView('portal');
    reloadCoursesCatalog();
    const course = currentSelectedCourse || coursesCatalog[0];
    if (course) {
        playCourseLesson(course.id, modNum, lessonNum || 1);
    }
}

// ==========================================================================
// UNIFIED ENTERPRISE VIDEO PLAYER ENGINE (YOUTUBE & HTML5 WITH ANTI-CHEAT)
// ==========================================================================
let isYTReady = false;
let pendingVideoInit = null;
let currentYTPlayer = null;
let currentVideoType = 'none'; // 'youtube' | 'html5'
let currentPlaybackRate = 1.25;
let videoDuration = 0;
let maxWatchedSeconds = 0;
let playerTickerInterval = null;
let isPlayerMuted = false;
let toastTimeout = null;

// YouTube IFrame API Ready Callback
window.onYouTubeIframeAPIReady = function() {
    isYTReady = true;
    if (pendingVideoInit) {
        pendingVideoInit();
        pendingVideoInit = null;
    }
};

// Check if YT script was already loaded
if (window.YT && window.YT.Player) {
    isYTReady = true;
}

// Utility: Format seconds to MM:SS
function formatClockTime(sec) {
    if (!sec || isNaN(sec) || sec < 0) return '00:00';
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    const remainS = s % 60;
    return `${String(m).padStart(2, '0')}:${String(remainS).padStart(2, '0')}`;
}

// Show Toast Message on Player
function showToast(msg) {
    const toast = document.getElementById('lms-player-toast');
    if (!toast) return;
    toast.innerHTML = msg;
    toast.style.display = 'flex';
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

// Anti-Scrub Warning Alert
function showAntiScrubAlert() {
    showToast('<i class="bi bi-shield-exclamation" style="color:#f59e0b; font-size:1.1rem;"></i> <span><strong>Chế độ chống tua:</strong> Bạn chỉ có thể xem lại đoạn đã học. Vui lòng học tuần tự để đảm bảo chất lượng đào tạo!</span>');
}

// DYNAMIC SYSTEM CONFIGURATION ENGINE (SYNCED LIVE FROM ADMIN PANEL VIA LOCALSTORAGE)
function applySystemConfig() {
    const minWatch = parseInt(localStorage.getItem('lms_min_watch_percent') || '80');
    const minScore = parseInt(localStorage.getItem('lms_min_quiz_score') || '80');
    const quizMinutes = parseInt(localStorage.getItem('lms_quiz_time_minutes') || '10');
    const isAntiScrub = localStorage.getItem('lms_anti_scrub_enabled') !== 'false';

    // 1. Update Video Scrubber Gate Marker Position & Label
    const gateMarker = document.querySelector('.anti-scrub-gate-marker');
    if (gateMarker) {
        gateMarker.style.left = `${minWatch}%`;
        gateMarker.title = isAntiScrub ? `Mốc hoàn thành tối thiểu ${minWatch}% thời lượng video` : `Mốc tham khảo ${minWatch}% (Chống tua đang TẮT)`;
        const gateLabel = gateMarker.querySelector('.gate-label');
        if (gateLabel) {
            gateLabel.innerHTML = `<i class="bi bi-flag-fill"></i> ${minWatch}%`;
        }
        gateMarker.style.opacity = isAntiScrub ? '1' : '0.65';
    }

    // 2. Update Video Watch Progress Target Badge in Custom Player Bar
    const reqBadge = document.getElementById('video-watch-progress-badge');
    if (reqBadge && !reqBadge.classList.contains('completed') && !reqBadge.classList.contains('ready')) {
        reqBadge.title = `Học viên cần xem thực tế tối thiểu ${minWatch}% thời lượng video để được tính hoàn thành bài học`;
        const reqTarget = reqBadge.querySelector('.req-target');
        if (reqTarget) {
            reqTarget.textContent = `/ ${minWatch}%`;
        }
    }

    // 3. Update Complete Button Label (when in locked state)
    const btnComplete = document.getElementById('btn-mark-complete');
    if (btnComplete && btnComplete.classList.contains('locked')) {
        btnComplete.title = `Cần xem tối thiểu ${minWatch}% thời lượng bài giảng để mở khóa hoàn thành`;
        const curWatched = document.getElementById('btn-watch-progress');
        const curPct = curWatched ? curWatched.textContent : '0%';
        btnComplete.innerHTML = `<span><i class="bi bi-lock-fill"></i> Đang học (${curPct}/${minWatch}%)</span>`;
    }

    // 4. Update Quiz Header Countdown Display if not currently counting down
    const quizClock = document.getElementById('quiz-timer-display');
    if (quizClock && !quizTimerInterval) {
        quizClock.textContent = `${String(quizMinutes).padStart(2, '0')}:00`;
    }
}

// Center play icon flash animation
function flashCenterIndicator(type) {
    const indicator = document.getElementById('center-play-indicator');
    if (!indicator) return;
    indicator.innerHTML = type === 'pause' ? '<i class="bi bi-pause-fill"></i>' : '<i class="bi bi-play-fill"></i>';
    indicator.classList.add('show');
    setTimeout(() => {
        if (type === 'play') {
            indicator.classList.remove('show');
        }
    }, 650);
}

// Toggle Play / Pause
function togglePlayPause() {
    const playBtn = document.getElementById('btn-player-play-pause');

    if (currentVideoType === 'youtube' && currentYTPlayer) {
        const state = typeof currentYTPlayer.getPlayerState === 'function' ? currentYTPlayer.getPlayerState() : -1;
        if (state === 1) { // Playing
            currentYTPlayer.pauseVideo();
            if (playBtn) playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
            flashCenterIndicator('pause');
        } else {
            currentYTPlayer.playVideo();
            if (playBtn) playBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
            flashCenterIndicator('play');
        }
    } else {
        const video = document.getElementById('lms-video');
        if (video) {
            if (video.paused) {
                video.play().catch(() => {});
                if (playBtn) playBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
                flashCenterIndicator('play');
            } else {
                video.pause();
                if (playBtn) playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
                flashCenterIndicator('pause');
            }
        }
    }
}

// Toggle Mute / Unmute
function toggleMute() {
    const muteBtn = document.getElementById('btn-player-mute');
    isPlayerMuted = !isPlayerMuted;

    if (currentVideoType === 'youtube' && currentYTPlayer) {
        if (isPlayerMuted) {
            if (typeof currentYTPlayer.mute === 'function') currentYTPlayer.mute();
            if (muteBtn) muteBtn.innerHTML = '<i class="bi bi-volume-mute-fill"></i>';
        } else {
            if (typeof currentYTPlayer.unMute === 'function') currentYTPlayer.unMute();
            if (muteBtn) muteBtn.innerHTML = '<i class="bi bi-volume-up-fill"></i>';
        }
    } else {
        const video = document.getElementById('lms-video');
        if (video) {
            video.muted = isPlayerMuted;
            if (muteBtn) muteBtn.innerHTML = isPlayerMuted ? '<i class="bi bi-volume-mute-fill"></i>' : '<i class="bi bi-volume-up-fill"></i>';
        }
    }
}

// Custom Player Speed Control (Supports both YouTube & HTML5 Video)
function setSpeed(rate) {
    currentPlaybackRate = rate;

    if (currentVideoType === 'youtube' && currentYTPlayer && typeof currentYTPlayer.setPlaybackRate === 'function') {
        try {
            currentYTPlayer.setPlaybackRate(rate);
        } catch (e) {
            console.warn('YT setPlaybackRate:', e);
        }
    }

    const video = document.getElementById('lms-video');
    if (video) {
        video.playbackRate = rate;
    }

    document.querySelectorAll('.speed-btn').forEach(btn => {
        const bSpeed = parseFloat(btn.dataset.speed || btn.textContent);
        btn.classList.toggle('active', bSpeed === rate);
    });
}

// Fullscreen Toggle
function togglePlayerFullscreen() {
    const container = document.getElementById('lms-video-container');
    if (!container) return;
    if (!document.fullscreenElement) {
        if (container.requestFullscreen) container.requestFullscreen();
        else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
}

// Seek Player Helper
function seekPlayerTo(seconds) {
    if (currentVideoType === 'youtube' && currentYTPlayer && typeof currentYTPlayer.seekTo === 'function') {
        currentYTPlayer.seekTo(seconds, true);
        currentYTPlayer.playVideo();
    } else {
        const video = document.getElementById('lms-video');
        if (video) {
            video.currentTime = seconds;
            video.play().catch(() => {});
        }
    }
}

// Anti-Scrub Progress Bar Click Handler
function handleScrubClick(e) {
    if (!videoDuration || videoDuration <= 0) return;
    const container = document.getElementById('anti-scrub-progress-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * videoDuration;

    if (!currentSelectedCourse) return;
    const isAntiScrub = localStorage.getItem('lms_anti_scrub_enabled') !== 'false';
    const prog = getStudentProgress(currentSelectedCourse.id);
    const lessonKey = `m${currentActiveModNum}_l${currentActiveLessonNum}`;
    const isDone = prog.completedLessons.includes(lessonKey);

    // Anti-scrub: If anti-scrub is ON and lesson is not completed, cannot seek past maxWatchedSeconds + 2
    if (isAntiScrub && !isDone && targetTime > maxWatchedSeconds + 2) {
        showAntiScrubAlert();
        return;
    }

    seekPlayerTo(targetTime);
}

/* ==========================================================================
   5-STEP LEARNING WORKFLOW & PROGRESSION STATE ENGINE (COURSERA / UDEMY STANDARD)
   ========================================================================== */

function getUserKey() {
    return currentUser ? currentUser.empId : 'DEFAULT_USER';
}

function getStudentProgress(courseId) {
    const key = `lms_progress_${getUserKey()}_${courseId}`;
    let data = JSON.parse(localStorage.getItem(key) || 'null');
    if (!data) {
        data = {
            completedLessons: [], // Starts clean, lesson 1.1 is unlocked by rule
            passedQuizzes: [],
            lastActive: { modNum: 1, lessonNum: 1, time: 0 },
            certificateEarned: false,
            earnedDate: null
        };
        localStorage.setItem(key, JSON.stringify(data));
    }
    return data;
}

function saveStudentProgress(courseId, data) {
    const key = `lms_progress_${getUserKey()}_${courseId}`;
    localStorage.setItem(key, JSON.stringify(data));
}

function calculateCourseProgressPercent(courseId) {
    reloadCoursesCatalog();
    const course = coursesCatalog.find(c => c.id === courseId) || coursesCatalog[0];
    if (!course) return 0;
    const prog = getStudentProgress(courseId);
    
    let totalLessonsCount = 0;
    (course.modules || []).forEach(m => {
        const count = (m.lessons && m.lessons.length) ? m.lessons.length : ((m.meta && m.meta.videos) ? parseInt(m.meta.videos) : 2);
        totalLessonsCount += count;
    });

    if (totalLessonsCount === 0) return 0;
    const doneCount = prog.completedLessons.length;
    const percent = Math.min(100, Math.round((doneCount / totalLessonsCount) * 100));
    return percent;
}

function isLessonUnlocked(course, modNum, lessonNum) {
    if (modNum === 1 && lessonNum === 1) return true;
    if (!isModuleUnlocked(course, modNum)) return false;
    if (lessonNum === 1) return true;
    const prog = getStudentProgress(course.id);
    const prevLessonKey = `m${modNum}_l${lessonNum - 1}`;
    return prog.completedLessons.includes(prevLessonKey);
}

function isModuleUnlocked(course, modNum) {
    if (modNum === 1) return true;
    const prog = getStudentProgress(course.id);
    const prevModNum = modNum - 1;

    // Strict Quiz Gate: Previous module must be passed (score >= 80)
    const quizPassed = prog.passedQuizzes.includes(`m${prevModNum}`);
    if (!quizPassed) return false;

    // And all lessons in previous module must be completed
    const prevMod = (course.modules || []).find(m => m.id === prevModNum);
    if (prevMod) {
        const count = (prevMod.lessons && prevMod.lessons.length) ? prevMod.lessons.length : 2;
        for (let i = 1; i <= count; i++) {
            if (!prog.completedLessons.includes(`m${prevModNum}_l${i}`)) {
                return false;
            }
        }
    }
    return true;
}

// VIDEO WATCH PROGRESS % MEASUREMENT & COMPLETION ENFORCEMENT (ANTI-CHEAT)
let currentActiveModNum = 1;
let currentActiveLessonNum = 1;
let autoAdvanceInterval = null;

function clearAutoAdvanceToast() {
    if (autoAdvanceInterval) {
        clearInterval(autoAdvanceInterval);
        autoAdvanceInterval = null;
    }
    const existing = document.getElementById('lms-auto-advance-toast');
    if (existing) existing.remove();
}

function showAutoAdvanceToast() {
    clearAutoAdvanceToast();

    const videoWrapper = document.querySelector('.video-wrapper');
    if (!videoWrapper) return;

    let secondsLeft = 5;
    const toast = document.createElement('div');
    toast.className = 'auto-advance-toast';
    toast.id = 'lms-auto-advance-toast';
    toast.innerHTML = `
        <div class="count-badge" id="auto-advance-countdown">${secondsLeft}</div>
        <div style="font-size:0.78rem; line-height:1.3; color:#ffffff;">
            <strong>Đã xem hết bài giảng!</strong><br>
            Tự động chuyển sang bài tiếp theo sau <span id="auto-advance-countdown-text">${secondsLeft}s</span>...
        </div>
        <button class="btn btn-primary animated-shine-btn" style="padding:4px 10px; font-size:0.75rem; background:var(--accent); color:var(--primary); font-weight:800; border:none; cursor:pointer;" onclick="dismissAutoAdvance(true)">
            Chuyển Ngay <i class="bi bi-chevron-right"></i>
        </button>
        <button class="btn" style="padding:4px 8px; font-size:0.75rem; background:rgba(255,255,255,0.15); color:#ffffff; border:none; cursor:pointer;" onclick="dismissAutoAdvance(false)">
            Hủy
        </button>
    `;
    videoWrapper.appendChild(toast);

    autoAdvanceInterval = setInterval(() => {
        secondsLeft--;
        const badge = document.getElementById('auto-advance-countdown');
        const text = document.getElementById('auto-advance-countdown-text');
        if (badge) badge.textContent = secondsLeft;
        if (text) text.textContent = `${secondsLeft}s`;

        if (secondsLeft <= 0) {
            clearAutoAdvanceToast();
            goToNextLesson();
        }
    }, 1000);
}

function dismissAutoAdvance(proceed) {
    clearAutoAdvanceToast();
    if (proceed) {
        goToNextLesson();
    }
}

// START PLAYER TICKER: LIVE COUNTERS, ANTI-CHEAT ENFORCEMENT & ELIGIBILITY
function startPlayerTicker(courseId, modNum, lessonNum) {
    if (playerTickerInterval) {
        clearInterval(playerTickerInterval);
        playerTickerInterval = null;
    }

    const minPercent = parseInt(localStorage.getItem('lms_min_watch_percent') || '80');
    const lessonKey = `m${modNum}_l${lessonNum}`;

    playerTickerInterval = setInterval(() => {
        let curTime = 0;
        let dur = 0;

        if (currentVideoType === 'youtube' && currentYTPlayer) {
            if (typeof currentYTPlayer.getCurrentTime === 'function') {
                curTime = currentYTPlayer.getCurrentTime() || 0;
            }
            if (typeof currentYTPlayer.getDuration === 'function') {
                dur = currentYTPlayer.getDuration() || 0;
            }
        } else {
            const video = document.getElementById('lms-video');
            if (video) {
                curTime = video.currentTime || 0;
                dur = video.duration || 0;
            }
        }

        if (dur > 0) {
            videoDuration = dur;
        }

        if (!currentSelectedCourse) return;
        const prog = getStudentProgress(courseId);
        const isLessonDone = prog.completedLessons.includes(lessonKey);

        const isAntiScrub = localStorage.getItem('lms_anti_scrub_enabled') !== 'false';
        // Anti-Cheat: If user somehow scrubbed forward beyond what they watched + 3s
        if (isAntiScrub && !isLessonDone && curTime > maxWatchedSeconds + 3) {
            seekPlayerTo(maxWatchedSeconds);
            showAntiScrubAlert();
            curTime = maxWatchedSeconds;
        } else if (curTime > maxWatchedSeconds) {
            maxWatchedSeconds = curTime;
        }

        // Calculate progress percentages
        const playPercent = videoDuration > 0 ? Math.min(100, Math.round((curTime / videoDuration) * 100)) : 0;
        const watchPercent = videoDuration > 0 ? Math.min(100, Math.round((maxWatchedSeconds / videoDuration) * 100)) : (isLessonDone ? 100 : 0);

        // Update live time counters
        const curTimeEl = document.getElementById('lms-current-time');
        const durTimeEl = document.getElementById('lms-duration-time');
        if (curTimeEl) curTimeEl.textContent = formatClockTime(curTime);
        if (durTimeEl) durTimeEl.textContent = formatClockTime(videoDuration);

        // Update custom scrubber bars
        const curBar = document.getElementById('player-current-bar');
        const bufBar = document.getElementById('player-buffer-bar');
        if (curBar) curBar.style.width = `${playPercent}%`;
        if (bufBar) bufBar.style.width = `${isLessonDone ? 100 : watchPercent}%`;

        // Update watch requirement badges & button states
        const watchDisplay = document.getElementById('lms-watched-pct-display');
        const btnWatchProg = document.getElementById('btn-watch-progress');
        if (watchDisplay) watchDisplay.textContent = `${isLessonDone ? 100 : watchPercent}%`;
        if (btnWatchProg) btnWatchProg.textContent = `${isLessonDone ? 100 : watchPercent}%`;

        const reqBadge = document.getElementById('video-watch-progress-badge');
        const btnComplete = document.getElementById('btn-mark-complete');

        if (isLessonDone) {
            if (reqBadge) {
                reqBadge.className = 'video-watch-progress-badge completed';
                reqBadge.innerHTML = '<i class="bi bi-check-circle-fill" style="color:#86efac;"></i> Đã hoàn thành bài học';
            }
            if (btnComplete) {
                btnComplete.className = 'btn btn-complete finished';
                btnComplete.disabled = false;
                btnComplete.title = 'Bài học này đã được bạn hoàn thành xuất sắc';
                btnComplete.innerHTML = '<span><i class="bi bi-check2-all"></i> Đã Hoàn Thành</span>';
            }
        } else if (watchPercent >= minPercent) {
            if (reqBadge) {
                reqBadge.className = 'video-watch-progress-badge ready';
                reqBadge.innerHTML = `<i class="bi bi-check-circle-fill" style="color:#86efac;"></i> Đủ điều kiện: <strong>${watchPercent}%</strong> / ${minPercent}%`;
            }
            if (btnComplete) {
                btnComplete.className = 'btn btn-complete ready animated-shine-btn';
                btnComplete.disabled = false;
                btnComplete.title = 'Bạn đã xem đủ thời lượng bắt buộc. Bấm để xác nhận hoàn thành bài học!';
                btnComplete.innerHTML = '<span><i class="bi bi-check2-circle"></i> Đủ điều kiện hoàn thành (Bấm xác nhận)</span>';
            }
        } else {
            if (reqBadge) {
                reqBadge.className = 'video-watch-progress-badge';
                reqBadge.innerHTML = `<i class="bi bi-clock-history"></i> Đã học: <strong>${watchPercent}%</strong> <span class="req-target">/ ${minPercent}%</span>`;
            }
            if (btnComplete) {
                btnComplete.className = 'btn btn-complete locked';
                btnComplete.disabled = true;
                btnComplete.title = `Cần xem tối thiểu ${minPercent}% thời lượng bài giảng để mở khóa hoàn thành`;
                btnComplete.innerHTML = `<span><i class="bi bi-lock-fill"></i> Đang học (${watchPercent}%/${minPercent}%)</span>`;
            }
        }
    }, 250);
}

function markLessonComplete(isAuto = false) {
    if (!currentSelectedCourse) return;
    const minPercentRequired = parseInt(localStorage.getItem('lms_min_watch_percent') || '80');
    
    let watchedPercent = 0;
    if (videoDuration > 0) {
        watchedPercent = Math.round((maxWatchedSeconds / videoDuration) * 100);
    } else {
        watchedPercent = maxWatchedSeconds > 0 ? 100 : 0;
    }

    const prog = getStudentProgress(currentSelectedCourse.id);
    const lessonKey = `m${currentActiveModNum}_l${currentActiveLessonNum}`;
    const alreadyDone = prog.completedLessons.includes(lessonKey);

    // Anti-cheat verification
    if (!alreadyDone && watchedPercent < minPercentRequired && !isAuto) {
        alert(`BẮT BUỘC XEM VIDEO THỰC TẾ:\nHệ thống đo lường bạn mới xem ${watchedPercent}% video bài giảng.\nBạn cần xem tối thiểu ${minPercentRequired}% thời lượng video để được tính hoàn thành bài học này!`);
        return;
    }

    if (!alreadyDone) {
        prog.completedLessons.push(lessonKey);
        prog.lastActive = { modNum: currentActiveModNum, lessonNum: currentActiveLessonNum, time: 0 };
        saveStudentProgress(currentSelectedCourse.id, prog);
        maxWatchedSeconds = 999999; // Allow free review once completed
    }

    // Update UI button
    const btn = document.getElementById('btn-mark-complete');
    if (btn) {
        btn.className = 'btn btn-complete finished';
        btn.disabled = false;
        btn.innerHTML = '<span><i class="bi bi-check2-all"></i> Đã Hoàn Thành</span>';
    }

    // Update Progress Bar
    const newPercent = calculateCourseProgressPercent(currentSelectedCourse.id);
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    if (progressFill) progressFill.style.width = `${newPercent}%`;
    if (progressText) progressText.textContent = `${newPercent}% (${prog.completedLessons.length} Bài)`;

    // Re-render sidebar to unlock next lesson
    renderClassroomSidebar(currentSelectedCourse, currentActiveModNum, currentActiveLessonNum);

    if (!isAuto) {
        alert(`CHÚC MỪNG!\nBạn đã hoàn thành Bài ${currentActiveModNum}.${currentActiveLessonNum}. Bài học tiếp theo đã sẵn sàng!`);
    }

    if (newPercent >= 100) {
        checkCourseCompletion(currentSelectedCourse.id);
    }
}

// CLASSROOM NAVIGATION: NEXT / PREVIOUS LESSONS
function goToNextLesson() {
    if (!currentSelectedCourse) return;
    const prog = getStudentProgress(currentSelectedCourse.id);
    const targetMod = (currentSelectedCourse.modules || []).find(m => m.id === currentActiveModNum);
    if (!targetMod) return;

    const lessons = targetMod.lessons || [];
    const currentIdx = lessons.findIndex(l => l.id === currentActiveLessonNum);

    if (currentIdx !== -1 && currentIdx < lessons.length - 1) {
        const nextLesson = lessons[currentIdx + 1];
        if (isLessonUnlocked(currentSelectedCourse, currentActiveModNum, nextLesson.id)) {
            enterCourseLesson(currentSelectedCourse.id, currentActiveModNum, nextLesson.id);
        } else {
            alert(`BÀI HỌC ĐANG KHÓA:\nBạn cần hoàn thành Bài ${currentActiveModNum}.${currentActiveLessonNum} để mở khóa bài tiếp theo!`);
        }
    } else {
        const nextModNum = currentActiveModNum + 1;
        const nextMod = (currentSelectedCourse.modules || []).find(m => m.id === nextModNum);
        if (nextMod) {
            if (isModuleUnlocked(currentSelectedCourse, nextModNum)) {
                enterCourseLesson(currentSelectedCourse.id, nextModNum, 1);
            } else {
                alert(`HOÀN THÀNH VIDEO MODULE ${currentActiveModNum}!\n\nBạn đã xem xong toàn bộ video bài giảng của Module này. Hãy làm bài kiểm tra trong tab "Bài Kiểm Tra Module" (đạt từ 80% điểm) để mở khóa Module ${nextModNum}!`);
                switchTab('quiz');
            }
        } else {
            if (isCourseFullyCompleted(currentSelectedCourse.id)) {
                checkCourseCompletion(currentSelectedCourse.id);
            } else {
                alert(`BẠN ĐÃ XEM XONG VIDEO BÀI GIẢNG CỦA MODULE NÀY!\n\nVui lòng chuyển sang tab "Bài Kiểm Tra" để làm bài đánh giá hoàn thành.`);
                switchTab('quiz');
            }
        }
    }
}

function goToPrevLesson() {
    if (!currentSelectedCourse) return;
    const targetMod = (currentSelectedCourse.modules || []).find(m => m.id === currentActiveModNum);
    if (!targetMod) return;

    const lessons = targetMod.lessons || [];
    const currentIdx = lessons.findIndex(l => l.id === currentActiveLessonNum);

    if (currentIdx > 0) {
        const prevLesson = lessons[currentIdx - 1];
        enterCourseLesson(currentSelectedCourse.id, currentActiveModNum, prevLesson.id);
    } else if (currentActiveModNum > 1) {
        const prevModNum = currentActiveModNum - 1;
        const prevMod = (currentSelectedCourse.modules || []).find(m => m.id === prevModNum);
        if (prevMod && prevMod.lessons && prevMod.lessons.length > 0) {
            const lastLesson = prevMod.lessons[prevMod.lessons.length - 1];
            enterCourseLesson(currentSelectedCourse.id, prevModNum, lastLesson.id);
        }
    }
}

// TOGGLE FOCUS MODE (SIDEBAR COLLAPSE)
function toggleSidebarFocus() {
    const lmsBody = document.querySelector('.lms-body');
    const textBtn = document.getElementById('text-toggle-sidebar');
    if (lmsBody) {
        lmsBody.classList.toggle('focus-mode');
        const isFocus = lmsBody.classList.contains('focus-mode');
        if (textBtn) {
            textBtn.textContent = isFocus ? 'Hiện Lộ Trình' : 'Thu Gọn Lộ Trình';
        }
    }
}

// INTERACTIVE TIMESTAMP SEEK (ANTI-SCRUB PROTECTED)
function seekToTimestamp(seconds) {
    if (!currentSelectedCourse) return;
    const isAntiScrub = localStorage.getItem('lms_anti_scrub_enabled') !== 'false';
    const prog = getStudentProgress(currentSelectedCourse.id);
    const lessonKey = `m${currentActiveModNum}_l${currentActiveLessonNum}`;
    const isDone = prog.completedLessons.includes(lessonKey);

    if (isAntiScrub && !isDone && seconds > maxWatchedSeconds + 2) {
        showAntiScrubAlert();
        return;
    }
    seekPlayerTo(seconds);
}

// RESUME LEARNING BANNER
function renderResumeLearningBanner() {
    const container = document.getElementById('resume-learning-container');
    if (!container) return;

    reloadCoursesCatalog();
    const activeCourse = currentSelectedCourse || coursesCatalog[0];
    if (!activeCourse) {
        container.style.display = 'none';
        return;
    }

    const prog = getStudentProgress(activeCourse.id);
    const lastActive = prog.lastActive || { modNum: 1, lessonNum: 1 };
    const percent = calculateCourseProgressPercent(activeCourse.id);

    if (percent === 0 && (!prog.completedLessons || prog.completedLessons.length === 0)) {
        container.style.display = 'none';
        return;
    }

    const mod = (activeCourse.modules || []).find(m => m.id === lastActive.modNum) || (activeCourse.modules || [])[0];
    const les = (mod && mod.lessons) ? (mod.lessons.find(l => l.id === lastActive.lessonNum) || mod.lessons[0]) : null;
    const lessonTitle = les ? les.title : `Module ${lastActive.modNum}`;

    container.style.display = 'block';
    container.innerHTML = `
        <div class="resume-learning-card">
            <div>
                <span class="badge-gold" style="font-size:0.7rem; padding:2px 8px; border-radius:10px; font-weight:800; display:inline-block; margin-bottom:4px;">
                    <i class="bi bi-arrow-repeat"></i> HỌC TIẾP ĐIỂM DỪNG
                </span>
                <div class="resume-title">${activeCourse.title}</div>
                <div class="resume-desc">Đang dừng tại: <strong>${lessonTitle}</strong> • Đã hoàn thành <strong>${percent}%</strong></div>
            </div>
            <button class="btn animated-shine-btn" style="background:#ffffff; color:var(--primary); font-weight:800; padding:10px 20px; border:none; border-radius:8px; cursor:pointer; flex-shrink:0;" onclick="enterCourseLesson('${activeCourse.id}', ${lastActive.modNum}, ${lastActive.lessonNum})">
                <span>Tiếp Tục Học Ngay <i class="bi bi-play-circle-fill"></i></span>
            </button>
        </div>
    `;
}

// STRICT COURSE COMPLETION ENGINE (100% OF ALL MODULES & ALL QUIZZES REQUIRED)
function isCourseFullyCompleted(courseId) {
    reloadCoursesCatalog();
    const course = coursesCatalog.find(c => c.id === courseId) || coursesCatalog[0];
    if (!course || !course.modules || course.modules.length === 0) return false;

    const prog = getStudentProgress(courseId);

    // Every module in the entire course must have all lessons completed AND quiz passed
    for (const mod of course.modules) {
        // 1. Must pass this module's quiz (score >= 80%)
        if (!prog.passedQuizzes.includes(`m${mod.id}`)) {
            return false;
        }

        // 2. Must complete all lessons in this module
        const lessons = mod.lessons || [];
        const count = lessons.length > 0 ? lessons.length : ((mod.meta && mod.meta.videos) ? parseInt(mod.meta.videos) : 2);
        for (let i = 1; i <= count; i++) {
            if (!prog.completedLessons.includes(`m${mod.id}_l${i}`)) {
                return false;
            }
        }
    }

    return true;
}

// CERTIFICATE GENERATOR & MODAL (TRIGGERED ONLY WHEN 100% OF ENTIRE COURSE IS COMPLETED)
function checkCourseCompletion(courseId) {
    reloadCoursesCatalog();
    const course = coursesCatalog.find(c => c.id === courseId) || coursesCatalog[0];
    if (!course) return;

    const prog = getStudentProgress(courseId);
    const isCompleted = isCourseFullyCompleted(courseId);

    if (isCompleted && !prog.certificateEarned) {
        prog.certificateEarned = true;
        prog.earnedDate = new Date().toLocaleDateString('vi-VN');
        saveStudentProgress(courseId, prog);
        alert(`CHÚC MỪNG BẠN ĐÃ TỐT NGHIỆP TOÀN BỘ KHÓA HỌC!\n\nBạn đã hoàn thành xuất sắc toàn bộ ${course.modules.length} Module bài học và vượt qua tất cả các bài kiểm tra của:\n"${course.title}"\n\nHội Đồng Đào Tạo Queen Land Academy trân trọng trao Chứng Chỉ Tốt Nghiệp Khóa Học cho bạn!`);
        showCertificateModal(courseId);
    }
}

function showCertificateModal(courseId) {
    const container = document.getElementById('certificate-modal-container');
    if (!container) return;

    reloadCoursesCatalog();
    const course = coursesCatalog.find(c => c.id === courseId) || coursesCatalog[0];
    const user = currentUser || { name: 'Nguyễn Văn An', empId: 'NV-10892', team: 'Phòng KD 101', div: 'Khối Kinh Doanh 1' };
    const certCode = 'QLA-CERT-' + Math.floor(100000 + Math.random() * 900000);
    const issueDate = new Date().toLocaleDateString('vi-VN');

    container.style.display = 'block';
    container.innerHTML = `
    <div class="certificate-modal-backdrop" onclick="closeCertificateModal(event)">
        <div class="certificate-frame" onclick="event.stopPropagation()">
            <div style="position:absolute; top:12px; right:16px; cursor:pointer;" onclick="closeCertificateModal()">
                <i class="bi bi-x-circle-fill" style="font-size:1.5rem; color:#94a3b8;"></i>
            </div>
            
            <div class="certificate-header-logo">
                <i class="bi bi-award-fill" style="color:#d97706;"></i> QUEEN LAND ACADEMY
            </div>
            <div style="font-size:0.75rem; color:#64748b; letter-spacing:0.1em; text-transform:uppercase;">Hệ Thống Đào Tạo Doanh Nghiệp Chuẩn Quốc Tế</div>

            <div class="certificate-title">CHỨNG NHẬN HOÀN THÀNH KHÓA HỌC</div>
            <div style="font-size:0.85rem; color:#475569; margin-bottom:16px;">Ban Đào Tạo & Phát Triển Nguồn Nhân Lực chứng nhận học viên:</div>

            <h2 style="font-family:var(--font-label); font-size:1.6rem; color:var(--primary); font-weight:900; margin-bottom:4px;">${user.name}</h2>
            <div style="font-size:0.82rem; font-weight:700; color:#047857; margin-bottom:12px;">MÃ NHÂN VIÊN: ${user.empId} • ${user.team} (${user.div})</div>

            <p style="font-size:0.85rem; color:#334155; line-height:1.5; max-width:480px; margin:0 auto 16px;">
                Đã hoàn thành xuất sắc 100% thời lượng video bài giảng và vượt qua toàn bộ các bài kiểm tra đánh giá chất lượng của chương trình:
            </p>

            <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:10px 16px; font-weight:800; color:var(--primary); font-size:0.95rem; margin-bottom:16px;">
                ${course.title}
            </div>

            <div style="display:flex; justify-content:space-between; align-items:flex-end; padding:0 20px; font-size:0.75rem; color:#64748b; margin-top:20px;">
                <div style="text-align:left;">
                    <div>Mã tra cứu: <strong>${certCode}</strong></div>
                    <div>Ngày cấp: <strong>${issueDate}</strong></div>
                </div>
                <div style="text-align:center;">
                    <div style="font-family:cursive; font-size:1.1rem; color:#0f172a;">Queen Land Academy</div>
                    <div style="border-top:1px solid #94a3b8; padding-top:2px; font-weight:700;">HỘI ĐỒNG ĐÀO TẠO</div>
                </div>
            </div>

            <div style="margin-top:24px; display:flex; justify-content:center; gap:12px;">
                <button class="btn btn-primary" onclick="window.print()" style="font-size:0.82rem; padding:8px 16px;">
                    <i class="bi bi-printer-fill"></i> In Chứng Nhận
                </button>
                <button class="btn btn-secondary" onclick="closeCertificateModal()" style="font-size:0.82rem; padding:8px 16px;">
                    Đóng
                </button>
            </div>
        </div>
    </div>
    `;
}

function closeCertificateModal() {
    const container = document.getElementById('certificate-modal-container');
    if (container) container.style.display = 'none';
}

// Switch Content Tabs Below Video
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    const activePane = document.getElementById(`tab-${tabId}`);
    if (activePane) activePane.classList.add('active');

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// QUIZ GATE SUBMISSION & MODULE UNLOCK
function submitQuiz(event) {
    event.preventDefault();
    if (!currentSelectedCourse) return;

    const prog = getStudentProgress(currentSelectedCourse.id);
    const quizKey = `m${currentActiveModNum}`;

    if (!prog.passedQuizzes.includes(quizKey)) {
        prog.passedQuizzes.push(quizKey);
        saveStudentProgress(currentSelectedCourse.id, prog);
    }

    const resultBox = document.getElementById('quiz-result');
    if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.style.background = '#d1fae5';
        resultBox.style.color = '#065f46';
        resultBox.style.padding = '14px';
        resultBox.style.borderRadius = '8px';
        resultBox.style.marginTop = '12px';
        resultBox.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <i class="bi bi-patch-check-fill" style="font-size:1.2rem; color:#047857;"></i>
                <strong>KẾT QUẢ ĐẠT CHUẨN: 100/100 ĐIỂM (ĐẠT YÊU CẦU)!</strong>
            </div>
            <p style="margin:0; font-size:0.82rem;">Chúc mừng bạn đã vượt qua bài kiểm tra đánh giá Module ${currentActiveModNum}. Module tiếp theo đã được mở khóa!</p>
        `;
    }

    // Re-render sidebar and modules grid to reflect unlocked module
    renderClassroomSidebar(currentSelectedCourse, currentActiveModNum, currentActiveLessonNum);

    const nextModNum = currentActiveModNum + 1;
    const nextMod = (currentSelectedCourse.modules || []).find(m => m.id === nextModNum);
    if (nextMod) {
        alert(`CHÚC MỪNG BẠN ĐÃ VƯỢT QUA BÀI TEST MODULE ${currentActiveModNum}!\n\nModule ${nextModNum} (${nextMod.title}) đã được mở khóa. Bạn có thể bấm tiếp tục học!`);
    } else {
        if (isCourseFullyCompleted(currentSelectedCourse.id)) {
            checkCourseCompletion(currentSelectedCourse.id);
        } else {
            alert(`CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH BÀI TEST MODULE ${currentActiveModNum}!\n\nĐể nhận Chứng Chỉ Tốt Nghiệp Khóa Học, vui lòng hoàn thành tất cả các bài học và bài kiểm tra còn lại trong chương trình.`);
        }
    }
}

/* ==========================================================================
   2-TIER CURRICULUM ARCHITECTURE: CHƯƠNG TRÌNH HỌC ➔ MODULE BÀI HỌC
   ========================================================================== */

const defaultCoursesCatalog = [
    {
        id: 'c1',
        title: 'Khóa 1: Quy Trình Tư Vấn Căn Hộ Đô Thị 2026',
        category: 'Căn Hộ Đô Thị',
        access: 'DIV1',
        desc: 'Lộ trình đào tạo chuẩn kỹ năng tư vấn, tiếp cận khách hàng cao cấp, phân tích bảng giá và kịch bản chốt hợp đồng căn hộ thương mại.',
        stats: { modules: 4, videos: 18, duration: '4 Giờ Học', materials: 4 },
        progress: 35,
        instructor: 'Ban Đào Tạo Queen Land',
        modules: [
            {
                id: 1,
                title: 'Tổng Quan & Định Hướng Kiến Thức Nền Tảng',
                desc: 'Giới thiệu tổng quan hệ thống dự án căn hộ cao cấp, mục tiêu đào tạo và các khái niệm cốt lõi ban đầu.',
                status: 'completed',
                statusText: 'Đã Hoàn Thành',
                meta: { videos: 4, duration: '45 Phút', docs: '2 Tài Liệu' },
                buttonText: 'Xem Lại Module 1',
                buttonClass: 'btn-module',
                lessonId: 1
            },
            {
                id: 2,
                title: 'Quy Trình & Kỹ Thuật Thực Hành Chuyên Sâu',
                desc: 'Hướng dẫn từng bước thao tác thực tế qua bài giảng video chi tiết kèm ví dụ minh họa và xử lý phản đối từ khách hàng.',
                status: 'in-progress',
                statusText: 'Đang Học (Bài 2/3)',
                meta: { videos: 6, duration: '90 Phút', docs: '1 Bài Quiz' },
                buttonText: 'Tiếp Tục Học Ngay',
                buttonClass: 'btn-module primary',
                lessonId: 2
            },
            {
                id: 3,
                title: 'Tối Ưu Hóa & Đánh Giá Năng Lực Sales',
                desc: 'Phân tích chuyên sâu các case study thực tế, kịch bản chốt cọc và phương pháp nâng cao hiệu suất làm việc.',
                status: 'locked',
                statusText: 'Chưa Mở Khóa',
                meta: { videos: 5, duration: '60 Phút', docs: '1 Bài Test' },
                buttonText: 'Chưa Mở Khóa',
                buttonClass: 'btn-module disabled',
                lessonId: 3
            },
            {
                id: 4,
                title: 'Bài Thu Hoạch Tổng Hợp & Đánh Giá Tốt Nghiệp Khóa Học',
                desc: 'Thực hiện bài thu hoạch thực tế và bài kiểm tra tổng hợp cuối khóa để hoàn tất điều kiện tốt nghiệp toàn khóa học.',
                status: 'locked',
                statusText: 'Chưa Mở Khóa',
                meta: { videos: 3, duration: '120 Phút', docs: 'Bài Thu Hoạch Cuối Khóa' },
                buttonText: 'Chưa Mở Khóa',
                buttonClass: 'btn-module disabled',
                lessonId: 4
            }
        ]
    },
    {
        id: 'c2',
        title: 'Khóa 2: Phân Tích Dòng Tiền & Pháp Lý Biệt Thự Biển Hạ Long',
        category: 'Nghỉ Dưỡng Cao Cấp',
        access: 'DIV2',
        desc: 'Phân tích chuyên sâu bảng tính ROI dòng tiền, bài toán đòn bẩy tài chính ngân hàng và kỹ năng tư vấn khách hàng VIP biệt thự nghỉ dưỡng.',
        stats: { modules: 3, videos: 12, duration: '3.5 Giờ Học', materials: 3 },
        progress: 0,
        instructor: 'Chuyên Gia Tài Chính Queen Land',
        modules: [
            {
                id: 1,
                title: 'Tổng Quan Thị Trường Nghỉ Dưỡng & Quy Hoạch Hạ Long 2026',
                desc: 'Nắm vững quy hoạch tổng thể, tiềm năng tăng giá bất động sản ven biển và hồ sơ pháp lý sở hữu.',
                status: 'in-progress',
                statusText: 'Bắt Đầu Học',
                meta: { videos: 4, duration: '50 Phút', docs: '2 Bản Đồ QH' },
                buttonText: 'Vào Học Module 1',
                buttonClass: 'btn-module primary',
                lessonId: 1
            },
            {
                id: 2,
                title: 'Phân Tích Bảng Tính Dòng Tiền ROI & Đòn Bẩy Ngân Hàng',
                desc: 'Thực hành tính toán lợi suất cho thuê, dòng tiền thực nhận và phương án tài chính tối ưu cho nhà đầu tư.',
                status: 'locked',
                statusText: 'Chưa Mở Khóa',
                meta: { videos: 5, duration: '75 Phút', docs: '1 Bài Quiz' },
                buttonText: 'Chưa Mở Khóa',
                buttonClass: 'btn-module disabled',
                lessonId: 2
            },
            {
                id: 3,
                title: 'Kỹ Thuật Xử Lý Từ Chối & Kịch Bản Chốt Cọc Biệt Thự Triệu Đô',
                desc: 'Các tình huống thực chiến với khách hàng thượng lưu và kỹ năng giải tỏa băn khoăn về tiến độ dự án.',
                status: 'locked',
                statusText: 'Chưa Mở Khóa',
                meta: { videos: 3, duration: '60 Phút', docs: '1 Bài Test' },
                buttonText: 'Chưa Mở Khóa',
                buttonClass: 'btn-module disabled',
                lessonId: 3
            }
        ]
    },
    {
        id: 'c3',
        title: 'Khóa 3: Kỹ Năng Đàm Phán & Chốt Cọc Bất Động Sản Đỉnh Cao',
        category: 'Kỹ Năng Thực Chiến',
        access: 'PUBLIC',
        desc: 'Nghệ thuật xử lý phản đối, đọc vị tâm lý khách hàng đầu tư bất động sản và kỹ thuật đàm phán chốt hợp đồng trong 24h.',
        stats: { modules: 3, videos: 10, duration: '3 Giờ Học', materials: 2 },
        progress: 15,
        instructor: 'Giám Đốc Đào Tạo Queen Land',
        modules: [
            {
                id: 1,
                title: 'Tâm Lý Học Khách Hàng Đầu Tư Bất Động Sản',
                desc: 'Phân loại các nhóm tính cách nhà đầu tư và cách xây dựng niềm tin cá nhân ngay trong 5 phút đầu.',
                status: 'completed',
                statusText: 'Đã Hoàn Thành',
                meta: { videos: 3, duration: '40 Phút', docs: '1 Tài Liệu' },
                buttonText: 'Xem Lại Module 1',
                buttonClass: 'btn-module',
                lessonId: 1
            },
            {
                id: 2,
                title: 'Kỹ Thuật Đặt Câu Hỏi Điều Hướng & Đàm Phán Giá',
                desc: 'Nghệ thuật dẫn dắt cuộc trò chuyện từ băn khoăn về giá sang giá trị độc bản của bất động sản.',
                status: 'in-progress',
                statusText: 'Đang Học (Bài 1/3)',
                meta: { videos: 4, duration: '60 Phút', docs: '1 Bài Quiz' },
                buttonText: 'Tiếp Tục Học Ngay',
                buttonClass: 'btn-module primary',
                lessonId: 2
            },
            {
                id: 3,
                title: 'Kịch Bản Chốt Cọc Thực Chiến & Xử Lý Do Dự',
                desc: 'Kỹ thuật tạo sự khan hiếm tự nhiên và kịch bản chốt cọc thành công ngay tại bàn tư vấn.',
                status: 'locked',
                statusText: 'Chưa Mở Khóa',
                meta: { videos: 3, duration: '50 Phút', docs: '1 Bài Test' },
                buttonText: 'Chưa Mở Khóa',
                buttonClass: 'btn-module disabled',
                lessonId: 3
            }
        ]
    },
    {
        id: 'c4',
        title: 'Khóa 4: Pháp Lý Bất Động Sản & Thẩm Định Quy Hoạch Dự Án',
        category: 'Pháp Lý Dự Án',
        access: 'DIV3',
        desc: 'Nắm vững luật kinh doanh BĐS mới nhất, quy trình kiểm tra quy hoạch 1/500, hồ sơ pháp lý dự án và các điều khoản hợp đồng mua bán.',
        stats: { modules: 2, videos: 8, duration: '2.5 Giờ Học', materials: 4 },
        progress: 0,
        instructor: 'Phòng Pháp Chế Queen Land',
        modules: [
            {
                id: 1,
                title: 'Bộ Luật Đất Đai & Pháp Lý Dự Án Bất Động Sản 2026',
                desc: 'Cập nhật những điểm mới của luật đất đai và quy định về điều kiện mở bán nhà ở hình thành trong tương lai.',
                status: 'in-progress',
                statusText: 'Bắt Đầu Học',
                meta: { videos: 4, duration: '60 Phút', docs: '4 Văn Bản Luật' },
                buttonText: 'Vào Học Module 1',
                buttonClass: 'btn-module primary',
                lessonId: 1
            },
            {
                id: 2,
                title: 'Kỹ Năng Đọc Bản Đồ Quy Hoạch & Hướng Dẫn Ký HĐMB',
                desc: 'Thực hành tra cứu quy hoạch trên cổng thông tin địa chính và giải thích các điều khoản HĐMB cho khách hàng.',
                status: 'locked',
                statusText: 'Chưa Mở Khóa',
                meta: { videos: 4, duration: '65 Phút', docs: '1 Bài Quiz' },
                buttonText: 'Chưa Mở Khóa',
                buttonClass: 'btn-module disabled',
                lessonId: 2
            }
        ]
    }
];

let coursesCatalog = defaultCoursesCatalog;
let currentSelectedCourse = null;

// RELOAD COURSES CATALOG FROM LOCALSTORAGE SAFELY
function reloadCoursesCatalog() {
    try {
        const stored = localStorage.getItem('lms_courses_catalog') || localStorage.getItem('lms_courses_list');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Auto-migrate legacy titles to eliminate confusion
                parsed.forEach(c => {
                    (c.modules || []).forEach(m => {
                        if (m.title && m.title.includes('Cấp Chứng Nhận')) {
                            m.title = m.title.replace('Cấp Chứng Nhận', 'Đánh Giá Tốt Nghiệp Khóa Học');
                        }
                        if (m.meta && m.meta.docs === 'Cấp Chứng Nhận') {
                            m.meta.docs = 'Bài Thu Hoạch Cuối Khóa';
                        }
                    });
                });
                coursesCatalog = parsed;
                return;
            }
        }
    } catch (e) {
        console.error("Lỗi đọc lms_courses_catalog:", e);
    }
    coursesCatalog = defaultCoursesCatalog;
    try {
        localStorage.setItem('lms_courses_catalog', JSON.stringify(defaultCoursesCatalog));
        localStorage.setItem('lms_courses_list', JSON.stringify(defaultCoursesCatalog));
    } catch (e) {}
}

// Initial load
reloadCoursesCatalog();

// SEARCH & FILTER STATE FOR COURSES
let currentCourseSearchKeyword = '';

function handleCourseSearch(val) {
    currentCourseSearchKeyword = (val || '').trim().toLowerCase();
    const clearBtn = document.getElementById('btn-clear-course-search');
    if (clearBtn) clearBtn.style.display = currentCourseSearchKeyword ? 'flex' : 'none';
    const activeDiv = document.getElementById('student-div-select')?.value || 'ALL';
    renderStudentCoursesCatalog(activeDiv, currentCourseSearchKeyword);
}

function clearCourseSearch() {
    const input = document.getElementById('course-search-input');
    if (input) input.value = '';
    handleCourseSearch('');
}

// RENDER LEVEL 1: CHƯƠNG TRÌNH HỌC (COURSES CATALOG)
function renderStudentCoursesCatalog(filterDiv, searchKeyword) {
    const container = document.getElementById('student-courses-catalog-grid');
    if (!container) return;

    // Render resume learning card if student has active course
    renderResumeLearningBanner();

    // Always fetch freshest data
    reloadCoursesCatalog();

    const kw = (typeof searchKeyword === 'string' ? searchKeyword : (typeof filterDiv === 'string' && filterDiv !== 'ALL' && !filterDiv.startsWith('DIV') ? filterDiv : currentCourseSearchKeyword)).toLowerCase();

    // Filter courses simply by search keyword (all courses accessible to all learners)
    const filteredCourses = coursesCatalog.filter(c => {
        if (!kw) return true;
        const titleMatch = (c.title || '').toLowerCase().includes(kw);
        const descMatch = (c.desc || c.rawDesc || '').toLowerCase().includes(kw);
        const catMatch = (c.category || c.cat || '').toLowerCase().includes(kw);
        return titleMatch || descMatch || catMatch;
    });

    const countBadge = document.getElementById('catalog-count-badge');
    if (countBadge) {
        countBadge.innerHTML = `<i class="bi bi-collection-play-fill"></i> ${filteredCourses.length} Khóa Học Đào Tạo`;
    }

    if (filteredCourses.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1;">
                <div style="font-size: 2rem; color: #94a3b8; margin-bottom: 8px;"><i class="bi bi-search"></i></div>
                <h4 style="font-size: 1rem; color: #1e293b; margin-bottom: 8px;">Không tìm thấy khóa học nào khớp với từ khóa "${kw}"</h4>
                <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">Vui lòng thử tìm kiếm bằng từ khóa khác hoặc xóa ô tìm kiếm.</p>
                <button class="btn btn-secondary" onclick="clearCourseSearch()"><i class="bi bi-x-circle"></i> Xóa Tìm Kiếm</button>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredCourses.map(course => {
        const category = course.category || course.cat || 'Chuyên Đề';
        const stats = course.stats || {
            modules: (course.modules && course.modules.length) ? course.modules.length : 1,
            videos: (course.modules && course.modules.length) ? course.modules.length : 2,
            duration: '1 Giờ Học',
            materials: 1
        };
        const desc = course.desc || course.rawDesc || 'Lộ trình đào tạo chuẩn kỹ năng cho nhân sự Sales Queen Land.';
        const progress = calculateCourseProgressPercent(course.id);
        const prog = getStudentProgress(course.id);
        const hasCert = prog.certificateEarned;

        return `
        <div class="course-program-card card-premium">
            <div class="course-card-top">
                <span class="course-category-badge badge-gold">${category}</span>
                ${hasCert ? '<span class="status-badge success" style="margin-left:auto;"><i class="bi bi-award-fill" style="color:#d97706;"></i> Đã Nhận Chứng Chỉ</span>' : ''}
            </div>
            <h3>${course.title}</h3>
            <p class="course-desc">${desc}</p>
            
            <div class="course-stats-pills">
                <span class="course-stat-pill"><i class="bi bi-collection"></i> ${stats.modules} Module</span>
                <span class="course-stat-pill"><i class="bi bi-play-circle"></i> ${stats.videos} Video</span>
                <span class="course-stat-pill"><i class="bi bi-clock"></i> ${stats.duration}</span>
                <span class="course-stat-pill"><i class="bi bi-file-earmark-text"></i> ${stats.materials} Tài Liệu</span>
            </div>

            <div class="course-progress-mini">
                <div class="p-bar-label">
                    <span>Tiến độ học tập</span>
                    <strong>${progress}%</strong>
                </div>
                <div class="p-bar-track">
                    <div class="p-bar-fill" style="width: ${progress}%;"></div>
                </div>
            </div>

            <div style="display:flex; gap:8px; margin-top:12px;">
                <button class="btn-view-course-modules animated-shine-btn" style="flex:1;" onclick="openCourseModules('${course.id}')">
                    <span>Xem Các Module Bài Học <i class="bi bi-arrow-right"></i></span>
                </button>
                ${hasCert ? `
                    <button class="btn btn-secondary animated-shine-btn" style="background:#fef3c7; color:#92400e; border-color:#fde68a; font-weight:800; padding:8px 12px; font-size:0.75rem;" onclick="event.stopPropagation(); showCertificateModal('${course.id}')" title="Xem chứng chỉ tốt nghiệp khóa học">
                        <i class="bi bi-award-fill"></i> Chứng Chỉ
                    </button>
                ` : ''}
            </div>
        </div>
        `;
    }).join('');
}

// LEVEL 2: DRILL-DOWN INTO MODULES OF SELECTED COURSE
function openCourseModules(courseId, push = true) {
    reloadCoursesCatalog();
    const course = coursesCatalog.find(c => c.id === courseId) || coursesCatalog[0];
    currentSelectedCourse = course;

    const coursesView = document.getElementById('curriculum-courses-view');
    const modulesView = document.getElementById('curriculum-modules-view');
    const banner = document.getElementById('selected-course-banner');
    const modulesGrid = document.getElementById('student-modules-grid');
    const courseTitleEl = document.getElementById('modules-view-course-title');

    if (coursesView) coursesView.style.display = 'none';
    if (modulesView) modulesView.style.display = 'block';

    if (courseTitleEl) {
        courseTitleEl.textContent = `Các Module Đào Tạo: ${course.title}`;
    }

    const category = course.category || course.cat || 'Chuyên Đề';
    const desc = course.desc || course.rawDesc || 'Lộ trình đào tạo chuẩn kỹ năng cho nhân sự Sales Queen Land.';
    const instructor = course.instructor || 'Ban Đào Tạo Queen Land';
    const progress = typeof course.progress === 'number' ? course.progress : 0;
    const stats = course.stats || {
        modules: (course.modules && course.modules.length) ? course.modules.length : 1,
        videos: (course.modules && course.modules.length) ? course.modules.length : 2,
        duration: '1 Giờ Học',
        materials: 1
    };

    const modulesList = (course.modules && Array.isArray(course.modules) && course.modules.length > 0)
        ? course.modules
        : [
            {
                id: 1,
                title: 'Tổng Quan & Định Hướng Kiến Thức Nền Tảng',
                desc: desc,
                status: 'in-progress',
                statusText: 'Bắt Đầu Học',
                meta: { videos: 2, duration: '45 Phút', docs: '1 Tài Liệu' },
                buttonText: 'Vào Học Module 1',
                buttonClass: 'btn-module primary',
                lessonId: 1
            }
        ];

    // Render Banner
    if (banner) {
        const prog = getStudentProgress(course.id);
        const hasCert = prog.certificateEarned;
        banner.innerHTML = `
            <div>
                <span class="badge-gold" style="font-size:0.75rem; padding:4px 12px; border-radius:20px; font-weight:700; display:inline-block; margin-bottom:8px;">${category}</span>
                <h2 style="margin-top:4px; font-family: var(--font-label); font-weight:800; color: #ffffff;">${course.title}</h2>
                <p style="color: rgba(255,255,255,0.85); font-size: 0.95rem; line-height: 1.5; margin: 8px 0 16px;">${desc}</p>
                <div class="banner-meta-row" style="display:flex; flex-wrap:wrap; gap:16px; font-size:0.85rem; color: rgba(255,255,255,0.9);">
                    <span><i class="bi bi-person-badge"></i> Giảng viên: <strong>${instructor}</strong></span>
                    <span><i class="bi bi-collection"></i> <strong>${stats.modules} Module</strong></span>
                    <span><i class="bi bi-play-circle"></i> <strong>${stats.videos} Video</strong></span>
                    <span><i class="bi bi-clock"></i> <strong>${stats.duration}</strong></span>
                    <span><i class="bi bi-graph-up-arrow"></i> Tiến độ: <strong>${progress}%</strong></span>
                    ${hasCert ? '<span style="color:var(--accent); font-weight:800;"><i class="bi bi-award-fill"></i> Đã Tốt Nghiệp Khóa Học</span>' : ''}
                </div>
            </div>
            <div style="flex-shrink:0; text-align:right; display:flex; flex-direction:column; gap:8px;">
                <button class="btn animated-shine-btn" style="background:#ffffff; color:var(--primary); font-weight:800; padding:12px 24px; border:none; border-radius:8px; cursor:pointer;" onclick="enterCourseLesson('${course.id}', 1, 1)">
                    <span>Vào Học Ngay <i class="bi bi-arrow-right"></i></span>
                </button>
                ${hasCert ? `
                    <button class="btn animated-shine-btn" style="background:var(--accent); color:var(--primary); font-weight:800; padding:10px 18px; border:none; border-radius:8px; cursor:pointer;" onclick="showCertificateModal('${course.id}')">
                        <i class="bi bi-award-fill" style="color:#d97706;"></i> <span>Xem Chứng Chỉ Tốt Nghiệp</span>
                    </button>
                ` : `
                    <span style="font-size:0.72rem; color:rgba(255,255,255,0.75);"><i class="bi bi-info-circle"></i> Cấp chứng chỉ sau khi hoàn thành toàn bộ khóa</span>
                `}
            </div>
        `;
    }

    // Render Modules with detailed lessons list
    if (modulesGrid) {
        const prog = getStudentProgress(course.id);
        modulesGrid.innerHTML = modulesList.map(mod => {
            // Use real unlocked state from getStudentProgress
            const isModUnlocked = isModuleUnlocked(course, mod.id);
            const isModPassed = prog.passedQuizzes.includes(`m${mod.id}`);
            
            let statusBadgeClass = 'locked';
            let statusIcon = '<i class="bi bi-lock-fill"></i>';
            let statusText = 'Chưa Mở Khóa';
            if (isModPassed) {
                statusBadgeClass = 'success';
                statusIcon = '<i class="bi bi-check-circle-fill"></i>';
                statusText = 'Đã Hoàn Thành';
            } else if (isModUnlocked) {
                statusBadgeClass = 'warning';
                statusIcon = '<i class="bi bi-play-circle-fill"></i>';
                statusText = 'Đang Học';
            }

            const meta = mod.meta || { videos: 2, duration: '30 Phút', docs: '1 Tài Liệu' };

            // Ensure lessons list exists
            let lessons = mod.lessons;
            if (!lessons || !Array.isArray(lessons) || lessons.length === 0) {
                const count = (mod.meta && mod.meta.videos) ? parseInt(mod.meta.videos) : 2;
                lessons = [];
                for (let i = 1; i <= count; i++) {
                    lessons.push({
                        id: i,
                        title: `Bài ${mod.id}.${i}: ${mod.title} - Phần ${i}`,
                        duration: i === 1 ? '12:00' : (i === 2 ? '15:30' : '18:45'),
                        youtubeUrl: mod.youtubeUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        status: 'locked'
                    });
                }
                mod.lessons = lessons;
            }

            // Render lessons items with real unlock check
            const lessonsHtml = lessons.map(les => {
                const lessonKey = `m${mod.id}_l${les.id}`;
                const isDone = prog.completedLessons.includes(lessonKey);
                const isUnlocked = isLessonUnlocked(course, mod.id, les.id);
                const icon = isDone 
                    ? '<i class="bi bi-check-circle-fill text-success"></i>' 
                    : (!isUnlocked ? '<i class="bi bi-lock-fill text-muted"></i>' : '<i class="bi bi-play-circle-fill text-primary"></i>');

                return `
                <div class="module-lesson-item ${!isUnlocked ? 'locked-item' : ''}">
                    <div class="lesson-main-info">
                        <span class="lesson-icon">${icon}</span>
                        <span class="lesson-title-text" title="${les.title}"><strong>Bài ${mod.id}.${les.id}:</strong> ${les.title.replace(/^Bài \d+\.\d+:?\s*/, '')}</span>
                    </div>
                    <div class="lesson-badges-group">
                        <span class="lesson-duration" style="font-size:0.7rem; color:#64748b;"><i class="bi bi-clock"></i> ${les.duration || '15:00'}</span>
                        <button class="btn-play-lesson" ${!isUnlocked ? 'disabled' : ''} onclick="enterCourseLesson('${course.id}', ${mod.id}, ${les.id})" title="${!isUnlocked ? 'Hoàn thành bài trước để mở khóa' : 'Vào xem bài giảng này'}">
                            <i class="bi bi-play-fill"></i> <span>${isDone ? 'Xem lại' : 'Học bài này'}</span>
                        </button>
                    </div>
                </div>
                `;
            }).join('');

            return `
            <div class="module-card card-premium ${!isModUnlocked ? 'locked' : ''}">
                <div class="module-status-badge ${statusBadgeClass}">${statusIcon} ${statusText}</div>
                <div class="module-header">
                    <span class="module-number">MODULE 0${mod.id}</span>
                    <h3>${mod.title}</h3>
                </div>
                <p class="module-desc">${mod.desc || 'Bài giảng lý thuyết & thực hành kèm video hướng dẫn chi tiết.'}</p>
                
                <div class="module-lessons-list">
                    <div class="module-lessons-header">
                        <span><i class="bi bi-collection-play"></i> DANH SÁCH BÀI GIẢNG VIDEO</span>
                        <span>${lessons.length} Bài</span>
                    </div>
                    ${lessonsHtml}
                </div>

                <div class="module-meta">
                    <span><i class="bi bi-play-circle"></i> ${meta.videos} Video</span>
                    <span><i class="bi bi-clock"></i> ${meta.duration}</span>
                    <span><i class="bi bi-file-earmark-text"></i> ${meta.docs}</span>
                </div>
                <button class="${isModUnlocked ? 'btn-module primary' : 'btn-module disabled'} animated-shine-btn" ${!isModUnlocked ? 'disabled' : ''} onclick="enterCourseLesson('${course.id}', ${mod.id}, 1)">
                    <span>${!isModUnlocked ? 'Module Đang Khóa' : (isModPassed ? 'Xem Lại Module ' + mod.id : 'Vào Học Module ' + mod.id)} <i class="bi bi-arrow-right"></i></span>
                </button>
            </div>
            `;
        }).join('');
    }

    // Scroll smoothly to modules view
    const curriculumEl = document.getElementById('curriculum');
    if (curriculumEl) {
        curriculumEl.scrollIntoView({ behavior: 'smooth' });
    }

    if (push) {
        try {
            history.pushState({ view: 'modules', courseId: course.id }, '', '#course-' + course.id);
        } catch (e) {}
    }
}

// BACK TO COURSE MODULES (FROM CLASSROOM PORTAL)
function backToCourseModules(push = true) {
    stopQuizTimer();
    switchView('landing', false);
    if (currentSelectedCourse) {
        openCourseModules(currentSelectedCourse.id, push);
    } else {
        backToCoursesList(push);
    }
}

// BACK TO LEVEL 1 (COURSES LIST)
function backToCoursesList(push = true) {
    stopQuizTimer();
    switchView('landing', false);
    const coursesView = document.getElementById('curriculum-courses-view');
    const modulesView = document.getElementById('curriculum-modules-view');

    if (modulesView) modulesView.style.display = 'none';
    if (coursesView) coursesView.style.display = 'block';

    const curriculumEl = document.getElementById('curriculum');
    if (curriculumEl) {
        curriculumEl.scrollIntoView({ behavior: 'smooth' });
    }

    if (push) {
        try {
            history.pushState({ view: 'catalog' }, '', '#catalog');
        } catch (e) {}
    }
}

// ENTER CLASSROOM VIDEO FOR SPECIFIC COURSE & MODULE
function enterCourseLesson(courseId, modNum, lessonNum, push = true) {
    switchView('portal', false);
    playCourseLesson(courseId, modNum, lessonNum || 1);
    if (push) {
        try {
            history.pushState({ view: 'portal', courseId: courseId, modNum: modNum, lessonNum: lessonNum || 1 }, '', `#lesson-${modNum}-${lessonNum || 1}`);
        } catch (e) {}
    }
}

// PLAY SPECIFIC LESSON INSIDE CLASSROOM
function playCourseLesson(courseId, modNum, lessonNum) {
    reloadCoursesCatalog();
    const course = coursesCatalog.find(c => c.id === courseId) || coursesCatalog[0];
    if (!course) return;

    currentSelectedCourse = course;
    currentActiveModNum = modNum;
    currentActiveLessonNum = lessonNum;

    // Save as last active in progress
    const prog = getStudentProgress(course.id);
    prog.lastActive = { modNum, lessonNum, time: 0 };
    saveStudentProgress(course.id, prog);

    // Ensure modules exist
    if (!course.modules || course.modules.length === 0) {
        course.modules = [
            {
                id: 1,
                title: course.title,
                status: 'in-progress',
                lessons: [
                    { id: 1, title: `Bài 1.1: Giới thiệu tổng quan`, duration: '15:00', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', status: 'in-progress' }
                ]
            }
        ];
    }

    const targetMod = course.modules.find(m => m.id === modNum) || course.modules[0];
    
    // Ensure lessons exist
    if (!targetMod.lessons || targetMod.lessons.length === 0) {
        const count = (targetMod.meta && targetMod.meta.videos) ? parseInt(targetMod.meta.videos) : 2;
        const defaultLessons = [];
        for (let i = 1; i <= (count || 2); i++) {
            defaultLessons.push({
                id: i,
                title: `Bài ${targetMod.id}.${i}: ${targetMod.title} - Phần ${i}`,
                duration: i === 1 ? '12:00' : '18:45',
                youtubeUrl: targetMod.youtubeUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                status: i === 1 ? 'in-progress' : 'locked'
            });
        }
        targetMod.lessons = defaultLessons;
    }

    const targetLesson = targetMod.lessons.find(l => l.id === lessonNum) || targetMod.lessons[0];

    // Update Topbar Title & Progress
    const topCourseTitle = document.getElementById('current-course-title');
    if (topCourseTitle) {
        topCourseTitle.textContent = `${course.title} - Module ${targetMod.id}`;
    }

    const newPercent = calculateCourseProgressPercent(course.id);
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    if (progressFill) progressFill.style.width = `${newPercent}%`;
    if (progressText) progressText.textContent = `${newPercent}% (${prog.completedLessons.length} Bài)`;

    // Update Video Title & Tag
    const videoTitle = document.getElementById('video-lesson-title');
    if (videoTitle && targetLesson) {
        videoTitle.textContent = targetLesson.title;
    }

    const playingTag = document.querySelector('.playing-tag');
    if (playingTag) {
        playingTag.textContent = `ĐANG PHÁT BÀI ${targetMod.id}.${targetLesson.id}`;
    }

    // Update btn-mark-complete state
    const isDone = prog.completedLessons.includes(`m${targetMod.id}_l${targetLesson.id}`);
    const minWatch = parseInt(localStorage.getItem('lms_min_watch_percent') || '80');
    const btnComplete = document.getElementById('btn-mark-complete');
    if (btnComplete) {
        if (isDone) {
            btnComplete.className = 'btn btn-complete finished';
            btnComplete.disabled = false;
            btnComplete.title = 'Bài học này đã được bạn hoàn thành xuất sắc';
            btnComplete.innerHTML = '<span><i class="bi bi-check2-all"></i> Đã Hoàn Thành</span>';
            btnComplete.style.background = '#059669';
        } else {
            btnComplete.className = 'btn btn-complete locked animated-shine-btn';
            btnComplete.disabled = true;
            btnComplete.title = `Cần xem tối thiểu ${minWatch}% thời lượng bài giảng để mở khóa hoàn thành`;
            btnComplete.innerHTML = `<span><i class="bi bi-lock-fill"></i> Đang học (0%/${minWatch}%)</span>`;
            btnComplete.style.background = '';
        }
    }

    // Update Prev / Next buttons
    const btnPrev = document.getElementById('btn-prev-lesson');
    if (btnPrev) {
        btnPrev.disabled = (modNum === 1 && lessonNum === 1);
    }

    // Embed Video: Unified Player Engine (YouTube IFrame API / HTML5 Video)
    if (targetLesson) {
        setupUnifiedVideoPlayer(targetLesson.youtubeUrl, targetLesson.title, course.id, targetMod.id, targetLesson.id);
    }

    // Render dynamic sidebar
    renderClassroomSidebar(course, targetMod.id, targetLesson.id);

    // Render Quiz Tab for this course
    renderClassroomQuizTab(course.id);

    // Render Interactive Discussion Forum for this lesson
    renderLessonDiscussions(course.id, targetMod.id, targetLesson.id);

    // Apply Real-time Admin Config (Gate Marker %, Watch Target %, Timer)
    applySystemConfig();
}

// SETUP UNIFIED VIDEO PLAYER (YOUTUBE IFRAME API & HTML5 VIDEO WITH ANTI-CHEAT)
function setupUnifiedVideoPlayer(url, title, courseId, modNum, lessonNum) {
    clearAutoAdvanceToast();
    if (playerTickerInterval) {
        clearInterval(playerTickerInterval);
        playerTickerInterval = null;
    }

    if (currentYTPlayer && typeof currentYTPlayer.destroy === 'function') {
        try {
            currentYTPlayer.destroy();
        } catch (e) {
            console.warn('Destroying previous YT player:', e);
        }
        currentYTPlayer = null;
    }

    videoDuration = 0;
    const prog = getStudentProgress(courseId);
    const lessonKey = `m${modNum}_l${lessonNum}`;
    const isDone = prog.completedLessons.includes(lessonKey);
    maxWatchedSeconds = isDone ? 999999 : 0;

    // Update overlay title & tags
    const overlayTitle = document.getElementById('video-overlay-lesson-name');
    if (overlayTitle) overlayTitle.textContent = title || `Bài ${modNum}.${lessonNum}`;

    const playingTag = document.getElementById('current-playing-mod-lesson-tag');
    if (playingTag) playingTag.textContent = `ĐANG PHÁT BÀI ${modNum}.${lessonNum}`;

    const videoTitle = document.getElementById('video-lesson-title');
    if (videoTitle) videoTitle.textContent = title || `Bài ${modNum}.${lessonNum}`;

    // Reset progress scrubber UI
    const curBar = document.getElementById('player-current-bar');
    const bufBar = document.getElementById('player-buffer-bar');
    if (curBar) curBar.style.width = '0%';
    if (bufBar) bufBar.style.width = isDone ? '100%' : '0%';

    const playBtn = document.getElementById('btn-player-play-pause');
    if (playBtn) playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';

    const mountPoint = document.getElementById('player-mount-point');
    if (!mountPoint) return;

    const ytMatch = (url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);

    if (ytMatch && ytMatch[1]) {
        currentVideoType = 'youtube';
        mountPoint.innerHTML = '<div id="yt-player-embed" style="width:100%; height:100%;"></div>';

        const initPlayer = () => {
            currentYTPlayer = new YT.Player('yt-player-embed', {
                videoId: ytMatch[1],
                width: '100%',
                height: '100%',
                playerVars: {
                    autoplay: 1,
                    controls: 0,        // HIDES NATIVE YOUTUBE CONTROLS (SCRUBBER, TIME, LOGO)
                    disablekb: 1,       // DISABLES KEYBOARD SEEKING
                    modestbranding: 1,  // MINIMIZES BRANDING
                    rel: 0,             // NO EXTERNAL RELATED VIDEOS
                    showinfo: 0,
                    iv_load_policy: 3,  // NO ANNOTATIONS
                    fs: 0,              // HIDE DEFAULT FULLSCREEN
                    playsinline: 1,
                    enablejsapi: 1,
                    origin: window.location.origin
                },
                events: {
                    onReady: (event) => {
                        try {
                            event.target.setPlaybackRate(currentPlaybackRate);
                        } catch (e) {}
                        if (playBtn) playBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
                        startPlayerTicker(courseId, modNum, lessonNum);
                    },
                    onStateChange: (event) => {
                        if (event.data === 1) { // Playing
                            if (playBtn) playBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
                        } else if (event.data === 2) { // Paused
                            if (playBtn) playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
                        } else if (event.data === 0) { // Ended
                            if (playBtn) playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
                            markLessonComplete(true);
                            showAutoAdvanceToast();
                        }
                    }
                }
            });
        };

        if (isYTReady && window.YT && window.YT.Player) {
            initPlayer();
        } else {
            pendingVideoInit = initPlayer;
        }
    } else {
        currentVideoType = 'html5';
        mountPoint.innerHTML = `
            <video id="lms-video" poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80" style="width:100%; height:100%; object-fit:cover;">
                <source src="${url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}" type="video/mp4">
                Trình duyệt của bạn không hỗ trợ thẻ video.
            </video>
        `;
        const video = document.getElementById('lms-video');
        if (video) {
            video.playbackRate = currentPlaybackRate;
            video.play().catch(() => {});
            if (playBtn) playBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
            video.addEventListener('ended', () => {
                markLessonComplete(true);
                showAutoAdvanceToast();
            });
            startPlayerTicker(courseId, modNum, lessonNum);
        }
    }
}

// RENDER DYNAMIC SIDEBAR ACCORDIONS IN CLASSROOM WITH SEQUENTIAL LOCKING
function renderClassroomSidebar(course, activeModNum, activeLessonNum) {
    const listContainer = document.querySelector('.sidebar-modules-list');
    if (!listContainer || !course) return;

    if (!course.modules || course.modules.length === 0) {
        listContainer.innerHTML = `
            <div style="padding:16px; font-size:0.8rem; color:#64748b; text-align:center;">
                Chưa có Module bài học nào.
            </div>
        `;
        return;
    }

    const prog = getStudentProgress(course.id);

    listContainer.innerHTML = course.modules.map(mod => {
        const isModActive = mod.id === activeModNum;
        const isModUnlocked = isModuleUnlocked(course, mod.id);
        const isModPassed = prog.passedQuizzes.includes(`m${mod.id}`);

        const modClass = isModPassed ? 'completed-mod' : (isModActive ? 'active-mod' : (!isModUnlocked ? 'locked-mod' : ''));
        const iconHtml = isModPassed 
            ? '<i class="bi bi-check-circle-fill" style="color:var(--secondary-brand);"></i>' 
            : (isModActive ? '<i class="bi bi-hourglass-split" style="color:var(--warning);"></i>' : (!isModUnlocked ? '<i class="bi bi-lock-fill text-muted"></i>' : '<i class="bi bi-play-circle-fill"></i>'));

        let lessons = mod.lessons;
        if (!lessons || !Array.isArray(lessons) || lessons.length === 0) {
            const count = (mod.meta && mod.meta.videos) ? parseInt(mod.meta.videos) : 2;
            lessons = [];
            for (let i = 1; i <= count; i++) {
                lessons.push({
                    id: i,
                    title: `Bài ${mod.id}.${i}: ${mod.title} - Phần ${i}`,
                    duration: '15:00',
                    youtubeUrl: mod.youtubeUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    status: 'locked'
                });
            }
            mod.lessons = lessons;
        }

        const lessonsHtml = lessons.map(les => {
            const isPlaying = (mod.id === activeModNum && les.id === activeLessonNum);
            const isDone = prog.completedLessons.includes(`m${mod.id}_l${les.id}`);
            const isUnlocked = isLessonUnlocked(course, mod.id, les.id);

            let lesClass = 'lesson-item';
            if (isPlaying) lesClass += ' playing';
            else if (isDone) lesClass += ' done';
            else if (!isUnlocked) lesClass += ' locked-item';

            const statusIcon = isDone 
                ? '<i class="bi bi-check2"></i>' 
                : (isPlaying ? '<i class="bi bi-play-fill"></i>' : (!isUnlocked ? '<i class="bi bi-lock"></i>' : '<i class="bi bi-circle"></i>'));

            const clickHandler = isUnlocked 
                ? `onclick="playCourseLesson('${course.id}', ${mod.id}, ${les.id})"` 
                : `onclick="alert('BÀI HỌC ĐANG KHÓA:\\nHọc viên cần hoàn thành bài học trước để mở khóa bài này!')" style="cursor:not-allowed;"`;

            return `
                <div class="${lesClass}" id="lesson-${mod.id}-${les.id}" ${clickHandler}>
                    <span class="status-icon">${statusIcon}</span>
                    <span class="lesson-name">${les.title}</span>
                    <span class="duration">${les.duration || '15:00'}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="accordion-item ${modClass}">
                <div class="accordion-header" onclick="${isModUnlocked ? `toggleAccordion('mod-accord-${mod.id}')` : `alert('MODULE ĐANG KHÓA:\\nHọc viên cần vượt qua bài kiểm tra Module trước để mở khóa!')`}">
                    <div class="mod-title">
                        <span class="mod-icon">${iconHtml}</span>
                        <span>Module ${mod.id}: ${mod.title}</span>
                    </div>
                    <span class="arrow"><i class="bi bi-chevron-${isModActive ? 'down' : 'right'}"></i></span>
                </div>
                <div class="accordion-body ${isModActive ? 'open' : ''}" id="mod-accord-${mod.id}">
                    ${lessonsHtml}
                </div>
            </div>
        `;
    }).join('');
}

// QUIZ COUNTDOWN TIMER STATE & FUNCTIONS
let quizTimerInterval = null;
let quizTimeSeconds = 600;
let totalQuizSeconds = 600;

function startQuizTimer(courseId) {
    stopQuizTimer();
    const quizMinutes = parseInt(localStorage.getItem('lms_quiz_time_minutes') || '10');
    totalQuizSeconds = quizMinutes * 60;
    quizTimeSeconds = totalQuizSeconds;
    updateQuizTimerDisplay();
    quizTimerInterval = setInterval(() => {
        quizTimeSeconds--;
        updateQuizTimerDisplay();
        if (quizTimeSeconds <= 0) {
            stopQuizTimer();
            alert(`HẾT THỜI GIAN LÀM BÀI (${quizMinutes} PHÚT)!\n\nHệ thống sẽ tự động tổng hợp câu trả lời và nộp bài kiểm tra trắc nghiệm của bạn.`);
            autoSubmitQuiz(courseId);
        }
    }, 1000);
}

function stopQuizTimer() {
    if (quizTimerInterval) {
        clearInterval(quizTimerInterval);
        quizTimerInterval = null;
    }
}

function updateQuizTimerDisplay() {
    const badge = document.getElementById('quiz-timer-badge');
    const display = document.getElementById('quiz-timer-display');
    const progBar = document.getElementById('quiz-timer-progress-bar');
    const stickyHeader = document.getElementById('quiz-sticky-header');

    if (!display) return;
    const mins = Math.floor(Math.max(0, quizTimeSeconds) / 60);
    const secs = Math.max(0, quizTimeSeconds) % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (progBar && totalQuizSeconds > 0) {
        const pct = Math.max(0, Math.min(100, (quizTimeSeconds / totalQuizSeconds) * 100));
        progBar.style.width = `${pct}%`;
    }

    if (quizTimeSeconds <= 120 && quizTimeSeconds > 0) {
        if (badge) badge.classList.add('urgent');
        if (stickyHeader) stickyHeader.classList.add('urgent');
    } else {
        if (badge) badge.classList.remove('urgent');
        if (stickyHeader) stickyHeader.classList.remove('urgent');
    }
}

function autoSubmitQuiz(courseId) {
    const fakeEvent = { preventDefault: () => {} };
    submitDynamicQuiz(fakeEvent, courseId);
}

// RENDER DYNAMIC QUIZ TAB IN CLASSROOM
function renderClassroomQuizTab(courseId) {
    const quizPane = document.getElementById('tab-quiz');
    if (!quizPane) return;

    let quizzes = JSON.parse(localStorage.getItem('lms_quizzes') || 'null');
    if (!quizzes || !Array.isArray(quizzes) || quizzes.length === 0) {
        quizzes = [
            { id: 'q1', courseId: 'c1', title: 'Quy trình tư vấn căn hộ chuẩn gồm bao nhiêu bước?', a: '3 bước', b: '5 bước cốt lõi', c: '7 bước', d: 'Không cố định', correct: 'B' },
            { id: 'q2', courseId: 'c1', title: 'Khi khách hàng do dự về tiến độ bàn giao, tư vấn viên cần làm gì?', a: 'Giục khách cọc ngay', b: 'Cung cấp biên bản nghiệm thu & hình ảnh tiến độ thực tế', c: 'Giảm giá căn hộ', d: 'Chờ khách tự quyết định', correct: 'B' }
        ];
    }

    const courseQuizzes = quizzes.filter(q => q.courseId === courseId);
    const questionsToRender = courseQuizzes.length > 0 ? courseQuizzes : quizzes.slice(0, 3);
    const minScore = parseInt(localStorage.getItem('lms_min_quiz_score') || '80');
    const quizMinutes = parseInt(localStorage.getItem('lms_quiz_time_minutes') || '10');

    quizPane.innerHTML = `
        <!-- Sticky Countdown Timer Header for Quiz -->
        <div class="quiz-sticky-timer-bar" id="quiz-sticky-header">
            <div class="quiz-timer-info">
                <i class="bi bi-alarm-fill" style="color:#b91c1c; font-size:1.15rem;"></i>
                <span>THỜI GIAN LÀM BÀI CÒN LẠI:</span>
                <strong id="quiz-timer-display" class="quiz-timer-clock">${String(quizMinutes).padStart(2, '0')}:00</strong>
            </div>
            <div class="quiz-timer-meta">
                <span class="quiz-timer-badge" id="quiz-timer-badge" style="background:#f1f5f9; color:var(--primary); border-color:#cbd5e1;">
                    <i class="bi bi-patch-question-fill"></i> ${questionsToRender.length} Câu Hỏi
                </span>
                <span style="font-size:0.75rem; background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:20px; font-weight:800; border:1px solid #86efac;">
                    <i class="bi bi-check2-all"></i> Đạt: >= ${minScore}%
                </span>
            </div>
        </div>
        <div class="quiz-timer-progress-track">
            <div id="quiz-timer-progress-bar" class="quiz-timer-progress-fill" style="width: 100%;"></div>
        </div>

        <form id="quiz-form" onsubmit="submitDynamicQuiz(event, '${courseId}')">
            ${questionsToRender.map((q, idx) => `
                <div class="quiz-question" style="background:#f8fafc; padding:14px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:12px;">
                    <p class="q-title" style="font-size:0.85rem; font-weight:800; color:#0f172a; margin-bottom:8px;">
                        <strong>Câu ${idx + 1}:</strong> ${q.title}
                    </p>
                    <label class="q-option" style="display:block; margin-bottom:6px; font-size:0.82rem; cursor:pointer;">
                        <input type="radio" name="quiz_ans_${q.id}" value="A" required> A. ${q.a}
                    </label>
                    <label class="q-option" style="display:block; margin-bottom:6px; font-size:0.82rem; cursor:pointer;">
                        <input type="radio" name="quiz_ans_${q.id}" value="B"> B. ${q.b}
                    </label>
                    <label class="q-option" style="display:block; margin-bottom:6px; font-size:0.82rem; cursor:pointer;">
                        <input type="radio" name="quiz_ans_${q.id}" value="C"> C. ${q.c}
                    </label>
                    <label class="q-option" style="display:block; font-size:0.82rem; cursor:pointer;">
                        <input type="radio" name="quiz_ans_${q.id}" value="D"> D. ${q.d}
                    </label>
                </div>
            `).join('')}
            <button type="submit" class="btn btn-primary animated-shine-btn" style="padding:10px 20px; font-size:0.85rem; font-weight:800;">
                <i class="bi bi-send-fill"></i> Nộp Bài Kiểm Tra
            </button>
        </form>
        <div id="quiz-result" class="quiz-result-box" style="display:none; margin-top:14px;"></div>
    `;

    // Start timer for this quiz session based on admin config
    startQuizTimer(courseId);
}

// SUBMIT DYNAMIC QUIZ & SCORE CALCULATION
function submitDynamicQuiz(event, courseId) {
    if (event && event.preventDefault) event.preventDefault();
    stopQuizTimer();

    const timerBadge = document.getElementById('quiz-timer-badge');
    if (timerBadge) {
        timerBadge.classList.remove('urgent');
        timerBadge.innerHTML = '<i class="bi bi-check-circle-fill"></i> Đã Nộp';
        timerBadge.style.background = '#dcfce7';
        timerBadge.style.color = '#15803d';
        timerBadge.style.borderColor = '#86efac';
    }

    const resultBox = document.getElementById('quiz-result');
    if (!resultBox) return;

    const quizzes = JSON.parse(localStorage.getItem('lms_quizzes') || '[]');
    const courseQuizzes = quizzes.filter(q => q.courseId === courseId);
    const fallbackQuizzes = [
        { id: 'q1', courseId: 'c1', title: 'Quy trình tư vấn căn hộ chuẩn gồm bao nhiêu bước?', a: '3 bước', b: '5 bước cốt lõi', c: '7 bước', d: 'Không cố định', correct: 'B' },
        { id: 'q2', courseId: 'c1', title: 'Khi khách hàng do dự về tiến độ bàn giao, tư vấn viên cần làm gì?', a: 'Giục khách cọc ngay', b: 'Cung cấp biên bản nghiệm thu & hình ảnh tiến độ thực tế', c: 'Giảm giá căn hộ', d: 'Chờ khách tự quyết định', correct: 'B' }
    ];
    const questions = courseQuizzes.length > 0 ? courseQuizzes : (quizzes.length > 0 ? quizzes.slice(0, 3) : fallbackQuizzes);

    let correctCount = 0;
    questions.forEach(q => {
        const selected = document.querySelector(`input[name="quiz_ans_${q.id}"]:checked`);
        if (selected && selected.value === q.correct) {
            correctCount++;
        }
    });

    const minScoreRequired = parseInt(localStorage.getItem('lms_min_quiz_score') || '80');
    const score = Math.round((correctCount / questions.length) * 100);
    const isPass = score >= minScoreRequired;

    resultBox.style.display = 'block';
    resultBox.style.background = isPass ? '#ecfdf5' : '#fffbeb';
    resultBox.style.border = `1px solid ${isPass ? '#a7f3d0' : '#fde68a'}`;
    resultBox.style.color = isPass ? '#065f46' : '#92400e';
    resultBox.style.padding = '14px 18px';
    resultBox.style.borderRadius = '10px';
    resultBox.innerHTML = `
        <div style="font-size:0.95rem; font-weight:800; margin-bottom:4px;">
            ${isPass ? '✓ CHÚC MỪNG: BẠN ĐÃ ĐẠT ĐIỂM CHUẨN!' : `⚠ CHƯA ĐẠT ĐIỂM CHUẨN (TỐI THIỂU ${minScoreRequired}đ)`}
        </div>
        <div style="font-size:0.85rem;">
            Kết quả: <strong>${score}/100 Điểm</strong> (${correctCount}/${questions.length} câu đúng).<br>
            ${isPass ? '<span style="color:var(--secondary-brand); font-weight:700;">Hệ thống đã ghi nhận hoàn thành bài kiểm tra cho tài khoản của bạn.</span>' : `Vui lòng xem lại video bài giảng và làm lại bài kiểm tra để đạt tối thiểu ${minScoreRequired}đ.`}
        </div>
    `;

    if (isPass) {
        const prog = getStudentProgress(courseId);
        const quizKey = `m${currentActiveModNum}`;
        if (!prog.passedQuizzes.includes(quizKey)) {
            prog.passedQuizzes.push(quizKey);
            saveStudentProgress(courseId, prog);
        }

        if (currentSelectedCourse) {
            renderClassroomSidebar(currentSelectedCourse, currentActiveModNum, currentActiveLessonNum);
            const nextModNum = currentActiveModNum + 1;
            const nextMod = (currentSelectedCourse.modules || []).find(m => m.id === nextModNum);
            if (nextMod) {
                alert(`CHÚC MỪNG BẠN ĐÃ ĐẠT ${score}/100 ĐIỂM BÀI KIỂM TRA MODULE ${currentActiveModNum}!\n\nModule ${nextModNum} (${nextMod.title}) đã được mở khóa. Bạn có thể tiếp tục lộ trình học tập!`);
            } else {
                if (isCourseFullyCompleted(currentSelectedCourse.id)) {
                    checkCourseCompletion(currentSelectedCourse.id);
                } else {
                    alert(`CHÚC MỪNG BẠN ĐÃ VƯỢT QUA BÀI KIỂM TRA MODULE ${currentActiveModNum} VỚI ${score}/100 ĐIỂM!\n\nĐể nhận Chứng Chỉ Tốt Nghiệp Khóa Học, vui lòng kiểm tra và hoàn thành toàn bộ các bài học video còn thiếu trong chương trình.`);
                }
            }
        }
    }
}

/* ==========================================================================
   INTERACTIVE DISCUSSION FORUM & INSTRUCTOR Q&A LOGIC
   ========================================================================== */
function getLessonDiscussions(courseId, modId, lessonId) {
    const key = `lms_disc_${courseId}_${modId}_${lessonId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
    }

    // High quality realistic default questions for interactive experience
    return [
        {
            id: 'disc-seed-1',
            authorName: 'Lê Hoàng Cường',
            empId: 'NV-20411',
            role: 'student',
            date: '10:30 Hôm nay',
            content: 'Thưa giảng viên, đối với khách hàng mua trả góp 70%, thủ tục thẩm định thu nhập có cần sao kê 6 tháng hay 12 tháng gần nhất ạ?',
            replies: [
                {
                    authorName: 'ThS. Nguyễn Thành Trung',
                    role: 'instructor',
                    date: '11:15 Hôm nay',
                    content: 'Chào Cường, theo chính sách đối tác ngân hàng liên kết dự án năm 2026, khách hàng chỉ cần cung cấp sao kê 6 tháng lương chuyển khoản gần nhất là đã đủ điều kiện xét duyệt hạn mức nhanh trong 24h em nhé!'
                }
            ]
        }
    ];
}

function renderLessonDiscussions(courseId, modId, lessonId) {
    const listEl = document.getElementById('lesson-comments-list');
    if (!listEl) return;

    const discussions = getLessonDiscussions(courseId, modId, lessonId);
    if (!discussions || discussions.length === 0) {
        listEl.innerHTML = `
            <div style="text-align:center; padding:24px; color:#64748b; font-size:0.8rem; background:#f8fafc; border-radius:8px; border:1px dashed #cbd5e1;">
                <i class="bi bi-chat-square-dots" style="font-size:1.5rem; display:block; margin-bottom:6px; color:#94a3b8;"></i>
                Chưa có câu hỏi nào cho bài học này. Hãy gửi câu hỏi đầu tiên cho ban giảng viên ở biểu mẫu phía trên!
            </div>
        `;
        return;
    }

    listEl.innerHTML = discussions.map(item => `
        <div class="comment-item" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:14px; margin-bottom:12px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
            <div class="comment-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:32px; height:32px; border-radius:50%; background:#f1f5f9; color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.75rem;">
                        <i class="bi bi-person-fill"></i>
                    </div>
                    <div>
                        <span style="font-size:0.82rem; font-weight:800; color:#1e293b;">${item.authorName}</span>
                        <span style="font-size:0.7rem; color:#64748b; margin-left:4px;">(${item.empId || 'Học Viên'})</span>
                    </div>
                </div>
                <span style="font-size:0.72rem; color:#94a3b8;"><i class="bi bi-clock"></i> ${item.date}</span>
            </div>
            <div class="comment-body" style="font-size:0.82rem; color:#334155; line-height:1.45; padding-left:40px; margin-bottom:8px;">
                ${item.content}
            </div>
            ${(item.replies && item.replies.length > 0) ? `
                <div class="comment-replies" style="margin-left:40px; border-left:2px solid #cbd5e1; padding-left:12px; margin-top:8px;">
                    ${item.replies.map(rep => `
                        <div style="background:#f8fafc; border-radius:8px; padding:10px 12px; margin-top:6px; border:1px solid #e2e8f0;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <strong style="font-size:0.78rem; color:var(--secondary-brand); display:flex; align-items:center; gap:4px;">
                                    <i class="bi bi-patch-check-fill"></i> ${rep.authorName} <span style="font-size:0.68rem; background:#dcfce7; color:#15803d; padding:1px 6px; border-radius:10px; font-weight:800;">Giảng Viên</span>
                                </strong>
                                <span style="font-size:0.7rem; color:#94a3b8;">${rep.date}</span>
                            </div>
                            <div style="font-size:0.78rem; color:#334155; line-height:1.4;">
                                ${rep.content}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div style="margin-left:40px; margin-top:4px;">
                    <span class="pending-badge"><i class="bi bi-hourglass-split"></i> Đang chờ ban giảng viên giải đáp</span>
                </div>
            `}
        </div>
    `).join('');
}

function handleSendDiscussion(event) {
    event.preventDefault();
    if (!currentUser) {
        alert('Vui lòng đăng nhập tài khoản học viên để gửi câu hỏi thảo luận!');
        openAuthModal('login');
        return;
    }
    const input = document.getElementById('discussion-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    if (!currentSelectedCourse) return;
    const courseId = currentSelectedCourse.id;
    const modId = currentActiveModNum || 1;
    const lessonId = currentActiveLessonNum || 1;

    const discussions = getLessonDiscussions(courseId, modId, lessonId);
    const newComment = {
        id: 'disc-' + Date.now(),
        authorName: currentUser.name,
        empId: currentUser.empId,
        role: 'student',
        date: 'Vừa xong',
        content: text,
        replies: []
    };
    discussions.unshift(newComment);
    const key = `lms_disc_${courseId}_${modId}_${lessonId}`;
    localStorage.setItem(key, JSON.stringify(discussions));

    input.value = '';
    renderLessonDiscussions(courseId, modId, lessonId);
    alert('ĐÃ GỬI CÂU HỎI THÀNH CÔNG!\n\nCâu hỏi của bạn đã được lưu vào hệ thống và chuyển đến ban giảng viên phụ trách khóa học.');
}

// DYNAMIC STUDENT DIVISION FILTERING & FILTER TABS
window.addEventListener('DOMContentLoaded', () => {
    initStudentDivisions();
    renderStudentCoursesCatalog('ALL');
});

// REAL-TIME CROSS-TAB SYNCHRONIZATION WITH ADMIN PORTAL
window.addEventListener('storage', (e) => {
    if (e.key === 'lms_courses_catalog' || e.key === 'lms_courses_list') {
        reloadCoursesCatalog();
        const currentDiv = document.getElementById('student-div-select')?.value || 'ALL';
        renderStudentCoursesCatalog(currentDiv);
    }
    if (e.key === 'lms_divisions_list') {
        initStudentDivisions();
        populateRegisterDivisions();
        const currentDiv = document.getElementById('student-div-select')?.value || 'ALL';
        renderStudentCoursesCatalog(currentDiv);
    }
    if (e.key === 'lms_users_db' || e.key === 'lms_current_user' || e.key === 'lms_allow_self_reg') {
        usersDatabase = JSON.parse(localStorage.getItem('lms_users_db') || 'null') || usersDatabase;
        currentUser = JSON.parse(localStorage.getItem('lms_current_user') || 'null');
        checkAuthGuard();
    }
});

function initStudentDivisions() {
    const divSelect = document.getElementById('student-div-select');
    if (!divSelect) return;

    const divisions = JSON.parse(localStorage.getItem('lms_divisions_list') || 'null') || [
        { id: 'DIV1', name: 'Khối Kinh Doanh 1' },
        { id: 'DIV2', name: 'Khối Kinh Doanh 2' },
        { id: 'DIV3', name: 'Khối Kinh Doanh 3 - Miền Nam' }
    ];

    let optionsHtml = `<option value="ALL">Tất Cả Khóa Học</option>`;
    divisions.forEach(d => {
        optionsHtml += `<option value="${d.id}">${d.name}</option>`;
    });
    divSelect.innerHTML = optionsHtml;
    divSelect.value = 'ALL';

    renderCourseFilterTabs('ALL');
}

function renderCourseFilterTabs(activeDiv) {
    const tabsContainer = document.getElementById('course-filter-tabs');
    if (!tabsContainer) return;

    const divisions = JSON.parse(localStorage.getItem('lms_divisions_list') || 'null') || [
        { id: 'DIV1', name: 'Khối Kinh Doanh 1' },
        { id: 'DIV2', name: 'Khối Kinh Doanh 2' },
        { id: 'DIV3', name: 'Khối Kinh Doanh 3 - Miền Nam' }
    ];

    const currentActive = activeDiv || 'ALL';

    let tabsHtml = `
        <button class="filter-tab-btn ${currentActive === 'ALL' ? 'active' : ''}" onclick="filterStudentCoursesByDiv('ALL')">
            Tất Cả Khóa Học
        </button>
    `;

    divisions.forEach(d => {
        tabsHtml += `
            <button class="filter-tab-btn ${currentActive === d.id ? 'active' : ''}" onclick="filterStudentCoursesByDiv('${d.id}')">
                ${d.name}
            </button>
        `;
    });

    tabsContainer.innerHTML = tabsHtml;
}

function filterStudentCoursesByDiv(divId) {
    const divSelect = document.getElementById('student-div-select');
    if (divSelect) {
        divSelect.value = divId;
    }
    backToCoursesList(); // Return to Level 1 if currently in Level 2
    renderStudentCoursesCatalog(divId);
}

/* ==========================================================================
   AUTHENTICATION LOGIC & PER-USER PROGRESS ISOLATION
   ========================================================================== */
let usersDatabase = JSON.parse(localStorage.getItem('lms_users_db') || 'null') || [
    { empId: 'NV-10892', name: 'Nguyễn Văn An', div: 'DIV1', team: 'Phòng KD 101', pass: '123456' },
    { empId: 'NV-10893', name: 'Trần Thị Bình', div: 'DIV1', team: 'Phòng KD 102', pass: '123456' },
    { empId: 'NV-20411', name: 'Lê Hoàng Cường', div: 'DIV2', team: 'Phòng KD 201', pass: '123456' }
];

let currentUser = JSON.parse(localStorage.getItem('lms_current_user') || 'null');

window.addEventListener('DOMContentLoaded', () => {
    populateRegisterDivisions();
    checkAuthGuard();
});

function checkAuthGuard() {
    const lockedScreen = document.getElementById('auth-guard-locked-screen');
    const curriculumSec = document.getElementById('curriculum');
    const userNameEl = document.getElementById('student-user-name');
    const userDivSelect = document.getElementById('student-div-select');
    const authBtn = document.querySelector('.auth-btn');
    const btnGuardReg = document.getElementById('btn-guard-reg');
    const regTabBtn = document.getElementById('auth-tab-reg-btn');
    const btnChangePass = document.getElementById('btn-change-password');
    const allowSelfReg = localStorage.getItem('lms_allow_self_reg') !== 'false';

    // Toggle self-registration buttons
    if (btnGuardReg) btnGuardReg.style.display = allowSelfReg ? 'inline-flex' : 'none';
    if (regTabBtn) regTabBtn.style.display = allowSelfReg ? 'inline-block' : 'none';

    if (!currentUser) {
        // GUEST MODE: HIDE 100% OF LESSONS & SHOW LOCK SCREEN
        if (lockedScreen) lockedScreen.style.display = 'block';
        if (curriculumSec) curriculumSec.style.display = 'none';
        if (btnChangePass) btnChangePass.style.display = 'none';

        if (userNameEl) userNameEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">Chưa Đăng Nhập</span>`;
        if (userDivSelect) userDivSelect.disabled = true;
        if (authBtn) {
            authBtn.textContent = 'Đăng Nhập';
            authBtn.style.background = '#ffffff';
            authBtn.style.color = 'var(--primary)';
            authBtn.style.borderColor = 'var(--primary)';
            authBtn.onclick = () => openAuthModal('login');
        }
    } else {
        // LOGGED IN MODE: UNLOCK CONTENT
        if (lockedScreen) lockedScreen.style.display = 'none';
        if (curriculumSec) curriculumSec.style.display = 'block';
        if (btnChangePass) btnChangePass.style.display = 'inline-flex';

        if (userNameEl) userNameEl.innerHTML = `${currentUser.name} <span class="emp-code">(${currentUser.empId})</span>`;
        if (userDivSelect) {
            userDivSelect.disabled = false;
            // Ensure select has 'ALL' or user's div
            if (!userDivSelect.value) userDivSelect.value = 'ALL';
        }
        renderStudentCoursesCatalog(userDivSelect ? userDivSelect.value : 'ALL');
        if (authBtn) {
            authBtn.textContent = 'Đăng Xuất';
            authBtn.style.background = '#fef2f2';
            authBtn.style.color = '#ef4444';
            authBtn.style.borderColor = '#fca5a5';
            authBtn.onclick = handleLogout;
        }
    }
}

function updateAuthHeaderUI() {
    checkAuthGuard();
}

function populateRegisterDivisions() {
    const regSelect = document.getElementById('reg-div-select');
    if (!regSelect) return;

    const divisions = JSON.parse(localStorage.getItem('lms_divisions_list') || 'null') || [
        { id: 'DIV1', name: 'Khối Kinh Doanh 1' },
        { id: 'DIV2', name: 'Khối Kinh Doanh 2' },
        { id: 'DIV3', name: 'Khối Kinh Doanh 3 - Miền Nam' }
    ];

    regSelect.innerHTML = divisions.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}

function openAuthModal(tabName) {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';
        switchAuthTab(tabName || 'login');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function switchAuthTab(tabName) {
    const loginForm = document.getElementById('auth-login-form');
    const regForm = document.getElementById('auth-reg-form');
    const loginBtn = document.getElementById('auth-tab-login-btn');
    const regBtn = document.getElementById('auth-tab-reg-btn');

    if (tabName === 'login') {
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
        loginBtn.className = 'btn btn-primary';
        regBtn.className = 'btn btn-secondary';
    } else {
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        loginBtn.className = 'btn btn-secondary';
        regBtn.className = 'btn btn-primary';
    }
}

function handleLogin(event) {
    event.preventDefault();
    const empId = document.getElementById('login-empid').value.trim();
    const pass = document.getElementById('login-password').value;

    const matched = usersDatabase.find(u => u.empId.toLowerCase() === empId.toLowerCase() && u.pass === pass);

    if (matched) {
        currentUser = matched;
        localStorage.setItem('lms_current_user', JSON.stringify(currentUser));
        checkAuthGuard();
        closeAuthModal();
        alert(`ĐĂNG NHẬP THÀNH CÔNG!\n\nXin chào Sales ${matched.name} (${matched.empId})\n• Đơn vị: ${matched.team} - Thuộc ${matched.div}\n\nHệ thống đã mở khóa lộ trình đào tạo của bạn!`);
    } else {
        alert(`Đăng nhập thất bại: Sai Mã Nhân Viên hoặc Mật Khẩu!`);
    }
}

function handleRegister(event) {
    event.preventDefault();
    const fullname = document.getElementById('reg-fullname').value.trim();
    const empId = document.getElementById('reg-empid').value.trim().toUpperCase();
    const div = document.getElementById('reg-div-select').value;
    const team = document.getElementById('reg-team').value.trim();
    const pass = document.getElementById('reg-password').value;

    if (usersDatabase.some(u => u.empId === empId)) {
        alert(`Mã nhân viên "${empId}" đã tồn tại trên hệ thống!`);
        return;
    }

    const newUser = { empId, name: fullname, div, team, pass };
    usersDatabase.push(newUser);
    localStorage.setItem('lms_users_db', JSON.stringify(usersDatabase));

    currentUser = newUser;
    localStorage.setItem('lms_current_user', JSON.stringify(currentUser));

    checkAuthGuard();
    closeAuthModal();
    alert(`ĐĂNG KÝ TÀI KHOẢN THÀNH CÔNG!\n\nChào mừng học viên mới ${fullname} (${empId})!\n• Thuộc đơn vị: ${team} (${div})\n\nTài khoản của bạn đã được kích hoạt trên hệ thống LMS!`);
}

function handleLogout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất tài khoản hiện tại?')) {
        stopQuizTimer();
        currentUser = null;
        localStorage.removeItem('lms_current_user');
        switchView('landing');
        checkAuthGuard();
        alert('Đã đăng xuất! Toàn bộ nội dung bài học đã được khóa.');
    }
}

/* ==========================================================================
   CHANGE PASSWORD MODAL HANDLERS
   ========================================================================== */
function openChangePasswordModal() {
    if (!currentUser) {
        alert('Vui lòng đăng nhập tài khoản học viên trước khi đổi mật khẩu!');
        openAuthModal('login');
        return;
    }
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.style.display = 'flex';
        const curInput = document.getElementById('current-password-input');
        const newInput = document.getElementById('new-password-input');
        const confirmInput = document.getElementById('confirm-new-password-input');
        if (curInput) curInput.value = '';
        if (newInput) newInput.value = '';
        if (confirmInput) confirmInput.value = '';
    }
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) modal.style.display = 'none';
}

function handleChangePassword(event) {
    event.preventDefault();
    if (!currentUser) return;

    const currentPass = document.getElementById('current-password-input')?.value;
    const newPass = document.getElementById('new-password-input')?.value;
    const confirmPass = document.getElementById('confirm-new-password-input')?.value;

    if (currentUser.pass !== currentPass) {
        alert('Mật khẩu hiện tại không chính xác! Vui lòng kiểm tra lại.');
        return;
    }
    if (!newPass || newPass.length < 6) {
        alert('Mật khẩu mới phải có tối thiểu 6 ký tự!');
        return;
    }
    if (newPass !== confirmPass) {
        alert('Mật khẩu mới và xác nhận mật khẩu không trùng khớp!');
        return;
    }

    // Update currentUser object & localStorage
    currentUser.pass = newPass;
    localStorage.setItem('lms_current_user', JSON.stringify(currentUser));

    // Update usersDatabase list & localStorage
    const idx = usersDatabase.findIndex(u => u.empId.toLowerCase() === currentUser.empId.toLowerCase());
    if (idx !== -1) {
        usersDatabase[idx].pass = newPass;
    } else {
        usersDatabase.push(currentUser);
    }
    localStorage.setItem('lms_users_db', JSON.stringify(usersDatabase));

    closeChangePasswordModal();
    alert('ĐỔI MẬT KHẨU THÀNH CÔNG!\n\nMật khẩu mới của bạn đã được cập nhật an toàn vào hệ thống.');
}

/* ==========================================================================
   ROBUST BROWSER HISTORY & BACK BUTTON NAVIGATION (PREVENTS JUMPING TO ADMIN)
   ========================================================================== */
window.addEventListener('popstate', function(event) {
    const state = event.state;
    if (state) {
        if (state.view === 'portal') {
            switchView('portal', false);
            if (state.courseId) {
                playCourseLesson(state.courseId, state.modNum || 1, state.lessonNum || 1);
            }
        } else if (state.view === 'modules') {
            switchView('landing', false);
            if (state.courseId) {
                openCourseModules(state.courseId, false);
            } else {
                backToCoursesList(false);
            }
        } else if (state.view === 'catalog') {
            backToCoursesList(false);
        }
    } else {
        const hash = window.location.hash || '';
        if (hash.startsWith('#course-')) {
            const cId = hash.replace('#course-', '');
            openCourseModules(cId, false);
        } else if (hash.startsWith('#lesson-')) {
            if (currentSelectedCourse) {
                openCourseModules(currentSelectedCourse.id, false);
            } else {
                backToCoursesList(false);
            }
        } else {
            backToCoursesList(false);
        }
    }
});

// Set initial catalog state on first load so Back button stays inside student portal
window.addEventListener('DOMContentLoaded', function() {
    if (!window.location.hash || window.location.hash === '#catalog') {
        try {
            history.replaceState({ view: 'catalog' }, '', '#catalog');
        } catch (e) {}
    } else if (window.location.hash.startsWith('#course-')) {
        const cId = window.location.hash.replace('#course-', '');
        openCourseModules(cId, false);
    }
    initSessionStudyTimer();
    applySystemConfig();
});

// GLOBAL SESSION STUDY TIMER (COUNTS UP SECONDS OF ACTIVE LEARNING IN CLASSROOM)
let sessionStudySeconds = 0;
let sessionStudyInterval = null;

function initSessionStudyTimer() {
    if (sessionStudyInterval) return;
    sessionStudyInterval = setInterval(() => {
        const portal = document.getElementById('view-portal');
        if (portal && portal.classList.contains('active')) {
            sessionStudySeconds++;
            const timerEl = document.getElementById('session-study-timer');
            if (timerEl) {
                const m = Math.floor(sessionStudySeconds / 60);
                const s = sessionStudySeconds % 60;
                timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }
        }
    }, 1000);
}

// REAL-TIME BI-DIRECTIONAL STORAGE SYNC: LIVE UPDATES WHEN ADMIN CHANGES SETTINGS
window.addEventListener('storage', function(e) {
    applySystemConfig();
    if (!e || e.key === 'lms_courses_catalog' || e.key === 'lms_custom_courses') {
        reloadCoursesCatalog();
        renderCourseCards();
    }
});

