/**
 * Queen Land LMS - Core Business Logic & Calculation Engine
 * Clean Architecture Layer 2: Domain Logic & Metrics Calculations
 */

(function(window) {
    'use strict';

    const LMSEngine = {
        escapeHtml: function(str) {
            if (str == null) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },

        getModuleLessons: function(course, mod) {
            if (mod.lessons && Array.isArray(mod.lessons) && mod.lessons.length > 0) {
                return mod.lessons;
            }
            const count = (mod.meta && mod.meta.videos) ? parseInt(mod.meta.videos) : 2;
            const defaultList = [];
            for (let i = 1; i <= (count || 2); i++) {
                defaultList.push({
                    id: i,
                    title: `Bai ${mod.id}.${i}: ${mod.title} - Phan ${i}`,
                    duration: i === 1 ? '10:15' : '15:30',
                    youtubeUrl: mod.youtubeUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    status: mod.status === 'completed' ? 'completed' : (i === 1 && mod.status === 'in-progress' ? 'in-progress' : 'locked')
                });
            }
            mod.lessons = defaultList;
            return mod.lessons;
        },

        calculateUserCourseModuleStatus: function(empId, course) {
            if (!course) return { totalPct: 0, summaryLines: 'Chua co du lieu', modulesDetail: [] };
            const progKey = `lms_progress_${empId}_${course.id}`;
            let prog = JSON.parse(localStorage.getItem(progKey) || 'null');
            if (!prog) {
                prog = { completedLessons: [], passedQuizzes: [] };
            }

            const completedLessons = prog.completedLessons || [];
            const passedQuizzes = prog.passedQuizzes || [];
            const modules = course.modules || [];
            const quizzesDb = window.quizzesDatabase || [];

            let totalCourseItems = 0;
            let completedCourseItems = 0;

            const self = this;
            const modulesDetail = modules.map((m, mIdx) => {
                const lessons = self.getModuleLessons(course, m);
                const totalModLessons = lessons.length;

                let modDoneCount = 0;
                lessons.forEach(l => {
                    if (completedLessons.includes(`m${m.id}_l${l.id}`)) {
                        modDoneCount++;
                    }
                });

                // Check whether this module has an associated quiz in quizzesDatabase or curriculum progression
                const courseQuizzes = quizzesDb.filter(q => q.courseId === course.id);
                const modHasQuiz = courseQuizzes.length > 0 || (m.meta && m.meta.docs && /quiz|test/i.test(m.meta.docs)) || quizzesDb.some(q => 
                    (q.courseId === course.id || !q.courseId) && 
                    (String(q.moduleId) === String(m.id) || String(q.modId) === String(m.id))
                );

                const isQuizPassed = passedQuizzes.includes(`m${m.id}`);

                const totalItems = totalModLessons + (modHasQuiz ? 1 : 0);
                const doneItems = modDoneCount + (isQuizPassed ? 1 : 0);
                totalCourseItems += totalItems;
                completedCourseItems += doneItems;

                const modPercent = totalItems > 0 ? Math.min(100, Math.round((doneItems / totalItems) * 100)) : 0;

                let isModCompleted = false;
                if (modHasQuiz) {
                    isModCompleted = (modDoneCount === totalModLessons) && isQuizPassed;
                } else {
                    isModCompleted = (modDoneCount === totalModLessons && totalModLessons > 0);
                }

                let statusText = 'Chua Hoc';
                let statusColor = '#6b7280';
                let badgeBg = '#f1f5f9';

                if (isModCompleted) {
                    statusText = 'Hoan Thanh';
                    statusColor = '#047857';
                    badgeBg = '#d1fae5';
                } else if (modDoneCount > 0 || isQuizPassed) {
                    if (modDoneCount === totalModLessons && modHasQuiz && !isQuizPassed) {
                        statusText = 'Chua Vuot Quiz';
                        statusColor = '#b45309';
                        badgeBg = '#fef3c7';
                    } else {
                        statusText = 'Dang Hoc';
                        statusColor = '#b45309';
                        badgeBg = '#fef3c7';
                    }
                } else if (mIdx === 0 || passedQuizzes.includes(`m${modules[mIdx - 1]?.id}`)) {
                    statusText = 'Chua Hoc';
                    statusColor = '#475569';
                    badgeBg = '#f1f5f9';
                } else {
                    statusText = 'Chua Mo Khoa';
                    statusColor = '#94a3b8';
                    badgeBg = '#f8fafc';
                }

                return {
                    id: m.id,
                    title: m.title,
                    totalLessons: totalModLessons,
                    doneLessons: modDoneCount,
                    hasQuiz: modHasQuiz,
                    isQuizPassed: isQuizPassed,
                    percent: modPercent,
                    statusText: statusText,
                    statusColor: statusColor,
                    badgeBg: badgeBg
                };
            });

            const totalPct = totalCourseItems > 0 ? Math.min(100, Math.round((completedCourseItems / totalCourseItems) * 100)) : 0;
            const summaryLines = modulesDetail.map(m => `Mod ${m.id}: ${m.percent}% (${m.statusText})`).join(' | ');

            return {
                totalPct,
                summaryLines,
                modulesDetail
            };
        },

        calculateLeaderboardStats: function(users, courses, divisions) {
            const teamStats = {};
            const self = this;

            users.forEach(u => {
                const teamKey = u.team || 'Phong Khac';
                if (!teamStats[teamKey]) {
                    const divObj = divisions.find(d => d.id === u.div);
                    teamStats[teamKey] = {
                        team: teamKey,
                        divId: u.div,
                        divName: divObj ? divObj.name : u.div,
                        membersCount: 0,
                        totalProgressSum: 0
                    };
                }
                teamStats[teamKey].membersCount++;

                const userCourses = courses.filter(c => c.access === 'PUBLIC' || c.access === u.div);
                const primaryCourse = userCourses[0] || courses[0];
                const status = self.calculateUserCourseModuleStatus(u.empId, primaryCourse);
                teamStats[teamKey].totalProgressSum += status.totalPct;
            });

            const ranking = Object.values(teamStats).map(t => {
                const avg = t.membersCount > 0 ? Math.round(t.totalProgressSum / t.membersCount) : 0;
                return { ...t, avgProgress: avg };
            });

            // Ensure teams with 0 users still show if registered in divisions
            divisions.forEach(d => {
                (d.teams || []).forEach(t => {
                    if (!ranking.some(r => r.team === t)) {
                        ranking.push({
                            team: t,
                            divId: d.id,
                            divName: d.name,
                            membersCount: 0,
                            avgProgress: 0
                        });
                    }
                });
            });

            ranking.sort((a, b) => b.avgProgress - a.avgProgress || b.membersCount - a.membersCount);
            return ranking;
        },

        calculateAdminKPICounters: function(users, courses, divisions) {
            let totalTeams = 0;
            divisions.forEach(d => { totalTeams += (d.teams ? d.teams.length : 0); });

            let completedCount = 0;
            let inProgressCount = 0;
            const self = this;

            users.forEach(u => {
                const userCourses = courses.filter(c => c.access === 'PUBLIC' || c.access === u.div);
                const primaryCourse = userCourses[0] || courses[0];
                const status = self.calculateUserCourseModuleStatus(u.empId, primaryCourse);
                if (status.totalPct === 100) {
                    completedCount++;
                } else if (status.totalPct > 0) {
                    inProgressCount++;
                }
            });

            return {
                totalStudents: users.length,
                totalDivisions: divisions.length,
                totalTeams: totalTeams,
                completedStudents: completedCount,
                inProgressStudents: inProgressCount
            };
        },

        calculateDivisionAverages: function(divisions, users, courses) {
            const self = this;
            const labels = divisions.map(d => d.name);
            const data = divisions.map(d => {
                const divUsers = users.filter(u => u.div === d.id);
                if (divUsers.length === 0) return 0;
                let sum = 0;
                divUsers.forEach(u => {
                    const userCourses = courses.filter(c => c.access === 'PUBLIC' || c.access === u.div);
                    const primaryCourse = userCourses[0] || courses[0];
                    const status = self.calculateUserCourseModuleStatus(u.empId, primaryCourse);
                    sum += status.totalPct;
                });
                return Math.round(sum / divUsers.length);
            });
            return { labels, data };
        }
    };

    // Global exposure
    window.LMSEngine = LMSEngine;
    window.escapeHtml = LMSEngine.escapeHtml.bind(LMSEngine);
    window.getModuleLessons = LMSEngine.getModuleLessons.bind(LMSEngine);
    window.calculateUserCourseModuleStatus = LMSEngine.calculateUserCourseModuleStatus.bind(LMSEngine);

})(window);
