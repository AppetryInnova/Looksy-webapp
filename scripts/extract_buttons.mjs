import fs from 'fs';
import path from 'path';

const SRC_DIR = 'e:/Looksy/Looksy Gravity App/src';
const OUTPUT_FILE = 'C:/Users/nicol/.gemini/antigravity/brain/0cf49fba-b8a3-4d08-8354-773db6400b45/artifacts/botones_matriz_funcional.md';

function scanDirectory(dir) {
    let results = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            results = results.concat(scanDirectory(fullPath));
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
            results.push(fullPath);
        }
    }
    return results;
}

const files = scanDirectory(SRC_DIR);

let markdown = `# Matriz Funcional de Botones e Interacciones\n\n`;
markdown += `| Componente / Archivo | Elemento | Atributo/Acción | Supuesta Funcionalidad/Estado |\n`;
markdown += `|---|---|---|---|\n`;

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(SRC_DIR, file).replace(/\\/g, '/');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Match <button>, onClick=, href=
        if (line.match(/<button/i) || line.match(/onClick={/i) || line.match(/href=/i)) {
            let elemento = 'Interactuable';
            if (line.match(/<button/i)) elemento = 'Botón (<button>)';
            else if (line.match(/<Link/i)) elemento = 'Enlace (<Link>)';
            else if (line.match(/<a /i)) elemento = 'Enlace (<a href>)';
            else if (line.match(/onClick/i)) elemento = 'Div/Span (onClick)';

            let accion = 'Múltiple/Desconocido';
            const onClickMatch = line.match(/onClick={([^}]+)}/);
            if (onClickMatch) accion = onClickMatch[1];
            
            const hrefMatch = line.match(/href={?["']([^"'}]+)["']}?/);
            if (hrefMatch) accion = `Navegar a: ${hrefMatch[1]}`;

            let estado = '✅ Activo (Revisar)';
            if (accion.includes('console.log')) estado = '⚠️ Dummy (Log)';
            else if (accion.includes('TODO')) estado = '❌ TODO';
            else if (accion.includes('alert(')) estado = '⚠️ Modal/Alert Nativo';

            markdown += `| \`${relativePath}\` (Línea ${i+1}) | ${elemento} | \`${accion.trim().substring(0, 60)}\` | ${estado} |\n`;
        }
    }
}

// Make sure that the artifact directory exists, or it won't write
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, markdown);
console.log('Report generated at:', OUTPUT_FILE);
