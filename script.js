document.addEventListener('DOMContentLoaded', () => {
    // Number Counter Animation
    const animateNumbers = () => {
        const stats = document.querySelectorAll('.counter');

        stats.forEach(stat => {
            // Get target from data attribute, fallback to innerText if missing
            const targetAttr = stat.getAttribute('data-target');
            const target = targetAttr ? parseInt(targetAttr) : null;

            if (!target) return; // Skip if no target

            const prefix = stat.getAttribute('data-prefix') || '';
            const suffix = stat.getAttribute('data-suffix') || '';

            const duration = 2500;
            const startTime = performance.now();

            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - progress, 4); // EaseOutQuart

                const current = Math.floor(target * ease);

                // Format WITHOUT commas per user request
                stat.innerText = `${prefix}${current}${suffix}`;

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    stat.innerText = `${prefix}${target}${suffix}`;
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
    // Scroll Reveal Animation
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});
