import {drawFace} from './expressions.js';
import { CROPS } from "./world.js";
import {drawGuardian,drawTechnician} from './engineering-render.js';
const TAU = Math.PI * 2;
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.scale = 1;
    this.ox = 0;
    this.oy = 0;
  }
  point(x, y) {
    return { x: (x - this.ox) / this.scale, y: (y - this.oy) / this.scale };
  }
  ellipse(x, y, rx, ry, color) {
    const c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, TAU);
    c.fill();
  }
  path(points, fill, stroke, width = 1) {
    const c = this.ctx;
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = width;
      c.stroke();
    }
  }
  tree(x, y, size = 1) {
    const c = this.ctx;
    c.save();
    c.translate(x, y);
    c.scale(size, size);
    this.ellipse(15, 12, 43, 15, "#17392525");
    c.fillStyle = "#645840";
    c.fillRect(-5, -70, 10, 75);
    this.ellipse(-17, -68, 34, 40, "#345a3c");
    this.ellipse(17, -85, 36, 43, "#416f45");
    this.ellipse(-7, -110, 30, 32, "#59834c");
    this.ellipse(-18, -117, 17, 15, "#729556");
    c.restore();
  }
  building(x, y, w, h, color) {
    const c = this.ctx;
    this.path(
      [
        [x, y],
        [x + w + 24, y + 8],
        [x + w + 55, y + 35],
        [x + 35, y + 35],
      ],
      "#20342625",
    );
    this.path(
      [
        [x, y - h],
        [x + w, y - h],
        [x + w, y],
        [x, y],
      ],
      color,
    );
    this.path(
      [
        [x + w, y - h],
        [x + w + 22, y - h - 15],
        [x + w + 22, y - 15],
        [x + w, y],
      ],
      "#765e49",
    );
    this.path(
      [
        [x - 14, y - h],
        [x + w / 2, y - h - 58],
        [x + w + 18, y - h],
        [x + w, y - h + 12],
      ],
      "#3c514a",
    );
    this.path(
      [
        [x + w / 2, y - h - 58],
        [x + w / 2 + 22, y - h - 72],
        [x + w + 35, y - h - 15],
        [x + w + 18, y - h],
      ],
      "#52675a",
    );
    c.fillStyle = "#2e4035";
    c.fillRect(x + w * 0.4, y - 50, w * 0.23, 50);
    c.fillStyle = "#ecdca4";
    c.fillRect(x + 16, y - h + 24, 22, 23);
    c.strokeStyle = "#806c4c";
    c.lineWidth = 3;
    c.strokeRect(x + 16, y - h + 24, 22, 23);
  }
  label(x, y, text, color = "#f7f0dc") {
    const c = this.ctx;
    c.font = '600 12px "DM Sans",sans-serif';
    c.textAlign = "center";
    const w = c.measureText(text).width + 18;
    c.fillStyle = "#17382acc";
    c.beginPath();
    c.roundRect(x - w / 2, y - 13, w, 21, 6);
    c.fill();
    c.fillStyle = color;
    c.fillText(text, x, y + 1);
  }
  animal(a, time, selected) {
    const c = this.ctx;
    c.save();
    c.translate(a.x, a.y);
    const cow = a.kind === "cow",
      scale = cow
        ? 0.55 + a.growth * 0.0045
        : a.kind === "chicken"
          ? 0.4
          : a.kind === "dog"
            ? 0.7
            : 0.8;
    c.scale(scale, scale);
    const bounce = Math.sin(time * 3 + a.x) * 1.3;
    this.ellipse(6, 6, 35, 12, "#24432b35");
    if (selected) {
      c.strokeStyle = "#f0d796";
      c.lineWidth = 2.5;
      c.beginPath();
      c.ellipse(0, 5, 45, 18, 0, 0, TAU);
      c.stroke();
    }
    c.translate(0, bounce);
    if (a.kind === "chicken") {
      this.ellipse(0, -20, 21, 19, a.golden?"#f2c84f":"#f8e9c5");
      this.ellipse(14, -34, 12, 13, a.golden?"#ffe88a":"#fff3d7");
      this.path(
        [
          [24, -36],
          [39, -30],
          [24, -27],
        ],
        "#d9a74c",
      );
      this.ellipse(11, -48, 6, 7, "#bb6650");
      c.fillStyle = "#322e23";
      c.fillRect(17, -38, 3, 3);
      if((a.eggs||0)+(a.goldenEggs||0)>0)this.ellipse(-28,0,10,7,(a.goldenEggs||0)>0?'#ffd24d':'#f8ead0');
      c.strokeStyle = "#b78845";
      c.lineWidth = 3;
      for (const x of [-7, 7]) {
        c.beginPath();
        c.moveTo(x, -5);
        c.lineTo(x, 9);
        c.stroke();
      }
    } else {
      for (const x of [-23, 19]) {
        c.fillStyle = "#5c584a";
        c.fillRect(x, -6, 8, 18);
      }
      this.ellipse(
        0,
        -20,
        34,
        23,
        cow ? "#f2ead7" : a.kind === "sheep" ? "#e9e3d1" : a.enemyType==='vampire'?"#432945":a.enemyType==='direwolf'?"#5d6670":"#bc8854",
      );
      if (cow) {
        this.ellipse(-13, -28, 14, 14, "#695d49");
        this.ellipse(19, -17, 10, 13, "#695d49");
      }
      if (a.kind === "sheep")
        for (let i = 0; i < 7; i++)
          this.ellipse(
            Math.cos(i) * 24,
            -23 + Math.sin(i) * 12,
            13,
            12,
            "#f5eeda",
          );
      this.ellipse(
        28,
        -30,
        15,
        21,
        cow ? "#f4ebd9" : a.kind === "sheep" ? "#786e58" : a.enemyType==='vampire'?"#6e3a63":a.enemyType==='direwolf'?"#737d88":"#ba8551",
      );
      this.ellipse(36, -17, 13, 8, cow ? "#cc9e88" : "#67513d");
      this.ellipse(28, -36, 2.5, 3, "#30382a");
      this.ellipse(15, -42, 10, 5, "#9c8870");
      if (cow) {
        this.path(
          [
            [20, -46],
            [18, -56],
            [25, -46],
          ],
          "#dfd0a9",
        );
        this.path(
          [
            [34, -48],
            [39, -58],
            [39, -45],
          ],
          "#dfd0a9",
        );
      }
      c.strokeStyle = "#75624b";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-31, -24);
      c.quadraticCurveTo(-45, -24, -42, -10);
      c.stroke();
    }
    c.restore();
    if (selected) {
      this.label(a.x, a.y - 64, a.name || a.kind);
      if (a.pregnancy !== null && cow)
        this.label(a.x, a.y + 29, "EXPECTING", "#e5c58d");
    }
  }
  person(n, time, player = false) {
    const c = this.ctx;
    c.save();
    c.translate(n.x, n.y);
    this.ellipse(5, 6, 18, 7, "#18352638");
    if (n.id === "child") c.scale(0.65, 0.65);
    const robot =
      n.id === "vet" ||
      (n.id === "partner" && n.role === "Robot companion") ||
      (n.id === "child" && ['Human–robot child','Robot child'].includes(n.role));
    c.fillStyle = robot ? "#647971" : "#394d40";
    c.fillRect(-10, -9, 7, 17);
    c.fillRect(4, -9, 7, 17);
    c.fillStyle = player
      ? "#dcbd79"
      : robot
        ? "#d4d9c6"
        : n.id === "farmer"
          ? "#b88a66"
          : "#729793";
    c.beginPath();
    c.roundRect(-14, -39, 28, 34, 8);
    c.fill();
    this.ellipse(0, -48, 11, 13, robot ? "#d9e1d8" : "#d5ac86");
    if (robot) {
      c.fillStyle = "#34675f";
      c.fillRect(-8, -53, 16, 8);
      c.fillStyle = "#b7eee1";
      c.fillRect(-5, -51, 4, 3);
      c.fillRect(3, -51, 4, 3);
      c.strokeStyle = "#839d88";
      c.beginPath();
      c.moveTo(0, -60);
      c.lineTo(0, -69);
      c.stroke();
      this.ellipse(0, -71, 3, 3, "#dec982");
    } else {
      this.ellipse(0, -58, 17, 5, player ? "#586849" : "#a7925c");
      c.fillStyle = player ? "#556548" : "#a7925c";
      c.fillRect(-10, -66, 20, 9);
    }
    drawFace(c,n,time,robot);
    if(!robot){c.fillStyle='#eec096';c.fillRect(12,-36,7,20);}
    if(player){
      const held=n.held;c.save();c.translate(22,-20);
      if(held==='watering_can'){c.fillStyle='#48b7d7';c.fillRect(-7,-8,18,17);this.path([[11,-4],[22,-10],[25,-5],[11,5]],'#91e8ed');}
      else if(held==='hoe'||held==='staff'||held==='spear'){c.strokeStyle='#cc9b55';c.lineWidth=4;c.beginPath();c.moveTo(0,14);c.lineTo(9,-39);c.stroke();if(held!=='staff')this.path([[6,-38],[18,-43],[16,-30],[5,-27]],'#b3dce4');}
      else if(held==='bow'){c.strokeStyle='#d9a058';c.lineWidth=3;c.beginPath();c.arc(-9,-10,23,-1.2,1.2);c.stroke();c.lineWidth=1;c.beginPath();c.moveTo(-1,-31);c.lineTo(-1,11);c.stroke();}
      else if(held==='blaster'||held==='cryo'){c.fillStyle=held==='cryo'?'#7fccef':'#588e98';c.fillRect(0,-12,25,11);c.fillStyle='#b6f8ff';c.fillRect(16,-10,12,5);}
      else if(held==='hammer'){c.strokeStyle='#c49359';c.lineWidth=5;c.beginPath();c.moveTo(0,12);c.lineTo(7,-18);c.stroke();c.fillStyle='#77b4c4';c.fillRect(-5,-29,26,14);}
      else if(held==='screwdriver'){c.strokeStyle='#c8e6df';c.lineWidth=3;c.beginPath();c.moveTo(0,1);c.lineTo(9,-24);c.stroke();c.strokeStyle='#f8b945';c.lineWidth=7;c.beginPath();c.moveTo(-3,10);c.lineTo(2,-3);c.stroke();}
      else {this.path([[0,2],[5,-29],[11,-35],[15,-26],[8,4]],'#c7e7ea','#628e9e',1);c.fillStyle='#efbf62';c.fillRect(-5,0,18,4);c.fillStyle='#91543c';c.fillRect(1,4,6,10);}
      c.restore();
    }
    c.restore();
    if (!player)
      this.label(n.x, n.y - 82, n.id === "vet" ? "B.O.V.I." : n.name);
  }
  draw(s) {
    const c = this.ctx,
      el = this.canvas,
      r = el.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    if (
      el.width !== Math.round(r.width * dpr) ||
      el.height !== Math.round(r.height * dpr)
    ) {
      el.width = Math.round(r.width * dpr);
      el.height = Math.round(r.height * dpr);
    }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = c.createLinearGradient(0, 0, 0, r.height);
    sky.addColorStop(0, "#b8c9a4");
    sky.addColorStop(0.35, "#8ba16a");
    sky.addColorStop(1, "#607c4c");
    c.fillStyle = sky;
    c.fillRect(0, 0, r.width, r.height);
    this.scale = Math.max(r.width / 1700, r.height / 1100);
    this.ox = r.width / 2 - s.player.x * this.scale;
    this.oy = r.height * 0.57 - s.player.y * this.scale;
    c.translate(this.ox, this.oy);
    c.scale(this.scale, this.scale);
    const ground = c.createLinearGradient(0, 100, 0, 1100);
    ground.addColorStop(0, "#aabd80");
    ground.addColorStop(.5, '#8cc05b');
    ground.addColorStop(1, "#4b954d");
    c.fillStyle = ground;
    c.fillRect(-2000, -2000, 6000, 5000);
    this.path(
      [
        [-300, 180],
        [100, 50],
        [500, 200],
        [900, 60],
        [1400, 180],
        [2000, 20],
        [2200, 370],
        [-300, 370],
      ],
      "#759568",
    );
    this.path(
      [
        [-300, 270],
        [200, 170],
        [620, 300],
        [1100, 150],
        [1700, 300],
        [2200, 180],
        [2200, 400],
        [-300, 400],
      ],
      "#87a074",
    );
    c.strokeStyle = "#c7bd8a";
    c.lineWidth = 60;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(280, 1000);
    c.bezierCurveTo(350, 730, 560, 830, 590, 590);
    c.bezierCurveTo(640, 330, 1000, 370, 1580, 310);
    c.stroke();
    c.strokeStyle = "#d8cc9b";
    c.lineWidth = 39;
    c.stroke();
    this.ellipse(1150, 867, 178, 70, "#b6bb87");
    this.ellipse(1150, 865, 155, 58, "#6a9f9b");
    this.ellipse(1143, 856, 145, 46, "#91b6a5");
    for (let i = 0; i < 5; i++) {
      c.strokeStyle = "#d2e0c16b";
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(
        1140 + Math.sin(s.time + i) * 5,
        857,
        40 + i * 21,
        9 + i * 6,
        0,
        0,
        Math.PI,
      );
      c.stroke();
    }
    for (let i = 0; i < 160; i++) {
      const x = (i * 137.37) % 1550,
        y = 370 + ((i * 73.93) % 580);
      if (x > 1050 && y > 790) continue;
      c.strokeStyle = i % 3 ? "#567b4a55" : "#b8c88977";
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - 3, y - 5);
      c.moveTo(x, y);
      c.lineTo(x + 3, y - 7);
      c.stroke();
      if (i % 9 === 0) this.ellipse(x, y - 7, 2, 2, "#e6d29b");
    }
    for (let x = 280; x < 1460; x += 65) {
      c.strokeStyle = "#81724f";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x, 394);
      c.lineTo(x + 65, 394);
      c.moveTo(x, 406);
      c.lineTo(x + 65, 406);
      c.stroke();
      c.fillStyle = "#b3a16e";
      c.fillRect(x - 3, 383, 6, 32);
    }
    this.building(735, 360, 160, 98, "#b58e67");
    this.building(235, 400, 90, 58, "#b9ac87");
    this.label(810, 215, "WILLOWBROOK FARM");
    this.label(280, 280, "ROBOT STATION");
    for (const p of s.crops) {
      this.ellipse(p.x + 4, p.y + 8, 34, 20, "#42633830");
      this.path(
        [
          [p.x - 28, p.y - 17],
          [p.x + 28, p.y - 17],
          [p.x + 28, p.y + 17],
          [p.x - 28, p.y + 17],
        ],
        p.water > 20 ? "#735a3e" : "#927750",
        "#a18a5d",
        2,
      );
      if (!p.type) continue;
      for (let i = 0; i < 6; i++) {
        const x = p.x - 18 + (i % 3) * 18,
          y = p.y - 7 + Math.floor(i / 3) * 16,
          h = p.growth * 0.18;
        c.strokeStyle = "#58783b";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x, y - h);
        c.stroke();
        this.ellipse(
          x - 3,
          y - h + 4,
          5,
          3,
          p.growth >= 100 ? CROPS[p.type].color : "#94b757",
        );
        this.ellipse(
          x + 3,
          y - h,
          5,
          3,
          p.growth >= 100 ? CROPS[p.type].color : "#acc779",
        );
      }
    }
    const entities = [
      ...s.cows.map((a) => ({
        y: a.y,
        draw: () => this.animal(a, s.time, a.id === s.selected),
      })),
      ...s.animals.map((a) => ({
        y: a.y,
        draw: () => this.animal(a, s.time, a.id === s.selected),
      })),
      ...s.npcs.map((n) => ({ y: n.y, draw: () => this.person(n, s.time) })),
      ...s.guards.map(g=>({y:g.y,draw:()=>drawGuardian(this,g,s.time,g.id===s.selected)})),
      ...s.technicians.map(t=>({y:t.y,draw:()=>drawTechnician(this,t,s.time)})),
      { y: s.player.y, draw: () => this.person({...s.player,held:s.activeTool==='weapon'?s.weapon:s.activeTool}, s.time, true) },
    ];
    for (const [x, y, z] of [
      [160, 500, 1.4],
      [1480, 520, 1.4],
      [1370, 760, 1],
      [150, 870, 1.5],
      [540, 900, 0.85],
      [1400, 1010, 1.4],
    ])
      entities.push({ y, draw: () => this.tree(x, y, z) });
    for (const w of s.wolves.filter(w=>!w.dead))
      entities.push({
        y: w.y,
        draw: () => {
          const hp=w.health??w.courage??3,max=w.maxHealth??(w.type==='vampire'?10:w.type==='direwolf'?6:3);
          c.fillStyle='#40252b';c.fillRect(w.x-25,w.y-51,50,6);c.fillStyle='#ef6c66';c.fillRect(w.x-25,w.y-51,50*Math.max(0,hp/max),6);
          this.animal({ ...w, kind: "dog", enemyType:w.type||'wolf' }, s.time, false);
          this.label(
            w.x,
            w.y - 60,
            w.frozen ? "FROZEN" : w.retreat ? "RETREATING" : w.type==='vampire'?"VAMPIRE":w.type==='direwolf'?"DIRE WOLF":"WOLF",
            w.frozen ? "#9ddde2" : w.type==='vampire'?"#f29ace":w.type==='direwolf'?"#c1cad4":"#efb194",
          );
        },
      });
    for (const b of s.buildings)
      entities.push({
        y: b.y,
        draw: () => {
          if (b.type === "wall") {
            this.path(
              [
                [b.x - 25, b.y - 18],
                [b.x + 25, b.y - 18],
                [b.x + 25, b.y],
                [b.x - 25, b.y],
              ],
              b.health > 0 ? "#8c9281" : "#737761",
            );
            this.path(
              [
                [b.x - 25, b.y - 18],
                [b.x - 17, b.y - 26],
                [b.x + 32, b.y - 26],
                [b.x + 25, b.y - 18],
              ],
              "#acb09a",
            );
            c.strokeStyle = "#606954";
            c.lineWidth = 2;
            c.strokeRect(b.x - 25, b.y - 18, 50, 18);
          } else
            this.building(
              b.x - 35,
              b.y,
              70,
              b.type === "barn" ? 65 : 55,
              b.health > 0 ? "#c0a47b" : "#817860",
            );
          if (b.id === s.selected)
            this.label(b.x, b.y - 80, b.type.toUpperCase());
        },
      });
    entities.sort((a, b) => a.y - b.y).forEach((e) => e.draw());
    for(const drop of s.lootDrops||[]){
      this.ellipse(drop.x,drop.y,17,9,'#f7cd65');this.label(drop.x,drop.y-18,drop.type==='fur'?'FUR':drop.type==='fang'?'FANG':'ESSENCE','#ffe4a0');
    }
    if(s.sanctuaryUntil>s.time){
      c.save();c.strokeStyle='#b5a0ff';c.lineWidth=4;c.shadowColor='#aa88ff';c.shadowBlur=16;
      for(const a of [s.player,...s.cows,...s.guards,...s.buildings]){c.beginPath();c.ellipse(a.x,a.y-15,35,45,0,0,TAU);c.stroke();}c.restore();
    }
    for(const arrow of s.projectiles||[]){
      if(arrow.kind==='fireball'){c.save();c.shadowColor='#ff6b20';c.shadowBlur=25;this.ellipse(arrow.x,arrow.y,13,13,'#ff752b');this.ellipse(arrow.x,arrow.y,7,7,'#fff0a0');c.restore();continue;}
      c.save();c.translate(arrow.x,arrow.y);c.rotate(arrow.angle||0);c.strokeStyle=arrow.color;c.lineWidth=3;c.beginPath();c.moveTo(-26,0);c.lineTo(8,0);c.stroke();c.fillStyle=arrow.color;c.beginPath();c.moveTo(12,0);c.lineTo(2,-5);c.lineTo(2,5);c.fill();c.beginPath();c.moveTo(-24,-5);c.lineTo(-18,0);c.lineTo(-24,5);c.stroke();c.restore();
    }
    for (const e of s.effects) {
      if(e.kind==='speech'){if(e.startsAt>s.time||s.effects.filter(other=>other.kind==='speech'&&other.x===e.x&&other.y===e.y&&(!other.startsAt||other.startsAt<=s.time)).at(-1)!==e)continue;this.label(e.x,e.y,'♥  '+(e.text.length>48?e.text.slice(0,45)+'…':e.text));continue;}
      if(e.kind==='frost-wave'){c.save();c.strokeStyle='#a7edff';c.lineWidth=7;c.shadowColor='#79cfff';c.shadowBlur=15;c.beginPath();c.arc(e.x,e.y,Math.min(320,(s.time-e.start)*320),0,TAU);c.stroke();c.restore();continue;}
      if(e.kind==='explosion'){c.save();c.globalAlpha=Math.max(0,(e.until-s.time)/.6);this.ellipse(e.x,e.y,15+(s.time-e.start)*70,15+(s.time-e.start)*70,'#ff9545');c.restore();continue;}
      if(e.kind==='rain-target'||e.kind==='bloom-target'){c.save();const t=s.time-e.start;c.strokeStyle=e.kind==='rain-target'?'#74d6ff':'#8af58e';c.lineWidth=3;for(let i=0;i<5;i++){const x=e.x-20+i*10,y=e.y-50+((t*55+i*11)%45);c.beginPath();c.moveTo(x,y);c.lineTo(x+(e.kind==='rain-target'?-3:6),y+9);c.stroke();}c.restore();continue;}
      if(e.kind==='npc-action'){c.save();c.strokeStyle=e.action==='attack'?'#ffd28d':e.action==='water'||e.action==='care'?'#7adfff':'#b8f482';c.lineWidth=3;c.setLineDash([5,5]);c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.tx,e.ty);c.stroke();c.restore();this.label(e.x,e.y-25,e.action.toUpperCase());continue;}
      if(e.kind==='damage'){c.save();c.fillStyle='#fff0a4';c.font='bold 22px sans-serif';c.textAlign='center';c.fillText('-'+e.amount,e.x,e.y-(.8-(e.until-s.time))*35);c.restore();continue;}
      if(e.kind==='electric'){
        c.save();c.strokeStyle='#b2f5ff';c.lineWidth=4;c.shadowColor='#5fd8ff';c.shadowBlur=16;c.beginPath();c.moveTo(e.exactOrigin?e.x:e.x+48,e.y);c.lineTo((e.x+e.tx)/2,e.y-20);c.lineTo((e.x+e.tx)/2+12,e.y+5);c.lineTo(e.tx,e.ty);c.stroke();c.restore();continue;
      }
      const t = 2 - (e.until - s.time),
        colors = {
          rain: "#afd6e2",
          frost: "#c0e5e8",
          bloom: "#d6e995",
          fire: "#f3bc70",
          attack: "#f3dfaa",
        };
      c.strokeStyle = colors[e.kind];
      c.lineWidth = 4;
      c.globalAlpha = (2 - t) / 2;
      c.beginPath();
      c.ellipse(e.x, e.y, 40 + t * 100, 20 + t * 45, 0, 0, TAU);
      c.stroke();
      for (let i = 0; i < 20; i++)
        this.ellipse(
          e.x + Math.sin(i * 3) * t * 110,
          e.y + Math.cos(i * 3) * t * 45 - t * 30,
          3,
          6,
          colors[e.kind],
        );
      c.globalAlpha = 1;
    }
    const night = (Math.sin(s.time / 180 - Math.PI / 2) + 1) * 0.075;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = `rgba(18,39,59,${night})`;
    c.fillRect(0, 0, r.width, r.height);
    const vignette = c.createRadialGradient(
      r.width * 0.5,
      r.height * 0.5,
      Math.min(r.width, r.height) * 0.2,
      r.width * 0.5,
      r.height * 0.5,
      Math.max(r.width, r.height) * 0.7,
    );
    vignette.addColorStop(0, "#132c2100");
    vignette.addColorStop(1, "#132c2145");
    c.fillStyle = vignette;
    c.fillRect(0, 0, r.width, r.height);
  }
}
