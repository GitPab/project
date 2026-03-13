import { RouterProvider } from 'react-router';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { LanguageProvider } from './context/LanguageContext';
import { router } from './routes';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <AuthProvider>
          <CurrencyProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" richColors />
          </CurrencyProvider>
        </AuthProvider>
      </AppProvider>
    </LanguageProvider>
  );
}
