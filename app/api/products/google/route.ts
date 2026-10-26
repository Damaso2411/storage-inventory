import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Result={title:string;snippet:string;url:string;domain:string;image?:string;price?:string;sponsored?:boolean};
export async function GET(req:NextRequest){
 const code=(req.nextUrl.searchParams.get("code")||"").trim();
 if(!/^[a-zA-Z0-9._-]{4,60}$/.test(code))return NextResponse.json({error:"Identificador inválido."},{status:400});
 const suggestion=(req.nextUrl.searchParams.get("q")||"").trim().slice(0,120);
 const visualQuery=Boolean(suggestion&&/[a-zA-Z]{3,}/.test(suggestion));
 const query=visualQuery?suggestion:code;
 const searchUrl="https://www.google.com/search?q="+encodeURIComponent(query);
 const key=process.env.SERPAPI_API_KEY||process.env.SERPAPI_KEY;
 if(!key)return NextResponse.json({configured:false,results:[],searchUrl,note:"La búsqueda automática está preparada. Falta conectar SERPAPI_API_KEY en Vercel. Puedes abrir Google con el código exacto."});
 try{
  const url=new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine","google");url.searchParams.set("q",query);url.searchParams.set("gl","us");url.searchParams.set("hl","en");url.searchParams.set("num","8");url.searchParams.set("google_domain","google.com");url.searchParams.set("api_key",key);
  const response=await fetch(url,{signal:AbortSignal.timeout(18000),cache:"no-store"});
  if(!response.ok)return NextResponse.json({configured:true,results:[],searchUrl,note:"SerpAPI devolvió HTTP "+response.status+". Comprueba la clave y los límites del plan."});
  const data=await response.json();
  if(data.error)return NextResponse.json({configured:true,results:[],searchUrl,note:"SerpAPI: "+String(data.error).slice(0,180)});
  const organic=Array.isArray(data.organic_results)?data.organic_results:[];
  const ads=Array.isArray(data.ads)?data.ads:[];
  const inlineShopping=Array.isArray(data.inline_shopping_results)?data.inline_shopping_results:[];
  const shopping=Array.isArray(data.shopping_results)?data.shopping_results:[];
  const knowledge=data.knowledge_graph&&typeof data.knowledge_graph==="object"?data.knowledge_graph:null;
  const excluded=/(?:orcid\.org|nii\.ac\.jp|researchgate\.net|scholar\.google|trademarks\.justia\.com|uspto\.gov|linkedin\.com|pubmed\.ncbi|wikipedia\.org|academia\.edu|patents\.google)/i;
  const retailer=/(?:amazon\.(?:com|ca)|ebay\.com|walmart\.com|target\.com|homedepot\.com|lowes\.com|bestbuy\.com|costco\.com|walgreens\.com|cvs\.com|etsy\.com|mercari\.com|shopify\.com)/i;
  const productWords=/\b(?:UPC|EAN|GTIN|barcode|product|item|model|pack|oz|ml|Vicks|VapoStick)\b/i;
  const latin=/^[\x00-\x7F\u00C0-\u024F\s\p{P}\p{N}\p{S}]*$/u;
  const candidates=[...ads.map((x:{title?:string;description?:string;link?:string;displayed_link?:string;thumbnail?:string;price?:string})=>({title:x.title||"",snippet:x.description||"",link:x.link||"",displayed_link:x.displayed_link||"",thumbnail:x.thumbnail||"",price:x.price||"",sponsored:true})),...[...shopping,...inlineShopping].map((x:{title?:string;snippet?:string;link?:string;product_link?:string;source?:string;thumbnail?:string})=>({title:x.title||"",snippet:x.snippet||"",link:x.link||x.product_link||"",displayed_link:x.source||"",thumbnail:x.thumbnail||"",price:(x as {price?:string}).price||"",sponsored:true})),...organic];
  const results:Result[]=candidates.slice(0,25).map((r:{title?:string;snippet?:string;link?:string;displayed_link?:string;thumbnail?:string;price?:string;sponsored?:boolean})=>({title:r.title||"",snippet:r.snippet||"",url:r.link||"",domain:r.displayed_link||"",image:r.thumbnail||"",price:r.price||"",sponsored:Boolean(r.sponsored)})).filter((r:Result)=>{
   if(!/^https:\/\//.test(r.url)||excluded.test(r.url)||!latin.test(r.title))return false;
   const content=r.title+" "+r.snippet;
   return visualQuery?(retailer.test(r.url)||r.sponsored||productWords.test(content)):(content.toLowerCase().includes(code.toLowerCase())||retailer.test(r.url)||r.sponsored||productWords.test(content));
  });
  const productInfo=knowledge&&typeof knowledge.title==="string"&&knowledge.title.toLowerCase().includes(code)?{title:knowledge.title,description:knowledge.description||""}:null;
  return NextResponse.json({configured:true,results,productInfo,searchUrl,visualSuggestion:visualQuery,note:results.length?visualQuery?"Sugerencias comerciales de Google basadas en la fotografía, no verificadas contra el código.":"Posibles páginas de productos. Confirma el código, la marca y el envase.":visualQuery?"No se encontraron productos para la descripción visual.":"No hay coincidencias comerciales verificables para el código; se puede intentar una búsqueda visual."});
 }catch{return NextResponse.json({configured:true,results:[],searchUrl,note:"La búsqueda automática no respondió. Intenta nuevamente."});}
}
