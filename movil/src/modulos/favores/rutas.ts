export function hrefDetalleFavor(id: string) {
  return {
    pathname: "/(privado)/(pestanas)/favores/detalle/[id]" as const,
    params: { id },
  };
}

export function hrefCalificarFavor(id: string) {
  return {
    pathname: "/(privado)/(pestanas)/favores/calificar/[id]" as const,
    params: { id },
  };
}
