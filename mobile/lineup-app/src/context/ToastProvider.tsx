import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme';

type ToastOptions = {
  type?: 'default' | 'error';
  duration?: number;
};

type ToastContextValue = {
  show: (message: string, options?: ToastOptions) => void;
  hide: () => void;
};

const ToastContext = createContext<ToastContextValue>({
  show: () => {},
  hide: () => {},
});

type ToastState = {
  id: number;
  message: string;
  type: 'default' | 'error';
} | null;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (!toast) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setToast(null);
      }
    });
  }, [opacity, toast]);

  const show = useCallback(
    (message: string, options?: ToastOptions) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const next: ToastState = {
        id: Date.now(),
        message,
        type: options?.type ?? 'default',
      };
      setToast(next);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      timerRef.current = setTimeout(() => {
        hide();
      }, options?.duration ?? 2500);
    },
    [hide, opacity],
  );

  const contextValue = useMemo(
    () => ({
      show,
      hide,
    }),
    [hide, show],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            toast.type === 'error' ? styles.toastError : undefined,
            { opacity },
          ]}
        >
          <View>
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  toastError: {
    backgroundColor: '#7f1d1d',
    borderColor: '#fecaca',
  },
  toastText: {
    color: palette.text,
    fontWeight: '600',
    textAlign: 'center',
  },
});
