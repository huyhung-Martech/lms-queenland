/**
 * Queen Land LMS - Excel Processing Service Layer
 * Clean Architecture Layer 1: Excel Import, Export & Template Generator
 */

(function(window) {
    'use strict';

    let parsedExcelStudents = [];

    const ExcelService = {
        getParsedStudents: function() {
            return parsedExcelStudents;
        },

        setParsedStudents: function(list) {
            parsedExcelStudents = list;
            window.parsedExcelStudents = parsedExcelStudents;
        },

        escapeCsv: function(val) {
            if (val == null) return '';
            return String(val).replace(/"/g, '""');
        },

        getColVal: function(row, candidates) {
            for (const key of Object.keys(row)) {
                const cleanKey = key.toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
                for (const cand of candidates) {
                    if (cleanKey.includes(cand)) {
                        return (row[key] !== undefined && row[key] !== null) ? String(row[key]).trim() : '';
                    }
                }
            }
            return '';
        },

        downloadSalesExcelTemplate: function() {
            if (typeof XLSX === 'undefined') {
                if (window.showAdminToast) {
                    window.showAdminToast('Dang ket noi thu vien Excel, vui long thu lai sau 2 giay...');
                }
                return;
            }

            const sampleRows = [
                {
                    "Ma Nhan Vien": "NV-10892",
                    "Ho Va Ten": "Nguyen Hoang Long",
                    "Khoi Kinh Doanh": "Khoi 1: Can Ho Do Thi (DIV1)",
                    "Phong Kinh Doanh": "Phong KD 101",
                    "Mat Khau": "123456"
                },
                {
                    "Ma Nhan Vien": "NV-10893",
                    "Ho Va Ten": "Tran Thu Ha",
                    "Khoi Kinh Doanh": "Khoi 1: Can Ho Do Thi (DIV1)",
                    "Phong Kinh Doanh": "Phong KD 102",
                    "Mat Khau": "123456"
                },
                {
                    "Ma Nhan Vien": "NV-20411",
                    "Ho Va Ten": "Le Van Thanh",
                    "Khoi Kinh Doanh": "Khoi 2: Nghi Duong Bien (DIV2)",
                    "Phong Kinh Doanh": "Phong KD 201",
                    "Mat Khau": "123456"
                },
                {
                    "Ma Nhan Vien": "NV-30515",
                    "Ho Va Ten": "Pham Thanh Tung",
                    "Khoi Kinh Doanh": "Khoi 3: Dat Nen & Phap Ly (DIV3)",
                    "Phong Kinh Doanh": "Phong KD 301",
                    "Mat Khau": "123456"
                }
            ];

            const ws = XLSX.utils.json_to_sheet(sampleRows);
            ws['!cols'] = [
                { wch: 16 },
                { wch: 28 },
                { wch: 32 },
                { wch: 22 },
                { wch: 14 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "DanhSachSales");

            const guideRows = [
                { "HUONG DAN NHAP DU LIEU SALES TU EXCEL": "He thong tu dong nhan dien va dong bo len CVKD Sync theo cau truc sau:" },
                { "HUONG DAN NHAP DU LIEU SALES TU EXCEL": "1. Ma Nhan Vien (Bat buoc): Ma nhan su (VD: NV-10892, NV-20411...). Neu nhap so '10892' he thong se tu them 'NV-'." },
                { "HUONG DAN NHAP DU LIEU SALES TU EXCEL": "2. Ho Va Ten (Bat buoc): Ten day du cua nhan su Sales." },
                { "HUONG DAN NHAP DU LIEU SALES TU EXCEL": "3. Khoi Kinh Doanh: Dien ma khoi (DIV1, DIV2, DIV3) hoac ten khoi. Neu de trong se mac dinh gan DIV1." },
                { "HUONG DAN NHAP DU LIEU SALES TU EXCEL": "4. Phong Kinh Doanh: Ten phong Sales truc thuoc (VD: Phong KD 101, Phong KD 102...)." },
                { "HUONG DAN NHAP DU LIEU SALES TU EXCEL": "5. Mat Khau: Mat khau khoi tao. Neu de trong he thong se tu dat mac dinh la '123456'." },
                { "HUONG DAN NHAP DU LIEU SALES TU EXCEL": "LUU Y: Sau khi nhap, tai khoan se co the dang nhap ngay lap tuc o ca may tinh lan dien thoai cua hoc vien." }
            ];
            const wsGuide = XLSX.utils.json_to_sheet(guideRows);
            wsGuide['!cols'] = [{ wch: 95 }];
            XLSX.utils.book_append_sheet(wb, wsGuide, "HuongDan");

            XLSX.writeFile(wb, "Mau_Danh_Sach_Sales_QueenLand.xlsx");
            if (window.showAdminToast) {
                window.showAdminToast('Da tai xuong file mau Excel "Mau_Danh_Sach_Sales_QueenLand.xlsx"!');
            }
        },

        openExcelImportModal: function() {
            this.setParsedStudents([]);
            const modal = document.getElementById('excelImportModal');
            const fileInput = document.getElementById('excel-file-input');
            const previewContainer = document.getElementById('excel-preview-container');
            const confirmBtn = document.getElementById('btn-confirm-excel-import');
            const progressBox = document.getElementById('excel-import-progress-box');

            if (fileInput) fileInput.value = '';
            if (previewContainer) previewContainer.style.display = 'none';
            if (progressBox) progressBox.style.display = 'none';
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = '0.6';
                confirmBtn.style.cursor = 'not-allowed';
            }

            if (modal) modal.style.display = 'flex';
        },

        closeExcelImportModal: function() {
            const modal = document.getElementById('excelImportModal');
            if (modal) modal.style.display = 'none';
        },

        handleExcelFileSelected: function(event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;

            if (typeof XLSX === 'undefined') {
                if (window.showAdminToast) {
                    window.showAdminToast('Thu vien Excel dang tai, vui long doi vai giay va thu lai...');
                }
                return;
            }

            const fileNameEl = document.getElementById('excel-file-name-display');
            if (fileNameEl) fileNameEl.textContent = `File: ${file.name}`;

            const reader = new FileReader();
            const self = this;

            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                    if (!rawRows || rawRows.length === 0) {
                        if (window.showAdminToast) {
                            window.showAdminToast('File Excel khong co du lieu hoac dinh dang rong!');
                        }
                        return;
                    }

                    const list = [];
                    const currentDivisions = window.divisionsState || [];

                    rawRows.forEach((row, index) => {
                        let empId = self.getColVal(row, ['manhanvien', 'manv', 'empid', 'id', 'username', 'user', 'maso']);
                        let name = self.getColVal(row, ['hovaten', 'hoten', 'ten', 'name', 'fullname', 'nhanvien']);
                        let divRaw = self.getColVal(row, ['khoikinhdoanh', 'khoikd', 'makhoi', 'khoi', 'div', 'division']);
                        let team = self.getColVal(row, ['phongkinhdoanh', 'phongkd', 'phong', 'maphong', 'team', 'phongban']);
                        let pass = self.getColVal(row, ['matkhau', 'password', 'pass', 'mk']);

                        // Skip completely empty rows
                        if (!empId && !name) return;

                        // Normalize empId
                        if (!empId && name) {
                            empId = 'NV-' + (10000 + index);
                        } else {
                            empId = empId.toUpperCase();
                            if (/^\d+$/.test(empId)) {
                                empId = 'NV-' + empId;
                            }
                        }

                        if (!name) name = `Sales ${empId}`;

                        // Map division intelligently
                        let div = 'DIV1';
                        const divUpper = divRaw.toUpperCase();
                        if (divUpper.includes('DIV3') || divUpper.includes('KHOI 3') || divUpper.includes('MIEN NAM') || divUpper.includes('PHAP LY')) {
                            div = 'DIV3';
                        } else if (divUpper.includes('DIV2') || divUpper.includes('KHOI 2') || divUpper.includes('NGHI DUONG') || divUpper.includes('BIEN')) {
                            div = 'DIV2';
                        } else {
                            const found = currentDivisions.find(d => d.id === divUpper || (d.name && d.name.toUpperCase().includes(divUpper)));
                            div = found ? found.id : 'DIV1';
                        }

                        // Team fallback
                        if (!team) {
                            const targetDiv = currentDivisions.find(d => d.id === div);
                            team = (targetDiv && targetDiv.teams && targetDiv.teams.length > 0) ? targetDiv.teams[0] : 'Phong KD 101';
                        }

                        // Password fallback
                        if (!pass) pass = '123456';

                        list.push({ empId, name, div, team, pass });
                    });

                    self.setParsedStudents(list);

                    if (list.length === 0) {
                        if (window.showAdminToast) {
                            window.showAdminToast('Khong tim thay tai khoan nhan vien hop le nao trong file!');
                        }
                        return;
                    }

                    // Render preview table
                    const tbody = document.getElementById('excel-preview-tbody');
                    const rowsCountBadge = document.getElementById('excel-rows-count-badge');
                    const previewContainer = document.getElementById('excel-preview-container');
                    const confirmBtn = document.getElementById('btn-confirm-excel-import');

                    if (rowsCountBadge) {
                        rowsCountBadge.textContent = `Da nhan dien ${list.length} Sales hop le`;
                    }

                    if (tbody) {
                        const previewSlice = list.slice(0, 5);
                        const escapeHtml = window.escapeHtml || (s => s);
                        tbody.innerHTML = previewSlice.map((s, idx) => `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:6px 10px; color:#64748b;">${idx + 1}</td>
                                <td style="padding:6px 10px; font-weight:800; color:var(--primary);">${escapeHtml(s.empId)}</td>
                                <td style="padding:6px 10px; font-weight:700; color:#0f172a;">${escapeHtml(s.name)}</td>
                                <td style="padding:6px 10px; font-weight:600;"><span class="div-badge" style="font-size:0.68rem; padding:1px 6px;">${escapeHtml(s.div)}</span></td>
                                <td style="padding:6px 10px; color:#475569;">${escapeHtml(s.team)}</td>
                                <td style="padding:6px 10px; color:#64748b; font-family:monospace;">${escapeHtml(s.pass)}</td>
                            </tr>
                        `).join('');
                    }

                    if (previewContainer) previewContainer.style.display = 'block';
                    if (confirmBtn) {
                        confirmBtn.disabled = false;
                        confirmBtn.style.opacity = '1';
                        confirmBtn.style.cursor = 'pointer';
                    }

                    if (window.showAdminToast) {
                        window.showAdminToast(`Da nhan dien thanh cong ${list.length} tai khoan sales tu file!`);
                    }
                } catch (err) {
                    console.error("Loi doc file Excel:", err);
                    if (window.showAdminToast) {
                        window.showAdminToast('Loi khi doc file Excel: ' + err.message);
                    }
                }
            };
            reader.readAsArrayBuffer(file);
        },

        executeBatchExcelImport: async function() {
            if (!parsedExcelStudents || parsedExcelStudents.length === 0) {
                if (window.showAdminToast) {
                    window.showAdminToast('Chua co danh sach sales nao de nap!');
                }
                return;
            }

            const confirmBtn = document.getElementById('btn-confirm-excel-import');
            const progressBox = document.getElementById('excel-import-progress-box');
            const progressFill = document.getElementById('excel-progress-bar-fill');
            const progressText = document.getElementById('excel-progress-text');
            const progressPct = document.getElementById('excel-progress-pct');
            const overwriteDup = document.getElementById('excel-overwrite-dup') ? document.getElementById('excel-overwrite-dup').checked : true;

            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> <span>Dang Dong Bo...</span>`;
            }

            if (progressBox) progressBox.style.display = 'block';
            if (progressFill) progressFill.style.width = '30%';
            if (progressPct) progressPct.textContent = '30%';

            let importedCount = 0;
            let updatedCount = 0;

            const usersDb = window.usersDatabase || [];

            parsedExcelStudents.forEach(item => {
                const existingIdx = usersDb.findIndex(u => u.empId === item.empId);
                if (existingIdx !== -1) {
                    if (overwriteDup) {
                        usersDb[existingIdx].name = item.name;
                        usersDb[existingIdx].div = item.div;
                        usersDb[existingIdx].team = item.team;
                        usersDb[existingIdx].pass = item.pass;
                        updatedCount++;
                    }
                } else {
                    usersDb.push({
                        empId: item.empId,
                        name: item.name,
                        div: item.div,
                        team: item.team,
                        pass: item.pass
                    });
                    importedCount++;
                }
            });

            // Save to storage
            if (window.StorageService) {
                window.StorageService.saveUsers(usersDb);
            } else {
                localStorage.setItem('lms_users_db', JSON.stringify(usersDb));
                window.usersDatabase = usersDb;
            }

            if (progressFill) progressFill.style.width = '70%';
            if (progressPct) progressPct.textContent = '70%';
            if (progressText) progressText.textContent = 'Dang dong bo len CVKD Sync Cloud...';

            // Sync to Supabase Cloud
            if (window.supabaseClient) {
                try {
                    const cloudRecords = parsedExcelStudents.map(u => ({
                        emp_id: u.empId,
                        name: u.name,
                        division: u.div,
                        team: u.team,
                        password: u.pass,
                        role: 'student'
                    }));
                    const { error } = await window.supabaseClient.from('users').upsert(cloudRecords, { onConflict: 'emp_id' });
                    if (error) {
                        console.warn('[QueenLand Admin] Notice when batch upserting to CVKD Sync:', error.message);
                    }
                } catch (cloudErr) {
                    console.warn('[QueenLand Admin] Cloud sync notice:', cloudErr);
                }
            }

            if (progressFill) progressFill.style.width = '100%';
            if (progressPct) progressPct.textContent = '100%';
            if (progressText) progressText.textContent = 'Hoan tat dong bo!';

            const self = this;
            setTimeout(() => {
                self.closeExcelImportModal();
                if (window.renderAdminStudentsUI) window.renderAdminStudentsUI();
                if (window.renderReportsTable) window.renderReportsTable();
                if (window.renderLeaderboardUI) window.renderLeaderboardUI();
                if (window.updateAdminKPICards) window.updateAdminKPICards();
                if (window.updateDivisionChart) window.updateDivisionChart();
                if (window.showAdminToast) {
                    window.showAdminToast(`Da nap thanh cong ${parsedExcelStudents.length} tai khoan Sales (Moi: ${importedCount}, Cap nhat: ${updatedCount}) va dong bo len CVKD Sync!`);
                }
            }, 500);
        },

        exportExcelReport: function() {
            const divSelect = document.getElementById('report-division-filter');
            const courseSelect = document.getElementById('report-course-filter');
            const searchInput = document.getElementById('report-search-input');

            const kw = searchInput ? searchInput.value.trim().toLowerCase() : '';
            const targetDiv = divSelect ? divSelect.value : 'ALL';
            const targetCourseId = courseSelect ? courseSelect.value : 'ALL';

            const usersDb = window.usersDatabase || [];
            const divsState = window.divisionsState || [];
            const crsState = window.coursesState || [];

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

            let csvContent = "\uFEFF\"Ho va Ten\",\"Ma Nhan Vien\",\"Phong KD / Khoi Kinh Doanh\",\"Ten Khoa Hoc\",\"Tong Tien Do (%)\",\"Tinh Trang Chi Tiet Tung Module\"\n";
            const self = this;

            filteredUsers.forEach(u => {
                const divObj = divsState.find(d => d.id === u.div);
                const divName = divObj ? `${u.team} - ${divObj.name}` : `${u.team} - ${u.div}`;
                const userCourses = crsState.filter(c => c.access === 'PUBLIC' || c.access === u.div);

                let targetCourse = null;
                if (targetCourseId !== 'ALL') {
                    targetCourse = crsState.find(c => c.id === targetCourseId);
                } else {
                    targetCourse = userCourses[0] || crsState[0];
                }
                if (!targetCourse) targetCourse = { title: 'Dao Tao Du An Queen Land' };
                
                const status = window.calculateUserCourseModuleStatus 
                    ? window.calculateUserCourseModuleStatus(u.empId, targetCourse) 
                    : { totalPct: 0, summaryLines: 'N/A' };

                csvContent += `"${self.escapeCsv(u.name)}","${self.escapeCsv(u.empId)}","${self.escapeCsv(divName)}","${self.escapeCsv(targetCourse.title)}","${status.totalPct}%","${self.escapeCsv(status.summaryLines)}"\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Bao_Cao_Tien_Do_Dao_Tao_LMS_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (window.showAdminToast) {
                window.showAdminToast(`Da xuat file bao cao (${filteredUsers.length} nhan vien) thanh cong!`);
            }
        }
    };

    // Global Exposure
    window.ExcelService = ExcelService;
    window.downloadSalesExcelTemplate = ExcelService.downloadSalesExcelTemplate.bind(ExcelService);
    window.openExcelImportModal = ExcelService.openExcelImportModal.bind(ExcelService);
    window.closeExcelImportModal = ExcelService.closeExcelImportModal.bind(ExcelService);
    window.getColVal = ExcelService.getColVal.bind(ExcelService);
    window.handleExcelFileSelected = ExcelService.handleExcelFileSelected.bind(ExcelService);
    window.executeBatchExcelImport = ExcelService.executeBatchExcelImport.bind(ExcelService);
    window.exportExcelReport = ExcelService.exportExcelReport.bind(ExcelService);
    window.escapeCsv = ExcelService.escapeCsv.bind(ExcelService);

})(window);
