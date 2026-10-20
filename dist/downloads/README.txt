# SIENNA — The Open Gallery

A standalone English-language 3D website for SIENNA Catalogue 2026. This does not replace the Ruang project.

Public repository: https://github.com/rizky-make-it/sienna-house-2026
GitHub Pages website: https://rizky-make-it.github.io/sienna-house-2026/

Website and 3D visualisation created by Muhammad Rizky.

## Open exhibition

The latest version is a furniture exhibition without walls, partitions, window
frames, curtains, or a roof. Four display zones are defined by floor inlays and
information signs, with a central aisle and circulation around the perimeter.
The catalogue dimensions and 14 SKUs are unchanged; all 17 product placements and
32 drawer/door pivots are preserved.

The browser starts in Orbit exhibition mode. Choose a zone or Walk to move around.
Legacy wall colliders have been removed; furniture and display-foot collisions
remain active. The original house version is preserved separately in the workspace.

## File requests via WhatsApp

All file-request buttons open a contact pop-up and prepare a WhatsApp message
identifying the selected file or SKU. Messages are never sent automatically.
The public destination is configured in dist/contact-config.js using international
format (country code, without a leading local zero). Currently placeholder=true
with the example number 6200000000000: the pop-up works, but never opens a chat
with that example number. To enable chat, replace whatsappNumber with your real
number and set placeholder to false. Deployment rejects invalid number formats.
Creator credits appear in the footer and on the sources and licences page.

This changes the UI flow, not access control. The public repository and static
assets remain directly accessible; GLB models are also required by the browser
tour. Never put confidential data in the repository or dist folder.

## Run locally

1. Install Node.js 20 or later.
2. Open this website folder and run `npm run dev`.
3. Open http://127.0.0.1:4174. Do not open index.html through file:// because GLB
   loading requires an HTTP server.
4. No npm install or build is needed. Three.js 0.186.1, Draco, and fonts are local.

## GitHub Pages hosting

1. In the GitHub repository, choose Settings → Pages → Source: GitHub Actions.
2. Push changes to main. The .github/workflows/pages.yml workflow validates models
   and renders, then publishes only the dist folder.
3. Monitor Actions → Deploy SIENNA to GitHub Pages.
4. To deploy manually, select that workflow → Run workflow → main.
5. Website URL: https://rizky-make-it.github.io/sienna-house-2026/
6. Relative asset paths support the repository subfolder. No npm install, build,
   API key, backend, or Vercel is required.

The .openai/hosting.json manifest is only used by Sites deployment, not GitHub Pages.
Never publish tokens, credentials, or the .local or .vercel folders.
This repository and website are public, including Blender files, models, and catalogue.

## Controls

- Exhibition tour: start in Orbit exhibition mode. Choose a zone, then drag to look.
  Click the canvas and use WASD / arrow keys, or use the on-screen controls to walk.
- Click furniture to view its SKU, dimensions, and drawer/door interactions.
- Product inspection: orbit, pan, zoom, open/close moving parts, and request a GLB
  for a specific SKU via WhatsApp.
- Orbit exhibition: view the entire display. Press Esc or Exhibition to leave
  product inspection.
- Product thumbnails come from the original catalogue; 3D models are reconstructed.
  The current gallery contains Blender EEVEE renders, not AI-generated images.

## Files

- dist/: deployment-ready website, assets, and downloadable files.
- dist/downloads/sienna-house.blend: open exhibition master, metric units, packed textures.
- dist/downloads/sienna-project.zip: Blender scripts, textures, and metadata.
- dist/assets/sienna-house.glb: complete browser exhibition without walls or a roof.
- dist/assets/models/: 14 product models, one file per SKU, with moving-part pivots.
- dist/downloads/*-4k.png: original lossless 3840 × 2160 renders.
- dist/downloads/render-proof.json: file size, resolution, and SHA-256 for each render.

In Blender, the file opens in exhibition overview / Material Preview. Products are
grouped by zone and SKU. Camera markers at frames 1 / 31 / 61 / 91 switch to the
overview / dining / living / Queen display. Numpad 0 toggles camera view. The file
remains configured for Cycles; the four website PNGs use EEVEE, 64 samples, UHD 4K.

To rebuild from the ZIP, run build_house.py in Blender to create the product base,
then open the resulting sienna-house.blend and run build_exhibition.py. This creates
sienna-exhibition.blend. Export with export_web.py, render with
render_exhibition.py -- all, and package with prepare_assets.py --exhibition.

## Interpretation limits

All 14 SKUs follow the dimensions printed in the catalogue. Model axes: X width,
Y depth, Z height, front -Y. UI dimensions: width × depth × height. Bed widths are
1630 / 1930 mm, with a depth / length of 2125 mm. Handles may extend beyond the body.
Tallboy B51: the catalogue says “2 Over 4 Drawers” but shows four wide drawer fronts;
the model follows the photograph. Lamp table L11: 550 × 550 × 550 mm on page 5.

This is a visual study, not manufacturer CAD or production drawings. Exhibition
styling, hidden joinery, chairs, sofa, ornaments, and accessories are design
interpretations. King and Queen collections occupy separate zones in one open gallery.

The browser uses real-time lighting and environment reflections, not Cycles
ray tracing. Shadow quality and frame rate depend on the device. WebGL2 is required;
images and file requests remain available without WebGL.

## Credits

Product references: SIENNA CATALOGUE 2026.pdf, supplied by the project owner,
Living Ikon, 6 pages. No manufacturer affiliation or endorsement is claimed.
Ash Veneer: Jenelle van Heerden / Poly Haven (CC0),
https://polyhaven.com/a/ash_veneer . Warm Brown is an interpreted stain.
Three.js 0.186.1 (MIT); Draco decoder (Apache 2.0); DM Sans and Instrument Serif
(SIL Open Font License). See dist/credits.html and the vendored licences.
