export default function Selo({ situacao, mapa }) {
  const info = mapa[situacao];
  if (!info) return null;
  return <span className={`selo selo-${info.classe}`}>{info.rotulo}</span>;
}
