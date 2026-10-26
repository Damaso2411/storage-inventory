import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Result={title:string;snippet:string;url:string;domain:string;image?:string};
export async function GET(req:NextRequest){
 const code=(req.nextUrl.searchParams.get("code")||"").trim();
 if(!/^\d{8,14}$/.test(code))return NextResponse.json({error:"Código numérico de 8 a 14 dígitos requerido."},{status:400});
 const searchUrl="https://www.google.com/search?q="+encodeURIComponent(code);
 const key=process.env.SERPAPI_API_KEY||process.env.SERPAPI_KEY;
 if(!key)return NextResponse.json({configured:false,results:[],searchUrl,note:"La búsqueda automática está preparada. Falta conectar SERPAPI_API_KEY en Vercel. Puedes abrir Google con el código exacto."});
 try{
  const url=new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine","google");url.searchParams.set("q",code);url.searchParams.set("gl","us");url.searchParams.set("hl","en");url.searchParams.set("num","8");url.searchParams.set("api_key",key);
  const response=await fetch(url,{signal:AbortSignal.timeout(18000),cache:"no-store"});
  if(!response.ok)return NextResponse.json({configured:true,results:[],searchUrl,note:"SerpAPI devolvió HTTP "+response.status+". Comprueba la clave y los límites del plan."});
  const data=await response.json();
  if(data.error)return NextResponse.json({configured:true,results:[],searchUrl,note:"SerpAPI: "+String(data.error).slice(0,180)});
  const organic=Array.isArray(data.organic_results)?data.organic_results:[];
  const excluded=/(?:orcid\.org|nii\.ac\.jp|researchgate\.net|scholar\.google|trademarks\.justia\.com|uspto\.gov|linkedin\.com|pubmed\.ncbi|wikipedia\.org|academia\.edu|patents\.google)/i;
  const commercial=/(?:amazon\.|ebay\.|walmart\.|target\.|homedepot\.|lowes\.|bestbuy\.|costco\.|walgreens\.|cvs\.|etsy\.|mercari\.|shopify\.|aliexpress\.|alibaba\.|barcode|upc|product|item|buy|shop|store|price|pack|oz\b|ml\b|vicks|vap[o]?stick)/i;
  const results:Result[]=organic.slice(0,15).map((r:{title?:string;snippet?:string;link?:string;displayed_link?:string;thumbnail?:string})=>({title:r.title||"",snippet:r.snippet||"",url:r.link||"",domain:r.displayed_link||"",image:r.thumbnail||""})).filter((r:Result)=>/^https:\/\//.test(r.url)&&!excluded.test(r.url)&&commercial.test([r.title,r.snippet,r.url].join(" ")));
  return NextResponse.json({configured:true,results,searchUrl,note:results.length?"Resultados de Google vía SerpAPI. Comprueba que el producto corresponda al código antes de confirmar.":"No se encontraron coincidencias comerciales confiables para este número. No se mostrarán personas, registros académicos ni marcas como productos."});
 }catch{return NextResponse.json({configured:true,results:[],searchUrl,note:"La búsqueda automática no respondió. Intenta nuevamente."});}
}
