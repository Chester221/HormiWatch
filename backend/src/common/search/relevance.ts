/**
 * Construye la expresión de relevancia usada por el buscador global.
 *
 * Orden (menor = mejor):
 *   0 → el campo visible empieza con el término  ("Abe" en "Abejas")
 *   1 → una palabra del campo visible empieza con el término ("Abe" en "Proyecto Abejas")
 *   2 → el término aparece en cualquier parte      ("Abe" en "Cableado")
 *   3 → coincide solo en un campo relacionado (líder, cliente, técnico, etc.)
 *   4 → sin coincidencia (no debería llegar: el WHERE ya filtró)
 *
 * Los parámetros se devuelven aparte para que TypeORM los enlace de forma
 * segura. Se usa `addSelect` + `ORDER BY search_relevance` en vez de meter
 * parámetros directamente en el ORDER BY (más portable entre `getCount`,
 * `getMany` y `getRawAndEntities`).
 */
export interface RelevanceFields {
  /** Expresión SQL del campo que se muestra como título. */
  primary: string;
  /** Expresiones SQL de campos secundarios (puntuación 3). */
  related?: string[];
}

export interface RelevanceExpression {
  expression: string;
  params: {
    prefix: string;
    wordStart: string;
    contains: string;
  };
}

export function buildRelevance(
  term: string,
  fields: RelevanceFields,
): RelevanceExpression {
  const prefix = `${term}%`;
  const wordStart = `% ${term}%`;
  const contains = `%${term}%`;
  const { primary, related = [] } = fields;

  const relatedWhen = related.length
    ? `\n    WHEN ${related
        .map((field) => `${field} ILIKE :contains`)
        .join(' OR ')} THEN 3`
    : '';

  return {
    expression: `CASE
    WHEN ${primary} ILIKE :prefix THEN 0
    WHEN ${primary} ILIKE :wordStart THEN 1
    WHEN ${primary} ILIKE :contains THEN 2${relatedWhen}
    ELSE 4
  END`,
    params: { prefix, wordStart, contains },
  };
}
