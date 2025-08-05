const fs = require("fs");

const fix_name = (n) => n.replace(/[^a-zA-Z0-9]/g,"");
const fix_name2 = (n) => fix_name(n).toLowerCase();

(async () => {
  const gifts = (await(await fetch("https://api.changes.tg/gifts")).json());
  fs.mkdirSync("./gifts/thumbs",{ recursive: true });
  for (const g of gifts) {
    /*fs.mkdirSync(`./gifts/thumbs/${g}`,{ recursive: true });
    const models = await(await fetch("https://api.changes.tg/models/"+encodeURIComponent(g))).json();
    for (const m of models) {
      if (!fs.existsSync(`./gifts/thumbs/${g}/${m.name.replaceAll("/","")}.png`)) {
        const b = Buffer.from(await(await fetch(`https://api.changes.tg/model/${encodeURIComponent(g)}/${encodeURIComponent(m.name)}.png`)).arrayBuffer());
        fs.writeFileSync(`./gifts/thumbs/${g}/${m.name.replaceAll("/","")}.png`,b);
        console.log(g,m.name);
      }
    }*/
    if (!fs.existsSync(`./gifts/thumbs/${fix_name2(g)}.png`)) {
      const b = Buffer.from(await(await fetch(`https://api.changes.tg/model/${g}/original.png`)).arrayBuffer());
      fs.writeFileSync(`./gifts/thumbs/${fix_name2(g)}.png`,b);
    }
  }
})();
