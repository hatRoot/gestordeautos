document.addEventListener('DOMContentLoaded', () => {
    // Number Counter Animation
    const animateNumbers = () => {
        const stats = document.querySelectorAll('.counter');

        stats.forEach(stat => {
            const finalValueStr = stat.innerText;
            const finalValue = parseInt(finalValueStr.replace(/\D/g, ''));
            const suffix = finalValueStr.replace(/[0-9]/g, '');
            const duration = 3000; // 3 seconds
            const startTime = performance.now();

            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out quart
                const ease = 1 - Math.pow(1 - progress, 4);

                const current = Math.floor(finalValue * ease);

                if (finalValueStr.includes('+')) {
                    stat.innerText = '+' + current.toLocaleString() + suffix.replace('+', '');
                } else {
                    stat.innerText = current.toLocaleString() + suffix;
                }

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    stat.innerText = finalValueStr; // Ensure final value is exact
                }
            };

            requestAnimationFrame(update);
        });
    };

    // Intersection Observer for Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('hero-stats')) {
                    animateNumbers();
                    observer.unobserve(entry.target);
                }

                // Overlay Aimation Trigger
                if (entry.target.classList.contains('mobile-hero-overlay')) {
                    entry.target.classList.add('visible'); // Add class to trigger CSS animation
                    observer.unobserve(entry.target);
                }
            }
        });
    }, { threshold: 0.3 }); // Lower threshold for earlier trigger

    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) {
        observer.observe(statsSection);
    }

    const heroOverlay = document.querySelector('.mobile-hero-overlay');
    if (heroOverlay) {
        observer.observe(heroOverlay);
    }
});
