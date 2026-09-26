/**
 * Queen Land LMS - Storage & Repository Service Layer
 * Clean Architecture Layer 1: Data Access & State Persistence
 */

(function(window) {
    'use strict';

    // 1. DEFAULT SEED CONSTANTS
    const defaultCoursesSeed = [
        {
            id: 'c1',
            title: 'Khóa 1: Quy Trình Tư Vấn Căn Hộ Đô Thị 2026',
            category: 'Căn Hộ Đô Thị',
            cat: 'Căn Hộ Đô Thị',
            access: 'DIV1',
            desc: 'Lộ trình đào tạo chuẩn kỹ năng tư vấn, tiếp cận khách hàng cao cấp, phân tích bảng giá và kịch bản chốt hợp đồng căn hộ thương mại.',
            rawDesc: 'Lộ trình đào tạo chuẩn kỹ năng tư vấn, tiếp cận khách hàng cao cấp, phân tích bảng giá và kịch bản chốt hợp đồng căn hộ thương mại.',
            stats: { modules: 4, videos: 18, duration: '4 Giờ Học', materials: 4 },
            progress: 35,
            instructor: 'Ban Đào Tạo Queen Land',
            modules: [
                { id: 1, title: 'Tổng Quan & Định Hướng Kiến Thức Nền Tảng', desc: 'Giới thiệu tổng quan hệ thống dự án căn hộ cao cấp, mục tiêu đào tạo và các khái niệm cốt lõi ban đầu.', status: 'completed', statusText: 'Đã Hoàn Thành', meta: { videos: 4, duration: '45 Phút', docs: '2 Tài Liệu' }, buttonText: 'Xem Lại Module 1', buttonClass: 'btn-module', lessonId: 1 },
                { id: 2, title: 'Quy Trình & Kỹ Thuật Thực Hành Chuyên Sâu', desc: 'Hướng dẫn từng bước thao tác thực tế qua bài giảng video chi tiết kèm ví dụ minh họa và xử lý phản đối từ khách hàng.', status: 'in-progress', statusText: 'Đang Học (Bài 2/3)', meta: { videos: 6, duration: '90 Phút', docs: '1 Bài Quiz' }, buttonText: 'Tiếp Tục Học Ngay', buttonClass: 'btn-module primary', lessonId: 2 },
                { id: 3, title: 'Tối Ưu Hóa & Đánh Giá Năng Lực Sales', desc: 'Phân tích chuyên sâu các case study thực tế, kịch bản chốt cọc và phương pháp nâng cao hiệu suất làm việc.', status: 'locked', statusText: 'Chưa Mở Khóa', meta: { videos: 5, duration: '60 Phút', docs: '1 Bài Test' }, buttonText: 'Chưa Mở Khóa', buttonClass: 'btn-module disabled', lessonId: 3 },
                { id: 4, title: 'Bài Thu Hoạch Tổng Hợp & Đánh Giá Tốt Nghiệp Khóa Học', desc: 'Thực hiện bài thu hoạch thực tế và bài kiểm tra tổng hợp cuối khóa để hoàn tất điều kiện tốt nghiệp toàn khóa học.', status: 'locked', statusText: 'Chưa Mở Khóa', meta: { videos: 3, duration: '120 Phút', docs: 'Bài Thu Hoạch Cuối Khóa' }, buttonText: 'Chưa Mở Khóa', buttonClass: 'btn-module disabled', lessonId: 4 }
            ]
        },
        {
            id: 'c2',
            title: 'Khóa 2: Phân Tích Dòng Tiền & Pháp Lý Biệt Thự Biển Hạ Long',
            category: 'Nghỉ Dưỡng Cao Cấp',
            cat: 'Nghỉ Dưỡng Cao Cấp',
            access: 'DIV2',
            desc: 'Phân tích chuyên sâu bảng tính ROI dòng tiền, bài toán đòn bẩy tài chính ngân hàng và kỹ năng tư vấn khách hàng VIP biệt thự nghỉ dưỡng.',
            rawDesc: 'Phân tích chuyên sâu bảng tính ROI dòng tiền, bài toán đòn bẩy tài chính ngân hàng và kỹ năng tư vấn khách hàng VIP biệt thự nghỉ dưỡng.',
            stats: { modules: 3, videos: 12, duration: '3.5 Giờ Học', materials: 3 },
            progress: 0,
            instructor: 'Chuyên Gia Tài Chính Queen Land',
            modules: [
                { id: 1, title: 'Tổng Quan Thị Trường Nghỉ Dưỡng & Quy Hoạch Hạ Long 2026', desc: 'Nắm vững quy hoạch tổng thể, tiềm năng tăng giá bất động sản ven biển và hồ sơ pháp lý sở hữu.', status: 'in-progress', statusText: 'Bắt Đầu Học', meta: { videos: 4, duration: '50 Phút', docs: '2 Bản Đồ QH' }, buttonText: 'Vào Học Module 1', buttonClass: 'btn-module primary', lessonId: 1 },
                { id: 2, title: 'Phân Tích Bảng Tính Dòng Tiền ROI & Đòn Bẩy Ngân Hàng', desc: 'Thực hành tính toán lợi suất cho thuê, dòng tiền thực nhận và phương án tài chính tối ưu cho nhà đầu tư.', status: 'locked', statusText: 'Chưa Mở Khóa', meta: { videos: 5, duration: '75 Phút', docs: '1 Bài Quiz' }, buttonText: 'Chưa Mở Khóa', buttonClass: 'btn-module disabled', lessonId: 2 },
                { id: 3, title: 'Kỹ Thuật Xử Lý Từ Chối & Kịch Bản Chốt Cọc Biệt Thự Triệu Đô', desc: 'Các tình huống thực chiến với khách hàng thượng lưu và kỹ năng giải tỏa băn khoăn về tiến độ dự án.', status: 'locked', statusText: 'Chưa Mở Khóa', meta: { videos: 3, duration: '60 Phút', docs: '1 Bài Test' }, buttonText: 'Chưa Mở Khóa', buttonClass: 'btn-module disabled', lessonId: 3 }
            ]
        },
        {
            id: 'c3',
            title: 'Khóa 3: Kỹ Năng Đàm Phán & Chốt Cọc Bất Động Sản Đỉnh Cao',
            category: 'Kỹ Năng Thực Chiến',
            cat: 'Kỹ Năng Thực Chiến',
            access: 'PUBLIC',
            desc: 'Nghệ thuật xử lý phản đối, đọc vị tâm lý khách hàng đầu tư bất động sản và kỹ thuật đàm phán chốt hợp đồng trong 24h.',
            rawDesc: 'Nghệ thuật xử lý phản đối, đọc vị tâm lý khách hàng đầu tư bất động sản và kỹ thuật đàm phán chốt hợp đồng trong 24h.',
            stats: { modules: 3, videos: 10, duration: '3 Giờ Học', materials: 2 },
            progress: 15,
            instructor: 'Giám Đốc Đào Tạo Queen Land',
            modules: [
                { id: 1, title: 'Tâm Lý Học Khách Hàng Đầu Tư Bất Động Sản', desc: 'Phân loại các nhóm tính cách nhà đầu tư và cách xây dựng niềm tin cá nhân ngay trong 5 phút đầu.', status: 'completed', statusText: 'Đã Hoàn Thành', meta: { videos: 3, duration: '40 Phút', docs: '1 Tài Liệu' }, buttonText: 'Xem Lại Module 1', buttonClass: 'btn-module', lessonId: 1 },
                { id: 2, title: 'Kỹ Thuật Đặt Câu Hỏi Điều Hướng & Đàm Phán Giá', desc: 'Nghệ thuật dẫn dắt cuộc trò chuyện từ băn khoăn về giá sang giá trị độc bản của bất động sản.', status: 'in-progress', statusText: 'Đang Học (Bài 1/3)', meta: { videos: 4, duration: '60 Phút', docs: '1 Bài Quiz' }, buttonText: 'Tiếp Tục Học Ngay', buttonClass: 'btn-module primary', lessonId: 2 },
                { id: 3, title: 'Kịch Bản Chốt Cọc Thực Chiến & Xử Lý Do Dự', desc: 'Kỹ thuật tạo sự khan hiếm tự nhiên và kịch bản chốt cọc thành công ngay tại bàn tư vấn.', status: 'locked', statusText: 'Chưa Mở Khóa', meta: { videos: 3, duration: '50 Phút', docs: '1 Bài Test' }, buttonText: 'Chưa Mở Khóa', buttonClass: 'btn-module disabled', lessonId: 3 }
            ]
        },
        {
            id: 'c4',
            title: 'Khóa 4: Pháp Lý Bất Động Sản & Thẩm Định Quy Hoạch Dự Án',
            category: 'Pháp Lý Dự Án',
            cat: 'Pháp Lý Dự Án',
            access: 'DIV3',
            desc: 'Nắm vững luật kinh doanh BĐS mới nhất, quy trình kiểm tra quy hoạch 1/500, hồ sơ pháp lý dự án và các điều khoản hợp đồng mua bán.',
            rawDesc: 'Nắm vững luật kinh doanh BĐS mới nhất, quy trình kiểm tra quy hoạch 1/500, hồ sơ pháp lý dự án và các điều khoản hợp đồng mua bán.',
            stats: { modules: 2, videos: 8, duration: '2.5 Giờ Học', materials: 4 },
            progress: 0,
            instructor: 'Phòng Pháp Chế Queen Land',
            modules: [
                { id: 1, title: 'Bộ Luật Đất Đai & Pháp Lý Dự Án Bất Động Sản 2026', desc: 'Cập nhật những điểm mới của luật đất đai và quy định về điều kiện mở bán nhà ở hình thành trong tương lai.', status: 'in-progress', statusText: 'Bắt Đầu Học', meta: { videos: 4, duration: '60 Phút', docs: '4 Văn Bản Luật' }, buttonText: 'Vào Học Module 1', buttonClass: 'btn-module primary', lessonId: 1 },
                { id: 2, title: 'Kỹ Năng Đọc Bản Đồ Quy Hoạch & Hướng Dẫn Ký HĐMB', desc: 'Thực hành tra cứu quy hoạch trên cổng thông tin địa chính và giải thích các điều khoản HĐMB cho khách hàng.', status: 'locked', statusText: 'Chưa Mở Khóa', meta: { videos: 4, duration: '65 Phút', docs: '1 Bài Quiz' }, buttonText: 'Chưa Mở Khóa', buttonClass: 'btn-module disabled', lessonId: 2 }
            ]
        }
    ];

    const defaultDivisionsSeed = [
        { id: 'DIV1', name: 'Khối Kinh Doanh 1', teams: ['Phòng KD 101', 'Phòng KD 102', 'Phòng KD 103'] },
        { id: 'DIV2', name: 'Khối Kinh Doanh 2', teams: ['Phòng KD 201', 'Phòng KD 202'] },
        { id: 'DIV3', name: 'Khối Kinh Doanh 3 - Miền Nam', teams: ['Phòng KD 301', 'Phòng KD 302'] }
    ];

    const defaultUsersSeed = [
        { empId: 'NV-10892', name: 'Nguyễn Văn An', div: 'DIV1', team: 'Phòng KD 101', pass: '123456' },
        { empId: 'NV-10893', name: 'Trần Thị Bình', div: 'DIV1', team: 'Phòng KD 102', pass: '123456' },
        { empId: 'NV-20411', name: 'Lê Hoàng Cường', div: 'DIV2', team: 'Phòng KD 201', pass: '123456' }
    ];

    const defaultQuizzesSeed = [
        { id: 'q1', courseId: 'c1', title: 'Quy trình tư vấn căn hộ chuẩn gồm bao nhiêu bước?', a: '3 bước', b: '5 bước cốt lõi', c: '7 bước', d: 'Không cố định', correct: 'B' },
        { id: 'q2', courseId: 'c1', title: 'Khi khách hàng do dự về tiến độ bàn giao, tư vấn viên cần làm gì?', a: 'Giục khách cọc ngay', b: 'Cung cấp biên bản nghiệm thu & hình ảnh tiến độ thực tế', c: 'Giảm giá căn hộ', d: 'Chờ khách tự quyết định', correct: 'B' },
        { id: 'q3', courseId: 'c2', title: 'Đòn bẩy tài chính tối đa khuyến nghị cho khách đầu tư biệt thự nghỉ dưỡng là bao nhiêu?', a: '30% - 50% giá trị căn', b: '70% - 80% giá trị căn', c: '100% giá trị căn', d: 'Không dùng đòn bẩy', correct: 'A' }
    ];

    const defaultSettingsSeed = {
        minWatchPct: 80,
        quizPassingScore: 80,
        quizTimeLimit: 10,
        antiSkipEnabled: true,
        divisionRestricted: true
    };

    // 2. STORAGE REPOSITORY OBJECT
    const StorageService = {
        // COURSES
        getCourses: function() {
            const isInit = localStorage.getItem('lms_courses_initialized');
            const stored = localStorage.getItem('lms_courses_catalog') || localStorage.getItem('lms_courses_list');
            if (isInit) {
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed)) return parsed;
                    } catch(e) {}
                }
                return [];
            }
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        localStorage.setItem('lms_courses_initialized', 'true');
                        return parsed;
                    }
                } catch(e) {}
            }
            // Seed defaults first time
            localStorage.setItem('lms_courses_initialized', 'true');
            this.saveCourses(defaultCoursesSeed);
            return JSON.parse(JSON.stringify(defaultCoursesSeed));
        },

        saveCourses: function(coursesList) {
            localStorage.setItem('lms_courses_initialized', 'true');
            localStorage.setItem('lms_courses_catalog', JSON.stringify(coursesList));
            localStorage.setItem('lms_courses_list', JSON.stringify(coursesList));
            window.coursesState = coursesList;
            window.coursesCatalog = coursesList;
        },

        resetCoursesToDefault: function() {
            const copy = JSON.parse(JSON.stringify(defaultCoursesSeed));
            this.saveCourses(copy);
            return copy;
        },

        // DIVISIONS
        getDivisions: function() {
            try {
                const stored = localStorage.getItem('lms_divisions_list');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch(e) {}
            localStorage.setItem('lms_divisions_list', JSON.stringify(defaultDivisionsSeed));
            return JSON.parse(JSON.stringify(defaultDivisionsSeed));
        },

        saveDivisions: function(divsList) {
            localStorage.setItem('lms_divisions_list', JSON.stringify(divsList));
            window.divisionsState = divsList;
        },

        // USERS / STUDENTS
        getUsers: function() {
            try {
                const stored = localStorage.getItem('lms_users_db');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch(e) {}
            localStorage.setItem('lms_users_db', JSON.stringify(defaultUsersSeed));
            return JSON.parse(JSON.stringify(defaultUsersSeed));
        },

        saveUsers: function(usersList) {
            localStorage.setItem('lms_users_db', JSON.stringify(usersList));
            window.usersDatabase = usersList;
        },

        // QUIZZES
        getQuizzes: function() {
            try {
                const stored = localStorage.getItem('lms_quizzes');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) return parsed;
                }
            } catch(e) {}
            localStorage.setItem('lms_quizzes', JSON.stringify(defaultQuizzesSeed));
            return JSON.parse(JSON.stringify(defaultQuizzesSeed));
        },

        saveQuizzes: function(quizzesList) {
            localStorage.setItem('lms_quizzes', JSON.stringify(quizzesList));
            window.quizzesDatabase = quizzesList;
        },

        // SYSTEM SETTINGS
        getSettings: function() {
            try {
                const minWatch = parseInt(localStorage.getItem('lms_min_watch_percent') || '80');
                const minScore = parseInt(localStorage.getItem('lms_min_quiz_score') || '80');
                const quizTime = parseInt(localStorage.getItem('lms_quiz_time_minutes') || '10');
                const antiSkip = localStorage.getItem('lms_anti_scrub_enabled') !== 'false';
                const divMode = localStorage.getItem('lms_division_mode_enabled') !== 'false';

                return {
                    minWatchPct: minWatch,
                    quizPassingScore: minScore,
                    quizTimeLimit: quizTime,
                    antiSkipEnabled: antiSkip,
                    divisionRestricted: divMode
                };
            } catch(e) {}
            return Object.assign({}, defaultSettingsSeed);
        },

        saveSettings: function(settingsObj) {
            const merged = Object.assign({}, defaultSettingsSeed, settingsObj);
            try {
                localStorage.setItem('lms_training_settings', JSON.stringify(merged));
                if (merged.minWatchPct !== undefined) localStorage.setItem('lms_min_watch_percent', String(merged.minWatchPct));
                if (merged.quizPassingScore !== undefined) localStorage.setItem('lms_min_quiz_score', String(merged.quizPassingScore));
                if (merged.quizTimeLimit !== undefined) localStorage.setItem('lms_quiz_time_minutes', String(merged.quizTimeLimit));
                if (merged.antiSkipEnabled !== undefined) localStorage.setItem('lms_anti_scrub_enabled', merged.antiSkipEnabled ? 'true' : 'false');
                if (merged.divisionRestricted !== undefined) localStorage.setItem('lms_division_mode_enabled', merged.divisionRestricted ? 'true' : 'false');
            } catch(e) {}
            return merged;
        },

        // STUDENT PROGRESS
        getProgress: function(empId, courseId) {
            try {
                const stored = localStorage.getItem(`lms_progress_${empId}_${courseId}`);
                if (stored) return JSON.parse(stored);
            } catch(e) {}
            return null;
        },

        saveProgress: function(empId, courseId, data) {
            localStorage.setItem(`lms_progress_${empId}_${courseId}`, JSON.stringify(data));

            // Sync to Supabase Cloud asynchronously
            if (window.supabaseClient) {
                window.supabaseClient.from('user_progress').upsert({
                    emp_id: empId,
                    course_id: courseId,
                    data: data,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'emp_id,course_id' }).then(({ error }) => {
                    if (error) console.warn('[CVKD Sync] Progress sync notice:', error.message);
                });
            }
        },

        // CLOUD SYNCHRONIZATION (PULL)
        pullCloudSync: async function() {
            if (!window.supabaseClient) return false;
            try {
                const [userRes, progRes] = await Promise.all([
                    window.supabaseClient.from('users').select('*'),
                    window.supabaseClient.from('user_progress').select('*')
                ]);

                if (userRes.data && userRes.data.length > 0) {
                    const cloudUsers = userRes.data.map(u => ({
                        empId: u.emp_id,
                        name: u.name,
                        div: u.division,
                        team: u.team,
                        pass: u.password,
                        role: u.role || 'student'
                    }));
                    this.saveUsers(cloudUsers);
                }

                if (progRes.data && progRes.data.length > 0) {
                    progRes.data.forEach(p => {
                        if (p.emp_id && p.course_id && p.data) {
                            localStorage.setItem(`lms_progress_${p.emp_id}_${p.course_id}`, JSON.stringify(p.data));
                        }
                    });
                }
                return true;
            } catch (err) {
                console.warn('[CVKD Sync] Cloud pull notice:', err);
                return false;
            }
        }
    };

    // Initialize global synchronized state references
    window.defaultCoursesSeed = defaultCoursesSeed;
    window.defaultDivisionsSeed = defaultDivisionsSeed;
    window.defaultUsersSeed = defaultUsersSeed;
    window.defaultQuizzesSeed = defaultQuizzesSeed;
    window.defaultSettingsSeed = defaultSettingsSeed;

    window.coursesState = StorageService.getCourses();
    window.coursesCatalog = window.coursesState;
    window.divisionsState = StorageService.getDivisions();
    window.usersDatabase = StorageService.getUsers();
    window.quizzesDatabase = StorageService.getQuizzes();
    window.StorageService = StorageService;

})(window);
