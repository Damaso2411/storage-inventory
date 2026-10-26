import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 const key=process.env.OPENAI_API_KEY||process.env.openai_api_key;
 if(!key)return NextResponse.json({code:null,error:"OCR no configurado"},{status:503});
 try{
  const body=await req.json();
  const image=body?.image;
  if(typeof image!=="string"||!/^data:image\/jpeg;base64,/.test(image)||image.length>1200000)return NextResponse.json({code:null,error:"Imagen inválida"},{status:400});
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},signal:AbortSignal.timeout(18000),body:JSON.stringify({model:"gpt-4.1-mini",max_output_tokens:80,input:[{role:"user",content:[{type:"input_text",text:"Read the visible printed product identifier from this image. Return ONLY a JSON object {\\\"code\\\":\\\"\\\"} containing exactly one clearly readable uninterrupted 8-14 digit number, or empty string if uncertain. Do not infer, complete, guess, or concatenate digits. Ignore dates, prices and ingredients."},{type:"input_image",image_url:image}]}]})});
  if(!response.ok)return NextResponse.json({code:null,error:"Servicio OCR no disponible"},{status:502});
  const data=await response.json();
  const raw=(data.output||[]).flatMap((x:{content?:Array<{text?:string}>})=>x.content||[]).map((x:{text?:string})=>x.text||"").join("");
  const parsed=JSON.parse(raw.replace(/^\x60\x60\x60(?:json)?\s*|\s*\x60\x60\x60$/g,""));
  const code=String(parsed.code||"").trim();
  return NextResponse.json({code:/^\d{8,14}$/.test(code)?code:null});
 }catch{return NextResponse.json({code:null,error:"OCR no pudo procesar la imagen"},{status:500});}
}