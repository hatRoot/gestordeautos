document.addEventListener('DOMContentLoaded', () => {
    // Number Counter Animation
    const animateNumbers = () => {
        const stats = document.querySelectorAll('.hero-stat-number');

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

    // Run animation
    animateNumbers();

    // Re-run animation when visible (optional, using Intersection Observer)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumbers();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) {
        observer.observe(statsSection);
    }
});
