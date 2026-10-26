import type { ReactNode } from 'react';
export const metadata = { title: 'Storage Inventory', description: 'Auction inventory management' };
export default function RootLayout({children}:{children:ReactNode}) { return <html lang="es"><body style={{fontFamily:'system-ui',margin:0,background:'#f8fafc',color:'#0f172a'}}>{children}</body></html> }
