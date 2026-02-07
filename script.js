// Consolidated Script for Gestor de Autos
// Handles animations, interactions, and logic

// Global Functions (called by HTML attributes)
function scrollReviews(direction) {
    const track = document.getElementById('reviewsTrack');
    const cardWidth = 350 + 24; // card width + gap
    const scrollAmount = direction === 'prev' ? -cardWidth : cardWidth;

    track.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. Number Counter Animation
    // ==========================================
    const animateNumbers = () => {
        const stats = document.querySelectorAll('.counter');

        stats.forEach(stat => {
            const targetAttr = stat.getAttribute('data-target');
            const target = targetAttr ? parseInt(targetAttr) : null;
            if (!target) return;

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

    // ==========================================
    // 2. Intersection Observer (Stats & Overlay & Fox)
    // ==========================================
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Stats
                if (entry.target.classList.contains('hero-stats')) {
                    animateNumbers();
                    observer.unobserve(entry.target);
                }
                // Mobile Hero Overlay
                if (entry.target.classList.contains('mobile-hero-overlay')) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
                // Fox Bubble
                if (entry.target.classList.contains('features-fox')) {
                    const bubble = document.getElementById('foxBubble');
                    if (bubble) bubble.classList.add('visible');
                    // Keep observing? logic said yes in inline, but here we can optimize.
                    // Inline logic: unobserve was NOT called for fox.
                }
            }
        });
    }, { threshold: 0.3 });

    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) observer.observe(statsSection);

    const heroOverlay = document.querySelector('.mobile-hero-overlay');
    if (heroOverlay) observer.observe(heroOverlay);

    const foxTrigger = document.querySelector('.features-fox');
    if (foxTrigger) observer.observe(foxTrigger);


    // ==========================================
    // 3. Service Tabs Logic
    // ==========================================
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('mouseover', () => {
            // Remove active class from all
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            // Add active class to hovered
            button.classList.add('active');
            const target = document.getElementById(button.dataset.tab);
            if (target) target.classList.add('active');
        });
    });

    // ==========================================
    // 4. Header Scroll Effect
    // ==========================================
    window.addEventListener('scroll', function () {
        const header = document.querySelector('.header');
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });

    // ==========================================
    // 5. Golden Ticket Logic
    // ==========================================
    const ticketModal = document.getElementById('goldenTicketModal');
    const navTicketItem = document.getElementById('navTicketItem');
    const openNavBtnDesktop = document.getElementById('openNavTicketDesktop');
    const openNavBtnMobile = document.getElementById('openNavTicket');
    const closeBtn = document.getElementById('closeTicket');
    const nameInput = document.getElementById('ticketVisitorName');
    const folioSpan = document.getElementById('ticketFolio');
    const claimBtn = document.getElementById('claimTicketBtn');
    const referralSelect = document.getElementById('referralSource');

    let currentFolio = "";
    let ticketShown = false;

    // Unique Code Generator
    function generateUniqueCode(source) {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const dateStr = `${day}${month}${year}`;

        let counter = parseInt(localStorage.getItem('ticketCounter') || '5000', 10);
        counter += 1;
        localStorage.setItem('ticketCounter', counter.toString());

        const counterStr = String(counter).padStart(4, '0');
        return `${source}-${dateStr}-${counterStr}`;
    }

    // Trigger Ticket Entry
    function triggerTicketEntry() {
        if (ticketShown || !navTicketItem) return;
        ticketShown = true;
        navTicketItem.classList.add('visible');
    }

    // Check if claimed
    if (sessionStorage.getItem('ticketClaimed') === 'true') {
        if (navTicketItem) navTicketItem.classList.remove('visible');
    } else {
        setTimeout(triggerTicketEntry, 1000);
        window.addEventListener('scroll', triggerTicketEntry);
    }

    function openTicket() {
        if (!referralSelect || !folioSpan || !ticketModal) return;
        const selectedSource = referralSelect.value;
        currentFolio = generateUniqueCode(selectedSource);
        folioSpan.textContent = currentFolio;
        
        ticketModal.classList.remove('hidden');
        setTimeout(() => ticketModal.classList.add('visible'), 10);
    }

    if (referralSelect && folioSpan) {
        referralSelect.addEventListener('change', () => {
            const selectedSource = referralSelect.value;
            currentFolio = generateUniqueCode(selectedSource);
            folioSpan.textContent = currentFolio;
        });
    }

    if (openNavBtnDesktop) openNavBtnDesktop.addEventListener('click', openTicket);
    if (openNavBtnMobile) openNavBtnMobile.addEventListener('click', openTicket);

    if (closeBtn && ticketModal) {
        closeBtn.addEventListener('click', () => {
            ticketModal.classList.remove('visible');
            setTimeout(() => {
                ticketModal.classList.add('hidden');
            }, 500);
        });
    }

    if (claimBtn && nameInput) {
        claimBtn.addEventListener('click', (e) => {
            const userName = nameInput.value.trim();
            if (userName.length < 2) {
                e.preventDefault();
                nameInput.style.borderColor = "#ef4444";
                nameInput.placeholder = "Escribe tu nombre";
                return;
            }

            sessionStorage.setItem('ticketClaimed', 'true');
            if (navTicketItem) navTicketItem.classList.remove('visible');

            const finalMsg = `Hola, soy *${userName}*. He generado mi *BOLETO DORADO* en GestorDeAutos.\nCódigo Único: *${currentFolio}*\nMe gustaría solicitar una cotización lo mas pronto posible.`;
            const waUrl = `https://wa.me/525535757364?text=${encodeURIComponent(finalMsg)}`;

            window.open(waUrl, '_blank');

            if (ticketModal) {
                ticketModal.classList.remove('visible');
                setTimeout(() => ticketModal.classList.add('hidden'), 500);
            }
        });
    }

    // ==========================================
    // 6. Cover Flow Effect (Reviews)
    // ==========================================
    const track = document.querySelector('.reviews-track');
    const cards = document.querySelectorAll('.review-card');

    if (track && cards.length > 0) {
        let currentScroll = track.scrollLeft;
        let targetScroll = track.scrollLeft;
        const lerpFactor = 0.08;

        function lerp(start, end, factor) {
            return start + (end - start) * factor;
        }

        function updateCoverFlow() {
            targetScroll = track.scrollLeft;
            if (Math.abs(targetScroll - currentScroll) < 0.5) {
                currentScroll = targetScroll;
            } else {
                currentScroll = lerp(currentScroll, targetScroll, lerpFactor);
            }

            const center = currentScroll + (track.offsetWidth / 2);

            cards.forEach(card => {
                const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
                const distance = Math.abs(center - cardCenter);
                const maxDistance = 500;

                // Reset
                card.classList.remove('active', 'prev', 'next');
                card.style.zIndex = Math.round(1000 - distance);

                let normDist = Math.min(1, distance / maxDistance);
                const scale = 1.15 - (normDist * 0.35);
                const rotRaw = normDist * 45;
                const shift = 0;
                const depth = -70 * normDist;

                if (distance < 50) {
                    card.classList.add('active');
                    card.style.transform = `translateX(0px) scale(1.15) translateZ(100px) rotateY(0deg)`;
                } else {
                    if (cardCenter < center) {
                        card.classList.add('prev');
                        card.style.transform = `translateX(${shift}px) scale(${scale}) translateZ(${depth}px) rotateY(${rotRaw}deg)`;
                    } else {
                        card.classList.add('next');
                        card.style.transform = `translateX(${shift}px) scale(${scale}) translateZ(${depth}px) rotateY(-${rotRaw}deg)`;
                    }
                    card.style.opacity = 1 - (normDist * 0.6);
                }
            });
            window.requestAnimationFrame(updateCoverFlow);
        }
        updateCoverFlow();
    }

    // ==========================================
    // 7. Translations
    // ==========================================
    const translations = {
        es: {
            // Nav
            nav_services: "Servicios",
            nav_contact: "Contacto",
            btn_quote: '<i class="fab fa-whatsapp"></i> Cotizar Ahora',

            // Header
            header_slogan: "Gestión vehicular rápida y segura.",

            // Hero
            hero_title_main: "Gestoría Vehicular en Estado de México y CDMX",
            hero_title_sub: "Chalco · Ixtapaluca · Huixquilucan · Interlomas",
            hero_desc_bold: "¿Moto o Auto nuevos?",
            hero_desc_text: "Somos expertos en alta de placas, licencias, legalización y cambios de propietario en EdoMex, CDMX y todo México. ¡Trámites 100% online!",
            btn_view_services: "Ver Servicios",
            trust_title: "¿Por qué elegirnos?",
            trust_subtitle: "Más de 5 años simplificando la vida de los conductores mexicanos.",
            text_stat_1: "Trámites Exitosos",
            text_stat_2: "Clientes Satisfechos",
            text_stat_3: "Tiempo Promedio de Respuesta",

            // Services
            services_title: "Nuestros Servicios",
            services_subtitle: "Gestión especializada en CDMX, Estado de México, Morelos, Guerrero, Michoacán y Oaxaca.",

            // Tabs
            tab_control: "Placas & Trámites",
            tab_licenses: "Licencias",
            tab_foreigners: "Extranjeros / Foreigners",
            tab_others: "Legalizaciones y REPUVE",

            // Foreigner Svc
            svc_foreign_lic_title: "Licencia para Extranjeros",
            svc_foreign_lic_sub: "Licencia de conducir para extranjeros",
            svc_foreign_lic_desc: "Tramitamos tu licencia de conducir mexicana con tu pasaporte o forma migratoria. Proceso 100% legal y seguro.",
            svc_foreign_plates_title: "Placas para Extranjeros",
            svc_foreign_plates_sub: "Registro de placas",
            svc_legalization_title: "Legalización de Autos",
            svc_legalization_sub: "Regularización de extranjeros",
        },
        en: {
            // Nav
            nav_services: "Services",
            nav_contact: "Contact",
            btn_quote: '<i class="fab fa-whatsapp"></i> Get Quote',

            // Header
            header_slogan: "Fast and secure vehicle registration.",

            // Hero
            hero_title_main: "Vehicle Registration Services CDMX & EdoMex",
            hero_title_sub: "Chalco · Ixtapaluca · Huixquilucan · Interlomas",
            hero_desc_bold: "New Car or Moto?",
            hero_desc_text: "Registration, legalization, and ownership transfer in the Metropolitan Area and all of Mexico. 100% online procedures.",
            btn_view_services: "View Services",
            trust_title: "Why Choose Us?",
            trust_subtitle: "Over 5 years simplifying life for drivers in Mexico.",
            text_stat_1: "Successful Procedures",
            text_stat_2: "Satisfied Clients",
            text_stat_3: "Average Response Time",

            // Services
            services_title: "Our Services",
            services_subtitle: "Specialized management in CDMX, State of Mexico, Morelos, Guerrero, Michoacán, and Oaxaca.",

            // Tabs
            tab_control: "Plates & Procedures",
            tab_licenses: "Licenses",
            tab_foreigners: "Foreigners Services",
            tab_others: "Legalization & REPUVE",

            // Foreigner Svc
            svc_foreign_lic_title: "Driver's License for Foreigners",
            svc_foreign_lic_sub: "Valid Mexican Driver's License",
            svc_foreign_lic_desc: "We process your Mexican driver's license using your passport or immigration form. 100% legal and secure process.",
            svc_foreign_plates_title: "License Plates for Foreigners",
            svc_foreign_plates_sub: "Vehicle Registration",
            svc_legalization_title: "Car Legalization",
            svc_legalization_sub: "Foreign car regularization",
        }
    };

    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        let currentLang = 'es';
        const userLang = navigator.language || navigator.userLanguage;
        if (userLang.startsWith('en')) {
            currentLang = 'en';
        }

        function updateLanguage(lang) {
            currentLang = lang;
            langToggle.textContent = lang === 'es' ? 'EN' : 'ES';

            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (translations[lang] && translations[lang][key]) {
                    if (element.tagName === 'A' && element.classList.contains('btn-whatsapp')) {
                        element.innerHTML = translations[lang][key];
                    } else {
                        element.textContent = translations[lang][key];
                    }
                }
            });
        }

        langToggle.addEventListener('click', () => {
            const newLang = currentLang === 'es' ? 'en' : 'es';
            updateLanguage(newLang);
        });

        if (currentLang === 'en') {
            updateLanguage('en');
        } else {
            langToggle.textContent = 'EN';
        }
    }
});
