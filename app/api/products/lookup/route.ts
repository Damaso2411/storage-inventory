import {NextRequest,NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const code=request.nextUrl.searchParams.get("code")?.trim()||"";
 if(!/^\d{8,14}$/.test(code))return NextResponse.json({error:"Introduce un UPC/EAN numérico de 8 a 14 dígitos."},{status:400});
 const sources=[
 {name:"UPCitemdb",url:"https://api.upcitemdb.com/prod/trial/lookup?upc="+encodeURIComponent(code)},
 {name:"Open Food Facts",url:"https://world.openfoodfacts.org/api/v2/product/"+encodeURIComponent(code)+".json?fields=product_name,brands,categories,image_front_url,quantity"}
 ];
 let failed=0;
 for(const source of sources){
  try{
   const response=await fetch(source.url,{headers:{"User-Agent":"StorageInventoryDemo/1.0 (barcode product lookup)","Accept":"application/json"},signal:AbortSignal.timeout(6500),cache:"no-store"});
   if(!response.ok){failed++;continue;}
   const data=await response.json();
   if(source.name==="UPCitemdb"){
    const item=data.items?.[0];
    if(item)return NextResponse.json({found:true,source:source.name,name:item.title||"",brand:item.brand||"",category:item.category||"General",description:item.description||"",image:item.images?.[0]||"",model:item.model||""});
   }else if(data.status===1&&data.product){
    const p=data.product;
    return NextResponse.json({found:true,source:source.name,name:p.product_name||"",brand:p.brands||"",category:p.categories?.split(",")[0]||"Alimentos",description:p.quantity||"",image:p.image_front_url||"",model:""});
   }
  }catch{failed++;}
 }
 return NextResponse.json({found:false,error:failed===sources.length?"Los catálogos no respondieron. Intenta nuevamente.":"No se encontró el producto en los catálogos consultados."});
}