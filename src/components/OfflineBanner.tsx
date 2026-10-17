import { useOnline } from "../hooks/useOnline";

export default function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <p className="offline" role="status">
      Sem conexão. Você vê as buscas já feitas e seus favoritos.
    </p>
  );
}
