/**
 * Queen Land LMS - Security & Client Protection Service
 * Implements non-intrusive client-side hardening and anti-tamper techniques
 * Adapted from anti-reversing and web defense principles.
 */

(function (window) {
    'use strict';

    var DEV_STORAGE_KEY = 'queenland_dev_mode';
    var isDevMode = sessionStorage.getItem(DEV_STORAGE_KEY) === 'true';

    /**
     * Show lightweight non-intrusive security toast
     */
    function showSecurityToast(message) {
        var existingToast = document.getElementById('security-guard-toast');
        if (existingToast) {
            existingToast.remove();
        }

        var toast = document.createElement('div');
        toast.id = 'security-guard-toast';
        toast.style.cssText = [
            'position: fixed',
            'bottom: 24px',
            'left: 50%',
            'transform: translateX(-50%)',
            'background: #0f172a',
            'color: #ffffff',
            'padding: 10px 20px',
            'border-radius: 8px',
            'font-size: 0.82rem',
            'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            'z-index: 99999',
            'border-left: 4px solid #C5A880',
            'pointer-events: none',
            'transition: opacity 0.3s ease',
            'opacity: 1'
        ].join(';');

        toast.innerText = message || 'Noi dung khoa hoc duoc bao ho ban quyen boi Queen Land Academy.';
        document.body.appendChild(toast);

        setTimeout(function () {
            toast.style.opacity = '0';
            setTimeout(function () {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 2200);
    }

    /**
     * Block right-click context menu except for inputs
     */
    function initContextMenuBlock() {
        document.addEventListener('contextmenu', function (e) {
            if (isDevMode) return;
            var target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                return;
            }
            e.preventDefault();
            showSecurityToast('Chuot phai bi vo hieu hoa de bao ve noi dung dao tao.');
        }, false);
    }

    /**
     * Block inspection and extraction shortcuts
     */
    function initKeyboardGuard() {
        document.addEventListener('keydown', function (e) {
            if (isDevMode) return;

            var key = e.key;
            var keyCode = e.keyCode || e.which;
            var ctrlOrCmd = e.ctrlKey || e.metaKey;
            var shiftKey = e.shiftKey;

            // F12 (DevTools)
            if (key === 'F12' || keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                showSecurityToast('Cong cu phan tich bi khoa.');
                return false;
            }

            // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools inspect/console)
            if (ctrlOrCmd && shiftKey && (key === 'I' || key === 'i' || key === 'J' || key === 'j' || key === 'C' || key === 'c' || keyCode === 73 || keyCode === 74 || keyCode === 67)) {
                e.preventDefault();
                e.stopPropagation();
                showSecurityToast('Che do kiem tra phan tu bi vo hieu hoa.');
                return false;
            }

            // Ctrl+U (View Page Source)
            if (ctrlOrCmd && (key === 'U' || key === 'u' || keyCode === 85)) {
                e.preventDefault();
                e.stopPropagation();
                showSecurityToast('Xem ma nguon bi vo hieu hoa.');
                return false;
            }

            // Ctrl+S (Save Web Page)
            if (ctrlOrCmd && (key === 'S' || key === 's' || keyCode === 83)) {
                e.preventDefault();
                e.stopPropagation();
                showSecurityToast('Luu trang bi vo hieu hoa de bao mat du lieu.');
                return false;
            }

            // Ctrl+P (Print to PDF - prevent dumping test sheets)
            if (ctrlOrCmd && (key === 'P' || key === 'p' || keyCode === 80)) {
                e.preventDefault();
                e.stopPropagation();
                showSecurityToast('In an bi vo hieu hoa.');
                return false;
            }

            // Ctrl+A outside form fields
            if (ctrlOrCmd && (key === 'A' || key === 'a' || keyCode === 65)) {
                var activeElem = document.activeElement;
                if (!activeElem || (activeElem.tagName !== 'INPUT' && activeElem.tagName !== 'TEXTAREA')) {
                    e.preventDefault();
                    return false;
                }
            }
        }, false);
    }

    /**
     * Prevent drag-and-drop extraction of images and videos
     */
    function initDragDropGuard() {
        document.addEventListener('dragstart', function (e) {
            if (isDevMode) return;
            var target = e.target;
            if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.tagName === 'A')) {
                e.preventDefault();
            }
        }, false);
    }

    /**
     * Anti-debugging technique: Detect DevTools via timing latency
     */
    function initAntiDebugTimingCheck() {
        if (isDevMode) return;

        var threshold = 180;
        setInterval(function () {
            var start = performance.now();
            // In standard execution this takes < 0.1ms. If DevTools is open and pausing/profiling, it spikes.
            (function () {}['constructor']('return false')());
            var duration = performance.now() - start;

            if (duration > threshold && !isDevMode) {
                // Suspicious debugging activity detected
                console.clear();
                console.warn('[Queen Land Security] Phat hien can thiep trinh duyet.');
            }
        }, 2500);
    }

    /**
     * Console security banner and protection
     */
    function initConsoleGuard() {
        try {
            console.log(
                '%c[QUEEN LAND ACADEMY - SECURITY SYSTEM]',
                'color: #C5A880; font-size: 16px; font-weight: 800; background: #0f172a; padding: 6px 12px; border-radius: 4px;'
            );
            console.log(
                '%cToan bo noi dung bai giang, ngan hang de thi va du lieu chuyen vien kinh doanh deu duoc bao mat. Moi hanh vi sao chep hoac trich xuat trai phep se duoc truy vet.',
                'color: #64748b; font-size: 11px;'
            );
        } catch (err) {
            // Ignore if console is restricted
        }
    }

    /**
     * Public Security API
     */
    var SecurityService = {
        init: function () {
            initContextMenuBlock();
            initKeyboardGuard();
            initDragDropGuard();
            initAntiDebugTimingCheck();
            initConsoleGuard();
        },

        isDevMode: function () {
            return isDevMode;
        },

        toggleDevMode: function (passcode) {
            if (passcode === 'queenland2026') {
                isDevMode = !isDevMode;
                sessionStorage.setItem(DEV_STORAGE_KEY, isDevMode ? 'true' : 'false');
                console.info('[SecurityService] Che do nha phat trien (Dev Mode): ' + (isDevMode ? 'BAT' : 'TAT'));
                showSecurityToast(isDevMode ? 'Dev Mode da duoc KICH HOAT.' : 'Dev Mode da duoc TAT.');
                return isDevMode;
            } else {
                console.warn('[SecurityService] Sai mat khau che do nha phat trien.');
                return false;
            }
        }
    };

    // Auto-init on script load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            SecurityService.init();
        });
    } else {
        SecurityService.init();
    }

    window.SecurityService = SecurityService;

})(window);
