"use client";
import {useEffect,useState} from "react";
export type Product={id:string;name:string;sku:string;category:string;status:"Disponible"|"Publicado"|"Vendido";price:number;cost:number;auction:string;barcode:string};
export type Auction={id:string;name:string;cost:number;date:string};
export type Sale={id:string;productId:string;amount:number;date:string;channel:string};
const seedProducts:Product[]=[{id:"p1",name:"Microsoft Surface Pro 7",sku:"ST-1001",category:"Electrónica",status:"Disponible",price:329,cost:95,auction:"A-101",barcode:"889842472135"},{id:"p2",name:"Consola de audio profesional",sku:"ST-1002",category:"Audio",status:"Publicado",price:249,cost:75,auction:"A-101",barcode:""},{id:"p3",name:"Bocinas Q Power (par)",sku:"ST-1003",category:"Audio",status:"Disponible",price:280,cost:85,auction:"A-102",barcode:""},{id:"p4",name:"Kit de herramientas",sku:"ST-1004",category:"Herramientas",status:"Vendido",price:120,cost:35,auction:"A-102",barcode:""}];
const seedAuctions:Auction[]=[{id:"A-101",name:"Storage Winter Haven #101",cost:350,date:"2026-10-12"},{id:"A-102",name:"Storage Orlando #102",cost:225,date:"2026-10-20"}];
const seedSales:Sale[]=[{id:"S-1001",productId:"p4",amount:120,date:"2026-10-24",channel:"Venta local"}];
export function useDemo(){const [products,setProducts]=useState<Product[]>([]),[auctions,setAuctions]=useState<Auction[]>([]),[sales,setSales]=useState<Sale[]>([]),[ready,setReady]=useState(false);
useEffect(()=>{try{const raw=localStorage.getItem("storage-demo-v2");if(raw){const data=JSON.parse(raw);setProducts(data.products||[]);setAuctions(data.auctions||[]);setSales(data.sales||[])}else{setProducts(seedProducts);setAuctions(seedAuctions);setSales(seedSales)}}catch{setProducts(seedProducts);setAuctions(seedAuctions);setSales(seedSales)}setReady(true)},[]);
useEffect(()=>{if(ready)localStorage.setItem("storage-demo-v2",JSON.stringify({products,auctions,sales}))},[products,auctions,sales,ready]);
const reset=()=>{setProducts(seedProducts);setAuctions(seedAuctions);setSales(seedSales)};
return {products,setProducts,auctions,setAuctions,sales,setSales,ready,reset}}
export const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
