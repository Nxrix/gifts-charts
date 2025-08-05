const fs = require("fs");

const fix_name = (n) => n.replace(/[^a-zA-Z0-9]/g, "");
const fix_name2 = (n) => fix_name(n).toLowerCase();

const update_g = (n,p) => {
  const l = {
    daily: 144,
    weekly: 1008,
    monthly: 4320,
    yearly: 52560
  };
  let ch = [];
  const b = "./gifts/charts/"+n;
  if (!fs.existsSync(b)) {
    fs.mkdirSync(b,{ recursive: true });
  }
  for (const t of ["daily","weekly","monthly","yearly"]) {
    const f = b+"/"+t+".json";
    let c = [];
    if (fs.existsSync(f)) {
      c = JSON.parse(fs.readFileSync(f,"utf8"));
    }
    ch.push([
      c[0]?.[0]?Math.round((p[0]-c[0][0])/c[0][0]*1000)/1000:0,
      c[0]?.[1]?Math.round((p[1]-c[0][1])/c[0][1]*1000)/1000:0
    ]);
    while (c.length > l[t]) {
      c.shift();
    }
    c.push(p);
    fs.writeFileSync(f,JSON.stringify(c),"utf8");
  }

  let all = [];
  if (!fs.existsSync(b+"/all.json")) {
    if (fs.existsSync(b+"/yearly.json")) {
      const yearly = JSON.parse(fs.readFileSync(b+"/yearly.json","utf8"));
      all = yearly;
    }
  } else {
    all = JSON.parse(fs.readFileSync(b+"/all.json","utf8"));
    all.push(p);
  }
  fs.writeFileSync(b+"/all.json",JSON.stringify(all),"utf8");

  return ch;
}

const update_marketcap = (r) => {
  const timeframes = ["daily", "weekly", "monthly", "yearly"];
  const lengths = {
    daily: 144,
    weekly: 1008,
    monthly: 4320,
    yearly: 52560
  };

  const marketcaps = {
    daily: [],
    weekly: [],
    monthly: [],
    yearly: [],
  };

  for (const g of r) {
    const supply = g.supply || 0;
    const basePath = "./gifts/charts/" + fix_name2(g.name);

    for (const t of timeframes) {
      const file = basePath + "/" + t + ".json";
      if (!fs.existsSync(file)) continue;

      const chart = JSON.parse(fs.readFileSync(file, "utf8"));
      chart.forEach((point, i) => {
        const ton = point[0] * supply;
        const usd = point[1] * supply;
        if (!marketcaps[t][i]) marketcaps[t][i] = [0, 0];
        marketcaps[t][i][0] = Math.round(marketcaps[t][i][0] + ton);
        marketcaps[t][i][1] = Math.round(marketcaps[t][i][1] + usd);
      });
    }
  }
  if (!fs.existsSync("./gifts/marketcap")) {
    fs.mkdirSync("./gifts/marketcap", { recursive: true });
  }
  for (const t of timeframes) {
    fs.writeFileSync(`./gifts/marketcap/${t}.json`,JSON.stringify(marketcaps[t]),"utf8");
  }
}

const fetch2 = async (u,o = {},to = 10000) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), to);
  try {
    const r = await fetch(u,{
      ...o,
      signal: c.signal
    });
    clearTimeout(t);
    return r;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

( async () => {

  let r = [];
  if (fs.existsSync("./gifts/prices.json")) {
    r = JSON.parse(fs.readFileSync("./gifts/prices.json","utf8"));
  }

  const ton = (await(await fetch("https://api.diadata.org/v1/assetQuotation/Ton/0x0000000000000000000000000000000000000000")).json()).Price;

  try {

    const r2 = await(await fetch2("https://proxy.thermos.gifts/api/v1/collections", {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9,fa;q=0.8",
        "cache-control": "public, max-age=300",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "referrer": "https://thermos.gifts/",
      }
    })).json();

    for (const g of r2) {
      const g2 = r.find(i=>fix_name2(i.name)==fix_name2(g.name));
      if (!g2) r.push({
        name: g.name,
        price: { ton: 0 , usd: 0 },
        change: [[0,0],[0,0],[0,0],[0,0]],
        supply: 0,
        count: 0,
      });
      const g3 = r.find(i=>fix_name2(i.name)==fix_name2(g.name));
      if (g?.stats.floor) {
        g3.price.ton = Math.round(parseInt(g.stats.floor)/1e9*1000    )/1000;
        g3.price.usd = Math.round(parseInt(g.stats.floor)/1e9*1000*ton)/1000;
        g3.count = parseInt(g.stats.count);
      }
    }

  } catch (e) {
    console.log(e.stack);
  }

  try {
    for (const g of r) {
      const t = await(await fetch2("https://t.me/nft/"+fix_name2(g.name)+"-1",{},3000)).text();
      g.supply = parseInt(t.split("<td>")[5]?.split(" issued")[0]?.split("/")[0].replaceAll(" ",""))||0;
    }
  } catch (e) {
    console.log(e.stack);
  }

  for (const g of r) {
    g.change = update_g(fix_name2(g.name),[g.price.ton,g.price.usd]);
  }

  r.sort((a,b)=>b.price.ton-a.price.ton);

  fs.writeFileSync("./gifts/prices.json",JSON.stringify(r),"utf8");

  //update_marketcap(r);

})();
