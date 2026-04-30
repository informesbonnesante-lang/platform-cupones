import './globals.css';

export const metadata = {
  title: 'MedCupon - Gestión de Vales Médicos',
  description: 'Plataforma para gestión de cupones y vales médicos.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
