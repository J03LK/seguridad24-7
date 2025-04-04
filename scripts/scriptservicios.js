// Debounce function for better performance
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Optimize scroll handler
const handleScroll = () => {
    const scrollPosition = window.scrollY;
    const section = document.querySelector('.protection-products');
    
    if (!section) return; // Guard clause
    
    // Use requestAnimationFrame for smooth animations
    requestAnimationFrame(() => {
        if (scrollPosition > 50) {
            section.classList.add('blur-background', 'hide-title');
        } else {
            section.classList.remove('blur-background', 'hide-title');
        }
    });
};

// Add debounced scroll listener
window.addEventListener('scroll', debounce(handleScroll, 10));

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    handleScroll();
    
    // Optimize image loading
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
});
