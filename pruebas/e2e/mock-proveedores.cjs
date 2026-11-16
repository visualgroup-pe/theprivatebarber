// Servidor de prueba: imita Resend y WhatsApp Cloud API y guarda cada pedido (GET /__log).
// Imita Resend (POST /emails) y WhatsApp Cloud API (POST /vXX/<id>/messages). Guarda cada pedido.
const http = require('http');
const log = [];
let n = 0;
http.createServer((req, res) => {
  let cuerpo = '';
  req.on('data', (c) => (cuerpo += c));
  req.on('end', () => {
    if (req.url === '/__log') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify(log)); }
    if (req.url === '/__reset') { log.length = 0; return res.end('ok'); }
    const json = cuerpo ? JSON.parse(cuerpo) : null;
    const entrada = { t: Date.now(), url: req.url, auth: req.headers.authorization, idem: req.headers['idempotency-key'], json };
    log.push(entrada);
    res.setHeader('content-type', 'application/json');
    if (req.url === '/emails') return res.end(JSON.stringify({ id: `re_${++n}` }));
    if (/\/messages$/.test(req.url)) return res.end(JSON.stringify({ messages: [{ id: `wamid.${++n}` }] }));
    res.statusCode = 404; res.end('{}');
  });
}).listen(3999, () => console.log('mock en 3999'));
