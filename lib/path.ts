/** Lecture d'une valeur par chemin pointé ("content.badge"). */
export function getPath(source: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object"
          ? (value as Record<string, unknown>)[key]
          : undefined,
      source
    )
}

/** Copie immuable de `source` avec la valeur remplacée au chemin donné. */
export function setPath<T>(source: T, path: string, value: unknown): T {
  const [key, ...rest] = path.split(".")
  const current = (source ?? {}) as Record<string, unknown>
  return {
    ...current,
    [key]: rest.length ? setPath(current[key], rest.join("."), value) : value,
  } as T
}
