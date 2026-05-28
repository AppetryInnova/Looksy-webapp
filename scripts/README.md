# Wardrobe Image Generation Scripts

Este directorio contiene scripts para generar imágenes realistas del armario inicial.

## Scripts Disponibles

### 1. `generate-wardrobe-images.js`
Genera imágenes fotorrealistas de prendas usando la API de Gemini Image Generation.

**Uso:**
```bash
node scripts/generate-wardrobe-images.js
```

**Requisitos:**
- Variable de entorno `GEMINI_API_KEY` configurada
- Cuota de API disponible

**Genera:**
- 27 imágenes de alta calidad en `public/wardrobe-images/`
- Archivo `manifest.json` con el resultado de cada generación

**Categorías incluidas:**
- **Tops:** Camisetas, camisas formales, suéteres (6 variantes)
- **Bottoms:** Jeans, pantalones formales, chinos (5 variantes)
- **Shoes:** Zapatillas, zapatos formales, tacones (5 variantes)
- **Outerwear:** Chaquetas, abrigos (4 variantes)
- **Dresses:** Vestidos elegantes, casuales, formales (4 variantes)
- **Accessories:** Relojes, cinturones (4 variantes)

### 2. `update-starter-pack.js`
Actualiza automáticamente `src/lib/StarterPackData.ts` con las rutas de las imágenes generadas.

**Uso:**
```bash
node scripts/update-starter-pack.js
```

**Requisitos:**
- Ejecutar después de `generate-wardrobe-images.js`
- Archivo `manifest.json` existente

**Funcionalidad:**
- Lee el manifest de imágenes generadas
- Actualiza `StarterPackData.ts` con las nuevas rutas
- Usa SVG placeholders como fallback para imágenes no generadas

## Flujo de Trabajo Completo

```bash
# 1. Asegúrate de tener la API key configurada
export GEMINI_API_KEY="tu-api-key-aqui"

# 2. Genera las imágenes (cuando la cuota esté disponible)
node scripts/generate-wardrobe-images.js

# 3. Actualiza el código con las nuevas imágenes
node scripts/update-starter-pack.js

# 4. Reinicia el servidor de desarrollo
npm run dev
```

## Notas Importantes

- **Cuota de API:** La generación de imágenes consume cuota de la API de Gemini. El script espera 2 segundos entre cada generación para evitar límites de tasa.
- **Fallback:** Si alguna imagen falla al generarse, el sistema usará automáticamente los SVG placeholders existentes.
- **Calidad:** Todas las imágenes se generan con:
  - Resolución alta
  - Fondo blanco puro
  - Sin personas ni manos
  - Estilo e-commerce profesional
  - Relación de aspecto 3:4

## Troubleshooting

### Error: "GEMINI_API_KEY not found"
Configura la variable de entorno:
```bash
export GEMINI_API_KEY="tu-api-key"
```

### Error: "429 Too Many Requests"
La cuota de API se ha agotado. Espera hasta que se restablezca (generalmente 24 horas).

### Algunas imágenes fallaron
Revisa el archivo `manifest.json` para ver qué imágenes fallaron y sus errores. El script `update-starter-pack.js` usará SVG placeholders para las imágenes faltantes.
