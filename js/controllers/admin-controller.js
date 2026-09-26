/**
 * Queen Land LMS - Admin Dashboard Controller Layer
 * Clean Architecture Layer 3: UI Event Handlers, Modals & DOM Rendering
 */

(function(window) {
    'use strict';

    // State Variables
    let currentLessonCourseId = null;
    let courseToDeleteId = null;
    let divisionChartInstance = null;
    let allowSelfReg = localStorage.getItem('lms_allow_self_reg') !== 'false';
    let isDivModeOn = true;
    let isAntiScrubOn = true;

    const escapeHtml = window.escapeHtml || (s => (s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')));

    // Toast notification
    function showAdminToast(msg) {
        const toast = document.getElementById('adminToast');
        const toastMsg = document.getElementById('adminToastMsg');
        if (toast && toastMsg) {
            toastMsg.textContent = msg;
            toast.style.display = 'flex';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 3500);
        }
    }

    // Mobile Sidebar
    function toggleMobileSidebar() {
        const sidebar = document.getElementById('adminSidebar');
        if (sidebar) sidebar.classList.toggle('open');
    }

    // Navigation Switcher
    function switchNav(navId) {
        document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.pane').forEach(el => el.classList.remove('active'));

        const targetNav = document.getElementById(`nav-${navId}`);
        if (targetNav) targetNav.classList.add('active');

        const targetPane = document.getElementById(`pane-${navId}`);
        if (targetPane) targetPane.classList.add('active');

        const titles = {
            courses: 'Quản Lý Khóa Học & Đào Tạo',
            lessons: 'Tạo Module & Video Bài Giảng YouTube',
            quiz: 'Quản Lý Trắc Nghiệm Quiz Builder',
            divisions: 'Quản Lý Khối Kinh Doanh & Phòng Sales Trực Thuộc',
            students: 'Quản Lý Danh Mục Tài Khoản Học Viên Sales',
            reports: 'Báo Cáo Tiến Độ Tình Trạng Module Từng Nhân Viên',
            leaderboard: 'Bảng Xếp Hạng Thi Đua Giữa Các Khối'
        };
        const titleEl = document.getElementById('current-page-title');
        if (titleEl) titleEl.textContent = titles[navId] || 'Quản Trị LMS';

        const coursesState = window.coursesState || [];

        if (navId === 'lessons') {
            if (!currentLessonCourseId && coursesState.length > 0) {
                currentLessonCourseId = coursesState[0].id;
            }
            const selectEl = document.getElementById('lesson-course-select');
            if (selectEl && currentLessonCourseId) {
                selectEl.value = currentLessonCourseId;
            }
            if (currentLessonCourseId) {
                handleCourseSelectionChange(currentLessonCourseId);
            }
        } else if (navId === 'quiz') {
            renderStandaloneQuizList();
        } else if (navId === 'leaderboard') {
            renderLeaderboardUI();
            updateDivisionChart();
        } else if (navId === 'reports') {
            renderReportsTable();
        }
    }

    // ==========================================
    // 1. COURSES MANAGEMENT
    // ==========================================
    function resetToDefaultSampleCourses() {
        if (!confirm('Ban co muon khoi phuc 4 khoa hoc mau ban dau cua he thong khong?')) return;
        if (window.StorageService) {
            window.coursesState = window.StorageService.resetCoursesToDefault();
        }
        renderCoursesUI();
        renderCourseDropdowns();
        renderReportsTable();
        renderStandaloneQuizList();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();
        showAdminToast('Da khoi phuc thanh cong 4 khoa hoc mau ban dau!');
    }

    function renderCoursesUI() {
        const container = document.getElementById('courses-list-container');
        if (!container) return;

        const coursesState = window.coursesState || [];
        const divisionsState = window.divisionsState || [];

        if (coursesState.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:36px 16px; border:2px dashed #cbd5e1; border-radius:12px; background:#f8fafc;">
                    <i class="bi bi-journal-x" style="font-size:2rem; color:#94a3b8;"></i>
                    <p style="margin-top:8px; font-size:0.9rem; font-weight:700; color:#64748b;">Chua co khoa hoc nao tren he thong.</p>
                    <p style="font-size:0.78rem; color:#94a3b8; margin-bottom:14px;">Hay su dung form ben trai de khoi tao khoa hoc moi, hoac khoi phuc du lieu mau ban dau neu can.</p>
                    <button class="btn btn-secondary" onclick="resetToDefaultSampleCourses()" style="padding:7px 16px; font-size:0.75rem; font-weight:700; border-color:#cbd5e1; display:inline-flex; align-items:center; gap:6px;">
                        <i class="bi bi-arrow-counterclockwise"></i> Khoi Phuc 4 Khoa Hoc Mau Ban Dau
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = coursesState.map(c => {
            let divName = 'Mo Cong Khai Tu Do';
            let accessBadgeClass = 'badge-forest';
            if (c.access !== 'PUBLIC') {
                const matchedDiv = divisionsState.find(d => d.id === c.access);
                divName = matchedDiv ? `Gan Rieng Cho ${matchedDiv.name}` : `Gan Cho ${c.access}`;
                accessBadgeClass = 'div-badge';
            }

            const modCount = c.modules ? c.modules.length : (c.stats?.modules || 0);
            let videoCount = 0;
            if (c.modules && c.modules.length > 0) {
                c.modules.forEach(m => {
                    videoCount += (m.lessons && m.lessons.length > 0) ? m.lessons.length : (m.meta?.videos || 1);
                });
            } else {
                videoCount = c.stats?.videos || modCount;
            }

            const safeId = (c.id || '').replace(/'/g, "\\'");

            return `
            <div class="card-premium" style="border:1px solid #e2e8f0; border-radius:12px; padding:16px 20px; margin-bottom:12px; background:#ffffff; display:flex; justify-content:space-between; align-items:center;">
                <div style="flex-grow:1; padding-right:16px;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                        <span class="badge-gold" style="font-size:0.72rem; padding:2px 8px; border-radius:10px; font-weight:700;">${escapeHtml(c.category || c.cat || 'Khoa Hoc')}</span>
                        <span class="${accessBadgeClass}" style="font-size:0.72rem; padding:2px 8px; border-radius:10px; font-weight:700;">
                            ${escapeHtml(divName)}
                        </span>
                    </div>
                    <h4 style="font-size:0.98rem; font-weight:800; color:var(--primary-dark); font-family:var(--font-label); margin:4px 0 3px;">${escapeHtml(c.title)}</h4>
                    <p style="font-size:0.8rem; color:#64748b; line-height:1.45; margin:0;">${escapeHtml(c.rawDesc || c.desc || 'Moi khoi tao')}</p>
                    <div style="margin-top:8px; font-size:0.73rem; color:#475569; font-weight:600; display:flex; flex-wrap:wrap; gap:16px;">
                        <span><i class="bi bi-person-badge"></i> Phu trach: <strong>${escapeHtml(c.instructor || 'Ban Dao Tao Queen Land')}</strong></span>
                        <span><i class="bi bi-collection"></i> <strong>${modCount} Module</strong></span>
                        <span><i class="bi bi-play-circle"></i> <strong>${videoCount} Video</strong></span>
                    </div>
                </div>
                <div style="display:flex; gap:8px; flex-shrink:0;">
                    <button class="btn btn-secondary" style="padding:7px 14px; font-size:0.75rem; font-weight:700; border-color:#cbd5e1; display:inline-flex; align-items:center; gap:5px;" onclick="openEditCourseModal('${safeId}')">
                        <i class="bi bi-pencil-square"></i> <span>Sua</span>
                    </button>
                    <button class="btn" style="padding:7px 14px; font-size:0.75rem; background:#fee2e2; color:#ef4444; font-weight:700; border:none; display:inline-flex; align-items:center; gap:5px;" onclick="deleteCourse('${safeId}')">
                        <i class="bi bi-trash3"></i> <span>Xoa</span>
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    function handleCreateCourse(event) {
        event.preventDefault();
        const title = document.getElementById('new-course-title').value.trim();
        const cat = document.getElementById('new-course-category').value;
        const access = document.getElementById('new-course-access').value;
        const instructor = (document.getElementById('new-course-instructor')?.value || 'Ban Dao Tao Queen Land').trim();
        const desc = (document.getElementById('new-course-desc')?.value || 'Lo trinh dao tao chuan ky nang cho nhan su Sales Queen Land.').trim();

        const courseId = 'course_' + Date.now();
        const newCourse = {
            id: courseId,
            title: title,
            cat: cat,
            category: cat,
            access: access,
            desc: desc,
            rawDesc: desc,
            instructor: instructor,
            progress: 0,
            stats: { modules: 1, videos: 1, duration: '45 Phut', materials: 1 },
            modules: [
                {
                    id: 1,
                    title: 'Module 1: Gioi Thieu & Kien Thuc Cot Loi',
                    desc: `Tong quan va dinh huong chuong trinh dao tao: ${title}.`,
                    status: 'in-progress',
                    statusText: 'Bat Dau Hoc',
                    meta: { videos: 1, duration: '45 Phut', docs: '1 Tai Lieu' },
                    buttonText: 'Vao Hoc Module 1',
                    buttonClass: 'btn-module primary',
                    lessonId: 1,
                    lessons: [
                        {
                            id: 1,
                            title: `Bai 1.1: Gioi thieu tong quan ${title}`,
                            duration: '15:00',
                            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                            status: 'in-progress'
                        }
                    ]
                }
            ]
        };

        const coursesState = window.coursesState || [];
        coursesState.unshift(newCourse);
        if (window.StorageService) {
            window.StorageService.saveCourses(coursesState);
        }

        renderCoursesUI();
        renderCourseDropdowns();
        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();

        const msg = document.getElementById('create-course-msg');
        if (msg) {
            msg.style.display = 'block';
            msg.textContent = `Da xuat ban thanh cong "${title}"! Khoa hoc da xuat hien tren giao dien hoc vien va dong bo sang Tab Module.`;
        }

        document.getElementById('create-course-form').reset();
        if (document.getElementById('new-course-instructor')) {
            document.getElementById('new-course-instructor').value = 'Ban Dao Tao Queen Land';
        }
        showAdminToast(`Da xuat ban khoa hoc moi: "${title}"!`);
    }

    function openEditCourseModal(courseId) {
        const coursesState = window.coursesState || [];
        const course = coursesState.find(c => c.id === courseId);
        if (!course) {
            showAdminToast('Khong tim thay thong tin khoa hoc de chinh sua!');
            return;
        }

        document.getElementById('edit-course-id').value = course.id;
        document.getElementById('edit-course-title').value = course.title || '';
        document.getElementById('edit-course-category').value = course.category || course.cat || 'Can Ho Do Thi';
        document.getElementById('edit-course-instructor').value = course.instructor || 'Ban Dao Tao Queen Land';
        document.getElementById('edit-course-desc').value = course.desc || course.rawDesc || '';

        const modCount = course.modules ? course.modules.length : (course.stats?.modules || 0);
        let vidCount = 0;
        if (course.modules && course.modules.length > 0) {
            course.modules.forEach(m => {
                vidCount += (m.lessons && m.lessons.length > 0) ? m.lessons.length : (m.meta?.videos || 1);
            });
        } else {
            vidCount = course.stats?.videos || 0;
        }
        const modEl = document.getElementById('edit-course-mod-count');
        const vidEl = document.getElementById('edit-course-video-count');
        if (modEl) modEl.textContent = modCount;
        if (vidEl) vidEl.textContent = vidCount;

        const accessSelect = document.getElementById('edit-course-access');
        const divisionsState = window.divisionsState || [];
        if (accessSelect) {
            let optionsHtml = `<option value="PUBLIC">Mo Cong Khai Cho Tat Ca Sales</option>`;
            divisionsState.forEach(d => {
                optionsHtml += `<option value="${d.id}">Gan Rieng Cho ${d.name} (${d.id})</option>`;
            });
            accessSelect.innerHTML = optionsHtml;
            accessSelect.value = course.access || 'PUBLIC';
        }

        const modal = document.getElementById('editCourseModal');
        if (modal) modal.style.display = 'flex';
    }

    function closeEditCourseModal() {
        const modal = document.getElementById('editCourseModal');
        if (modal) modal.style.display = 'none';
    }

    function jumpToCourseModulesFromEdit() {
        const id = document.getElementById('edit-course-id').value;
        const title = document.getElementById('edit-course-title').value.trim();
        const cat = document.getElementById('edit-course-category').value;
        const access = document.getElementById('edit-course-access').value;
        const instructor = document.getElementById('edit-course-instructor').value.trim();
        const desc = document.getElementById('edit-course-desc').value.trim();

        const coursesState = window.coursesState || [];
        const courseIndex = coursesState.findIndex(c => c.id === id);
        if (courseIndex !== -1) {
            coursesState[courseIndex].title = title;
            coursesState[courseIndex].cat = cat;
            coursesState[courseIndex].category = cat;
            coursesState[courseIndex].access = access;
            coursesState[courseIndex].instructor = instructor;
            coursesState[courseIndex].rawDesc = desc;
            coursesState[courseIndex].desc = desc;

            if (window.StorageService) {
                window.StorageService.saveCourses(coursesState);
            }
        }

        closeEditCourseModal();
        switchNav('lessons');
        currentLessonCourseId = id;
        const selectLesson = document.getElementById('lesson-course-select');
        if (selectLesson) {
            selectLesson.value = id;
            handleCourseSelectionChange(id);
        }
        showAdminToast(`Dang mo danh sach Module & Video cua "${title}"`);
    }

    function handleSaveCourseEdit(event) {
        event.preventDefault();
        const id = document.getElementById('edit-course-id').value;
        const title = document.getElementById('edit-course-title').value.trim();
        const cat = document.getElementById('edit-course-category').value;
        const access = document.getElementById('edit-course-access').value;
        const instructor = document.getElementById('edit-course-instructor').value.trim();
        const desc = document.getElementById('edit-course-desc').value.trim();

        const coursesState = window.coursesState || [];
        const courseIndex = coursesState.findIndex(c => c.id === id);
        if (courseIndex !== -1) {
            coursesState[courseIndex].title = title;
            coursesState[courseIndex].cat = cat;
            coursesState[courseIndex].category = cat;
            coursesState[courseIndex].access = access;
            coursesState[courseIndex].instructor = instructor;
            coursesState[courseIndex].rawDesc = desc;
            coursesState[courseIndex].desc = desc;

            if (window.StorageService) {
                window.StorageService.saveCourses(coursesState);
            }
        }

        renderCoursesUI();
        renderCourseDropdowns();
        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();
        closeEditCourseModal();
        showAdminToast(`Da cap nhat thanh cong khoa hoc: "${title}"!`);
    }

    function deleteCourse(id) {
        courseToDeleteId = id;
        const coursesState = window.coursesState || [];
        const course = coursesState.find(c => c.id === id);
        const courseTitle = course ? course.title : 'Khoa hoc nay';

        const titleEl = document.getElementById('delete-course-title-display');
        if (titleEl) titleEl.textContent = courseTitle;

        const modal = document.getElementById('deleteCourseModal');
        if (modal) modal.style.display = 'flex';
    }

    function closeDeleteCourseModal() {
        courseToDeleteId = null;
        const modal = document.getElementById('deleteCourseModal');
        if (modal) modal.style.display = 'none';
    }

    function executeDeleteCourse() {
        if (!courseToDeleteId) return;
        const id = courseToDeleteId;
        let coursesState = window.coursesState || [];
        const course = coursesState.find(c => c.id === id);
        const courseTitle = course ? course.title : 'Khoa hoc';

        coursesState = coursesState.filter(c => c.id !== id);
        window.coursesState = coursesState;
        if (window.StorageService) {
            window.StorageService.saveCourses(coursesState);
        }

        let quizzesDb = window.quizzesDatabase || [];
        quizzesDb = quizzesDb.filter(q => q.courseId !== id);
        window.quizzesDatabase = quizzesDb;
        if (window.StorageService) {
            window.StorageService.saveQuizzes(quizzesDb);
        }

        if (currentLessonCourseId === id) {
            currentLessonCourseId = coursesState.length > 0 ? coursesState[0].id : null;
        }

        // Clean up orphan student progress for this deleted course
        const usersDb = window.usersDatabase || [];
        usersDb.forEach(u => {
            try {
                localStorage.removeItem(`lms_progress_${u.empId}_${id}`);
            } catch(e) {}
        });
        if (window.supabaseClient) {
            window.supabaseClient.from('user_progress').delete().eq('course_id', id).then(() => {});
        }

        closeDeleteCourseModal();
        renderCoursesUI();
        renderCourseDropdowns();
        renderReportsTable();
        renderStandaloneQuizList();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();
        showAdminToast(`Da xoa vinh vien khoa hoc "${courseTitle}"!`);
    }

    // ==========================================
    // 2. MODULES & LESSONS MANAGEMENT (TAB 2)
    // ==========================================
    function renderCourseDropdowns() {
        const selectLesson = document.getElementById('lesson-course-select');
        const selectQuiz = document.getElementById('standalone-quiz-course-select');
        const editQuizCourse = document.getElementById('edit-quiz-course');
        const coursesState = window.coursesState || [];

        const optionsHtml = coursesState.map(c => `
            <option value="${c.id}">${c.title}</option>
        `).join('');

        if (selectLesson) {
            selectLesson.innerHTML = optionsHtml;
            if (!currentLessonCourseId && coursesState.length > 0) {
                currentLessonCourseId = coursesState[0].id;
            }
            if (currentLessonCourseId) {
                selectLesson.value = currentLessonCourseId;
            }
        }

        if (selectQuiz) selectQuiz.innerHTML = optionsHtml;
        if (editQuizCourse) editQuizCourse.innerHTML = optionsHtml;

        const quizFilterSelect = document.getElementById('quiz-list-filter-select');
        if (quizFilterSelect) {
            const currentFilterVal = quizFilterSelect.value || 'ALL';
            quizFilterSelect.innerHTML = `<option value="ALL">Tat Ca Cac Khoa Hoc (${coursesState.length} Khoa)</option>` + optionsHtml;
            quizFilterSelect.value = currentFilterVal;
        }

        if (currentLessonCourseId) {
            handleCourseSelectionChange(currentLessonCourseId);
        }
    }

    function handleCourseSelectionChange(courseId) {
        currentLessonCourseId = courseId;
        const coursesState = window.coursesState || [];
        const course = coursesState.find(c => c.id === courseId);
        if (!course) return;

        const metricsEl = document.getElementById('course-quick-metrics');
        const divisionsState = window.divisionsState || [];
        if (metricsEl) {
            const modCount = course.modules ? course.modules.length : (course.stats?.modules || 0);
            let totalVideos = 0;
            if (course.modules) {
                course.modules.forEach(m => {
                    const lList = window.LMSEngine ? window.LMSEngine.getModuleLessons(course, m) : (m.lessons || []);
                    totalVideos += lList.length;
                });
            } else {
                totalVideos = course.stats?.videos || 0;
            }

            const isPublic = !course.access || course.access === 'PUBLIC';
            const divObj = divisionsState.find(d => d.id === course.access);
            const accessText = isPublic ? 'Toan Bo Sales' : (divObj ? divObj.name : course.access);

            metricsEl.innerHTML = `
                <span class="badge-gold" style="font-size:0.75rem; padding:4px 12px; border-radius:20px; font-weight:700;"><i class="bi bi-collection"></i> ${modCount} Module</span>
                <span class="badge-forest" style="font-size:0.75rem; padding:4px 12px; border-radius:20px; font-weight:700;"><i class="bi bi-play-circle-fill"></i> ${totalVideos} Video Bai Giang</span>
                <span style="background:#e0e7ff; color:#2F2D74; font-size:0.75rem; padding:4px 12px; border-radius:20px; font-weight:700;"><i class="bi bi-shield-check"></i> ${accessText}</span>
            `;
        }

        const addCourseNameInput = document.getElementById('add-lesson-course-name');
        if (addCourseNameInput) {
            addCourseNameInput.value = course.title;
        }
        renderTargetModuleDropdown(course);
        renderCourseModulesTree(courseId);
        renderCourseSpecificQuizList(courseId);
    }

    function switchLessonsSubTab(tab) {
        document.querySelectorAll('#pane-lessons .filter-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('#pane-lessons .lessons-subpane').forEach(p => p.style.display = 'none');

        const btn = document.getElementById(`tab-btn-modules-${tab}`);
        if (btn) btn.classList.add('active');

        const subpane = document.getElementById(`subpane-modules-${tab}`);
        if (subpane) subpane.style.display = 'block';

        if (tab === 'list' && currentLessonCourseId) {
            renderCourseModulesTree(currentLessonCourseId);
        } else if (tab === 'quiz' && currentLessonCourseId) {
            renderCourseSpecificQuizList(currentLessonCourseId);
        }
    }

    function toggleModuleAddMode(mode) {
        const groupSelect = document.getElementById('group-select-existing-mod');
        const groupNew = document.getElementById('group-new-mod-title');
        const modTitleInput = document.getElementById('lesson-module-title');

        if (mode === 'new') {
            if (groupSelect) groupSelect.style.display = 'none';
            if (groupNew) groupNew.style.display = 'block';
            if (modTitleInput) modTitleInput.required = true;
        } else {
            if (groupSelect) groupSelect.style.display = 'block';
            if (groupNew) groupNew.style.display = 'none';
            if (modTitleInput) modTitleInput.required = false;
        }
    }

    function renderTargetModuleDropdown(course) {
        const selectEl = document.getElementById('lesson-target-module-select');
        if (!selectEl) return;

        if (!course.modules || course.modules.length === 0) {
            selectEl.innerHTML = `<option value="1">Module 1 (Mac dinh)</option>`;
            return;
        }

        selectEl.innerHTML = course.modules.map(m => `
            <option value="${m.id}">Module ${m.id}: ${m.title}</option>
        `).join('');
    }

    function renderCourseModulesTree(courseId) {
        const container = document.getElementById('course-modules-tree-container');
        if (!container) return;

        const coursesState = window.coursesState || [];
        const course = coursesState.find(c => c.id === courseId);
        if (!course) {
            container.innerHTML = `<div style="text-align:center; padding:30px; color:#64748b;">Vui long chon mot khoa hoc.</div>`;
            return;
        }

        if (!course.modules || course.modules.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:48px 20px; border:2px dashed #cbd5e1; border-radius:12px; background:#f8fafc;">
                    <i class="bi bi-collection" style="font-size:2.2rem; color:#94a3b8;"></i>
                    <h4 style="margin-top:10px; font-size:1rem; font-weight:800; color:#334155;">Khoa hoc "${course.title}" chua co Module bai giang nao</h4>
                    <p style="font-size:0.8rem; color:#64748b; margin-bottom:16px;">Hay bam nut ben duoi de them Module va bai giang video dau tien vao khoa hoc nay.</p>
                    <button class="btn btn-primary" onclick="switchLessonsSubTab('add')">
                        <i class="bi bi-plus-circle-fill"></i> + Them Module / Bai Giang Dau Tien
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = course.modules.map(mod => {
            const lessonsList = window.LMSEngine ? window.LMSEngine.getModuleLessons(course, mod) : (mod.lessons || []);
            const statusBadge = mod.status === 'completed' 
                ? '<span class="status-badge success"><i class="bi bi-check-circle-fill"></i> Da Hoan Thanh</span>' 
                : (mod.status === 'in-progress' 
                    ? '<span class="status-badge" style="background:#fef3c7; color:#b45309;"><i class="bi bi-play-circle-fill"></i> Dang Mo Hoc</span>' 
                    : '<span class="status-badge" style="background:#f1f5f9; color:#64748b;"><i class="bi bi-lock-fill"></i> Chua Mo Khoa</span>');

            const lessonsRowsHtml = lessonsList.map(les => {
                const lesStatusBadge = les.status === 'completed' 
                    ? '<span style="color:#0C5A3E; font-weight:700; font-size:0.72rem;"><i class="bi bi-check2"></i> Da hoc</span>' 
                    : (les.status === 'in-progress' 
                        ? '<span style="color:#b45309; font-weight:700; font-size:0.72rem;"><i class="bi bi-play-fill"></i> Dang hoc</span>' 
                        : '<span style="color:#94a3b8; font-size:0.72rem;"><i class="bi bi-lock"></i> Chua mo</span>');

                const safeCrsId = (course.id || '').replace(/'/g, "\\'");

                return `
                <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 14px; font-weight:700; color:#0f172a; font-size:0.82rem;">
                        <i class="bi bi-play-btn-fill" style="color:var(--primary); margin-right:6px;"></i>
                        ${escapeHtml(les.title)}
                    </td>
                    <td style="padding:10px 14px; font-size:0.78rem; color:#475569;">
                        <i class="bi bi-clock"></i> ${escapeHtml(les.duration || '15:00')}
                    </td>
                    <td style="padding:10px 14px;">
                        <button class="btn" style="padding:3px 10px; font-size:0.72rem; background:#fee2e2; color:#b91c1c; border:none; border-radius:4px;" onclick="previewLessonVideo('${safeCrsId}', ${mod.id}, ${les.id})">
                            <i class="bi bi-youtube"></i> Xem Video
                        </button>
                    </td>
                    <td style="padding:10px 14px;">${lesStatusBadge}</td>
                    <td style="padding:10px 14px; text-align:right;">
                        <div style="display:inline-flex; gap:6px;">
                            <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.72rem;" onclick="openEditLessonModal('${safeCrsId}', ${mod.id}, ${les.id})">
                                <i class="bi bi-pencil"></i> Sua
                            </button>
                            <button class="btn" style="padding:4px 8px; font-size:0.72rem; background:#fee2e2; color:#ef4444; border:none;" onclick="deleteLesson('${safeCrsId}', ${mod.id}, ${les.id})">
                                <i class="bi bi-trash"></i> Xoa
                            </button>
                        </div>
                    </td>
                </tr>
                `;
            }).join('');

            const safeCrsId = (course.id || '').replace(/'/g, "\\'");

            return `
            <div class="card-premium" style="border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:18px; background:#ffffff;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; border-bottom:1px solid #f1f5f9; padding-bottom:14px; margin-bottom:14px;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                            <span style="background:var(--primary); color:#ffffff; font-size:0.72rem; font-weight:800; padding:2px 8px; border-radius:4px;">MODULE 0${mod.id}</span>
                            ${statusBadge}
                            <span style="font-size:0.75rem; color:#64748b; font-weight:600;"><i class="bi bi-collection"></i> ${lessonsList.length} Video Bai Giang</span>
                            <span style="font-size:0.75rem; color:#64748b; font-weight:600;"><i class="bi bi-clock"></i> ${escapeHtml(mod.meta?.duration || '45 Phut')}</span>
                        </div>
                        <h3 style="font-size:1.05rem; font-weight:800; color:#0f172a; margin:4px 0;">${escapeHtml(mod.title)}</h3>
                        <p style="font-size:0.8rem; color:#64748b; margin:0; line-height:1.45;">${escapeHtml(mod.desc || 'Noi dung bai giang dao tao.')}</p>
                    </div>

                    <div style="display:flex; gap:8px; flex-shrink:0;">
                        <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem; font-weight:700;" onclick="openEditModuleModal('${safeCrsId}', ${mod.id})">
                            <i class="bi bi-pencil-square"></i> Sua Module
                        </button>
                        <button class="btn btn-primary" style="padding:6px 12px; font-size:0.75rem; font-weight:700;" onclick="openAddLessonToModule('${safeCrsId}', ${mod.id})">
                            <i class="bi bi-plus-lg"></i> + Them Bai Giang
                        </button>
                        <button class="btn" style="padding:6px 12px; font-size:0.75rem; background:#fee2e2; color:#ef4444; font-weight:700; border:none;" onclick="deleteModule('${safeCrsId}', ${mod.id})">
                            <i class="bi bi-trash3"></i> Xoa Module
                        </button>
                    </div>
                </div>

                <div class="table-responsive" style="margin-top:10px;">
                    <table style="width:100%; border-collapse:collapse; text-align:left;">
                        <thead>
                            <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; font-size:0.72rem; color:#64748b; text-transform:uppercase;">
                                <th style="padding:8px 14px;">Ten Bai Giang Video</th>
                                <th style="padding:8px 14px;">Thoi Luong</th>
                                <th style="padding:8px 14px;">Link Video</th>
                                <th style="padding:8px 14px;">Trang Thai</th>
                                <th style="padding:8px 14px; text-align:right;">Tuy Chinh</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${lessonsRowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
            `;
        }).join('');
    }

    function openAddLessonToModule(courseId, modId) {
        switchLessonsSubTab('add');
        const radioExisting = document.querySelector('input[name="module-add-mode"][value="existing"]');
        if (radioExisting) {
            radioExisting.checked = true;
            toggleModuleAddMode('existing');
        }
        const modSelect = document.getElementById('lesson-target-module-select');
        if (modSelect) {
            modSelect.value = modId;
        }
    }

    function handleAddLesson(event) {
        event.preventDefault();
        const courseId = currentLessonCourseId || document.getElementById('lesson-course-select').value;
        const coursesState = window.coursesState || [];
        const targetCourse = coursesState.find(c => c.id === courseId);
        if (!targetCourse) {
            showAdminToast('Vui long chon khoa hoc hop le!');
            return;
        }

        const addMode = document.querySelector('input[name="module-add-mode"]:checked')?.value || 'existing';
        const lessonName = document.getElementById('lesson-name-input').value.trim();
        const youtubeUrl = document.getElementById('lesson-youtube-url').value.trim();
        const duration = document.getElementById('lesson-duration-input').value.trim() || '15:00';
        const status = document.getElementById('lesson-status-select').value;

        if (!targetCourse.modules) targetCourse.modules = [];

        let targetMod = null;

        if (addMode === 'new') {
            const modTitle = document.getElementById('lesson-module-title').value.trim() || `Module ${targetCourse.modules.length + 1}`;
            const newModId = targetCourse.modules.length + 1;
            targetMod = {
                id: newModId,
                title: modTitle,
                desc: `Bai giang video: ${lessonName}.`,
                status: 'in-progress',
                statusText: 'Bat Dau Hoc',
                meta: { videos: 1, duration: duration, docs: '1 Video' },
                buttonText: 'Vao Hoc Module',
                buttonClass: 'btn-module primary',
                lessonId: newModId,
                youtubeUrl: youtubeUrl,
                lessons: []
            };
            targetCourse.modules.push(targetMod);
        } else {
            const targetModId = parseInt(document.getElementById('lesson-target-module-select').value) || 1;
            targetMod = targetCourse.modules.find(m => m.id === targetModId);
            if (!targetMod) {
                targetMod = targetCourse.modules[0];
            }
        }

        if (!targetMod) {
            targetMod = {
                id: 1,
                title: `Module 1: Nhap Mon Khoa Hoc`,
                desc: `Bai giang video: ${lessonName}.`,
                status: 'in-progress',
                statusText: 'Bat Dau Hoc',
                meta: { videos: 1, duration: duration, docs: '1 Video' },
                buttonText: 'Vao Hoc Module',
                buttonClass: 'btn-module primary',
                lessonId: 1,
                youtubeUrl: youtubeUrl,
                lessons: []
            };
            targetCourse.modules.push(targetMod);
        }

        if (!targetMod.lessons) {
            if (window.LMSEngine) {
                window.LMSEngine.getModuleLessons(targetCourse, targetMod);
            }
        }

        const newLessonId = (targetMod.lessons ? targetMod.lessons.length : 0) + 1;
        const newLesson = {
            id: newLessonId,
            title: lessonName,
            duration: duration,
            youtubeUrl: youtubeUrl,
            status: status
        };

        targetMod.lessons.push(newLesson);
        targetMod.meta.videos = targetMod.lessons.length;

        let totalVideos = 0;
        targetCourse.modules.forEach(m => {
            totalVideos += (m.lessons ? m.lessons.length : 1);
        });
        if (!targetCourse.stats) targetCourse.stats = { modules: targetCourse.modules.length, videos: totalVideos, duration: '2 Gio', materials: 2 };
        targetCourse.stats.modules = targetCourse.modules.length;
        targetCourse.stats.videos = totalVideos;
        targetCourse.desc = `Gom ${targetCourse.modules.length} Module - ${totalVideos} Video Bai Giang`;
        targetCourse.rawDesc = targetCourse.desc;

        if (window.StorageService) {
            window.StorageService.saveCourses(coursesState);
        }

        renderCoursesUI();
        handleCourseSelectionChange(courseId);
        switchLessonsSubTab('list');

        document.getElementById('add-lesson-form').reset();
        showAdminToast(`Da luu bai giang "${lessonName}" vao khoa "${targetCourse.title}"!`);
    }

    // EDIT MODULE
    function openEditModuleModal(courseId, modId) {
        const coursesState = window.coursesState || [];
        const course = coursesState.find(c => c.id === courseId);
        if (!course) return;
        const mod = course.modules?.find(m => m.id === modId);
        if (!mod) return;

        document.getElementById('edit-mod-course-id').value = courseId;
        document.getElementById('edit-mod-id').value = modId;
        document.getElementById('edit-mod-title').value = mod.title || '';
        document.getElementById('edit-mod-desc').value = mod.desc || '';
        document.getElementById('edit-mod-status').value = mod.status || 'in-progress';
        document.getElementById('edit-mod-duration').value = mod.meta?.duration || '45 Phut';

        document.getElementById('editModuleModal').style.display = 'flex';
    }

    function closeEditModuleModal() {
        document.getElementById('editModuleModal').style.display = 'none';
    }

    function handleSaveModuleEdit(event) {
        event.preventDefault();
        const courseId = document.getElementById('edit-mod-course-id').value;
        const modId = parseInt(document.getElementById('edit-mod-id').value);
        const title = document.getElementById('edit-mod-title').value.trim();
        const desc = document.getElementById('edit-mod-desc').value.trim();
        const status = document.getElementById('edit-mod-status').value;
        const duration = document.getElementById('edit-mod-duration').value.trim();

        const coursesState = window.coursesState || [];
        const course = coursesState.find(c => c.id === courseId);
        if (course && course.modules) {
            const mod = course.modules.find(m => m.id === modId);
            if (mod) {
                mod.title = title;
                mod.desc = desc;
                mod.status = status;
                mod.statusText = status === 'completed' ? 'Da Hoan Thanh' : (status === 'in-progress' ? 'Dang Hoc' : 'Chua Mo Khoa');
                if (!mod.meta) mod.meta = {};
                mod.meta.duration = duration;

                if (window.StorageService) {
                    window.StorageService.saveCourses(coursesState);
                }
            }
        }

        renderCourseModulesTree(courseId);
        renderCoursesUI();
        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();
        closeEditModuleModal();
        showAdminToast(`Da cap nhat Module "${title}"!`);
    }

    function deleteModule(courseId, modId) {
        const coursesState = window.coursesState || [];
        const course = coursesState.find(c => c.id === courseId);
        if (!course) return;
        const mod = course.modules?.find(m => m.id === modId);
        const modTitle = mod ? mod.title : `Module ${modId}`;

        if (!confirm(`XAC NHAN XOA MODULE:\n\nBan co chac chan muon xoa "${modTitle}" khong?\nToan bo cac video bai giang ben trong Module nay se bi xoa khoi khoa hoc.`)) {
            return;
        }

        course.modules = course.modules.filter(m => m.id !== modId);
        course.modules.forEach((m, idx) => { m.id = idx + 1; });

        let quizzesDb = window.quizzesDatabase || [];
        let quizzesChanged = false;
        quizzesDb = quizzesDb.filter(q => {
            if (q.courseId === courseId && (q.moduleId === modId || q.modId === modId)) {
                quizzesChanged = true;
                return false;
            }
            return true;
        });
        quizzesDb.forEach(q => {
            if (q.courseId === courseId) {
                if (q.moduleId > modId) { q.moduleId--; quizzesChanged = true; }
                if (q.modId > modId) { q.modId--; quizzesChanged = true; }
            }
        });
        if (quizzesChanged) {
            window.quizzesDatabase = quizzesDb;
            if (window.StorageService) {
                window.StorageService.saveQuizzes(quizzesDb);
            }
        }

        let totalVideos = 0;
        course.modules.forEach(m => {
            totalVideos += (m.lessons ? m.lessons.length : 1);
        });
        if (course.stats) {
            course.stats.modules = course.modules.length;
            course.stats.videos = totalVideos;
        }
        course.desc = `Gom ${course.modules.length} Module - ${totalVideos} Video Bai Giang`;
        course.rawDesc = course.desc;

        if (window.StorageService) {
            window.StorageService.saveCourses(coursesState);
        }

        renderCoursesUI();
        handleCourseSelectionChange(courseId);
        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();
        showAdminToast(`Da xoa "${modTitle}" thanh cong!`);
    }

    // EDIT LESSON
    function openEditLessonModal(courseId, modId, lessonId) {
        const coursesState = window.coursesState || [];
        const course = coursesState.find(c => c.id === courseId);
        if (!course) return;
        const mod = course.modules?.find(m => m.id === modId);
        if (!mod) return;
        const lessons = window.LMSEngine ? window.LMSEngine.getModuleLessons(course, mod) : (mod.lessons || []);
        const lesson = lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        document.getElementById('edit-lesson-course-id').value = courseId;
        document.getElementById('edit-lesson-mod-id').value = modId;
        document.getElementById('edit-lesson-id').value = lessonId;
        document.getElementById('edit-lesson-title').value = lesson.title || '';
        document.getElementById('edit-lesson-url').value = lesson.youtubeUrl || '';
        document.getElementById('edit-lesson-duration').value = lesson.duration || '15:00';
        document.getElementById('edit-lesson-status').value = lesson.status || 'in-progress';

        document.getElementById('editLessonModal').style.display = 'flex';
    }

    function closeEditLessonModal() {
        document.getElementById('editLessonModal').style.display = 'none';
    }

    function handleSaveLessonEdit(event) {
        event.preventDefault();
        const courseId = document.getElementById('edit-lesson-course-id').value;
        const modId = parseInt(document.getElementById('edit-lesson-mod-id').value);
        const lessonId = parseInt(document.getElementById('edit-lesson-id').value);
        const title = document.getElementById('edit-lesson-title').value.trim();
        const url = document.getElementById('edit-lesson-url').value.trim();
        const duration = document.getElementById('edit-lesson-duration').value.trim();
        const status = document.getElementById('edit-lesson-status').value;

        const coursesState = window.coursesState || [];
        const course = coursesState.find(c => c.id === courseId);
        if (course) {
            const mod = course.modules?.find(m => m.id === modId);
            if (mod) {
                const lessons = window.LMSEngine ? window.LMSEngine.getModuleLessons(course, mod) : (mod.lessons || []);
                const lesson = lessons.find(l => l.id === lessonId);
                if (lesson) {
                    lesson.title = title;
                    lesson.youtubeUrl = url;
                    lesson.duration = duration;
                    lesson.status = status;

                    if (window.StorageService) {
                        window.StorageService.saveCourses(coursesState);
                    }
                }
            }
        }

        renderCourseModulesTree(courseId);
        renderCoursesUI();
        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();
        closeEditLessonModal();
        showAdminToast(`Da luu bai giang "${title}"!`);
    }

    function deleteLesson(courseId, modId, lessonId) {
        const coursesState = window.coursesState || [];
        const course = coursesState.find(c => c.id === courseId);
        if (!course) return;
        const mod = course.modules?.find(m => m.id === modId);
        if (!mod) return;
        const lessons = window.LMSEngine ? window.LMSEngine.getModuleLessons(course, mod) : (mod.lessons || []);
        const targetLesson = lessons.find(l => l.id === lessonId);
        const lessonTitle = targetLesson ? targetLesson.title : `Bai ${lessonId}`;

        if (!confirm(`XAC NHAN XOA BAI GIANG:\n\nBan co chac chan muon xoa bai "${lessonTitle}" khong?`)) {
            return;
        }

        mod.lessons = lessons.filter(l => l.id !== lessonId);
        mod.lessons.forEach((l, idx) => { l.id = idx + 1; });

        if (!mod.meta) mod.meta = {};
        mod.meta.videos = mod.lessons.length;

        let totalVideos = 0;
        course.modules.forEach(m => {
            totalVideos += (m.lessons ? m.lessons.length : 1);
        });
        if (course.stats) course.stats.videos = totalVideos;

        if (window.StorageService) {
            window.StorageService.saveCourses(coursesState);
        }

        renderCourseModulesTree(courseId);
        renderCoursesUI();
        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();
        showAdminToast(`Da xoa bai giang "${lessonTitle}"!`);
    }

    // Video Preview Modal
    function previewLessonVideo(courseId, modId, lessonId) {
        const coursesState = window.coursesState || [];
        const course = coursesState.find(c => c.id === courseId);
        if (!course) return;
        const mod = (course.modules || []).find(m => m.id === modId);
        if (!mod) return;
        const lessons = window.LMSEngine ? window.LMSEngine.getModuleLessons(course, mod) : (mod.lessons || []);
        const les = lessons.find(l => l.id === lessonId);
        if (!les) return;
        openVideoPreviewModal(les.youtubeUrl || '', les.title || 'Bai giang');
    }

    function openVideoPreviewModal(url, title) {
        const modal = document.getElementById('videoPreviewModal');
        const titleEl = document.getElementById('preview-video-title');
        const urlLabel = document.getElementById('preview-video-url-label');
        const embedBox = document.getElementById('video-preview-embed-box');

        if (!modal) return;
        const safeTitle = escapeHtml(title || 'Bai Giang');
        if (titleEl) titleEl.textContent = `Xem Truoc: ${title || ''}`;
        if (urlLabel) urlLabel.textContent = `Nguon Video: ${url || ''}`;

        const ytMatch = url ? String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/) : null;
        if (ytMatch && ytMatch[1]) {
            const embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
            embedBox.innerHTML = `
                <iframe width="100%" height="100%" src="${embedUrl}" title="${safeTitle}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            `;
        } else {
            const safeMediaUrl = encodeURI(url || '');
            embedBox.innerHTML = `
                <video controls autoplay style="width:100%; height:100%; object-fit:contain;">
                    <source src="${safeMediaUrl}" type="video/mp4">
                    Trinh duyet khong ho tro xem video.
                </video>
            `;
        }

        modal.style.display = 'flex';
    }

    function closeVideoPreviewModal() {
        const modal = document.getElementById('videoPreviewModal');
        const embedBox = document.getElementById('video-preview-embed-box');
        if (embedBox) embedBox.innerHTML = '';
        if (modal) modal.style.display = 'none';
    }

    // ==========================================
    // 3. QUIZZES MANAGEMENT (TAB 3 & SUB-TAB 3)
    // ==========================================
    function handleCreateStandaloneQuiz(event) {
        event.preventDefault();
        const courseId = document.getElementById('standalone-quiz-course-select').value;
        const title = document.getElementById('standalone-quiz-title').value.trim();
        const a = document.getElementById('standalone-quiz-a').value.trim();
        const b = document.getElementById('standalone-quiz-b').value.trim();
        const c = document.getElementById('standalone-quiz-c').value.trim();
        const d = document.getElementById('standalone-quiz-d').value.trim();
        const correct = document.getElementById('standalone-quiz-correct').value;

        const newQuiz = {
            id: 'q_' + Date.now(),
            courseId: courseId,
            title: title,
            a: a,
            b: b,
            c: c,
            d: d,
            correct: correct
        };

        const quizzesDb = window.quizzesDatabase || [];
        quizzesDb.push(newQuiz);
        if (window.StorageService) {
            window.StorageService.saveQuizzes(quizzesDb);
        }

        renderStandaloneQuizList();
        if (currentLessonCourseId) {
            renderCourseSpecificQuizList(currentLessonCourseId);
        }
        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();

        const msg = document.getElementById('standalone-quiz-msg');
        if (msg) {
            msg.style.display = 'block';
            msg.textContent = `Da luu cau hoi thanh cong!`;
        }

        document.getElementById('standalone-quiz-form').reset();
        showAdminToast('Da them cau hoi trac nghiem moi!');
    }

    function renderStandaloneQuizList() {
        const container = document.getElementById('standalone-quiz-list-container');
        const totalBadge = document.getElementById('total-quizzes-badge');
        const filterEl = document.getElementById('quiz-list-filter-select');
        if (!container) return;

        const quizzesDb = window.quizzesDatabase || [];
        const coursesState = window.coursesState || [];
        const filterVal = filterEl ? filterEl.value : 'ALL';
        const filteredQuizzes = (filterVal && filterVal !== 'ALL') 
            ? quizzesDb.filter(q => q.courseId === filterVal) 
            : quizzesDb;

        if (totalBadge) {
            totalBadge.textContent = `${filteredQuizzes.length} Cau Hoi`;
        }

        if (filteredQuizzes.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:36px 16px; border:1px dashed #cbd5e1; border-radius:10px; color:#64748b; font-size:0.85rem; background:#f8fafc;">
                    <i class="bi bi-patch-question" style="font-size:2rem; color:#94a3b8; display:block; margin-bottom:8px;"></i>
                    Chua co cau hoi trac nghiem nao cho khoa hoc nay. Hay them cau hoi o form ben trai.
                </div>
            `;
            return;
        }

        container.innerHTML = filteredQuizzes.map((q, idx) => {
            const matchedCourse = coursesState.find(c => c.id === q.courseId);
            const courseName = matchedCourse ? matchedCourse.title : 'Khoa Hoc';
            const safeQId = (q.id || '').replace(/'/g, "\\'");

            return `
            <div style="border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px; margin-bottom:12px; background:#ffffff; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div>
                        <span style="font-size:0.7rem; background:#f1f5f9; color:#475569; padding:2px 8px; border-radius:4px; font-weight:700;">${escapeHtml(courseName)}</span>
                        <h4 style="font-size:0.9rem; font-weight:800; color:#0f172a; margin-top:4px;">Cau ${idx + 1}: ${escapeHtml(q.title)}</h4>
                    </div>
                    <div style="display:flex; gap:6px; flex-shrink:0;">
                        <button class="btn btn-secondary" style="padding:4px 10px; font-size:0.72rem;" onclick="openEditQuizModal('${safeQId}')">
                            <i class="bi bi-pencil"></i> Sua
                        </button>
                        <button class="btn" style="padding:4px 10px; font-size:0.72rem; background:#fee2e2; color:#ef4444; border:none;" onclick="deleteQuizQuestion('${safeQId}')">
                            <i class="bi bi-trash"></i> Xoa
                        </button>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.78rem; color:#475569; margin-top:10px;">
                    <div style="padding:6px 10px; border-radius:6px; ${q.correct === 'A' ? 'background:#ecfdf5; color:#065f46; font-weight:800; border:1px solid #a7f3d0;' : 'background:#f8fafc; border:1px solid #e2e8f0;'}">
                        A. ${escapeHtml(q.a)} ${q.correct === 'A' ? '<i class="bi bi-check2"></i> (Dap An)' : ''}
                    </div>
                    <div style="padding:6px 10px; border-radius:6px; ${q.correct === 'B' ? 'background:#ecfdf5; color:#065f46; font-weight:800; border:1px solid #a7f3d0;' : 'background:#f8fafc; border:1px solid #e2e8f0;'}">
                        B. ${escapeHtml(q.b)} ${q.correct === 'B' ? '<i class="bi bi-check2"></i> (Dap An)' : ''}
                    </div>
                    <div style="padding:6px 10px; border-radius:6px; ${q.correct === 'C' ? 'background:#ecfdf5; color:#065f46; font-weight:800; border:1px solid #a7f3d0;' : 'background:#f8fafc; border:1px solid #e2e8f0;'}">
                        C. ${escapeHtml(q.c)} ${q.correct === 'C' ? '<i class="bi bi-check2"></i> (Dap An)' : ''}
                    </div>
                    <div style="padding:6px 10px; border-radius:6px; ${q.correct === 'D' ? 'background:#ecfdf5; color:#065f46; font-weight:800; border:1px solid #a7f3d0;' : 'background:#f8fafc; border:1px solid #e2e8f0;'}">
                        D. ${escapeHtml(q.d)} ${q.correct === 'D' ? '<i class="bi bi-check2"></i> (Dap An)' : ''}
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    function renderCourseSpecificQuizList(courseId) {
        const container = document.getElementById('course-specific-quiz-list-container');
        const heading = document.getElementById('course-quiz-title-heading');
        if (!container) return;

        const coursesState = window.coursesState || [];
        const course = coursesState.find(c => c.id === courseId);
        if (heading && course) {
            heading.textContent = `Bo De Trac Nghiem Thuoc: "${course.title}"`;
        }

        const quizzesDb = window.quizzesDatabase || [];
        const quizzes = quizzesDb.filter(q => q.courseId === courseId);
        if (quizzes.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:36px 16px; border:1px dashed #cbd5e1; border-radius:10px; color:#64748b; font-size:0.85rem; background:#f8fafc;">
                    <i class="bi bi-patch-question" style="font-size:2.2rem; color:#94a3b8; display:block; margin-bottom:8px;"></i>
                    Khoa hoc nay hien chua co cau hoi trac nghiem nao.
                    <div style="margin-top:12px;">
                        <button class="btn btn-primary" onclick="openQuickAddQuizForCurrentCourse()">
                            <i class="bi bi-plus-lg"></i> Them Cau Hoi Dau Tien Cho Khoa Nay
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = quizzes.map((q, idx) => {
            const safeQId = (q.id || '').replace(/'/g, "\\'");
            return `
            <div style="border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px; margin-bottom:12px; background:#ffffff; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div>
                        <span style="font-size:0.7rem; background:#e0e7ff; color:#2F2D74; padding:2px 8px; border-radius:4px; font-weight:700;">CAU HOI ${idx + 1}</span>
                        <h4 style="font-size:0.92rem; font-weight:800; color:#0f172a; margin-top:4px;">${escapeHtml(q.title)}</h4>
                    </div>
                    <div style="display:flex; gap:6px; flex-shrink:0;">
                        <button class="btn btn-secondary" style="padding:4px 10px; font-size:0.72rem;" onclick="openEditQuizModal('${safeQId}')">
                            <i class="bi bi-pencil"></i> Sua Cau Hoi
                        </button>
                        <button class="btn" style="padding:4px 10px; font-size:0.72rem; background:#fee2e2; color:#ef4444; border:none;" onclick="deleteQuizQuestion('${safeQId}')">
                            <i class="bi bi-trash"></i> Xoa
                        </button>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.78rem; color:#475569; margin-top:8px;">
                    <div style="padding:6px 10px; border-radius:6px; ${q.correct === 'A' ? 'background:#ecfdf5; color:#065f46; font-weight:800; border:1px solid #a7f3d0;' : 'background:#f8fafc; border:1px solid #e2e8f0;'}">
                        A. ${escapeHtml(q.a)} ${q.correct === 'A' ? '<i class="bi bi-check2"></i> (Dap An Dung)' : ''}
                    </div>
                    <div style="padding:6px 10px; border-radius:6px; ${q.correct === 'B' ? 'background:#ecfdf5; color:#065f46; font-weight:800; border:1px solid #a7f3d0;' : 'background:#f8fafc; border:1px solid #e2e8f0;'}">
                        B. ${escapeHtml(q.b)} ${q.correct === 'B' ? '<i class="bi bi-check2"></i> (Dap An Dung)' : ''}
                    </div>
                    <div style="padding:6px 10px; border-radius:6px; ${q.correct === 'C' ? 'background:#ecfdf5; color:#065f46; font-weight:800; border:1px solid #a7f3d0;' : 'background:#f8fafc; border:1px solid #e2e8f0;'}">
                        C. ${escapeHtml(q.c)} ${q.correct === 'C' ? '<i class="bi bi-check2"></i> (Dap An Dung)' : ''}
                    </div>
                    <div style="padding:6px 10px; border-radius:6px; ${q.correct === 'D' ? 'background:#ecfdf5; color:#065f46; font-weight:800; border:1px solid #a7f3d0;' : 'background:#f8fafc; border:1px solid #e2e8f0;'}">
                        D. ${escapeHtml(q.d)} ${q.correct === 'D' ? '<i class="bi bi-check2"></i> (Dap An Dung)' : ''}
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    function openQuickAddQuizForCurrentCourse() {
        switchNav('quiz');
        const selectEl = document.getElementById('standalone-quiz-course-select');
        if (selectEl && currentLessonCourseId) {
            selectEl.value = currentLessonCourseId;
            renderStandaloneQuizList();
        }
    }

    function openEditQuizModal(quizId) {
        const quizzesDb = window.quizzesDatabase || [];
        const coursesState = window.coursesState || [];
        const quiz = quizzesDb.find(q => q.id === quizId);
        if (!quiz) return;

        document.getElementById('edit-quiz-id').value = quiz.id;
        document.getElementById('edit-quiz-course').value = quiz.courseId || coursesState[0]?.id;
        document.getElementById('edit-quiz-title').value = quiz.title || '';
        document.getElementById('edit-quiz-opt-a').value = quiz.a || '';
        document.getElementById('edit-quiz-opt-b').value = quiz.b || '';
        document.getElementById('edit-quiz-opt-c').value = quiz.c || '';
        document.getElementById('edit-quiz-opt-d').value = quiz.d || '';
        document.getElementById('edit-quiz-correct').value = quiz.correct || 'A';

        document.getElementById('editQuizModal').style.display = 'flex';
    }

    function closeEditQuizModal() {
        document.getElementById('editQuizModal').style.display = 'none';
    }

    function handleSaveQuizEdit(event) {
        event.preventDefault();
        const id = document.getElementById('edit-quiz-id').value;
        const courseId = document.getElementById('edit-quiz-course').value;
        const title = document.getElementById('edit-quiz-title').value.trim();
        const a = document.getElementById('edit-quiz-opt-a').value.trim();
        const b = document.getElementById('edit-quiz-opt-b').value.trim();
        const c = document.getElementById('edit-quiz-opt-c').value.trim();
        const d = document.getElementById('edit-quiz-opt-d').value.trim();
        const correct = document.getElementById('edit-quiz-correct').value;

        const quizzesDb = window.quizzesDatabase || [];
        const quiz = quizzesDb.find(q => q.id === id);
        if (quiz) {
            quiz.courseId = courseId;
            quiz.title = title;
            quiz.a = a;
            quiz.b = b;
            quiz.c = c;
            quiz.d = d;
            quiz.correct = correct;

            if (window.StorageService) {
                window.StorageService.saveQuizzes(quizzesDb);
            }
        }

        renderStandaloneQuizList();
        if (currentLessonCourseId) {
            renderCourseSpecificQuizList(currentLessonCourseId);
        }
        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();
        closeEditQuizModal();
        showAdminToast('Da cap nhat cau hoi trac nghiem thanh cong!');
    }

    function deleteQuizQuestion(quizId) {
        let quizzesDb = window.quizzesDatabase || [];
        const quiz = quizzesDb.find(q => q.id === quizId);
        const qTitle = quiz ? quiz.title : 'cau hoi nay';

        if (!confirm(`XAC NHAN XOA CAU HOI:\n\nBan co chac chan muon xoa cau hoi:\n"${qTitle}" khong?`)) {
            return;
        }

        quizzesDb = quizzesDb.filter(q => q.id !== quizId);
        window.quizzesDatabase = quizzesDb;
        if (window.StorageService) {
            window.StorageService.saveQuizzes(quizzesDb);
        }

        renderStandaloneQuizList();
        if (currentLessonCourseId) {
            renderCourseSpecificQuizList(currentLessonCourseId);
        }
        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();
        showAdminToast('Da xoa cau hoi trac nghiem!');
    }

    // ==========================================
    // 4. DIVISIONS MANAGEMENT (TAB 4)
    // ==========================================
    function renderDivisionsUI() {
        const listContainer = document.getElementById('divisions-list-container');
        const teamSelect = document.getElementById('team-div-select');
        const courseAccessSelect = document.getElementById('new-course-access');
        const divisionsState = window.divisionsState || [];
        const coursesState = window.coursesState || [];
        const escapeHtml = window.escapeHtml || (s => s);

        if (listContainer) {
            listContainer.innerHTML = divisionsState.map(div => {
                const assignedCourses = coursesState.filter(c => c.access === div.id);
                const safeDivId = (div.id || '').replace(/'/g, "\\'");
                const teamsBadges = div.teams.map(t => {
                    const safeT = (t || '').replace(/'/g, "\\'");
                    return `<span style="display:inline-flex; align-items:center; gap:4px; background:#e0e7ff; color:#2F2D74; padding:2px 8px; border-radius:4px; font-size:0.72rem; font-weight:700; margin-right:4px; margin-bottom:4px;">${escapeHtml(t)} <i class="bi bi-x-circle-fill" style="cursor:pointer; color:#ef4444; font-size:0.75rem;" title="Xoa phong ${escapeHtml(t)}" onclick="deleteTeam('${safeDivId}', '${safeT}')"></i></span>`;
                }).join('');

                return `
                <div style="border:1px solid #cbd5e1; border-radius:10px; padding:16px; margin-bottom:14px; background:#fff; box-shadow:0 2px 4px rgba(0,0,0,0.03);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="background:var(--primary); color:#fff; font-size:0.72rem; font-weight:800; padding:2px 8px; border-radius:4px;">MA: ${escapeHtml(div.id)}</span>
                                <h4 style="font-size:1rem; font-weight:800; color:#0f172a;">${escapeHtml(div.name)}</h4>
                            </div>
                            <div style="margin-top:8px;">
                                <span style="font-size:0.75rem; color:#64748b; font-weight:700; display:block; margin-bottom:4px;">Phong Sales Truc Thuoc (${div.teams.length} phong):</span>
                                <div>${teamsBadges || '<em style="font-size:0.72rem; color:#94a3b8;">Chua co phong</em>'}</div>
                            </div>
                            <div style="margin-top:8px; font-size:0.75rem; color:#0C5A3E; font-weight:700;">
                                <i class="bi bi-journal-check"></i> ${assignedCourses.length} Khoa hoc danh rieng cho Khoi nay
                            </div>
                        </div>
                        <button class="btn" style="padding:5px 10px; font-size:0.72rem; background:#fee2e2; color:#ef4444; border:none;" onclick="deleteDivision('${safeDivId}')">
                            <i class="bi bi-trash"></i> Xoa Khoi
                        </button>
                    </div>
                </div>
                `;
            }).join('');
        }

        if (teamSelect) {
            teamSelect.innerHTML = divisionsState.map(d => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.name)} (${escapeHtml(d.id)})</option>`).join('');
        }

        if (courseAccessSelect) {
            let optionsHtml = `<option value="PUBLIC">Mo Cong Khai Cho Tat Ca Sales</option>`;
            divisionsState.forEach(d => {
                optionsHtml += `<option value="${d.id}">Gan Rieng Cho ${d.name}</option>`;
            });
            courseAccessSelect.innerHTML = optionsHtml;
        }
    }

    function handleCreateDivision(event) {
        event.preventDefault();
        const name = document.getElementById('new-div-name').value.trim();
        const id = document.getElementById('new-div-id').value.trim().toUpperCase();
        const teamsRaw = document.getElementById('new-div-teams').value;

        const divisionsState = window.divisionsState || [];
        if (divisionsState.some(d => d.id === id)) {
            showAdminToast(`Ma Khoi "${id}" da ton tai! Vui long nhap Ma Khoi khac.`);
            return;
        }

        const teamsList = teamsRaw.split(',').map(t => t.trim()).filter(t => t.length > 0);
        const newDiv = {
            id: id,
            name: name,
            teams: teamsList.length > 0 ? teamsList : [`Phong KD ${id}-01`]
        };

        divisionsState.push(newDiv);
        if (window.StorageService) {
            window.StorageService.saveDivisions(divisionsState);
        }

        renderDivisionsUI();
        renderCoursesUI();
        renderCourseDropdowns();
        renderAdminStudentsUI();
        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();

        const msg = document.getElementById('create-div-msg');
        if (msg) {
            msg.style.display = 'block';
            msg.textContent = `Da tao thanh cong "${name}"! Khoi moi da cap nhat vao Menu Gan Khoa Hoc.`;
        }

        document.getElementById('create-div-form').reset();
        showAdminToast(`Da tao Khoi Kinh Doanh: ${name}!`);
    }

    function handleAddTeam(event) {
        event.preventDefault();
        const divId = document.getElementById('team-div-select').value;
        const teamName = document.getElementById('new-team-name').value.trim();

        const divisionsState = window.divisionsState || [];
        const targetDiv = divisionsState.find(d => d.id === divId);
        if (targetDiv) {
            if (!targetDiv.teams.includes(teamName)) {
                targetDiv.teams.push(teamName);
                if (window.StorageService) {
                    window.StorageService.saveDivisions(divisionsState);
                }
                renderDivisionsUI();
                renderReportsTable();
                renderLeaderboardUI();
                updateAdminKPICards();
                updateDivisionChart();
                showAdminToast(`Da them "${teamName}" vao ${targetDiv.name}!`);
            } else {
                showAdminToast(`Phong "${teamName}" da co trong ${targetDiv.name}!`);
            }
        }
        document.getElementById('add-team-form').reset();
    }

    function deleteTeam(divId, teamName) {
        const divisionsState = window.divisionsState || [];
        const targetDiv = divisionsState.find(d => d.id === divId);
        if (!targetDiv) return;

        if (!confirm(`XAC NHAN XOA PHONG:\n\nBan co chac muon xoa "${teamName}" khoi Khoi ${targetDiv.name}?`)) {
            return;
        }

        targetDiv.teams = targetDiv.teams.filter(t => t !== teamName);
        if (window.StorageService) {
            window.StorageService.saveDivisions(divisionsState);
        }
        renderDivisionsUI();
        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();
        showAdminToast(`Da xoa phong "${teamName}" thanh cong!`);
    }

    function deleteDivision(divId) {
        let divisionsState = window.divisionsState || [];
        let coursesState = window.coursesState || [];
        let usersDb = window.usersDatabase || [];

        const div = divisionsState.find(d => d.id === divId);
        const divName = div ? div.name : divId;
        const assignedCourses = coursesState.filter(c => c.access === divId);

        let warningMsg = `XAC NHAN XOA KHOI KINH DOANH:\n\nBan co chac chan muon xoa "${divName}" (${divId}) khong?`;
        if (assignedCourses.length > 0) {
            warningMsg += `\n\nCANH BAO: Khoi nay dang co ${assignedCourses.length} khoa hoc gan rieng. Sau khi xoa, cac khoa hoc nay se tu dong chuyen sang dang Cong Khai (PUBLIC).`;
        }

        if (!confirm(warningMsg)) return;

        coursesState.forEach(c => {
            if (c.access === divId) c.access = 'PUBLIC';
        });
        if (window.StorageService) {
            window.StorageService.saveCourses(coursesState);
        }

        divisionsState = divisionsState.filter(d => d.id !== divId);
        window.divisionsState = divisionsState;
        if (window.StorageService) {
            window.StorageService.saveDivisions(divisionsState);
        }

        const fallbackDiv = divisionsState.length > 0 ? divisionsState[0] : { id: 'DIV1', teams: ['Phong KD 101'] };
        usersDb.forEach(u => {
            if (u.div === divId) {
                u.div = fallbackDiv.id;
                u.team = (fallbackDiv.teams && fallbackDiv.teams.length > 0) ? fallbackDiv.teams[0] : 'Phong KD Mac Dinh';
            }
        });
        if (window.StorageService) {
            window.StorageService.saveUsers(usersDb);
        }

        renderDivisionsUI();
        renderCoursesUI();
        renderCourseDropdowns();
        renderAdminStudentsUI();
        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();
        showAdminToast(`Da xoa thanh cong Khoi "${divName}"!`);
    }

    // ==========================================
    // 5. SALES STUDENTS MANAGEMENT (TAB 5)
    // ==========================================
    function updateStudentTeamOptions() {
        const divSelect = document.getElementById('admin-student-div');
        const teamSelect = document.getElementById('admin-student-team');
        if (!divSelect || !teamSelect) return;
        const selectedDivId = divSelect.value;
        const divisionsState = window.divisionsState || [];
        const escapeHtml = window.escapeHtml || (s => s);
        const targetDiv = divisionsState.find(d => d.id === selectedDivId);
        if (targetDiv && targetDiv.teams && targetDiv.teams.length > 0) {
            teamSelect.innerHTML = targetDiv.teams.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
        } else {
            teamSelect.innerHTML = `<option value="Phong KD Mac Dinh">Phong KD Mac Dinh</option>`;
        }
    }

    function renderAdminStudentsUI() {
        const tbody = document.getElementById('admin-students-table-body');
        const totalBadge = document.getElementById('total-students-badge');
        const divSelect = document.getElementById('admin-student-div');
        const divisionsState = window.divisionsState || [];
        const usersDb = window.usersDatabase || [];

        if (divSelect) {
            divSelect.innerHTML = divisionsState.map(d => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.name)} (${escapeHtml(d.id)})</option>`).join('');
            updateStudentTeamOptions();
        }

        if (totalBadge) {
            totalBadge.textContent = `${usersDb.length} Sales`;
        }

        if (!tbody) return;

        tbody.innerHTML = usersDb.map(u => {
            const divObj = divisionsState.find(d => d.id === u.div);
            const divName = divObj ? divObj.name : u.div;
            const safeEmpId = (u.empId || '').replace(/'/g, "\\'");

            return `
            <tr>
                <td style="font-weight:700; color:#0f172a;">${escapeHtml(u.name)}</td>
                <td><strong style="color:var(--primary); font-family:var(--font-label);">${escapeHtml(u.empId)}</strong></td>
                <td>
                    <span class="status-badge" style="background:#e0e7ff; color:#2F2D74; font-size:0.75rem;">${escapeHtml(u.team)}</span>
                    <div style="font-size:0.7rem; color:#64748b; margin-top:2px;">${escapeHtml(divName)}</div>
                </td>
                <td>
                    <span class="status-badge success"><i class="bi bi-check-circle-fill"></i> Da Kich Hoat</span>
                </td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.72rem; border-color:#cbd5e1;" onclick="resetAdminStudentProgress('${safeEmpId}')" title="Dat lai tien do hoc tap">
                            <i class="bi bi-arrow-counterclockwise"></i> Reset
                        </button>
                        <button class="btn" style="padding:4px 8px; font-size:0.72rem; background:#fee2e2; color:#ef4444; border:none;" onclick="deleteAdminStudent('${safeEmpId}')" title="Thu hoi tai khoan">
                            <i class="bi bi-person-x"></i> Thu Hoi
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    function handleAdminCreateStudent(event) {
        event.preventDefault();
        const name = document.getElementById('admin-student-name').value.trim();
        const empId = document.getElementById('admin-student-empid').value.trim().toUpperCase();
        const div = document.getElementById('admin-student-div').value;
        const team = document.getElementById('admin-student-team').value.trim();
        const pass = document.getElementById('admin-student-pass').value;

        const usersDb = window.usersDatabase || [];
        if (usersDb.some(u => u.empId === empId)) {
            showAdminToast(`Ma nhan vien "${empId}" da ton tai tren he thong! Vui long kiem tra lai.`);
            return;
        }

        const newUser = { empId, name, div, team, pass };
        usersDb.push(newUser);
        if (window.StorageService) {
            window.StorageService.saveUsers(usersDb);
        }

        // Sync new user to Cloud Database
        if (window.supabaseClient) {
            window.supabaseClient.from('users').insert({
                emp_id: empId,
                name: name,
                division: div,
                team: team,
                password: pass,
                role: 'student'
            }).then(({ error }) => {
                if (error) console.warn('[QueenLand Admin] Cloud user insert notice:', error.message);
            });
        }

        renderAdminStudentsUI();
        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();

        const msg = document.getElementById('admin-create-student-msg');
        if (msg) {
            msg.style.display = 'block';
            msg.textContent = `Da cap tai khoan thanh cong cho Sales: ${name} (${empId})! Mat khau: ${pass}`;
        }

        document.getElementById('admin-create-student-form').reset();
        document.getElementById('admin-student-pass').value = '123456';
        showAdminToast(`Da cap tai khoan moi cho Sales: ${name}!`);
    }

    function resetAdminStudentProgress(empId) {
        const usersDb = window.usersDatabase || [];
        const user = usersDb.find(u => u.empId === empId);
        if (!user) return;

        if (!confirm(`XAC NHAN DAT LAI TIEN DO:\n\nBan co chac muon dat lai toan bo tien do hoc va ket qua bai thi cua Sales "${user.name} (${user.empId})"?\n\nHoc vien se hoc lai tu bai dau tien.`)) {
            return;
        }

        const coursesState = window.coursesState || [];
        coursesState.forEach(c => {
            localStorage.removeItem(`lms_progress_${empId}_${c.id}`);
        });

        if (window.supabaseClient) {
            window.supabaseClient.from('user_progress').delete().eq('emp_id', empId).then(() => {});
        }

        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();
        showAdminToast(`Da dat lai tien do hoc tap cho: ${user.name}!`);
    }

    function deleteAdminStudent(empId) {
        const usersDb = window.usersDatabase || [];
        const user = usersDb.find(u => u.empId === empId);
        const userName = user ? `${user.name} (${user.empId})` : empId;

        if (!confirm(`XAC NHAN THU HOI TAI KHOAN:\n\nBan co chac chan muon thu hoi tai khoan cua Sales "${userName}" khong?\n\nNhan vien nay se bi dang xuat va khong the truy cap lo trinh bai giang nua.`)) {
            return;
        }

        const filtered = usersDb.filter(u => u.empId !== empId);
        window.usersDatabase = filtered;
        if (window.StorageService) {
            window.StorageService.saveUsers(filtered);
        }

        const coursesState = window.coursesState || [];
        coursesState.forEach(c => {
            localStorage.removeItem(`lms_progress_${empId}_${c.id}`);
        });

        if (window.supabaseClient) {
            window.supabaseClient.from('users').delete().eq('emp_id', empId).then(() => {});
            window.supabaseClient.from('user_progress').delete().eq('emp_id', empId).then(() => {});
        }

        const currentUser = JSON.parse(localStorage.getItem('lms_current_user') || 'null');
        if (currentUser && currentUser.empId === empId) {
            localStorage.removeItem('lms_current_user');
        }

        renderAdminStudentsUI();
        renderReportsTable();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();
        showAdminToast(`Da thu hoi tai khoan cua nhan vien: ${userName}!`);
    }

    function toggleSelfRegMode() {
        allowSelfReg = !allowSelfReg;
        localStorage.setItem('lms_allow_self_reg', allowSelfReg ? 'true' : 'false');
        updateSelfRegButtonUI();
        showAdminToast(allowSelfReg ? 'Da BAT cho phep Sales tu dang ky tai khoan!' : 'Da TAT tu dang ky: Chi Admin moi duoc cap tai khoan!');
    }

    function updateSelfRegButtonUI() {
        const btn = document.getElementById('toggle-self-reg-btn');
        if (!btn) return;
        if (allowSelfReg) {
            btn.textContent = 'BAT';
            btn.className = 'toggle-switch-btn on';
        } else {
            btn.textContent = 'TAT (Chi Admin Cap)';
            btn.className = 'toggle-switch-btn off';
        }
    }

    // ==========================================
    // 6. REPORTS & PROGRESS MONITORING (TAB 6)
    // ==========================================
    function renderReportsTable() {
        const tbody = document.getElementById('reports-table-body') || document.querySelector('#pane-reports .data-table tbody');
        if (!tbody) return;

        const divisionsState = window.divisionsState || [];
        const coursesState = window.coursesState || [];
        const usersDb = window.usersDatabase || [];
        const escapeHtml = window.escapeHtml || (s => s);

        const divSelect = document.getElementById('report-division-filter');
        if (divSelect) {
            const currentDivVal = divSelect.value || 'ALL';
            let divOpts = '<option value="ALL">Tat Ca Cac Khoi</option>';
            divisionsState.forEach(d => {
                divOpts += `<option value="${d.id}">${escapeHtml(d.name)}</option>`;
            });
            divSelect.innerHTML = divOpts;
            divSelect.value = currentDivVal;
        }

        const courseSelect = document.getElementById('report-course-filter');
        if (courseSelect) {
            const currentCourseVal = courseSelect.value || 'ALL';
            let courseOpts = '<option value="ALL">Tat Ca Khoa Hoc</option>';
            coursesState.forEach(c => {
                courseOpts += `<option value="${c.id}">${escapeHtml(c.title)}</option>`;
            });
            courseSelect.innerHTML = courseOpts;
            courseSelect.value = currentCourseVal;
        }

        const searchInput = document.getElementById('report-search-input');
        const kw = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const targetDiv = divSelect ? divSelect.value : 'ALL';
        const targetCourseId = courseSelect ? courseSelect.value : 'ALL';

        const filteredUsers = usersDb.filter(u => {
            if (targetDiv !== 'ALL' && u.div !== targetDiv) return false;
            if (kw) {
                const nameMatch = (u.name || '').toLowerCase().includes(kw);
                const empIdMatch = (u.empId || '').toLowerCase().includes(kw);
                const teamMatch = (u.team || '').toLowerCase().includes(kw);
                if (!nameMatch && !empIdMatch && !teamMatch) return false;
            }
            return true;
        });

        if (filteredUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:32px; color:#64748b; font-size:0.85rem;">
                        <i class="bi bi-person-x" style="font-size:1.8rem; color:#94a3b8; display:block; margin-bottom:6px;"></i>
                        Khong tim thay nhan su Sales nao phu hop voi bo loc hien tai.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredUsers.map(u => {
            const divObj = divisionsState.find(d => d.id === u.div);
            const divName = divObj ? `${u.team} - ${divObj.name}` : `${u.team} - ${u.div}`;
            const userCourses = coursesState.filter(c => c.access === 'PUBLIC' || c.access === u.div);

            let targetCourse = null;
            if (targetCourseId !== 'ALL') {
                targetCourse = coursesState.find(c => c.id === targetCourseId);
            } else {
                targetCourse = userCourses[0] || coursesState[0];
            }

            if (!targetCourse) {
                return `
                <tr>
                    <td style="font-weight:700; color:#0f172a;">${escapeHtml(u.name)}</td>
                    <td><strong style="color:var(--primary); font-family:var(--font-label);">${escapeHtml(u.empId)}</strong></td>
                    <td><span class="status-badge" style="background:#e0e7ff; color:#2F2D74; font-size:0.75rem;">${escapeHtml(divName)}</span></td>
                    <td colspan="3" style="color:#94a3b8; font-size:0.75rem;">Chua gan khoa hoc</td>
                </tr>
                `;
            }

            const status = window.LMSEngine ? window.LMSEngine.calculateUserCourseModuleStatus(u.empId, targetCourse) : { totalPct: 0, summaryLines: '', modulesDetail: [] };
            const statusBadgeClass = status.totalPct === 100 ? 'status-badge success' : (status.totalPct > 0 ? 'badge-gold' : 'status-badge');
            const statusLabel = status.totalPct === 100 ? 'Hoan Thanh' : (status.totalPct > 0 ? 'Dang Hoc' : 'Chua Hoc');
            const safeEmpId = (u.empId || '').replace(/'/g, "\\'");
            const safeCrsId = (targetCourse.id || '').replace(/'/g, "\\'");

            const modulesIndicatorsHtml = status.modulesDetail.map(m => `
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:4px 8px; font-size:0.72rem; min-width:140px; box-shadow:0 1px 2px rgba(0,0,0,0.02);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                        <strong style="color:#1e293b;">M0${m.id}</strong>
                        <span style="font-weight:800; color:${m.statusColor}; background:${m.badgeBg}; padding:1px 5px; border-radius:4px; font-size:0.65rem;">
                            ${m.percent}%
                        </span>
                    </div>
                    <div style="font-size:0.68rem; color:#64748b;">
                        Vid: <strong>${m.doneLessons}/${m.totalLessons}</strong> | Quiz: <strong>${m.isQuizPassed ? '<span style="color:#0C5A3E;">Dat</span>' : '<span style="color:#94a3b8;">Chua</span>'}</strong>
                    </div>
                </div>
            `).join('');

            return `
            <tr>
                <td style="font-weight:700; color:#0f172a;">
                    ${escapeHtml(u.name)}
                    <div style="font-size:0.7rem; color:#64748b; font-weight:normal;">Role: Sales Consult</div>
                </td>
                <td><strong style="color:var(--primary); font-family:var(--font-label);">${escapeHtml(u.empId)}</strong></td>
                <td>
                    <span class="status-badge" style="background:#e0e7ff; color:#2F2D74; font-size:0.75rem;">${escapeHtml(u.team)}</span>
                    <div style="font-size:0.7rem; color:#64748b; margin-top:2px;">${escapeHtml(divObj ? divObj.name : u.div)}</div>
                </td>
                <td>
                    <div style="font-weight:700; font-size:0.82rem; color:#1e293b; margin-bottom:4px;">${escapeHtml(targetCourse.title)}</div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <strong style="color:var(--primary); font-size:0.9rem;">${status.totalPct}%</strong>
                        <div style="flex:1; background:#e2e8f0; height:6px; border-radius:3px; overflow:hidden; min-width:80px;">
                            <div style="width:${status.totalPct}%; height:100%; background:var(--primary);"></div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display:flex; flex-wrap:wrap; gap:6px;">
                        ${modulesIndicatorsHtml || '<span style="color:#94a3b8; font-size:0.72rem;">Chua co module</span>'}
                    </div>
                </td>
                <td>
                    <span class="${statusBadgeClass}" style="font-size:0.72rem; padding:3px 8px; border-radius:12px; font-weight:700; margin-bottom:4px; display:inline-block;">
                        ${statusLabel}
                    </span>
                    <button class="btn btn-secondary" style="padding:3px 8px; font-size:0.7rem; display:block; margin-top:2px;" onclick="openSalesModal('${safeEmpId}', '${safeCrsId}')">
                        <i class="bi bi-eye"></i> Chi Tiet
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    }

    // ==========================================
    // 7. LEADERBOARD & KPIS (TAB 7)
    // ==========================================
    function renderLeaderboardUI() {
        const podiumEl = document.getElementById('leaderboard-podium');
        const tbody = document.getElementById('leaderboard-table-body');
        if (!podiumEl || !tbody) return;

        const usersDb = window.usersDatabase || [];
        const coursesState = window.coursesState || [];
        const divisionsState = window.divisionsState || [];
        const escapeHtml = window.escapeHtml || (s => s);

        const ranking = window.LMSEngine 
            ? window.LMSEngine.calculateLeaderboardStats(usersDb, coursesState, divisionsState)
            : [];

        const top1 = ranking[0] || { team: 'Chua co', avgProgress: 0, divName: '---', membersCount: 0 };
        const top2 = ranking[1] || { team: 'Chua co', avgProgress: 0, divName: '---', membersCount: 0 };
        const top3 = ranking[2] || { team: 'Chua co', avgProgress: 0, divName: '---', membersCount: 0 };

        podiumEl.innerHTML = `
            <div class="card-premium" style="background:linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border:2px solid #10b981; padding:20px; border-radius:14px; text-align:center; box-shadow:0 10px 20px rgba(16,185,129,0.15);">
                <div style="width:48px; height:48px; border-radius:50%; background:#10b981; color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:1.4rem; font-weight:900; margin:0 auto 8px;">
                    <i class="bi bi-trophy-fill"></i>
                </div>
                <span style="font-size:0.8rem; font-weight:800; color:#047857; display:block; text-transform:uppercase; letter-spacing:1px;">QUAN QUAN TOP 1</span>
                <h4 style="font-size:1.15rem; font-weight:900; color:#064e3b; margin:6px 0 2px;">${escapeHtml(top1.team)}</h4>
                <span style="font-size:0.75rem; color:#047857; font-weight:600;">${escapeHtml(top1.divName)}</span>
                <div style="margin-top:12px; font-size:1.6rem; font-weight:900; color:#047857;">${top1.avgProgress}%</div>
                <span style="font-size:0.72rem; color:#065f46;">${top1.membersCount} Nhan Su Tham Gia</span>
            </div>

            <div class="card-premium" style="background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border:2px solid #94a3b8; padding:20px; border-radius:14px; text-align:center;">
                <div style="width:44px; height:44px; border-radius:50%; background:#94a3b8; color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:1.25rem; font-weight:900; margin:0 auto 8px;">
                    <i class="bi bi-award-fill"></i>
                </div>
                <span style="font-size:0.8rem; font-weight:800; color:#475569; display:block; text-transform:uppercase; letter-spacing:1px;">A QUAN TOP 2</span>
                <h4 style="font-size:1.1rem; font-weight:900; color:#1e293b; margin:6px 0 2px;">${escapeHtml(top2.team)}</h4>
                <span style="font-size:0.75rem; color:#64748b; font-weight:600;">${escapeHtml(top2.divName)}</span>
                <div style="margin-top:12px; font-size:1.45rem; font-weight:900; color:#1e293b;">${top2.avgProgress}%</div>
                <span style="font-size:0.72rem; color:#475569;">${top2.membersCount} Nhan Su Tham Gia</span>
            </div>

            <div class="card-premium" style="background:linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border:2px solid #f59e0b; padding:20px; border-radius:14px; text-align:center;">
                <div style="width:44px; height:44px; border-radius:50%; background:#f59e0b; color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:1.25rem; font-weight:900; margin:0 auto 8px;">
                    <i class="bi bi-star-fill"></i>
                </div>
                <span style="font-size:0.8rem; font-weight:800; color:#b45309; display:block; text-transform:uppercase; letter-spacing:1px;">QUY QUAN TOP 3</span>
                <h4 style="font-size:1.1rem; font-weight:900; color:#78350f; margin:6px 0 2px;">${escapeHtml(top3.team)}</h4>
                <span style="font-size:0.75rem; color:#b45309; font-weight:600;">${escapeHtml(top3.divName)}</span>
                <div style="margin-top:12px; font-size:1.45rem; font-weight:900; color:#b45309;">${top3.avgProgress}%</div>
                <span style="font-size:0.72rem; color:#92400e;">${top3.membersCount} Nhan Su Tham Gia</span>
            </div>
        `;

        tbody.innerHTML = ranking.map((r, idx) => {
            const medal = idx === 0 ? '<span style="color:#eab308; font-size:0.85rem; font-weight:800;"><i class="bi bi-trophy-fill"></i> Top 1</span>' 
                        : (idx === 1 ? '<span style="color:#64748b; font-size:0.85rem; font-weight:800;"><i class="bi bi-award-fill"></i> Top 2</span>' 
                        : (idx === 2 ? '<span style="color:#b45309; font-size:0.85rem; font-weight:800;"><i class="bi bi-star-fill"></i> Top 3</span>' 
                        : `<strong>#${idx + 1}</strong>`));
            const badgeClass = r.avgProgress >= 80 ? 'badge-forest' : (r.avgProgress >= 40 ? 'badge-gold' : 'status-badge');
            const comment = r.avgProgress >= 80 ? 'Xuat Sac - Dat Chuan' : (r.avgProgress >= 40 ? 'Tien Do Tot' : 'Can Tang Toc');

            return `
                <tr>
                    <td style="font-weight:800; text-align:center;">${medal}</td>
                    <td style="font-weight:800; color:#0f172a;">${escapeHtml(r.team)}</td>
                    <td><span class="status-badge" style="background:#e0e7ff; color:#2F2D74; font-size:0.75rem;">${escapeHtml(r.divName)}</span></td>
                    <td><strong>${r.membersCount}</strong> Sales</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <strong style="color:var(--primary); font-size:0.9rem;">${r.avgProgress}%</strong>
                            <div style="flex:1; background:#e2e8f0; height:6px; border-radius:3px; overflow:hidden; min-width:60px;">
                                <div style="width:${r.avgProgress}%; height:100%; background:var(--primary);"></div>
                            </div>
                        </div>
                    </td>
                    <td><span class="${badgeClass}" style="font-size:0.72rem; padding:3px 8px; border-radius:12px; font-weight:700;">${comment}</span></td>
                </tr>
            `;
        }).join('');
    }

    function updateAdminKPICards() {
        const usersDb = window.usersDatabase || [];
        const coursesState = window.coursesState || [];
        const divisionsState = window.divisionsState || [];

        const kpis = window.LMSEngine 
            ? window.LMSEngine.calculateAdminKPICounters(usersDb, coursesState, divisionsState)
            : { totalStudents: usersDb.length, totalDivisions: divisionsState.length, totalTeams: 0, completedStudents: 0, inProgressStudents: 0 };

        const elTotal = document.getElementById('kpi-total-students');
        if (elTotal) elTotal.textContent = kpis.totalStudents;

        const elDiv = document.getElementById('kpi-total-divisions');
        const elTeamsSub = document.getElementById('kpi-total-teams-sub');
        if (elDiv) elDiv.textContent = `${String(kpis.totalDivisions).padStart(2, '0')} Khoi`;
        if (elTeamsSub) elTeamsSub.textContent = `${String(kpis.totalTeams).padStart(2, '0')} Phong Sales Truc Thuoc`;

        const elComp = document.getElementById('kpi-completed-students');
        if (elComp) elComp.textContent = `${kpis.completedStudents} Sales`;

        const elProg = document.getElementById('kpi-in-progress-students');
        if (elProg) elProg.textContent = `${kpis.inProgressStudents} Sales`;
    }

    function updateDivisionChart() {
        const canvas = document.getElementById('salesDivisionChart');
        if (!canvas || typeof Chart === 'undefined') return;

        const divisionsState = window.divisionsState || [];
        const usersDb = window.usersDatabase || [];
        const coursesState = window.coursesState || [];

        const { labels, data } = window.LMSEngine
            ? window.LMSEngine.calculateDivisionAverages(divisionsState, usersDb, coursesState)
            : { labels: [], data: [] };

        if (divisionChartInstance) {
            divisionChartInstance.data.labels = labels;
            divisionChartInstance.data.datasets[0].data = data;
            divisionChartInstance.update();
        } else {
            const ctx = canvas.getContext('2d');
            divisionChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '% Hoan Thanh Bai Hoc Trung Binh',
                        data: data,
                        backgroundColor: ['#1A2238', '#0F766E', '#B45309', '#4338CA', '#047857'],
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, max: 100 } }
                }
            });
        }
    }

    // ==========================================
    // 8. GLOBAL SETTINGS & MODALS
    // ==========================================
    function toggleDivMode() {
        isDivModeOn = !isDivModeOn;
        const btn = document.getElementById('toggle-div-btn');
        const accessSelect = document.getElementById('new-course-access');

        if (isDivModeOn) {
            if (btn) {
                btn.textContent = 'BAT (Gan Theo Khoi)';
                btn.className = 'toggle-switch-btn on';
            }
            if (accessSelect) accessSelect.value = 'DIV1';
            showAdminToast('Da BAT Che do gan theo Khoi!');
        } else {
            if (btn) {
                btn.textContent = 'TAT (Mo Cong Khai Tu Do)';
                btn.className = 'toggle-switch-btn off';
            }
            if (accessSelect) accessSelect.value = 'PUBLIC';
            showAdminToast('Da TAT Che do gan theo Khoi!');
        }
    }

    function toggleAntiScrubMode() {
        isAntiScrubOn = !isAntiScrubOn;
        const btn = document.getElementById('toggle-anti-scrub-btn');
        if (isAntiScrubOn) {
            if (btn) {
                btn.textContent = 'BAT (Chong Tua)';
                btn.className = 'toggle-switch-btn on';
            }
            showAdminToast('Da BAT Che do cam tua video bai giang!');
        } else {
            if (btn) {
                btn.textContent = 'TAT (Cho Phep Tua)';
                btn.className = 'toggle-switch-btn off';
            }
            showAdminToast('Da TAT Che do chong tua! Hoc vien co the tua tu do.');
        }
    }

    function saveSystemSettings() {
        const minWatch = parseInt(document.getElementById('min-video-percent').value) || 80;
        const minScore = parseInt(document.getElementById('passing-score-input').value) || 80;
        const quizTime = parseInt(document.getElementById('quiz-time-input').value) || 10;
        const isAntiScrub = isAntiScrubOn;
        const isDivMode = isDivModeOn;

        localStorage.setItem('lms_min_watch_percent', minWatch.toString());
        localStorage.setItem('lms_min_quiz_score', minScore.toString());
        localStorage.setItem('lms_quiz_time_minutes', quizTime.toString());
        localStorage.setItem('lms_anti_scrub_enabled', isAntiScrub ? 'true' : 'false');
        localStorage.setItem('lms_division_mode_enabled', isDivMode ? 'true' : 'false');

        try {
            window.dispatchEvent(new Event('storage'));
        } catch(e) {}

        showAdminToast(`DA LUU CAI DAT HE THONG THANH CONG!\n- Xem video toi thieu: ${minWatch}%\n- Diem dat Quiz: ${minScore}/100d\n- Thoi gian lam Quiz: ${quizTime} phut\n- Chong tua: ${isAntiScrub ? 'BAT' : 'TAT'}\n(Giao dien hoc vien duoc cap nhat ngay lap tuc)`);
    }

    function loadSystemSettings() {
        const minWatch = localStorage.getItem('lms_min_watch_percent') || '80';
        const minScore = localStorage.getItem('lms_min_quiz_score') || '80';
        const quizTime = localStorage.getItem('lms_quiz_time_minutes') || '10';
        const isAntiScrub = localStorage.getItem('lms_anti_scrub_enabled') !== 'false';
        const isDivMode = localStorage.getItem('lms_division_mode_enabled') !== 'false';

        const minWatchEl = document.getElementById('min-video-percent');
        if (minWatchEl) minWatchEl.value = minWatch;

        const minScoreEl = document.getElementById('passing-score-input');
        if (minScoreEl) minScoreEl.value = minScore;

        const quizTimeEl = document.getElementById('quiz-time-input');
        if (quizTimeEl) quizTimeEl.value = quizTime;

        isAntiScrubOn = isAntiScrub;
        const antiScrubBtn = document.getElementById('toggle-anti-scrub-btn');
        if (antiScrubBtn) {
            antiScrubBtn.className = isAntiScrub ? 'toggle-switch-btn on' : 'toggle-switch-btn off';
            antiScrubBtn.textContent = isAntiScrub ? 'BAT (Chong Tua)' : 'TAT (Cho Phep Tua)';
        }

        isDivModeOn = isDivMode;
        const divBtn = document.getElementById('toggle-div-btn');
        if (divBtn) {
            divBtn.className = isDivMode ? 'toggle-switch-btn on' : 'toggle-switch-btn off';
            divBtn.textContent = isDivMode ? 'BAT (Gan Theo Khoi)' : 'TAT (Mo Cong Khai Tu Do)';
        }
    }

    function openSalesModal(empId, courseId) {
        const usersDb = window.usersDatabase || [];
        const coursesState = window.coursesState || [];
        const divisionsState = window.divisionsState || [];

        const user = usersDb.find(u => u.empId === empId);
        if (!user) return;

        const divObj = divisionsState.find(d => d.id === user.div);
        const divName = divObj ? `${user.team} - ${divObj.name}` : `${user.team} - ${user.div}`;

        const userCourses = coursesState.filter(c => c.access === 'PUBLIC' || c.access === user.div);
        const targetCourse = coursesState.find(c => c.id === courseId) || userCourses[0] || coursesState[0];

        const status = window.LMSEngine 
            ? window.LMSEngine.calculateUserCourseModuleStatus(user.empId, targetCourse) 
            : { totalPct: 0, modulesDetail: [] };

        document.getElementById('sales-modal-name').textContent = `Ho So Nhan Vien: ${user.name}`;
        document.getElementById('sales-modal-id').textContent = user.empId;
        document.getElementById('sales-modal-dept').textContent = divName;
        document.getElementById('sales-modal-course').textContent = targetCourse ? targetCourse.title : 'Chua gan';
        document.getElementById('sales-modal-total-pct').textContent = `${status.totalPct}%`;
        document.getElementById('sales-modal-progress-fill').style.width = `${status.totalPct}%`;

        const breakdownEl = document.getElementById('sales-modal-modules-breakdown');
        if (breakdownEl) {
            breakdownEl.innerHTML = status.modulesDetail.map(m => `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:800; font-size:0.85rem; color:#0f172a;">Module ${m.id}: ${m.title}</div>
                        <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">
                            Da xem <strong>${m.doneLessons}/${m.totalLessons}</strong> video | Trac nghiem: <strong>${m.isQuizPassed ? '<i class=\"bi bi-check2\"></i> Da Dat' : 'Chua Vuot Qua'}</strong>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <span style="display:inline-block; font-size:0.75rem; font-weight:800; padding:2px 8px; border-radius:12px; background:${m.badgeBg}; color:${m.statusColor};">
                            ${m.percent}% - ${m.statusText}
                        </span>
                    </div>
                </div>
            `).join('');
        }

        const remindBtn = document.getElementById('btn-modal-remind-student');
        if (remindBtn) {
            remindBtn.onclick = () => {
                showAdminToast(`Da gui thong bao nhac hoc bai den Sales ${user.name} (${user.empId})!`);
            };
        }

        document.getElementById('salesModal').style.display = 'flex';
    }

    function closeSalesModal() {
        document.getElementById('salesModal').style.display = 'none';
    }

    // ==========================================
    // 9. REAL-TIME STORAGE SYNC & CLOUD
    // ==========================================
    window.addEventListener('storage', (e) => {
        if (e.key === 'lms_courses_catalog' || e.key === 'lms_courses_list') {
            if (window.StorageService) window.coursesState = window.StorageService.getCourses();
            renderCoursesUI();
            renderCourseDropdowns();
            renderReportsTable();
            renderLeaderboardUI();
            updateAdminKPICards();
            updateDivisionChart();
        }
        if (e.key === 'lms_users_db') {
            if (window.StorageService) window.usersDatabase = window.StorageService.getUsers();
            renderAdminStudentsUI();
            renderReportsTable();
            renderLeaderboardUI();
            updateAdminKPICards();
            updateDivisionChart();
        }
        if (e.key === 'lms_divisions_list') {
            if (window.StorageService) window.divisionsState = window.StorageService.getDivisions();
            renderDivisionsUI();
            renderCoursesUI();
            renderCourseDropdowns();
            renderReportsTable();
            renderLeaderboardUI();
            updateAdminKPICards();
            updateDivisionChart();
        }
        if (e.key === 'lms_quizzes') {
            if (window.StorageService) window.quizzesDatabase = window.StorageService.getQuizzes();
            renderStandaloneQuizList();
        }
        if (e.key && e.key.startsWith('lms_progress_')) {
            renderReportsTable();
            renderLeaderboardUI();
            updateAdminKPICards();
            updateDivisionChart();
        }
        if (e.key && (e.key.startsWith('lms_min_') || e.key.startsWith('lms_anti_') || e.key.startsWith('lms_quiz_'))) {
            loadSystemSettings();
        }
    });

    async function syncAdminFromSupabase() {
        if (!window.supabaseClient) return;
        try {
            const [usersRes, progRes] = await Promise.all([
                window.supabaseClient.from('users').select('*'),
                window.supabaseClient.from('user_progress').select('*')
            ]);
            if (usersRes.data && usersRes.data.length > 0) {
                const cloudUsers = usersRes.data.map(u => ({
                    empId: u.emp_id,
                    name: u.name,
                    div: u.division,
                    team: u.team,
                    pass: u.password,
                    role: u.role || 'student'
                }));
                window.usersDatabase = cloudUsers;
                if (window.StorageService) {
                    window.StorageService.saveUsers(cloudUsers);
                }
            }
            if (progRes.data && progRes.data.length > 0) {
                progRes.data.forEach(p => {
                    if (p.emp_id && p.course_id && p.data) {
                        localStorage.setItem(`lms_progress_${p.emp_id}_${p.course_id}`, JSON.stringify(p.data));
                    }
                });
            }
            renderAdminStudentsUI();
            renderReportsTable();
            renderLeaderboardUI();
            updateAdminKPICards();
            updateDivisionChart();
        } catch (err) {
            console.warn('[QueenLand LMS Admin] Cloud pull notice:', err);
        }
    }

    // ==========================================
    // 10. INITIALIZATION LIFECYCLE
    // ==========================================
    window.addEventListener('DOMContentLoaded', () => {
        loadSystemSettings();
        renderCoursesUI();
        renderCourseDropdowns();
        renderDivisionsUI();
        renderAdminStudentsUI();
        renderReportsTable();
        renderStandaloneQuizList();
        renderLeaderboardUI();
        updateAdminKPICards();
        updateDivisionChart();
        updateSelfRegButtonUI();
        if (window.checkSupabaseConnection) {
            window.checkSupabaseConnection();
        }
        syncAdminFromSupabase();
    });

    // Expose all functions to window for 100% backward-compatible inline HTML binding
    window.showAdminToast = showAdminToast;
    window.toggleMobileSidebar = toggleMobileSidebar;
    window.switchNav = switchNav;
    window.resetToDefaultSampleCourses = resetToDefaultSampleCourses;
    window.renderCoursesUI = renderCoursesUI;
    window.handleCreateCourse = handleCreateCourse;
    window.openEditCourseModal = openEditCourseModal;
    window.closeEditCourseModal = closeEditCourseModal;
    window.jumpToCourseModulesFromEdit = jumpToCourseModulesFromEdit;
    window.handleSaveCourseEdit = handleSaveCourseEdit;
    window.deleteCourse = deleteCourse;
    window.closeDeleteCourseModal = closeDeleteCourseModal;
    window.executeDeleteCourse = executeDeleteCourse;
    window.renderCourseDropdowns = renderCourseDropdowns;
    window.handleCourseSelectionChange = handleCourseSelectionChange;
    window.switchLessonsSubTab = switchLessonsSubTab;
    window.toggleModuleAddMode = toggleModuleAddMode;
    window.renderTargetModuleDropdown = renderTargetModuleDropdown;
    window.renderCourseModulesTree = renderCourseModulesTree;
    window.openAddLessonToModule = openAddLessonToModule;
    window.handleAddLesson = handleAddLesson;
    window.openEditModuleModal = openEditModuleModal;
    window.closeEditModuleModal = closeEditModuleModal;
    window.handleSaveModuleEdit = handleSaveModuleEdit;
    window.deleteModule = deleteModule;
    window.openEditLessonModal = openEditLessonModal;
    window.closeEditLessonModal = closeEditLessonModal;
    window.handleSaveLessonEdit = handleSaveLessonEdit;
    window.deleteLesson = deleteLesson;
    window.openVideoPreviewModal = openVideoPreviewModal;
    window.previewLessonVideo = previewLessonVideo;
    window.closeVideoPreviewModal = closeVideoPreviewModal;
    window.handleCreateStandaloneQuiz = handleCreateStandaloneQuiz;
    window.renderStandaloneQuizList = renderStandaloneQuizList;
    window.renderCourseSpecificQuizList = renderCourseSpecificQuizList;
    window.openQuickAddQuizForCurrentCourse = openQuickAddQuizForCurrentCourse;
    window.openEditQuizModal = openEditQuizModal;
    window.closeEditQuizModal = closeEditQuizModal;
    window.handleSaveQuizEdit = handleSaveQuizEdit;
    window.deleteQuizQuestion = deleteQuizQuestion;
    window.renderDivisionsUI = renderDivisionsUI;
    window.handleCreateDivision = handleCreateDivision;
    window.handleAddTeam = handleAddTeam;
    window.deleteTeam = deleteTeam;
    window.deleteDivision = deleteDivision;
    window.updateStudentTeamOptions = updateStudentTeamOptions;
    window.renderAdminStudentsUI = renderAdminStudentsUI;
    window.handleAdminCreateStudent = handleAdminCreateStudent;
    window.resetAdminStudentProgress = resetAdminStudentProgress;
    window.deleteAdminStudent = deleteAdminStudent;
    window.toggleSelfRegMode = toggleSelfRegMode;
    window.updateSelfRegButtonUI = updateSelfRegButtonUI;
    window.renderReportsTable = renderReportsTable;
    window.renderLeaderboardUI = renderLeaderboardUI;
    window.updateAdminKPICards = updateAdminKPICards;
    window.updateDivisionChart = updateDivisionChart;
    window.toggleDivMode = toggleDivMode;
    window.toggleAntiScrubMode = toggleAntiScrubMode;
    window.saveSystemSettings = saveSystemSettings;
    window.loadSystemSettings = loadSystemSettings;
    window.openSalesModal = openSalesModal;
    window.closeSalesModal = closeSalesModal;
    window.syncAdminFromSupabase = syncAdminFromSupabase;

})(window);
