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
    // 3. Scroll-Reveal Observer
    // ==========================================
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });


    // ==========================================
    // 4. Service Tabs Logic
    // ==========================================
    document.querySelectorAll('.tab-btn').forEach(button => {
        // 🔴 FIX: Changed 'mouseover' to 'click'. Hover doesn't work on mobile/touch devices.
        button.addEventListener('click', () => {
            // Remove active class from all
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            // Add active class to clicked
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
    // 5. Golden Ticket Logic & Mobile Menu
    // ==========================================
    const ticketModal = document.getElementById('goldenTicketModal');
    const openNavBtnMobile = document.getElementById('openNavTicket');
    const openNavTicketOverlay = document.getElementById('openNavTicketOverlay');
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

        // Map prefixes properly
        let prefixSource = source;
        if (source === 'G') prefixSource = 'G';
        if (source === 'E') prefixSource = 'E';
        if (source === 'O') prefixSource = 'O';

        return `${prefixSource}-${dateStr}-${counterStr}`;
    }

    // Boleto Dorado: solo se abre con el botón, NO automáticamente.

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

    if (openNavBtnMobile) openNavBtnMobile.addEventListener('click', openTicket);
    if (openNavTicketOverlay) {
        openNavTicketOverlay.addEventListener('click', () => {
            const overlay = document.getElementById('mobileOverlay');
            if (overlay) overlay.classList.remove('active');
            openTicket();
        });
    }

    // --- Mobile Menu Overlay Logic ---
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const closeOverlay = document.getElementById('closeOverlay');
    const overlayLinks = document.querySelectorAll('.overlay-link-js');

    if (mobileMenuToggle && mobileOverlay) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileOverlay.classList.add('active');
        });
    }

    if (closeOverlay && mobileOverlay) {
        closeOverlay.addEventListener('click', () => {
            mobileOverlay.classList.remove('active');
        });
    }

    overlayLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileOverlay) mobileOverlay.classList.remove('active');
        });
    });

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
    }

    // ==========================================
    // 8. Dynamic Content Rotation (SEO Freshness)
    // ==========================================
    const activityDataPool = [
        { type: "Refrendo Morelos 2026", loc: "Huixquilucan / Interlomas", status: "Entregado", time: "11:45 AM", desc: "Gestión digital exitosa por WhatsApp." },
        { type: "Alta de Placas EdoMex 2026", loc: "Chalco", status: "Finalizado", time: "09:15 AM", desc: "Emplacamiento de vehículo nuevo sin filas." },
        { type: "Licencia Permanente CDMX", loc: "Tlalnepantla", status: "Verificado", time: "04:30 PM", desc: "Asesoría integral y trámite garantizado." },
        { type: "Baja de Placas EdoMex", loc: "Ecatepec", status: "Completado", time: "10:20 AM", desc: "Cese de obligaciones vehiculares rápido." },
        { type: "Cambio de Propietario", loc: "Naucalpan", status: "Entregado", time: "01:15 PM", desc: "Actualización de titularidad sin complicaciones." },
        { type: "Permiso Provisional 30 días", loc: "Ixtapaluca", status: "Finalizado", time: "12:00 PM", desc: "Permiso oficial para circular sin placas." },
        { type: "Refrendo Morelos Online", loc: "Cuautitlán Izcalli", status: "Entregado", time: "08:45 AM", desc: "Pago de derechos procesado en línea." },
        { type: "Reposición de Tarjeta", loc: "Atizapán", status: "Verificado", time: "02:30 PM", desc: "Recuperación de circulación por extravío." },
        { type: "Regularización REPUVE", loc: "Chalco", status: "Completado", time: "03:50 PM", desc: "Inscripción certificada en el sistema federal." },
        { type: "Alta de Placas CDMX", loc: "Interlomas", status: "Finalizado", time: "11:10 AM", desc: "Emplacamiento de lujo a domicilio." },
        { type: "Licencia Tipo B", loc: "Nezahualcóyotl", status: "Entregado", time: "09:55 AM", desc: "Trámite de licencia de carga agilizado." },
        { type: "Refrendo 2026", loc: "Chimalhuacán", status: "Finalizado", time: "10:15 AM", desc: "Pago anual de tenencia sin recargos." }
    ];

    function getSeededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    function rotateActivityFeed() {
        const grid = document.getElementById('activityGrid');
        if (!grid) return;

        // Use today's date as seed (YYYYMMDD)
        const now = new Date();
        const seedStr = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0');
        const seed = parseInt(seedStr);

        // Shuffle a copy of the pool using the seed
        let pool = [...activityDataPool];
        let shuffled = [];

        // simple seeded shuffle for 3 items
        for (let i = 0; i < 3; i++) {
            const rand = getSeededRandom(seed + i);
            const index = Math.floor(rand * pool.length);
            shuffled.push(pool.splice(index, 1)[0]);
        }

        grid.innerHTML = shuffled.map((item, idx) => {
            const dayLabel = idx === 0 ? "Finalizado Hoy" : (idx === 1 ? "Hace unas horas" : "Ayer");
            const bgLabel = "background: #dcfce7; color: #166534;";

            return `
                <div class="activity-card" style="padding: 2rem; border-radius: 16px; background: #f8fafc; border: 1px solid #e2e8f0; transition: transform 0.3s ease; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                        <span style="padding: 0.4rem 0.8rem; border-radius: 20px; ${bgLabel} font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">${dayLabel}</span>
                        <span style="color: #94a3b8; font-size: 0.8rem;">${item.time}</span>
                    </div>
                    <h4 style="font-size: 1.25rem; color: #1e293b; margin-bottom: 0.75rem; font-weight: 700;">${item.type}</h4>
                    <p style="font-size: 0.95rem; color: #64748b; line-height: 1.6;">${item.desc} para cliente en <b>${item.loc}</b>.</p>
                    <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; display: flex; align-items: center; gap: 0.5rem; color: #16a34a; font-weight: 600; font-size: 0.9rem;">
                        <i class="fas fa-check-circle"></i> Estatus: ${item.status}
                    </div>
                </div>
            `;
        }).join('');
    }

    rotateActivityFeed();

    // ==========================================
    // 9. GA4 Event Tracking & Sticky CTA
    // ==========================================

    // Helper to safely trigger GA4 events
    function trackEvent(eventName, params = {}) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
            console.log(`GA4 Event tracked: ${eventName}`, params);
        } else {
            console.warn(`GA4 not loaded. Event: ${eventName}`, params);
        }
    }

    // A. Track all WhatsApp Clicks globally
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a[href*="wa.me"]');
        if (link) {
            // Identify which button was clicked for clearer analytics
            let label = 'generic_whatsapp';
            if (link.classList.contains('primary-tel')) label = 'header_duran';
            if (link.classList.contains('erika-tel')) label = 'header_erika';
            if (link.closest('.hero')) label = 'hero_cta';
            if (link.closest('.service-card') || link.closest('.service-card-edomex')) label = 'service_card';
            if (link.closest('.sticky-whatsapp')) label = 'sticky_mobile';
            if (link.closest('.golden-ticket-modal')) label = 'golden_ticket_claim';

            trackEvent('generate_lead', {
                currency: "MXN",
                value: 100, // Estimated lead value
                event_category: "contact",
                event_label: label,
                transport_type: 'beacon'
            });
        }
    });

    // B. Track Boleto Dorado Claims (Specific Event)
    if (claimBtn) {
        // We attach to the existing listener logic by wrapping or adding a new one. 
        // Since we can't easily wrap the anonymous function above without refactoring, 
        // we'll just add a second listener that runs in parallel for tracking.
        claimBtn.addEventListener('click', () => {
            const userName = nameInput.value.trim();
            if (userName.length >= 2) {
                trackEvent('campaign_click', {
                    event_category: 'promotion',
                    event_label: 'boleto_dorado_claim',
                    value: 500 // Higher intent value
                });
            }
        });
    }

    // C. Sticky Mobile WhatsApp Button (Inject if missing)
    function injectStickyBtn() {
        if (window.innerWidth > 768) return; // Mobile only

        // Check if already exists
        if (document.querySelector('.sticky-whatsapp')) return;

        const stickyBtn = document.createElement('a');
        stickyBtn.href = "https://wa.me/525535757364?text=Hola,%20vi%20su%20web%20y%20quiero%20cotizar.";
        stickyBtn.className = "sticky-whatsapp";
        stickyBtn.target = "_blank";
        stickyBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Cotizar Ahora';
        document.body.appendChild(stickyBtn);

        // 🔴 FIX: Reduced threshold from 300px to 100px so the button appears sooner.
        // Many users scroll very little before deciding to contact or leave.
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                stickyBtn.classList.add('visible');
            } else {
                stickyBtn.classList.remove('visible');
            }
        });
    }

    injectStickyBtn();
    // Re-check on resize
    window.addEventListener('resize', injectStickyBtn);
});
