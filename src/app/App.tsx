import { RouterProvider } from 'react-router';
import { AppProvider } from './context/AppContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { LanguageProvider } from './context/LanguageContext';
import { router } from './routes';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <CurrencyProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors />
        </CurrencyProvider>
      </AppProvider>
    </LanguageProvider>
  );
}