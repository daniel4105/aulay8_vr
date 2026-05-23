# 🎯 Viewer 3D – SketchUp + Three.js + WebXR

Visualizador de modelos 3D exportados desde SketchUp (.glb),
con soporte de Realidad Virtual (WebXR) y Bootstrap 5.

---

## 📁 Estructura del proyecto

```
proyecto-3d/
│
├── index.html                 ← Página principal
│
└── assets/
    ├── css/
    │   └── style.css          ← Estilos personalizados
    ├── js/
    │   └── viewer.js          ← Three.js + carga GLB + VR
    ├── models/
    │   └── modelo.glb         ← ⚠️ PON TU MODELO AQUÍ
    └── img/                   ← (opcional) imágenes extra
```

---

## 🚀 Uso rápido

1. **Copia tu modelo GLB** en `assets/models/` con el nombre `modelo.glb`
   (o edita `MODEL_PATH` en `assets/js/viewer.js`).

2. **Sirve el proyecto** con cualquier servidor local:
   ```bash
   # Python
   python -m http.server 8080

   # Node (npx)
   npx serve .

   # VS Code → extensión "Live Server"
   ```

3. Abre `http://localhost:8080` en tu navegador.

---

## 🕶️ Modo VR

- Conecta tu visor VR (Meta Quest, HTC Vive, etc.) al equipo.
- El botón **"Entrar en VR"** se activará automáticamente si el
  navegador detecta el dispositivo.
- Compatible con navegadores Chrome/Edge con soporte WebXR.

---

## 🎮 Controles del visor

| Acción               | Descripción                |
|----------------------|----------------------------|
| Arrastrar (botón 1)  | Rotar el modelo            |
| Arrastrar (botón 2)  | Desplazar (pan)            |
| Scroll / Pinch       | Zoom in / out              |
| Botón ↺              | Activar/desactivar auto-rotación |
| Botón ⊡              | Restablecer cámara         |
| Botón ⊞              | Alternar wireframe         |
| Botón 📁             | Cargar otro archivo GLB    |

---

## ✏️ Personalizar tus datos

Abre `index.html` y busca el bloque marcado con:

```html
<!-- ↓↓ EDITA TUS DATOS AQUÍ ↓↓ -->
```

Reemplaza:
- `Tu Nombre Aquí`
- `tu@email.com`
- `tu-usuario` (GitHub, LinkedIn)
- `tu-portfolio.com`

---

## 📦 Dependencias (CDN, sin instalación)

| Librería         | Versión | Fuente              |
|------------------|---------|---------------------|
| Three.js         | 0.165   | jsdelivr.net        |
| Bootstrap        | 5.3.3   | jsdelivr.net        |
| Bootstrap Icons  | 1.11.3  | jsdelivr.net        |
| Space Grotesk    | —       | Google Fonts        |
| Inter            | —       | Google Fonts        |

---

## 🛠️ Exportar desde SketchUp

1. **File → Export → 3D Model**
2. Selecciona formato: **glTF / GLB (.glb)**
3. Guarda como `modelo.glb` en `assets/models/`

> Si SketchUp no exporta GLB directamente, usa el plugin
> [SketchUp glTF Exporter](https://extensions.sketchup.com).

---

MIT License – 2025