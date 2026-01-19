/**
 * StockQuest Theme Manager
 * Handles light/dark mode toggling and persistence
 */

function initTheme() {
    const root = document.documentElement;
    const storedTheme = localStorage.getItem('stockquest_theme') || 'dark';
    root.setAttribute('data-theme', storedTheme);

    // Setup toggle button listener
    // Use event delegation or wait for DOM? DOMContentLoaded is best.
    const toggleBtn = document.getElementById('navThemeToggle');
    if (toggleBtn) {
        // Update button icon/text if needed based on initial state?
        // Using SVG icon so it's generic, but tooltips could change.
        toggleBtn.addEventListener('click', () => {
            const current = root.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            localStorage.setItem('stockquest_theme', next);

            // Dispatch event if other components need to know
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: next }));
        });
    }
}

// Run immediately to avoid flash
(function preInit() {
    const storedTheme = localStorage.getItem('stockquest_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', storedTheme);
})();

// Run setup on load
document.addEventListener('DOMContentLoaded', initTheme);
