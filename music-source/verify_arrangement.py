import importlib.util,json
from pathlib import Path
from collections import Counter
root=Path(__file__).parent
spec=importlib.util.spec_from_file_location('original',root/'yes_or_no_soli.py')
s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)
a=json.loads((root/'arrangement.json').read_text())
expected=[]
for e in s.build_events():
 for p in e['ps']:
  v=e['inst'] if e['inst']!='drums' else {36:'kick',38:'snare',42:'hat',49:'ride'}.get(p,'hat')
  expected.append((v,p,round(e['s']*60/92/6,6),round(e['l']*60/92/6*.94,6)))
actual=[(e['voice'],e['p'],e['t'],e['d']) for e in a['events'] if e.get('original')]
assert Counter(expected)==Counter(actual),'Source pitch, onset or rhythmic duration changed'
print(f'All {len(expected)} original notes preserve pitches, onsets and rhythmic durations.')
