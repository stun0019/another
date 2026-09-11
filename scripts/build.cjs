const fs=require('fs'),path=require('path'),F=require('../src/features.js');
const root=path.resolve(__dirname,'..'),src=path.join(root,'src');
const rows=fs.readdirSync(path.join(root,'2026')).filter(f=>/^\d{2}\.txt$/.test(f)).sort().flatMap(f=>F.parse(fs.readFileSync(path.join(root,'2026',f),'utf8')));F.validate(rows);
const files=['features.js','models.js','backtest.js','blind.js','app.js'];
const scripts=files.map(f=>{const content=fs.readFileSync(path.join(src,f),'utf8');new Function(content);return '<script>\n'+content+'\n</script>'}).join('\n');
const html=fs.readFileSync(path.join(src,'index.template.html'),'utf8').replace('/* STYLES */',fs.readFileSync(path.join(src,'style.css'),'utf8')).replace('<!-- DATA -->','<script type="application/json" id="lab-data">'+JSON.stringify(rows)+'</script>').replace('<!-- SCRIPTS -->',scripts);
fs.writeFileSync(path.join(root,'index.html'),html,'utf8');console.log('Built index.html: '+rows.length+' draws; self-contained offline HTML.');
