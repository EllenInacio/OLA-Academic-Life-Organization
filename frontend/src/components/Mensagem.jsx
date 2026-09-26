export default function Mensagem({ texto, tipo, aoFechar }) {
  if (!texto) return null;

  return (
    <div className={`mensagem mensagem-${tipo}`}>
      <span>{texto}</span>
      {aoFechar && (
        <button
          type="button"
          className="mensagem-fechar"
          onClick={aoFechar}
          aria-label="Fechar mensagem"
        >
          ×
        </button>
      )}
    </div>
  );
}
