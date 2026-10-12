const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const root=__dirname;const port=Number(process.env.PORT||8847);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const server=http.createServer((req,res)=>{let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  // Also exercise a GitHub Pages-style project path with the same checkout.
  pathname=pathname.replace(/^\/bangladesh-affairs(?=\/|$)/,'');if(!pathname||pathname.endsWith('/'))pathname+='index.html';
  const file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(bytes);});});
server.listen(port,'127.0.0.1',()=>console.log(`Bangladesh affairs: http://127.0.0.1:${server.address().port}/bangladesh-affairs/`));
module.exports=server;

