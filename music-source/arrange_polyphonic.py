"""Deterministic four-voice arrangement; original source remains untouched.
48 bars 6/8 dotted-quarter=92 -> 16 bars 4/4 quarter=92 swing (2:1).
This is a subtractive Moog-inspired approximation, not an original preset.
"""
from pathlib import Path
import importlib.util,json,wave
import numpy as np

ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('source',ROOT/'yes_or_no_soli.py')
source=importlib.util.module_from_spec(spec);spec.loader.exec_module(source)
SR=44100; PULSE=60/92; STEP=PULSE/6; CHORUS_START=48*2*PULSE; CHORUS_LENGTH=16*4*PULSE
EVENTS=[]
def add(voice,t,d,p,v=.6):
 EVENTS.append(dict(voice=voice,t=round(t,6),d=round(d,6),p=p,v=v))
def shift(t):return t+(CHORUS_LENGTH if t>=CHORUS_START-1e-6 else 0)
def fit(p,lo,hi):
 while p<lo:p+=12
 while p>hi:p-=12
 return p
# Preserve EVERY source event, including instruments, rests, chords and lead pitches.
raw=source.build_events()
for e in raw:
 for pitch in e['ps']:
  voice=e['inst']
  if voice=='drums':voice={36:'kick',38:'snare',42:'hat',49:'ride'}.get(pitch,'hat')
  add(voice,e['s']*STEP,e['l']*STEP*.94,pitch,e['v']*.7)
  EVENTS[-1]['original']=True
# Add independent counter-lines without deleting or replacing any original line.
for bar in range(48):
 start=bar*12
 root=source.WORLDS[source.BARS[bar]['w']]['root']%12
 scale=[root+x for x in (0,2,3,5,7,9,10)]
 # Independent alto imitation, contrary tenor, and moving bass; staggered rhythms.
 for j,off in enumerate((1,4,7,10)):
  degree=(bar+j if bar%4<2 else bar-j)%7
  add('alto',shift((start+off)*STEP),2.8*STEP,fit(scale[degree],53,69),.43)
 for j,off in enumerate((0,5,9)):
  degree=(6-bar-j*2)%7
  add('tenor',shift((start+off)*STEP),(4.6 if j<2 else 2.8)*STEP,fit(scale[degree],43,58),.4)
# Open 16-bar chorus: long answering melody, spacious harmony, walking bass, swing ride.
chords=[(53,[0,3,7,10]),(58,[0,3,7,10]),(51,[0,4,7,10]),(56,[0,4,7,11]),
        (49,[0,4,7,11]),(50,[0,3,6,10]),(55,[0,4,7,10]),(48,[0,4,7,10])]
melody=[(0,1.7,72),(2,1.5,75),(0,2.7,77),(3,0.62,75),(3+2/3,.3,72),
        (0,1.8,70),(2,1.7,74),(0,3.7,75)]
for bar in range(16):
 t=CHORUS_START+bar*4*PULSE;r,c=chords[bar%8]
 phrase=[[(0,1.7,72),(2,1.5,75)],[(0,2.7,77),(3,.62,75),(3+2/3,.3,72)],[(0,1.8,70),(2,1.7,74)],[(0,3.7,75)]][bar%4]
 for off,d,p in phrase:add('lead',t+off*PULSE,d*PULSE,p+(2 if bar>=8 and bar%4<2 else 0),.66)
 for j,off in enumerate((0,1+2/3,3)):
  add('alto',t+off*PULSE,(1.5 if j<2 else .85)*PULSE,fit(r+c[(bar+j)%4],55,70),.38)
 for j,off in enumerate((0,2+2/3)):
  add('tenor',t+off*PULSE,(2.4 if j==0 else 1.2)*PULSE,fit(r+c[(3-j+bar)%4],45,59),.35)
 for beat in range(4):
  add('bass',t+beat*PULSE,.9*PULSE,fit(r+c[beat],29,45),.62)
  add('ride',t+beat*PULSE,.25,51,.19)
  if beat%2:add('ride',t+(beat+2/3)*PULSE,.2,51,.13);add('snare',t+beat*PULSE,.16,38,.22)
 add('kick',t,.22,36,.35)
DURATION=48*2*PULSE+CHORUS_LENGTH+1.5

def render(out):
 mix=np.zeros((int(DURATION*SR),2));rng=np.random.default_rng(92)
 pans={'flute':-.25,'synth':.1,'guitar':.25,'lead':0,'alto':-.45,'tenor':.4,'bass':0,'hat':-.25,'ride':.3,'snare':0,'kick':0}
 for e in EVENTS:
  voice=e['voice'];d=e['d'];t=np.arange(int((d+.16)*SR))/SR;f=440*2**((e['p']-69)/12)
  if voice in ('lead','synth','flute','guitar','alto','tenor','bass'):
   # Band-limited saw oscillators, slight detune, four-pole low-pass; filter envelope via two bands.
   sig=np.zeros(len(t));bright=np.zeros(len(t));cut={'synth':2600,'flute':4200,'guitar':2600,'lead':2600,'alto':1800,'tenor':1350,'bass':650}[voice]
   for detune,gain in ((1,.65),(2**(.045/12),.35)):
    for k in range(1,min(48,int(SR/2/f/detune))):
     partial=np.sin(2*np.pi*f*detune*k*t)/k
     sig+=partial*gain/(1+(k*f/(cut*.42))**4)
     bright+=partial*gain/(1+(k*f/cut)**4)
   sig=sig*.65+bright*.35*np.exp(-t/.2)
   sig=np.tanh(sig*1.35)
   if voice=='flute':sig=np.sin(2*np.pi*f*t+.08*np.sin(2*np.pi*5.5*t))-.1*np.sin(6*np.pi*f*t)
   if voice=='guitar':sig*=np.exp(-t/0.25)
   attack=.012 if voice=='lead' else .022
   env=np.minimum(1,t/attack)*(.7+.3*np.exp(-t/.1))*np.clip((d+.16-t)/.16,0,1)
   sig*=env*e['v']*({'synth':.23,'flute':.20,'guitar':.18,'lead':.23,'alto':.16,'tenor':.16,'bass':.27}[voice])
  elif voice=='kick':sig=np.sin(2*np.pi*(46*t+3*(1-np.exp(-t*30))))*np.exp(-t*24)*e['v']*.35
  else:
   noise=rng.uniform(-1,1,len(t));cut=6000 if voice in ('hat','ride') else 1200
   sig=np.concatenate(([0.],np.diff(noise)))*np.exp(-t*(35 if voice=='hat' else 15))*e['v']*.22
  start=round(e['t']*SR);end=min(len(mix),start+len(sig));sig=sig[:end-start];pan=pans[voice]
  mix[start:end,0]+=sig*np.sqrt((1-pan)/2);mix[start:end,1]+=sig*np.sqrt((1+pan)/2)
 # Low-level stereo reflections preserve separation without washing out counterpoint.
 dry=mix.copy()
 for delay,g in ((.071,.11),(.113,.08),(.179,.05)):
  n=int(delay*SR);mix[n:]+=dry[:-n,::-1]*g
 mix*=.86/max(.86,np.max(np.abs(mix)))
 with wave.open(str(out),'wb') as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
 return float(np.max(np.abs(mix)))
if __name__=='__main__':
 out=ROOT.parent/'.qa'/'polyphonic-soli.wav';peak=render(out)
 report={'duration':DURATION,'peak':peak,'voices':['flute','synth','guitar','alto','tenor','bass'],'sections':[{'meter':'6/8','start':0,'bars':48},{'meter':'4/4 swing 2:1','start':CHORUS_START,'bars':16}],'events':EVENTS}
 (ROOT/'arrangement.json').write_text(json.dumps(report,indent=2))
 print(json.dumps({k:v for k,v in report.items() if k!='events'}))


