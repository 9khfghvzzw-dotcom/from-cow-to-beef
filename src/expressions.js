export function expressionFor(n,time){
 if(n.expression&&n.expressionUntil>time)return n.expression;
 const action=n.intent||'';
 if(/Defend|Driving|Intercept|attack/i.test(action))return 'determined';
 if(/Harvest|Playing|Shared|Joined/i.test(action))return 'happy';
 if(/Plant|Water|Feed|Helping|repair|Tending/i.test(action))return 'focused';
 if((n.happiness??65)<30)return 'sad';
 if((n.happiness??65)>=80)return 'happy';
 return 'calm';
}
export function drawFace(c,n,time,robot=false){
 const mood=expressionFor(n,time),blink=Math.sin(time*1.7+n.x*.01)>.993;
 c.save();c.translate(0,Math.sin(time*2+n.x)*.5);
 c.strokeStyle=robot?'#a4fff2':'#493728';c.fillStyle=robot?'#a4fff2':'#fff6e8';c.lineWidth=1.7;c.lineCap='round';
 for(const x of [-5,5]){
  if(blink||mood==='happy'){c.beginPath();c.moveTo(x-2,-51);c.quadraticCurveTo(x,-54,x+2,-51);c.stroke();}
  else{c.beginPath();c.ellipse(x,-51,2.6,mood==='surprised'?3.6:2.6,0,0,Math.PI*2);c.fill();c.fillStyle=robot?'#25565c':'#344038';c.beginPath();c.arc(x+.5,-50.8,1.2,0,Math.PI*2);c.fill();c.fillStyle=robot?'#a4fff2':'#fff6e8';}
 }
 c.strokeStyle=robot?'#a4fff2':'#493728';
 if(mood==='determined'||mood==='focused'){c.beginPath();c.moveTo(-8,-57);c.lineTo(-2,-55);c.moveTo(2,-55);c.lineTo(8,-57);c.stroke();}
 if(mood==='surprised'){c.beginPath();c.ellipse(0,-43,2.5,3.5,0,0,Math.PI*2);c.stroke();}
 else{c.beginPath();c.moveTo(-4,-44);c.quadraticCurveTo(0,mood==='happy'?-37:mood==='determined'||mood==='sad'?-48:-41,4,-44);c.stroke();}
 if(mood==='happy'&&!robot){c.fillStyle='#e98d83';c.beginPath();c.ellipse(-8,-45,2.5,1.5,0,0,Math.PI*2);c.ellipse(8,-45,2.5,1.5,0,0,Math.PI*2);c.fill();}
 if(mood==='focused'){c.fillStyle='#88d9ff';c.beginPath();c.ellipse(12,-52,1.5,3,0,0,Math.PI*2);c.fill();}
 c.restore();
}
