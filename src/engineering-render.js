export function drawGuardian(r,g,time,selected){
  const c=r.ctx;c.save();c.translate(g.x,g.y);
  r.ellipse(8,5,34,11,'#14372b45');
  if(selected){c.strokeStyle='#e9d49a';c.lineWidth=3;c.beginPath();c.ellipse(0,4,40,15,0,0,Math.PI*2);c.stroke();}
  const offline=g.health<=0,bob=offline?8:Math.sin(time*3)*1.5;c.translate(0,bob);
  c.fillStyle='#425b5c';c.fillRect(-20,-22,13,25);c.fillRect(9,-22,13,25);
  c.fillStyle=offline?'#64716b':'#8da7a4';c.fillRect(-26,-59,52,41);
  r.path([[-26,-59],[-16,-67],[32,-67],[26,-59]],'#b8ccc0');
  c.fillStyle='#36545a';c.fillRect(-17,-54,34,28);
  r.path([[3,-53],[-8,-40],[1,-40],[-4,-28],[12,-44],[3,-44]],offline?'#6c7770':'#9ceffc');
  c.fillStyle=offline?'#77837a':'#bad4c8';c.fillRect(-19,-86,38,23);
  c.fillStyle='#28474b';c.fillRect(-14,-80,28,8);
  c.fillStyle=offline?'#9b6f58':'#95f4ea';c.fillRect(-10,-78,6,4);c.fillRect(5,-78,6,4);
  c.fillStyle='#78938e';c.fillRect(-37,-55,10,29);c.fillRect(27,-54,11,24);
  c.fillStyle='#36545b';c.fillRect(30,-47,28,12);
  c.fillStyle=offline?'#7d8573':'#b7f7ff';c.fillRect(52,-45,7,8);
  c.fillStyle='#203e35';c.fillRect(-26,12,52,5);c.fillStyle=g.health>80?'#9bcab3':'#e0a176';c.fillRect(-26,12,52*g.health/240,5);
  c.restore();r.label(g.x,g.y-103,g.name,offline?'#b4a486':'#c3eeee');
}
export function drawTechnician(r,t,time){
  r.person(t,time);const c=r.ctx;c.save();c.fillStyle='#e2b354';c.fillRect(t.x-14,t.y-65,28,7);r.ellipse(t.x,t.y-67,11,7,'#e6bc65');c.strokeStyle='#cfdbcf';c.lineWidth=4;c.beginPath();c.moveTo(t.x+16,t.y-28);c.lineTo(t.x+24,t.y-12);c.stroke();c.restore();
}
