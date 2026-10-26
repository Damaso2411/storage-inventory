import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 const key=(process.env.OPENAI_API_KEY||process.env.openai_api_key);
 if(!key)return NextResponse.json({error:"Identificación por IA pendiente de configurar: falta OPENAI_API_KEY en Vercel."},{status:503});
 try{
 const body=await request.json();const dataUrl=body?.image;
 if(typeof dataUrl!=="string"||!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)||dataUrl.length>6000000)return NextResponse.json({error:"Selecciona una foto JPEG, PNG o WebP de menos de 4 MB."},{status:400});
 const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4.1-mini",max_output_tokens:550,input:[{role:"user",content:[{type:"input_text",text:"Identifica el producto de esta fotografía para un inventario de segunda mano. Responde SOLAMENTE JSON con campos name,brand,model,category,description,confidence. No inventes marca o modelo si no son visibles; usa cadena vacía y confidence low si es incierto. Español."},{type:"input_image",image_url:dataUrl}]}]}) ,signal:AbortSignal.timeout(25000)});
 const data=await response.json();if(!response.ok){const code=String(data?.error?.code||"");const status=response.status;const errors:Record<string,string>={"invalid_api_key":"La clave de OpenAI no es válida. Revisa la variable en Vercel.","insufficient_quota":"La cuenta de OpenAI API no tiene saldo o límite disponible. Revisa facturación en OpenAI Platform.","model_not_found":"El modelo de visión no está disponible para esta cuenta."};const message=errors[code]||(status===401?"La API rechazó la clave. Revisa la credencial guardada.":status===429?"La API alcanzó un límite de uso o saldo. Revisa facturación.":status===403?"La cuenta no tiene permisos para este modelo.":"OpenAI devolvió un error HTTP "+status+" ("+(code||"sin código")+").");console.error("Vision API error",{status,code,type:data?.error?.type});return NextResponse.json({error:message},{status:502});}
 const output=(data.output||[]).flatMap((x:{content?:Array<{text?:string}>})=>x.content||[]).map((x:{text?:string})=>x.text||"").join("");
 const parsed=JSON.parse(output.replace(/^```(?:json)?\s*|\s*```$/g,""));
 return NextResponse.json({name:String(parsed.name||""),brand:String(parsed.brand||""),model:String(parsed.model||""),category:String(parsed.category||"General"),description:String(parsed.description||""),confidence:String(parsed.confidence||"unknown")});
 }catch(e){console.error("Vision request failed",e instanceof Error?e.name:"unknown");return NextResponse.json({error:"No fue posible completar el análisis. Intenta nuevamente."},{status:500})}
}