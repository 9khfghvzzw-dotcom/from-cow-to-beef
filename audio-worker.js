// Audio byte ranges let browsers seek inside long tracks without restarting them.
export default {
 async fetch(request,env){
  if(!/\.(mp3|m4a)$/.test(new URL(request.url).pathname)||!['GET','HEAD'].includes(request.method))return env.ASSETS.fetch(request);
  const headers=new Headers(request.headers);headers.delete('range');headers.delete('if-range');headers.delete('if-none-match');
  const asset=await env.ASSETS.fetch(new Request(request.url,{method:'GET',headers}));
  if(!asset.ok)return asset;
  const bytes=await asset.arrayBuffer(),size=bytes.byteLength,out=new Headers(asset.headers);
  out.set('Accept-Ranges','bytes');out.set('Content-Length',String(size));out.delete('Content-Encoding');
  const range=request.headers.get('range'),ifRange=request.headers.get('if-range');
  if(request.method==='GET'&&range&&(!ifRange||ifRange===out.get('etag'))){
   const m=/^bytes=(\d*)-(\d*)$/.exec(range);
   if(m&&(m[1]||m[2])){
    const start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2]));
    const end=m[1]?(m[2]?Math.min(size-1,Number(m[2])):size-1):size-1;
    if(!Number.isSafeInteger(start)||start>=size||end<start){out.set('Content-Range',`bytes */${size}`);out.set('Content-Length','0');return new Response(null,{status:416,headers:out});}
    out.set('Content-Range',`bytes ${start}-${end}/${size}`);out.set('Content-Length',String(end-start+1));
    return new Response(bytes.slice(start,end+1),{status:206,headers:out});
   }
  }
  return new Response(request.method==='HEAD'?null:bytes,{status:200,headers:out});
 }
};
