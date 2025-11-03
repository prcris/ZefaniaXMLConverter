// Global state
let currentLanguage = 'pt';
let currentTranslations = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeLanguage();
    initializeEventListeners();
    loadLanguagesMenu();
    // Optional: count visits using Firebase if it's present on the page
    registerVisitCounter();
    // Start visible counter UI
    startVisitCounterUI();
});

// Language Detection and Initialization
function initializeLanguage() {
    // Get language from URL, localStorage, or browser
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const storedLang = localStorage.getItem('preferredLanguage');
    const browserLang = navigator.language.split('-')[0];
    
    currentLanguage = urlLang || storedLang || (browserLang === 'es' ? 'es' : browserLang === 'en' ? 'en' : 'pt');
    
    // Load translations
    loadTranslations();
}

// Load translations from server
async function loadTranslations() {
    try {
        const response = await fetch(`/api/translations/${currentLanguage}`);
        currentTranslations = await response.json();
        
        // Apply translations to the page
        applyTranslations();
        
        // Update language selector
        updateLanguageSelector();
        // Reflect language on <html> tag for a11y
        try { document.documentElement.lang = currentLanguage; } catch (_) {}
        
        // Save language preference
        localStorage.setItem('preferredLanguage', currentLanguage);
        
    } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback to Portuguese if translations fail
        if (currentLanguage !== 'pt') {
            currentLanguage = 'pt';
            loadTranslations();
        }
    }
}

// Apply translations to elements with data-i18n attribute
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getNestedTranslation(currentTranslations, key);
        
        if (translation) {
            if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            } else if (element.hasAttribute('placeholder')) {
                element.placeholder = translation;
            } else if (element.hasAttribute('title')) {
                element.title = translation;
            } else {
                element.textContent = translation;
            }
        }
    });
}

// Get nested translation value
function getNestedTranslation(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
}

// Update language selector
function updateLanguageSelector() {
    const currentLangText = document.querySelector('#currentLanguage');
    const item = document.querySelector(`#languageMenu .language-option[data-lang="${currentLanguage}"]`);
    if (currentLangText && item) {
        const flag = item.getAttribute('data-flag') || '';
        const name = item.textContent || currentLanguage.toUpperCase();
        currentLangText.innerHTML = `${flag} ${name}`;
    }
}

// Change language
function changeLanguage(lang) {
    if (lang !== currentLanguage) {
        currentLanguage = lang;
        loadTranslations();
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Upload area events
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('xmlFile');
    const uploadForm = document.getElementById('uploadForm');

    // Drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFileSelect();
            }
        });

        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
    }

    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Form submit
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleFileUpload);
    }
    
    // Language selector (delegated; menu might be populated later)
    const languageMenu = document.getElementById('languageMenu');
    if (languageMenu) {
        languageMenu.addEventListener('click', (e) => {
            const el = e.target.closest('.language-option');
            if (!el) return;
            e.preventDefault();
            const lang = el.getAttribute('data-lang');
            if (lang) changeLanguage(lang);
        });
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            // Ignore pure '#'
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

// Populate language dropdown from backend
async function loadLanguagesMenu() {
    try {
        const res = await fetch('/languages');
        const data = await res.json();
        const list = data.languages || data || [];
        const menu = document.getElementById('languageMenu');
        if (!menu) return;
        menu.innerHTML = '';
        list.forEach(lang => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'dropdown-item language-option';
            a.setAttribute('data-lang', lang.code);
            a.setAttribute('data-flag', lang.flag || '');
            a.textContent = lang.nativeName || lang.name || lang.code.toUpperCase();
            li.appendChild(a);
            menu.appendChild(li);
        });
        updateLanguageSelector();
    } catch (err) {
        console.error('Failed to load languages:', err);
    }
}

// --- Analytics: Visit/Conversion counter using Firebase (compat) ---
function getFirebaseDbCompat() {
    try {
        const fb = window.firebase;
        if (!fb) return null;
        // Ensure app is initialized; if not, caller's index should include firebase config
        if (fb.apps && fb.apps.length === 0) return null;
        if (!fb.firestore) return null;
        const db = fb.firestore();
        if (!db || !fb.firestore.FieldValue) return null;
        return { db, FieldValue: fb.firestore.FieldValue };
    } catch (_) {
        return null;
    }
}

function registerVisitCounter() {
    const ctx = getFirebaseDbCompat();
    if (!ctx) return; // Firebase not available; skip silently
    try {
        const today = new Date().toISOString().slice(0, 10);
        const key = 'visitCounted:' + today;
        if (localStorage.getItem(key)) return; // avoid double counting per day per browser
        const inc = ctx.FieldValue.increment(1);
        ctx.db.collection('stats').doc('visits').set({
            total: inc,
            byDate: { [today]: inc }
        }, { merge: true }).then(() => {
            try { localStorage.setItem(key, '1'); } catch (_) {}
        }).catch(err => console.warn('Visit counter error:', err));
    } catch (err) {
        console.warn('Visit counter skipped:', err);
    }
}

function incrementCounter(docId) {
    const ctx = getFirebaseDbCompat();
    if (!ctx) return;
    try {
        const today = new Date().toISOString().slice(0, 10);
        const inc = ctx.FieldValue.increment(1);
        ctx.db.collection('stats').doc(docId).set({
            total: inc,
            byDate: { [today]: inc }
        }, { merge: true }).catch(err => console.warn('Counter error:', err));
    } catch (err) {
        console.warn('Counter skipped:', err);
    }
}

 

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = getOrCreateToastContainer();
    const toastId = 'toast-' + Date.now();
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-header">
            <i class="fas fa-${getToastIcon(type)} me-2"></i>
            <strong class="me-auto">${getToastTitle(type)}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Initialize and show toast
    const bootstrapToast = new bootstrap.Toast(toast);
    bootstrapToast.show();
    
    // Remove toast element after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Get or create toast container
function getOrCreateToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

// Get toast icon based on type
function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Get toast title based on type
function getToastTitle(type) {
    const titles = {
        success: getNestedTranslation(currentTranslations, 'common.success') || 'Success',
        error: getNestedTranslation(currentTranslations, 'common.error') || 'Error',
        warning: getNestedTranslation(currentTranslations, 'common.warning') || 'Warning',
        info: getNestedTranslation(currentTranslations, 'common.info') || 'Info'
    };
    return titles[type] || titles.info;
}

// Reset form
function resetForm() {
    const uploadForm = document.getElementById('uploadForm');
    const fileInfo = document.getElementById('fileInfo');
    const convertBtn = document.getElementById('convertBtn');
    
    if (uploadForm) {
        uploadForm.reset();
    }
    
    if (fileInfo) {
        fileInfo.classList.add('d-none');
    }
    
    if (convertBtn) {
        convertBtn.disabled = true;
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper: baixa um arquivo de uma URL e força o download com nome específico
async function downloadFileFromUrl(url, filename) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Falha ao baixar arquivo convertido');
    const blob = await res.blob();
    const objUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename || 'download.xml';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(objUrl);
    document.body.removeChild(a);
}

// Utility: corta texto para N caracteres
function truncate(str, max) {
    if (!str) return '';
    const s = String(str);
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// Handle file selection
function handleFileSelect() {
    const fileInput = document.getElementById('xmlFile');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const convertBtn = document.getElementById('convertBtn');

    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.xml')) {
            showToast(getNestedTranslation(currentTranslations, 'messages.invalidFileType') || 'Please select a valid XML file', 'error');
            return;
        }

        // Show file information
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = formatFileSize(file.size);
        if (fileInfo) fileInfo.classList.remove('d-none');

        // Enable convert button
        if (convertBtn) convertBtn.disabled = false;
    } else {
        if (fileInfo) fileInfo.classList.add('d-none');
        if (convertBtn) convertBtn.disabled = true;
    }
}

// Handle file upload and conversion
async function handleFileUpload(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const convertBtn = document.getElementById('convertBtn');
    const originalHTML = convertBtn ? convertBtn.innerHTML : '';

    // Show loading state
    if (convertBtn) {
        convertBtn.disabled = true;
        convertBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${getNestedTranslation(currentTranslations, 'converter.converting') || 'Converting...'}`;
    }

    try {
        const response = await fetch('/convert', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            if (data && data.downloadUrl) {
                await downloadFileFromUrl(data.downloadUrl, data.convertedName || 'converted_bible.xml');
                // Count a successful conversion (if Firebase is available)
                incrementCounter('conversions');
            } else {
                throw new Error('Resposta inesperada do servidor (downloadUrl ausente)');
            }

            showToast(getNestedTranslation(currentTranslations, 'messages.conversionSuccess') || 'Conversion successful!', 'success');
            resetForm();
        } else {
            // Try to parse server error
            let serverMsg = '';
            try {
                const data = await response.json();
                serverMsg = data?.details || data?.error || JSON.stringify(data);
            } catch (_) {
                try { serverMsg = await response.text(); } catch (_) {}
            }
            console.error('Conversion failed:', serverMsg);
            showToast(`${getNestedTranslation(currentTranslations, 'messages.conversionError') || 'Conversion error'}: ${truncate(serverMsg, 300)}`,'error');
            return;
        }
    } catch (error) {
        console.error('Conversion error:', error);
        showToast(`${getNestedTranslation(currentTranslations, 'messages.conversionError') || 'Conversion error'}: ${truncate(error?.message || String(error), 300)}`, 'error');
    } finally {
        if (convertBtn) {
            convertBtn.disabled = false;
            convertBtn.innerHTML = originalHTML;
        }
    }
}

function startVisitCounterUI() {
    const el = document.getElementById('visitCounterDisplay');
    if (!el) return;
    const ctx = getFirebaseDbCompat();
    if (ctx) {
        try {
            ctx.db.collection('stats').doc('visits').onSnapshot((doc) => {
                const data = (doc && doc.exists) ? doc.data() : {};
                const total = Number(data?.total || 0);
                el.textContent = total.toLocaleString();
            }, (err) => {
                console.warn('Visit counter listener error:', err);
            });
            return;
        } catch (err) {
            console.warn('Visit counter realtime not available:', err);
        }
    }
    // Fallback: local per-browser counter
    try {
        const key = 'localVisitCounterTotal';
        const current = Number(localStorage.getItem(key) || '0') + 1;
        localStorage.setItem(key, String(current));
        el.textContent = current.toLocaleString();
    } catch (_) {
        el.textContent = '1';
    }
}