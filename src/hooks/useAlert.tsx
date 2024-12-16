import { useState, useCallback } from 'react';
import { AlertModal } from '../components/AlertModal';

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
}

interface UseAlertReturn {
  showAlert: (title: string, message: string) => void;
  AlertComponent: () => JSX.Element;
}

export function useAlert(): UseAlertReturn {
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showAlert = useCallback((title: string, message: string) => {
    setAlert({
      isOpen: true,
      title,
      message,
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const AlertComponent = useCallback(() => (
    <AlertModal
      open={alert.isOpen}
      setIsOpen={closeAlert}
      title={alert.title}
    >
      {alert.message}
    </AlertModal>
  ), [alert.isOpen, alert.title, alert.message, closeAlert]);

  return {
    showAlert,
    AlertComponent,
  };
}
