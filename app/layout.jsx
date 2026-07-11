import './globals.css';

export const metadata = {
  title: 'SIGO2M – Ordem dos Médicos de Angola',
  description: 'Sistema de Gestão da Ordem dos Médicos de Angola',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <script src="https://cdn.jsdelivr.net/npm/chart.js" async></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
