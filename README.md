# landing-plataformaagentica-quales

Landing page de la Plataforma Agéntica de Quales.

## Cómo funciona (el circuito)

- **GitHub (este repo):** guarda los archivos de la web. Es la fuente de la verdad: lo que está acá es lo que se publica.
- **Cloudflare Pages:** está conectado a este repo. Cada commit se publica automáticamente en la pagina
- **Cloudflare R2:** almacena el video de la landing (los archivos pesados no van en el repo).
- **Claude Design:** donde se edita el diseño. Se exporta el `index.html` y se sube acá. El diseño NO se edita directo en el repo.
- **SendGrid + Pages Function:** el formulario de contacto envía los datos a la función `functions/api/contacto.js`, que manda un mail vía SendGrid.

## Estructura

- `index.html` — la página (exportada desde Claude Design).
- `functions/api/contacto.js` — función que procesa el formulario y envía el mail por SendGrid.

## Notas

- La API key de SendGrid NO está en el código: vive como variable de entorno secreta (`SENDGRID_API_KEY`) en Cloudflare Pages → Settings → Environment variables.
- Para cambiar el diseño: editar en Claude Design → exportar index.html → subir acá → Cloudflare publica solo.
