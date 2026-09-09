"""Build only the editable insert, reuse its cached render when only placement changes.
Edit arrangement.json notes or music-config.json voice gains, then run this file.
Original supplied source stays intact; no paid services or music generation APIs.
"""
import hashlib,importlib.util,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent;PROJECT=ROOT.parent;CACHE=PROJECT/'.qa';CACHE.mkdir(exist_ok=True)
config=json.loads((ROOT/'music-config.json').read_text())
score=json.loads((ROOT/'arrangement.json').read_text())
renderer=ROOT/'arrange_polyphonic.py'
fingerprint=hashlib.sha256(renderer.read_bytes()+json.dumps(score,sort_keys=True).encode()+json.dumps(config['voice_gains'],sort_keys=True).encode()).hexdigest()
marker=CACHE/'music-render-cache.json';wav=CACHE/'polyphonic-soli.wav'
reuse=marker.exists() and wav.exists() and json.loads(marker.read_text()).get('fingerprint')==fingerprint
if not reuse:
 spec=importlib.util.spec_from_file_location('arranger',renderer);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
 m.EVENTS=score['events'];m.DURATION=score['duration'];m.MIX_SETTINGS=config['voice_gains']
 peak=m.render(wav)
 marker.write_text(json.dumps({'fingerprint':fingerprint,'peak':peak}))
 print('Rendered editable insert only; original recording reused.',flush=True)
else:print('Reusing cached insert: no note synthesis required.',flush=True)
if '--render-only' in sys.argv:sys.exit(0)
def run(*args):subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error',*map(str,args)],check=True)
preview=CACHE/'polyphonic-preview.mp3'
run('-i',wav,'-af',f"loudnorm=I={config['loudness_lufs']}:TP=-2:LRA=9",'-ar',44100,'-c:a','libmp3lame','-b:a','128k',preview)
fade=config['crossfade_seconds'];split=config['insert_at_seconds']+fade
assert split>fade>=0
target=config.get('target_duration_seconds')
rate=1.0
if target:
 source_duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(PROJECT/config['source_audio'])]))
 rate=(source_duration-split)/(target-split-score['duration']+2*fade)
 assert .5<=rate<=2
filters=f'[0:a]asplit=2[a][b];[a]atrim=0:{split},asetpts=PTS-STARTPTS[first];[b]atrim=start={split},asetpts=PTS-STARTPTS,atempo={rate}[last];[first][1:a]acrossfade=d={fade}:c1=tri:c2=tri[mid];[mid][last]acrossfade=d={fade}:c1=tri:c2=tri[out]'
if target:filters=filters.replace('[out]',f'[joined];[joined]apad,atrim=duration={target}[out]')
run('-i',PROJECT/config['source_audio'],'-i',preview,'-filter_complex',filters,'-map','[out]','-ar',44100,'-c:a','libmp3lame','-b:a','96k',PROJECT/config['output_audio'])
print(f"Built {config['output_audio']}: insert begins at {config['insert_at_seconds']} seconds.",flush=True)
