import os
import re

html_files = ["alta-de-placas.html", "cambio-de-propietario.html", "tramites-edomex.html", "refrendo-morelos.html", "licencia-permanente-cdmx.html", "aviso-privacidad.html"]
base_dir = "/Users/joelduran/Documents/GitHub/gestordeautos"

overlay_html = """
    <!-- Mobile Overlay Menu (Apple-like) -->
    <div id="mobileOverlay" class="mobile-overlay">
        <button id="closeOverlay" class="close-overlay" aria-label="Cerrar Menú">
            <i class="fas fa-times"></i>
        </button>
        <div class="overlay-content">
            <a href="/#servicios" class="overlay-link overlay-link-js" data-i18n="nav_services">Servicios</a>
            <a href="/#contacto" class="overlay-link overlay-link-js" data-i18n="nav_contact">Contacto</a>
            <hr class="overlay-divider">
            <button id="openNavTicketOverlay" class="nav-ticket-btn overlay-btn">
                <i class="fas fa-ticket-alt"></i> BOLETO DORADO
            </button>
            <a href="https://wa.me/525535757364?text=Hola,%20me%20interesa%20una%20cotización"
                class="btn btn-whatsapp overlay-btn" target="_blank">
                <i class="fab fa-whatsapp"></i> COTIZACIONES 1
            </a>
            <a href="https://wa.me/525522917267?text=Hola,%20busco%20asesoría%20con%20Erika"
                class="btn btn-whatsapp overlay-btn" target="_blank"
                style="background: linear-gradient(135deg, #25d366, #128c7e);">
                <i class="fab fa-whatsapp"></i> COTIZACIONES 2
            </a>
        </div>
    </div>
"""

menu_toggle_html = """                <button id="mobileMenuToggle" class="mobile-menu-toggle" aria-label="Abrir Menú">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </div>
    </header>"""

for f in html_files:
    path = os.path.join(base_dir, f)
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as file:
        content = file.read()
    
    if "mobileMenuToggle" in content:
        print(f"Skipping {f}, already patched.")
        continue
        
    # Find the closing sequence: spaces/tabs followed by </div> then </div> then </header>
    pattern = re.compile(r'[ \t]*</div>\s*</div>\s*</header>')
    
    # We replace only the FIRST occurrence
    match = pattern.search(content)
    if match:
        new_content = content[:match.start()] + '\n' + menu_toggle_html + '\n' + overlay_html + content[match.end():]
        with open(path, "w", encoding="utf-8") as file:
            file.write(new_content)
        print(f"Patched {f}")
    else:
        print(f"Could not patch {f}, pattern not found.")
