import { useEffect, useState } from "react";
import { authService } from "../auth.service";
import { useAuthStore } from "../auth.store";

interface AuthProviderProps {
  children: React.ReactNode;
}


export default function AuthProvider({ children }: AuthProviderProps) {
  const [ready, setReady] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {

    const init = async () => {
      if (user) {
        await authService.silentRefresh();
      }
      setReady(true);
    };
    init();

  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  return <>{children}</>;
}
