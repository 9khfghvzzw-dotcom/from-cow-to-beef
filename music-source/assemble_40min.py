"""Join the two editable 20-minute renders into a single iPhone-visible 40-minute file."""
from pathlib import Path
import subprocess
p=Path(__file__).resolve().parent.parent
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(p/'public/audio/main-20min.mp3'),'-i',str(p/'public/audio/atonal-quartet-20min.mp3'),'-filter_complex','[0:a][1:a]concat=n=2:v=0:a=1[out]','-map','[out]','-c:a','aac','-b:a','80k','-movflags','+faststart',str(p/'public/audio/complete-40min.m4a')],check=True)
assert (p/'public/audio/complete-40min.m4a').stat().st_size<25*1024*1024
