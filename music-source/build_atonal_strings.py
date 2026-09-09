"""Editable original atonal quartet, 20 minutes; twelve-tone cells, no tonal chord plan.
The user's quartet screenshots inform texture/articulation, not copied notes.
Run again to reuse unchanged two-minute section renders; edit the JSON score directly.
"""
from pathlib import Path
import json,hashlib,subprocess,wave,importlib.util
import numpy as np
R=Path(__file__).resolve().parent;P=R.parent;C=P/'.qa'/'atonal-strings';C.mkdir(parents=True,exist_ok=True)
SR=32000
VOICE={'violin1':(.17,-.4,60,88),'violin2':(.15,.35,55,83),'viola':(.18,-.15,48,76),'cello':(.24,.2,36,64)}
ROW=[0,5,10,3,8,1,6,11,4,9,2,7]
NAMES=['Four questions','Interwoven shadows','Plucked fragments','Chromatic pursuit','Suspended light','Broken mirrors','Inversion and reply','Close intervals','Restless arches','Dissolving threads']
def compose():
 sections=[]
 for si in range(10):
  events=[];phrase_count=[12,10,16,18,8,14,12,10,16,8][si];span=120/phrase_count
  for vi,(voice,(_,_,lo,hi)) in enumerate(VOICE.items()):
   previous=(lo+hi)//2
   for phrase in range(phrase_count):
    transform=(phrase+vi+si)%4;row=ROW[::-1] if transform>=2 else ROW
    pcs=[(((-n if transform%2 else n)+(si*7+phrase*5+vi*3))%12) for n in row]
    # Independent subdivisions and delays: each voice completes its own aggregate.
    rhythm=np.array([[1,1,.5,1.5,.5,1,1.5,.5,1,1,.5,1.5],[1.5,.5,1,1,.5,1.5,1,1,.5,.5,1.5,1],[2,1,1,.5,.5,1,2,.5,.5,1,1,1],[1,2,.5,.5,1,1,1,2,.5,.5,1,1]][(vi+phrase)%4])
    usable=span*(.82 if si in (2,5,8) else .94);durations=rhythm/rhythm.sum()*usable
    t=phrase*span+vi*.035*span
    for j,(pc,d) in enumerate(zip(pcs,durations)):
     candidates=[n for n in range(lo,hi+1) if n%12==pc]
     # Local voice leading, with occasional register expansion and contrary contour.
     direction=1 if (phrase+vi)%2==0 else -1
     target=previous+direction*(3 if j%4 else 8)
     pitch=min(candidates,key=lambda n:abs(n-target));previous=pitch
     articulation='pizzicato' if si in (2,5) and (phrase+vi)%3!=0 else 'marcato' if si in (3,8) else 'arco'
     gate=.5 if articulation=='pizzicato' else .7 if articulation=='marcato' else .96
     velocity=.42+.22*np.sin(np.pi*(phrase+.5)/phrase_count)+.06*np.sin(j*np.pi/6+vi)
     events.append({'voice':voice,'t':round(float(t),6),'d':round(float(min(d*gate,120-t)),6),'p':pitch,'v':round(float(velocity),4),'articulation':articulation,'phrase':phrase,'row_form':transform})
     t+=d
  sections.append({'name':NAMES[si],'duration':120,'harmony':'non-functional chromatic; independent twelve-tone aggregates','events':events})
 return {'duration':1200,'instrumentation':list(VOICE),'row':ROW,'sections':sections}
def render(section,path):
 mix=np.zeros((120*SR,2),dtype=np.float32)
 for e in section['events']:
  gain,pan,_,_=VOICE[e['voice']];d=e['d'];start=round(e['t']*SR);n=min(int((d+.12)*SR),len(mix)-start)
  t=np.arange(n)/SR;f=440*2**((e['p']-69)/12);signal=np.zeros(n)
  for cents in (-4,3):
   phase=2*np.pi*f*2**(cents/1200)*t+.07*np.sin(2*np.pi*5.2*t)
   for h in range(1,9):signal+=np.sin(h*phase)/(h**1.5)*.5
  art=e['articulation']
  if art=='pizzicato':env=np.minimum(1,t/.004)*np.exp(-t/max(.05,min(.22,d*.7)))*np.clip((d+.12-t)/.12,0,1)
  else:
   attack=.018 if art=='marcato' else min(.07,d*.2)
   env=np.minimum(1,t/max(.008,attack))*np.clip((d+.12-t)/.15,0,1)
   if art=='marcato':env*=.65+.35*np.exp(-t/.06)
  signal*=env*gain*e['v'];mix[start:start+n,0]+=signal*np.sqrt((1-pan)/2);mix[start:start+n,1]+=signal*np.sqrt((1+pan)/2)
 dry=mix.copy()
 for delay,g in ((.093,.13),(.167,.09),(.283,.05)):
  n=int(delay*SR);mix[n:]+=dry[:-n,::-1]*g
 n=int(.25*SR);mix[:n]*=np.linspace(0,1,n)[:,None];mix[-n:]*=np.linspace(1,0,n)[:,None]
 peak=float(np.max(np.abs(mix)));assert peak<1
 with wave.open(str(path),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
 return peak
if __name__=='__main__':
 p=R/'atonal-strings-score.json'
 if not p.exists():p.write_text(json.dumps(compose(),indent=2))
 score=json.loads(p.read_text());assert sum(s['duration'] for s in score['sections'])==1200
 engine=Path(__file__).read_bytes()
 for i,s in enumerate(score['sections']):
  key=hashlib.sha256(engine+json.dumps(s,sort_keys=True).encode()).hexdigest();out=C/f'section-{i}.wav';marker=C/f'section-{i}.hash'
  if not(out.exists() and marker.exists() and marker.read_text()==key):
   peak=render(s,out);marker.write_text(key);print(f'Rendered {i+1}/10 {s["name"]}, peak {peak:.3f}',flush=True)
  else:print(f'Reused {i+1}/10',flush=True)
 listing=C/'concat.txt';listing.write_text(''.join(f"file 'section-{i}.wav'\n" for i in range(10)))
 subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(listing),'-af','loudnorm=I=-20:TP=-2:LRA=10','-ar','32000','-c:a','libmp3lame','-b:a','96k',str(P/'public/audio/atonal-quartet-20min.mp3')],check=True)
 print('Exported 20-minute atonal quartet.',flush=True)
