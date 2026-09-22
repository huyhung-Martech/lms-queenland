/* ==========================================================================
   UniAcademy LMS - Interactive Application Logic
   ========================================================================== */

// Switch view between Landing Page and LMS Portal
function switchView(viewName) {
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
    } else if (viewName === 'portal') {
        portalView.classList.add('active');
        landingView.classList.remove('active');
        btnPortal.classList.add('active');
        btnLanding.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const videoTitle = document.getElementById('video-lesson-title');
    const lessonTitleText = `Module ${modNum} - Bài ${modNum}.${lessonNum}: Bài Học Video Đào Tạo`;

    if (videoTitle) {
        videoTitle.textContent = lessonTitleText;
    }

    // Highlight active lesson in sidebar
    document.querySelectorAll('.lesson-item').forEach(el => el.classList.remove('playing'));
    const targetLesson = document.getElementById(`lesson-${modNum}-${lessonNum}`);
    if (targetLesson) {
        targetLesson.classList.add('playing');
    }

    // Auto play video simulation
    const video = document.getElementById('lms-video');
    if (video) {
        video.currentTime = 0;
        video.play().catch(() => {});
    }
}

// Custom Player Speed Control
function setSpeed(rate) {
    const video = document.getElementById('lms-video');
    if (video) {
        video.playbackRate = rate;
    }

    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseFloat(btn.textContent) === rate) {
            btn.classList.add('active');
        }
    });
}

// VIDEO WATCH PROGRESS % MEASUREMENT & COMPLETION ENFORCEMENT
let isCompleted = false;
function markLessonComplete() {
    const video = document.getElementById('lms-video');
    const minPercentRequired = 80; // Required minimum watch % threshold
    
    let watchedPercent = 100;
    if (video && video.duration > 0) {
        watchedPercent = Math.round((video.currentTime / video.duration) * 100);
    }

    // If user hasn't watched enough % of the video yet
    if (watchedPercent < minPercentRequired && !isCompleted) {
        alert(`BẮT BUỘC XEM VIDEO THỰC TẾ:\nHệ thống đo lường bạn mới xem ${watchedPercent}% video bài giảng.\nBạn cần xem tối thiểu ${minPercentRequired}% thời lượng video để được tính hoàn thành bài học này!`);
        return;
    }

    const btn = document.getElementById('btn-mark-complete');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const headerProgress = document.getElementById('header-user-progress');

    if (!isCompleted) {
        isCompleted = true;
        btn.textContent = 'Đã Hoàn Thành';
        btn.style.background = '#059669';
        
        progressFill.style.width = '48%';
        progressText.textContent = '48% (4/8 Bài)';
        if (headerProgress) headerProgress.textContent = 'Chuỗi 5 Ngày Học • 48% Hoàn thành';
        
        alert('Chúc mừng bạn đã xem đủ thời lượng video và hoàn thành Bài 2.2. Module 2.3 đã sẵn sàng!');
    } else {
        alert('Bạn đã hoàn thành bài học này trước đó.');
    }
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

function submitQuiz(event) {
    event.preventDefault();
    const resultBox = document.getElementById('quiz-result');
    if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.style.background = '#d1fae5';
        resultBox.style.color = '#065f46';
        resultBox.style.padding = '12px';
        resultBox.style.borderRadius = '8px';
        resultBox.style.marginTop = '12px';
        resultBox.innerHTML = '<strong>KẾT QUẢ BÀI TEST:</strong> 100/100 Điểm (2/2 Câu Đúng).<br><span style="color:#047857; font-weight:700;">ĐẠT CHUẨN: Bạn đã hoàn thành bài kiểm tra đánh giá Module này!</span>';
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
                title: 'Đồ Án Tốt Nghiệp & Cấp Chứng Nhận',
                desc: 'Thực hiện bài kiểm tra tổng hợp cuối khóa để cấp chứng nhận đào tạo chính thức của Queen Land Academy.',
                status: 'locked',
                statusText: 'Chưa Mở Khóa',
                meta: { videos: 3, duration: '120 Phút', docs: 'Cấp Chứng Nhận' },
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

let coursesCatalog = JSON.parse(localStorage.getItem('lms_courses_catalog') || 'null') || defaultCoursesCatalog;
let currentSelectedCourse = null;

// RENDER LEVEL 1: CHƯƠNG TRÌNH HỌC (COURSES CATALOG)
function renderStudentCoursesCatalog(filterDiv) {
    const container = document.getElementById('student-courses-catalog-grid');
    if (!container) return;

    const targetDiv = filterDiv || (document.getElementById('student-div-select')?.value) || 'ALL';

    // Filter courses: match student's division or PUBLIC courses or ALL
    const filteredCourses = coursesCatalog.filter(c => {
        if (!targetDiv || targetDiv === 'ALL') return true;
        if (!c.access || c.access === 'PUBLIC') return true;
        return c.access === targetDiv;
    });

    // Sync tabs
    renderCourseFilterTabs(targetDiv);

    if (filteredCourses.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1;">
                <h4 style="font-size: 1rem; color: #1e293b; margin-bottom: 8px;">Chưa có khóa học nào dành riêng cho khối này</h4>
                <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">Bạn có thể bấm nút bên dưới để xem toàn bộ danh mục khóa học của công ty.</p>
                <button class="btn btn-primary" onclick="filterStudentCoursesByDiv('ALL')">Xem Tất Cả Khóa Học</button>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredCourses.map(course => {
        const isPublic = course.access === 'PUBLIC';
        const accessLabel = isPublic ? 'Dành Cho Toàn Bộ Sales' : `Khóa Riêng ${course.access}`;
        const accessClass = isPublic ? 'public-badge' : 'div-badge';

        return `
        <div class="course-program-card">
            <div class="course-card-top">
                <span class="course-category-badge">${course.category}</span>
                <span class="course-access-badge ${accessClass}">${accessLabel}</span>
            </div>
            <h3>${course.title}</h3>
            <p class="course-desc">${course.desc}</p>
            
            <div class="course-stats-pills">
                <span class="course-stat-pill">${course.stats.modules} Module</span>
                <span class="course-stat-pill">${course.stats.videos} Video Bài Giảng</span>
                <span class="course-stat-pill">${course.stats.duration}</span>
                <span class="course-stat-pill">${course.stats.materials} Tài Liệu</span>
            </div>

            <div class="course-progress-mini">
                <div class="p-bar-label">
                    <span>Tiến độ cá nhân</span>
                    <strong>${course.progress}%</strong>
                </div>
                <div class="p-bar-track">
                    <div class="p-bar-fill" style="width: ${course.progress}%;"></div>
                </div>
            </div>

            <button class="btn-view-course-modules" onclick="openCourseModules('${course.id}')">
                <span>Xem Các Module Bài Học</span>
            </button>
        </div>
        `;
    }).join('');
}

// LEVEL 2: DRILL-DOWN INTO MODULES OF SELECTED COURSE
function openCourseModules(courseId) {
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

    // Render Banner
    if (banner) {
        banner.innerHTML = `
            <div>
                <span style="font-size:0.75rem; background:rgba(255,255,255,0.15); padding:3px 10px; border-radius:20px; font-weight:700;">${course.category}</span>
                <h2 style="margin-top:6px;">${course.title}</h2>
                <p>${course.desc}</p>
                <div class="banner-meta-row">
                    <span>Giảng viên: <strong>${course.instructor}</strong></span>
                    <span><strong>${course.stats.modules} Module</strong></span>
                    <span><strong>${course.stats.videos} Video</strong></span>
                    <span><strong>${course.stats.duration}</strong></span>
                    <span>Tiến độ: <strong>${course.progress}%</strong></span>
                </div>
            </div>
            <div style="flex-shrink:0; text-align:right;">
                <button class="btn" style="background:#ffffff; color:#312e81; font-weight:800; padding:10px 18px;" onclick="enterCourseLesson('${course.id}', 1, 1)">Vào Học Ngay</button>
            </div>
        `;
    }

    // Render Modules
    if (modulesGrid) {
        modulesGrid.innerHTML = course.modules.map(mod => {
            let statusBadgeClass = 'locked';
            if (mod.status === 'completed') statusBadgeClass = 'success';
            if (mod.status === 'in-progress') statusBadgeClass = 'warning';

            return `
            <div class="module-card ${mod.status}">
                <div class="module-status-badge ${statusBadgeClass}">${mod.statusText}</div>
                <div class="module-header">
                    <span class="module-number">MODULE 0${mod.id}</span>
                    <h3>${mod.title}</h3>
                </div>
                <p class="module-desc">${mod.desc}</p>
                <div class="module-meta">
                    <span>${mod.meta.videos} Video</span>
                    <span>${mod.meta.duration}</span>
                    <span>${mod.meta.docs}</span>
                </div>
                <button class="${mod.buttonClass}" ${mod.status === 'locked' ? 'disabled' : ''} onclick="enterCourseLesson('${course.id}', ${mod.id}, ${mod.lessonId})">
                    ${mod.buttonText}
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
}

// BACK TO LEVEL 1 (COURSES LIST)
function backToCoursesList() {
    const coursesView = document.getElementById('curriculum-courses-view');
    const modulesView = document.getElementById('curriculum-modules-view');

    if (modulesView) modulesView.style.display = 'none';
    if (coursesView) coursesView.style.display = 'block';

    const curriculumEl = document.getElementById('curriculum');
    if (curriculumEl) {
        curriculumEl.scrollIntoView({ behavior: 'smooth' });
    }
}

// ENTER CLASSROOM VIDEO FOR SPECIFIC COURSE & MODULE
function enterCourseLesson(courseId, modNum, lessonNum) {
    const course = coursesCatalog.find(c => c.id === courseId);
    if (course) {
        const topCourseTitle = document.getElementById('current-course-title');
        if (topCourseTitle) {
            topCourseTitle.textContent = `${course.title} - Module ${modNum}`;
        }
    }
    selectLesson(modNum, lessonNum || 1);
}

// DYNAMIC STUDENT DIVISION FILTERING & FILTER TABS
window.addEventListener('DOMContentLoaded', () => {
    initStudentDivisions();
    renderStudentCoursesCatalog('ALL');
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
    const allowSelfReg = localStorage.getItem('lms_allow_self_reg') !== 'false';

    // Toggle self-registration buttons
    if (btnGuardReg) btnGuardReg.style.display = allowSelfReg ? 'inline-flex' : 'none';
    if (regTabBtn) regTabBtn.style.display = allowSelfReg ? 'inline-block' : 'none';

    if (!currentUser) {
        // GUEST MODE: HIDE 100% OF LESSONS & SHOW LOCK SCREEN
        if (lockedScreen) lockedScreen.style.display = 'block';
        if (curriculumSec) curriculumSec.style.display = 'none';

        if (userNameEl) userNameEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">Chưa Đăng Nhập</span>`;
        if (userDivSelect) userDivSelect.disabled = true;
        if (authBtn) {
            authBtn.textContent = 'Đăng Nhập';
            authBtn.style.background = '#ffffff';
            authBtn.style.color = '#4f46e5';
            authBtn.style.borderColor = '#4f46e5';
            authBtn.onclick = () => openAuthModal('login');
        }
    } else {
        // LOGGED IN MODE: UNLOCK CONTENT
        if (lockedScreen) lockedScreen.style.display = 'none';
        if (curriculumSec) curriculumSec.style.display = 'block';

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
        currentUser = null;
        localStorage.removeItem('lms_current_user');
        switchView('landing');
        checkAuthGuard();
        alert('Đã đăng xuất! Toàn bộ nội dung bài học đã được khóa.');
    }
}
