import base64
import os
import re

md_path = r"C:\Users\Luis\.gemini\antigravity-ide\brain\e5bc39c6-f0ed-4fd6-a425-c3fc210308de\manual_usuario_sgh_gas.md"
html_path = r"C:\Users\Luis\Proyectos\sgh-mr - copia\Manual_Usuario_SGH.html"

with open(md_path, "r", encoding="utf-8") as f:
    md_content = f.read()

# Quitar las marcas del carrusel, ya que en HTML simple las mostraremos como una lista vertical de imágenes
md_content = md_content.replace("````carousel", "").replace("````", "").replace("<!-- slide -->", "")

# Función para convertir imágenes de markdown a HTML con base64
def img_replacer(match):
    alt_text = match.group(1)
    img_path = match.group(2)
    
    if os.path.exists(img_path):
        with open(img_path, "rb") as img_file:
            b64 = base64.b64encode(img_file.read()).decode("utf-8")
        ext = os.path.splitext(img_path)[1].lower().replace(".", "")
        if ext == "jpg": ext = "jpeg"
        # Estilos para que se vea bien en Word y navegadores
        return f'<div style="text-align: center; margin: 20px 0;"><img src="data:image/{ext};base64,{b64}" alt="{alt_text}" style="max-width: 100%; border: 1px solid #ccc; box-shadow: 2px 2px 5px rgba(0,0,0,0.2);"><p style="font-size: 12px; color: #666;"><i>{alt_text}</i></p></div>'
    return match.group(0)

# Reemplazar imágenes ![alt](ruta)
md_content = re.sub(r'!\[([^\]]+)\]\(([^)]+)\)', img_replacer, md_content)

# Convertir Markdown muy básico a HTML para Word (cabeceras, negritas, listas)
# 1. Cabeceras
md_content = re.sub(r'^# (.+)$', r'<h1 style="color: #1e40af; font-family: Arial, sans-serif;">\1</h1>', md_content, flags=re.MULTILINE)
md_content = re.sub(r'^## (.+)$', r'<h2 style="color: #2563eb; font-family: Arial, sans-serif; border-bottom: 1px solid #ccc; padding-bottom: 5px;">\1</h2>', md_content, flags=re.MULTILINE)
md_content = re.sub(r'^### (.+)$', r'<h3 style="color: #3b82f6; font-family: Arial, sans-serif;">\1</h3>', md_content, flags=re.MULTILINE)

# 2. Bloques de alerta (Quotes)
md_content = re.sub(r'^> \[!IMPORTANT\]\n> (.+)', r'<div style="background-color: #fff3cd; border-left: 5px solid #ffc107; padding: 10px; margin: 10px 0; font-family: Arial, sans-serif;"><strong>¡IMPORTANTE!</strong><br>\1</div>', md_content, flags=re.MULTILINE)
md_content = re.sub(r'^> \[!CAUTION\]\n> (.+)', r'<div style="background-color: #f8d7da; border-left: 5px solid #dc3545; padding: 10px; margin: 10px 0; font-family: Arial, sans-serif;"><strong>¡ATENCIÓN / PRECAUCIÓN!</strong><br>\1</div>', md_content, flags=re.MULTILINE)
md_content = re.sub(r'^> \[!TIP\]\n> (.+)', r'<div style="background-color: #d1ecf1; border-left: 5px solid #17a2b8; padding: 10px; margin: 10px 0; font-family: Arial, sans-serif;"><strong>¡TIP!</strong><br>\1</div>', md_content, flags=re.MULTILINE)

# 3. Negritas
md_content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', md_content)

# 4. Listas (muy rudimentario, pero funcional para este documento)
md_content = re.sub(r'^(\d+)\. (.+)$', r'<li style="margin-left: 20px;">\2</li>', md_content, flags=re.MULTILINE)
md_content = re.sub(r'^- (.+)$', r'<li style="margin-left: 20px; list-style-type: square;">\1</li>', md_content, flags=re.MULTILINE)

# 5. Saltos de línea para los párrafos normales
# Reemplazar líneas vacías con tags de párrafo
paragraphs = md_content.split('\n\n')
html_paragraphs = []
for p in paragraphs:
    if not p.strip().startswith('<') and p.strip() != '---':
        html_paragraphs.append(f'<p style="font-family: Arial, sans-serif; line-height: 1.5;">{p.strip()}</p>')
    else:
        html_paragraphs.append(p)

final_html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Manual de Usuario SGH</title>
</head>
<body style="padding: 40px; max-width: 800px; margin: 0 auto; color: #333;">
    {''.join(html_paragraphs)}
</body>
</html>"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(final_html)

print("HTML generado exitosamente en:", html_path)
