function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

const OPERATORS = {
  equals: (a, b) => a == b, // eslint-disable-line eqeqeq -- intentional loose compare: config values are always strings
  notEquals: (a, b) => a != b, // eslint-disable-line eqeqeq
  greaterThan: (a, b) => Number(a) > Number(b),
  lessThan: (a, b) => Number(a) < Number(b),
  contains: (a, b) => String(a ?? "").includes(String(b)),
  isEmpty: (a) => a === undefined || a === null || a === "",
  isNotEmpty: (a) => !(a === undefined || a === null || a === ""),
};

/**
 * Returns { result, field, value } rather than a bare boolean — the engine
 * needs `result` to pick a branch, and the inspector (Phase 5) benefits from
 * seeing exactly what was compared.
 */
export async function executeCondition(config, input) {
  const actual = getByPath(input, config.field);
  const compare = OPERATORS[config.operator];
  if (!compare) throw new Error(`Unknown condition operator: ${config.operator}`);
  const result = compare(actual, config.value);
  return { result, field: config.field, actualValue: actual, expected: config.value };
}
