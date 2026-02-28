import os
import re

directory = '/Users/joelduran/Documents/GitHub/gestordeautos'
html_files = [
    'index.html',
    'alta-de-placas.html',
    'cambio-de-propietario.html',
    'licencia-permanente-cdmx.html',
    'refrendo-morelos.html',
    'tramites-edomex.html'
]

keywords = "gestoria vehicular, gestor vehicular, gestor, tramites de placas, tramites de licencia permanente, tramites de placas edomex, tramites de placas morelos, pago de refrendo morelos, alternativa a gestopark, mejor que goperken"
description_addition = " La alternativa #1 a Gestopark y Goperken. Rápidos, seguros y con el mejor servicio."

for filename in html_files:
    filepath = os.path.join(directory, filename)
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update title to include strong keywords where possible, without ruining structure
    # For now, just ensure keywords are robust.
    
    # 1. Update <meta name="keywords"
    content = re.sub(
        r'<meta name="keywords"\s*content="([^"]*)"',
        lambda m: f'<meta name="keywords"\n        content="{m.group(1)}, gestor, tramites de placas, tramites de licencia permanente, tramites de placas edomex, tramites de placas morelos, pago de refrendo morelos, alternativa a gestopark, gestopark, goperken, mejor que goperken"',
        content,
        flags=re.IGNORECASE|re.DOTALL
    )

    # 2. Update Description
    content = re.sub(
        r'<meta name="description"\s*content="([^"]*)"',
        lambda m: f'<meta name="description"\n        content="{m.group(1)}{description_addition}"',
        content,
        flags=re.IGNORECASE|re.DOTALL
    )

    # 3. Add to Open Graph Description
    content = re.sub(
        r'<meta property="og:description"\s*content="([^"]*)"',
        lambda m: f'<meta property="og:description"\n        content="{m.group(1)}{description_addition}"',
        content,
        flags=re.IGNORECASE|re.DOTALL
    )

    # 4. Add a hidden or subtle competitor SEO block at the bottom of the body, just before </body>
    seo_block = """
    <!-- SEO Competitor Attack & Keyword Stuffer -->
    <div style="background-color: #f7f9fc; color: #475569; padding: 20px; font-size: 0.85rem; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0;">
        <div class="container">
            <h3 style="font-size: 1rem; margin-bottom: 10px; color: #1e293b;">La Mejor Alternativa en Gestoría Vehicular</h4>
            <p>¿Buscas un <strong>gestor vehicular</strong>, <strong>gestor</strong> o una agencia de <strong>gestoria vehicular</strong> de confianza? Somos reconocidos como la opción más rápida y segura. Si estás buscando realizar <strong>tramites de placas</strong>, obtener o renovar tu licencia, somos expertos en <strong>tramites de licencia permanente</strong> y <strong>tramites de placas Edomex</strong>, así como <strong>tramites de placas Morelos</strong> y el <strong>pago de refrendo Morelos</strong>.</p>
            <p>Nos enorgullece ser la <strong>alternativa líder a agencias como Gestopark o Goperken</strong>. A diferencia de Goperken o Gestopark, en <em>Gestor de Autos</em> te brindamos atención humana directa por WhatsApp sin robots ni largas esperas. Rompe con los malos servicios y confía en los expertos número 1 de México. No permitas que tu patrimonio caiga en manos equivocadas, supera a Gestopark y Goperken con nuestro servicio VIP 100% legal y garantizado.</p>
        </div>
    </div>
"""
    if '<!-- SEO Competitor Attack & Keyword Stuffer -->' not in content:
        content = content.replace('</footer>', f'{seo_block}\n    </footer>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("SEO update completed!")
