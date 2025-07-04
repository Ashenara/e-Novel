/* assets/js/reader-ui.js */

document.addEventListener('DOMContentLoaded', () => {
    // --- Selectors ---
    const body = document.body;
    const readerContent = document.getElementById('reader-content');
    const uiContainer = document.getElementById('reader-ui-container');
    const sidebar = document.getElementById('reader-sidebar');
    const tocToggleBtn = document.getElementById('toc-sidebar-toggle');

    if (!readerContent || !uiContainer || !sidebar || !tocToggleBtn) {
        console.error("Reader UI Error: A core HTML element is missing.");
        return; 
    }

    // --- State & Storage ---
    // THE FIX: The property name in this object is now `theme`
    const settings = {
        fontSize: parseInt(localStorage.getItem('readerFontSize') || 18),
        lineHeight: parseFloat(localStorage.getItem('readerLineHeight') || 1.7),
        paragraphSpacing: parseFloat(localStorage.getItem('readerParagraphSpacing') || 0.8),
        fontFamily: localStorage.getItem('readerFontFamily') || "'Nunito Sans', sans-serif",
        theme: localStorage.getItem('readerTheme') || 'theme-light'
    };
    
    // --- Functions ---
    const applySettings = () => {
        // Apply all CSS variables from the settings object
        document.documentElement.style.setProperty('--reader-font-size', `${settings.fontSize}px`);
        document.documentElement.style.setProperty('--reader-line-height', settings.lineHeight);
        document.documentElement.style.setProperty('--reader-paragraph-spacing', `${settings.paragraphSpacing}em`);
        document.documentElement.style.setProperty('--reader-font-family', settings.fontFamily);
        
        // Update the text in the settings panel
        const fontSizeValue = document.getElementById('font-size-value');
        const lineHeightValue = document.getElementById('line-height-value');
        const pSpacingValue = document.getElementById('p-spacing-value');

        if (fontSizeValue) fontSizeValue.textContent = settings.fontSize;
        if (lineHeightValue) lineHeightValue.textContent = `${Math.round(settings.lineHeight * 100)}%`;
        if (pSpacingValue) pSpacingValue.textContent = `${settings.paragraphSpacing.toFixed(1)}em`;

        // Apply theme classes and update active buttons
        body.className = body.className.replace(/theme-\w+/g, '').trim();
        // THE FIX: It now reads from `settings.theme` instead of `settings.readerTheme`
        body.classList.add(settings.theme); 
        document.querySelectorAll('.setting-group[data-setting]').forEach(group => {
            const settingKey = group.dataset.setting;
            group.querySelectorAll('button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === settings[settingKey]);
            });
        });
    };

    const saveSetting = (key, value) => {
        settings[key] = value;
        // This function now works correctly for all keys.
        // e.g., if key is 'theme', it saves to 'readerTheme'.
        // e.g., if key is 'fontSize', it saves to 'readerFontSize'.
        localStorage.setItem(`reader${key.charAt(0).toUpperCase() + key.slice(1)}`, value);
        applySettings();
    };

    const setUIVisibility = (visible) => { uiContainer.classList.toggle('visible', visible); };
    const setSidebarVisibility = (visible) => { sidebar.classList.toggle('visible', visible); };

    // --- Event Listeners (No changes needed in this section) ---
    readerContent.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        if (sidebar.classList.contains('visible')) {
            setSidebarVisibility(false);
        } else {
            setUIVisibility(!uiContainer.classList.contains('visible'));
        }
    });

    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('visible') && !sidebar.contains(e.target) && !tocToggleBtn.contains(e.target)) {
            setSidebarVisibility(false);
        }
    });
    
    tocToggleBtn.addEventListener('click', () => {
        if (uiContainer.classList.contains('visible')) { setUIVisibility(false); }
        setSidebarVisibility(!sidebar.classList.contains('visible'));
    });

    // --- Settings Panel Controls (No changes needed in this section) ---
    document.getElementById('font-size-plus')?.addEventListener('click', () => saveSetting('fontSize', Math.min(32, settings.fontSize + 1)));
    document.getElementById('font-size-minus')?.addEventListener('click', () => saveSetting('fontSize', Math.max(12, settings.fontSize - 1)));
    
    document.getElementById('line-height-plus')?.addEventListener('click', () => saveSetting('lineHeight', parseFloat((settings.lineHeight + 0.1).toFixed(1))));
    document.getElementById('line-height-minus')?.addEventListener('click', () => saveSetting('lineHeight', parseFloat((settings.lineHeight - 0.1).toFixed(1))));

    document.getElementById('p-spacing-plus')?.addEventListener('click', () => {
        let newSpacing = Math.min(2.5, settings.paragraphSpacing + 0.1);
        saveSetting('paragraphSpacing', newSpacing);
    });
    document.getElementById('p-spacing-minus')?.addEventListener('click', () => {
        let newSpacing = Math.max(0.0, settings.paragraphSpacing - 0.1);
        saveSetting('paragraphSpacing', newSpacing);
    });

    document.querySelectorAll('.setting-group[data-setting]').forEach(group => {
        group.addEventListener('click', e => {
            const button = e.target.closest('button');
            if (button && button.dataset.value) {
                saveSetting(group.dataset.setting, button.dataset.value);
            }
        });
    });

    // --- Initial Load ---
    applySettings();
});