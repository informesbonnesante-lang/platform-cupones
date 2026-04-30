import Navigation from '../../components/Navigation';
import AuthGuard from '../../components/AuthGuard';

export default function AdminLayout({ children }) {
  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navigation title="Panel de Administración" />
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
