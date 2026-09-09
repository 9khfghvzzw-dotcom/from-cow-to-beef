"""Editable 20-minute string continuation derived from the supplied Yes/No motif.
Run once to create strings-score.json; subsequent runs read edits and cache each section.
Python + NumPy + FFmpeg, no external music service.
"""
from pathlib import Path
import json,hashlib,subprocess,wave,importlib.util,math
import numpy as np
R=Path(__file__).resolve().parent;P=R.parent;C=P/'.qa'/'strings';C.mkdir(parents=True,exist_ok=True)
SR=32000
spec=importlib.util.spec_from_file_location('source',R/'yes_or_no_soli.py');source=importlib.util.module_from_spec(spec);spec.loader.exec_module(source)
lead=[p for e in source.build_events() if e['inst']=='flute' and e['s']<12 for p in e['ps']]
NAMES=['Valley after rain','Questions in the strings','Walking through the fields','A distant storm','Quiet answers','The valley wakes','Four voices in pursuit','Open sky','Homeward','Evening reprise']
METERS=['6/8','6/8','4/4 swing','4/4','6/8','4/4 swing','6/8','4/4','4/4 swing','6/8']
VOICES={'violin1':(.17,-.4,12),'violin2':(.14,.35,6),'viola':(.16,-.15,1),'cello':(.23,.2,-12)}
def fit(p,lo,hi):
 while p<lo:p+=12
 while p>hi:p-=12
 return p

def compose():
 sections=[]
 for index in range(10):
  meter=METERS[index];beats=2 if meter=='6/8' else 4;bars=([80,76,44,48,68,48,88,40,46,64][index]);pulse=120/(bars*beats)
  ev=[];progression=[0,5,10,3,8,2,7,0];tonic=[53,52,53,47,48,53,47,56,53,53][index]
  def add(v,t,d,p,vel):ev.append({'voice':v,'t':round(t,6),'d':round(min(d,120-t),6),'p':p,'v':round(vel,3)})
  for bar in range(bars):
   t=bar*beats*pulse;root=tonic+progression[(bar//2+index)%8];minor=bar%8 not in (3,6);chord=[root,root+(3 if minor else 4),root+7,root+10]
   phrase=bar//4;arc=.68+.2*np.sin(np.pi*bar/bars);quiet=index in (0,4,9)
   # Source contour, with augmentation, inversion and phrase answering, rather than a repeated audio loop.
   for voice,(gain,pan,register) in VOICES.items():
    if voice=='violin1':
     steps=2 if quiet else (4 if index in (2,5,7,8) else 6)
     for j in range(steps):
      if (bar+j)%13==9:continue
      motif=lead[(j+phrase)%len(lead)]-lead[0]
      if index in (1,4,8) and bar%4>=2:motif=-motif
      pitch=fit(root+12+motif,65,88)
      off=j*beats/steps
      if 'swing' in meter and steps==4 and j%2:off=(j//2)*2+4/3
      add(voice,t+off*pulse,beats/steps*pulse*(.82 if index==6 else .96),pitch,arc*.8)
    elif voice=='violin2':
     for j,off in enumerate((.3,beats*.55)):
      pitch=fit(chord[(bar+3-j)%4]+(2 if phrase%4==2 else 0),58,78)
      add(voice,t+off*pulse,min(beats*.42,beats-off)*pulse,pitch,arc*.65)
    elif voice=='viola':
     for j,off in enumerate((0,beats*.68)):
      pitch=fit(chord[(phrase-j)%4],48,67)
      add(voice,t+off*pulse,(beats*.63 if j==0 else beats*.30)*pulse,pitch,arc*.6)
    else:
     steps=beats if 'swing' in meter else 2
     for j in range(steps):
      pitch=fit(chord[(j+bar%2)%4]-12,29,52)
      add(voice,t+j*beats/steps*pulse,beats/steps*pulse*.92,pitch,arc*.8)
  sections.append({'name':NAMES[index],'duration':120,'meter':meter,'pulse_bpm':60/pulse,'events':ev})
 return {'duration':1200,'inspiration':'Supplied Yes/No contour; original string development','sections':sections}

def render(section,out):
 mix=np.zeros((120*SR,2),dtype=np.float32)
 for e in section['events']:
  voice=e['voice'];gain,pan,_=VOICES[voice];d=e['d'];length=min(int((d+.12)*SR),len(mix)-round(e['t']*SR))
  if length<=0:continue
  t=np.arange(length)/SR;f=440*2**((e['p']-69)/12)
  # Four detuned bowed-string oscillators, mild vibrato, soft bow attack, harmonic roll-off.
  signal=np.zeros(length)
  for cents in (-5,-1.5,2,5.5):
   phase=2*np.pi*f*2**(cents/1200)*t+.09*np.sin(2*np.pi*(5.1+cents*.04)*t)
   for h in range(1,9):signal+=np.sin(h*phase)/(h**1.45)*.25
  attack=min(.09,d*.25);env=np.minimum(1,t/max(.01,attack))*np.clip((d+.12-t)/.16,0,1)
  # Distinct bow pulses rather than a static pad.
  env*=.94+.06*np.sin(2*np.pi*3*t)
  signal*=env*gain*e['v'];start=round(e['t']*SR);end=start+length
  mix[start:end,0]+=signal*np.sqrt((1-pan)/2);mix[start:end,1]+=signal*np.sqrt((1+pan)/2)
 dry=mix.copy()
 for delay,gain in ((.093,.15),(.167,.11),(.283,.07),(.419,.04)):
  n=int(delay*SR);mix[n:]+=dry[:-n,::-1]*gain
 # Small boundary fades avoid clicks; sections are newly scored, never audio-looped.
 n=int(.4*SR);mix[:n]*=np.linspace(0,1,n)[:,None];mix[-n:]*=np.linspace(1,0,n)[:,None]
 peak=float(np.max(np.abs(mix)));mix*=min(1,.9/max(peak,.001))
 with wave.open(str(out),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
 return peak
if __name__=='__main__':
 scorepath=R/'strings-score.json'
 if not scorepath.exists():scorepath.write_text(json.dumps(compose(),indent=2))
 score=json.loads(scorepath.read_text());assert sum(s['duration'] for s in score['sections'])==1200
 wavs=[];renderer=Path(__file__).read_bytes()
 for i,s in enumerate(score['sections']):
  key=hashlib.sha256(renderer+json.dumps(s,sort_keys=True).encode()).hexdigest();out=C/f'section-{i}.wav';marker=C/f'section-{i}.hash'
  if not(out.exists() and marker.exists() and marker.read_text()==key):
   peak=render(s,out);marker.write_text(key);print(f'Rendered {i+1}/10: {s["name"]}, peak {peak:.3f}',flush=True)
  else:print(f'Reused {i+1}/10: {s["name"]}',flush=True)
  wavs.append(out)
 # Relative filenames avoid apostrophe escaping in the Windows user directory.
 listing=C/'concat.txt';listing.write_text(''.join(f"file 'section-{i}.wav'\n" for i in range(10)))
 subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(listing),'-af','loudnorm=I=-20:TP=-2:LRA=10','-ar','32000','-c:a','libmp3lame','-b:a','96k',str(P/'public/audio/strings-continuation.mp3')],check=True)
 print('20-minute continuation exported.',flush=True)
