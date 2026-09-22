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

let coursesCatalog = defaultCoursesCatalog;
let currentSelectedCourse = null;

// RELOAD COURSES CATALOG FROM LOCALSTORAGE SAFELY
function reloadCoursesCatalog() {
    try {
        const stored = localStorage.getItem('lms_courses_catalog') || localStorage.getItem('lms_courses_list');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
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

// RENDER LEVEL 1: CHƯƠNG TRÌNH HỌC (COURSES CATALOG)
function renderStudentCoursesCatalog(filterDiv) {
    const container = document.getElementById('student-courses-catalog-grid');
    if (!container) return;

    // Always fetch freshest data
    reloadCoursesCatalog();

    const targetDiv = filterDiv || (document.getElementById('student-div-select')?.value) || 'ALL';

    // Get current divisions for readable labels
    const divisions = JSON.parse(localStorage.getItem('lms_divisions_list') || 'null') || [
        { id: 'DIV1', name: 'Khối Kinh Doanh 1' },
        { id: 'DIV2', name: 'Khối Kinh Doanh 2' },
        { id: 'DIV3', name: 'Khối Kinh Doanh 3 - Miền Nam' }
    ];

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
        const isPublic = !course.access || course.access === 'PUBLIC';
        const matchedDiv = divisions.find(d => d.id === course.access);
        const accessLabel = isPublic ? 'Dành Cho Toàn Bộ Sales' : (matchedDiv ? `Khóa Riêng ${matchedDiv.name}` : `Khóa Riêng ${course.access}`);
        const accessClass = isPublic ? 'badge-forest' : 'div-badge';

        // Robust fallbacks for properties
        const category = course.category || course.cat || 'Chuyên Đề';
        const stats = course.stats || {
            modules: (course.modules && course.modules.length) ? course.modules.length : 1,
            videos: (course.modules && course.modules.length) ? course.modules.length : 2,
            duration: '1 Giờ Học',
            materials: 1
        };
        const desc = course.desc || course.rawDesc || 'Lộ trình đào tạo chuẩn kỹ năng cho nhân sự Sales Queen Land.';
        const progress = typeof course.progress === 'number' ? course.progress : 0;

        return `
        <div class="course-program-card card-premium">
            <div class="course-card-top">
                <span class="course-category-badge badge-gold">${category}</span>
                <span class="course-access-badge ${accessClass}">${accessLabel}</span>
            </div>
            <h3>${course.title}</h3>
            <p class="course-desc">${desc}</p>
            
            <div class="course-stats-pills">
                <span class="course-stat-pill"><i class="bi bi-collection"></i> ${stats.modules} Module</span>
                <span class="course-stat-pill"><i class="bi bi-play-circle"></i> ${stats.videos} Video Bài Giảng</span>
                <span class="course-stat-pill"><i class="bi bi-clock"></i> ${stats.duration}</span>
                <span class="course-stat-pill"><i class="bi bi-file-earmark-text"></i> ${stats.materials} Tài Liệu</span>
            </div>

            <div class="course-progress-mini">
                <div class="p-bar-label">
                    <span>Tiến độ cá nhân</span>
                    <strong>${progress}%</strong>
                </div>
                <div class="p-bar-track">
                    <div class="p-bar-fill" style="width: ${progress}%;"></div>
                </div>
            </div>

            <button class="btn-view-course-modules animated-shine-btn" onclick="openCourseModules('${course.id}')">
                <span>Xem Các Module Bài Học <i class="bi bi-arrow-right"></i></span>
            </button>
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
                </div>
            </div>
            <div style="flex-shrink:0; text-align:right;">
                <button class="btn animated-shine-btn" style="background:#ffffff; color:#2F2D74; font-weight:800; padding:12px 24px; border:none; border-radius:8px; cursor:pointer;" onclick="enterCourseLesson('${course.id}', 1, 1)">
                    <span>Vào Học Ngay <i class="bi bi-arrow-right"></i></span>
                </button>
            </div>
        `;
    }

    // Render Modules with detailed lessons list
    if (modulesGrid) {
        modulesGrid.innerHTML = modulesList.map(mod => {
            let statusBadgeClass = 'locked';
            let statusIcon = '<i class="bi bi-lock-fill"></i>';
            if (mod.status === 'completed') {
                statusBadgeClass = 'success';
                statusIcon = '<i class="bi bi-check-circle-fill"></i>';
            }
            if (mod.status === 'in-progress') {
                statusBadgeClass = 'warning';
                statusIcon = '<i class="bi bi-play-circle-fill"></i>';
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
                        status: (mod.status === 'completed') ? 'completed' : (i === 1 ? 'in-progress' : 'locked')
                    });
                }
                mod.lessons = lessons;
            }

            // Render lessons items
            const lessonsHtml = lessons.map(les => {
                const isDone = les.status === 'completed' || mod.status === 'completed';
                const isLocked = mod.status === 'locked';
                const icon = isDone 
                    ? '<i class="bi bi-check-circle-fill text-success"></i>' 
                    : (isLocked ? '<i class="bi bi-lock-fill text-muted"></i>' : '<i class="bi bi-play-circle-fill text-primary"></i>');

                return `
                <div class="module-lesson-item">
                    <div class="lesson-main-info">
                        <span class="lesson-icon">${icon}</span>
                        <span class="lesson-title-text" title="${les.title}"><strong>Bài ${mod.id}.${les.id}:</strong> ${les.title.replace(/^Bài \d+\.\d+:?\s*/, '')}</span>
                    </div>
                    <div class="lesson-badges-group">
                        <span class="lesson-duration" style="font-size:0.7rem; color:#64748b;"><i class="bi bi-clock"></i> ${les.duration || '15:00'}</span>
                        <button class="btn-play-lesson" ${isLocked ? 'disabled' : ''} onclick="enterCourseLesson('${course.id}', ${mod.id}, ${les.id})" title="Vào xem bài giảng này">
                            <i class="bi bi-play-fill"></i> <span>Học bài này</span>
                        </button>
                    </div>
                </div>
                `;
            }).join('');

            return `
            <div class="module-card card-premium ${mod.status}">
                <div class="module-status-badge ${statusBadgeClass}">${statusIcon} ${mod.statusText || 'Bắt Đầu Học'}</div>
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
                <button class="${mod.buttonClass || 'btn-module primary'} animated-shine-btn" ${mod.status === 'locked' ? 'disabled' : ''} onclick="enterCourseLesson('${course.id}', ${mod.id}, ${mod.lessonId || 1})">
                    <span>${mod.buttonText || 'Vào Học Module ' + mod.id} <i class="bi bi-arrow-right"></i></span>
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
    switchView('landing', false);
    if (currentSelectedCourse) {
        openCourseModules(currentSelectedCourse.id, push);
    } else {
        backToCoursesList(push);
    }
}

// BACK TO LEVEL 1 (COURSES LIST)
function backToCoursesList(push = true) {
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

    // Update Topbar
    const topCourseTitle = document.getElementById('current-course-title');
    if (topCourseTitle) {
        topCourseTitle.textContent = `${course.title} - Module ${targetMod.id}`;
    }

    // Update Video Title & Tag
    const videoTitle = document.getElementById('video-lesson-title');
    if (videoTitle && targetLesson) {
        videoTitle.textContent = targetLesson.title;
    }

    const playingTag = document.querySelector('.playing-tag');
    if (playingTag) {
        playingTag.textContent = `ĐANG PHÁT BÀI ${targetMod.id}.${targetLesson.id}`;
    }

    // Embed Video: YouTube iframe or MP4
    const videoWrapper = document.querySelector('.video-wrapper');
    if (videoWrapper && targetLesson) {
        const url = targetLesson.youtubeUrl || '';
        const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (ytMatch && ytMatch[1]) {
            videoWrapper.innerHTML = `
                <iframe id="lms-youtube-iframe" src="https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1" title="${targetLesson.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute; top:0; left:0; width:100%; height:100%; border-radius:12px;"></iframe>
            `;
        } else {
            videoWrapper.innerHTML = `
                <video id="lms-video" poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80" controls style="width:100%; height:100%; border-radius:12px;">
                    <source src="${url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}" type="video/mp4">
                    Trình duyệt của bạn không hỗ trợ thẻ video.
                </video>
            `;
            const video = document.getElementById('lms-video');
            if (video) video.play().catch(() => {});
        }
    }

    // Render dynamic sidebar
    renderClassroomSidebar(course, targetMod.id, targetLesson.id);

    // Render Quiz Tab for this course
    renderClassroomQuizTab(course.id);
}

// RENDER DYNAMIC SIDEBAR ACCORDIONS IN CLASSROOM
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

    listContainer.innerHTML = course.modules.map(mod => {
        const isModActive = mod.id === activeModNum;
        const modClass = mod.status === 'completed' ? 'completed-mod' : (isModActive ? 'active-mod' : (mod.status === 'locked' ? 'locked-mod' : ''));
        const iconHtml = mod.status === 'completed' 
            ? '<i class="bi bi-check-circle-fill" style="color:var(--secondary-brand);"></i>' 
            : (isModActive ? '<i class="bi bi-hourglass-split" style="color:var(--warning);"></i>' : '<i class="bi bi-play-circle-fill"></i>');

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
                    status: i === 1 ? 'in-progress' : 'locked'
                });
            }
            mod.lessons = lessons;
        }

        const lessonsHtml = lessons.map(les => {
            const isPlaying = (mod.id === activeModNum && les.id === activeLessonNum);
            const isDone = les.status === 'completed';
            const isLocked = les.status === 'locked';

            let lesClass = 'lesson-item';
            if (isPlaying) lesClass += ' playing';
            else if (isDone) lesClass += ' done';
            else if (isLocked) lesClass += ' locked-item';

            const statusIcon = isDone 
                ? '<i class="bi bi-check2"></i>' 
                : (isPlaying ? '<i class="bi bi-play-fill"></i>' : (isLocked ? '<i class="bi bi-lock"></i>' : '<i class="bi bi-circle"></i>'));

            return `
                <div class="${lesClass}" id="lesson-${mod.id}-${les.id}" onclick="playCourseLesson('${course.id}', ${mod.id}, ${les.id})">
                    <span class="status-icon">${statusIcon}</span>
                    <span class="lesson-name">${les.title}</span>
                    <span class="duration">${les.duration || '15:00'}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="accordion-item ${modClass}">
                <div class="accordion-header" onclick="toggleAccordion('mod-accord-${mod.id}')">
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

    quizPane.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #e2e8f0; padding-bottom:10px;">
            <h4 style="margin:0; font-size:1rem; font-weight:800; color:var(--primary);">Bài Kiểm Tra Trắc Nghiệm Đánh Giá Module</h4>
            <span style="font-size:0.75rem; background:#e0e7ff; color:#2F2D74; padding:3px 10px; border-radius:20px; font-weight:800;">${questionsToRender.length} Câu Hỏi</span>
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
}

// SUBMIT DYNAMIC QUIZ & SCORE CALCULATION
function submitDynamicQuiz(event, courseId) {
    event.preventDefault();
    const resultBox = document.getElementById('quiz-result');
    if (!resultBox) return;

    const quizzes = JSON.parse(localStorage.getItem('lms_quizzes') || '[]');
    const courseQuizzes = quizzes.filter(q => q.courseId === courseId);
    const questions = courseQuizzes.length > 0 ? courseQuizzes : quizzes.slice(0, 3);

    let correctCount = 0;
    questions.forEach(q => {
        const selected = document.querySelector(`input[name="quiz_ans_${q.id}"]:checked`);
        if (selected && selected.value === q.correct) {
            correctCount++;
        }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const isPass = score >= 80;

    resultBox.style.display = 'block';
    resultBox.style.background = isPass ? '#ecfdf5' : '#fffbeb';
    resultBox.style.border = `1px solid ${isPass ? '#a7f3d0' : '#fde68a'}`;
    resultBox.style.color = isPass ? '#065f46' : '#92400e';
    resultBox.style.padding = '14px 18px';
    resultBox.style.borderRadius = '10px';
    resultBox.innerHTML = `
        <div style="font-size:0.95rem; font-weight:800; margin-bottom:4px;">
            ${isPass ? '✓ CHÚC MỪNG: BẠN ĐÃ ĐẠT ĐIỂM CHUẨN!' : '⚠ CHƯA ĐẠT ĐIỂM CHUẨN (TỐI THIỂU 80đ)'}
        </div>
        <div style="font-size:0.85rem;">
            Kết quả: <strong>${score}/100 Điểm</strong> (${correctCount}/${questions.length} câu đúng).<br>
            ${isPass ? '<span style="color:#0C5A3E; font-weight:700;">Hệ thống đã ghi nhận hoàn thành bài kiểm tra cho tài khoản của bạn.</span>' : 'Vui lòng xem lại video bài giảng và làm lại bài kiểm tra để đạt tối thiểu 80đ.'}
        </div>
    `;
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
});
