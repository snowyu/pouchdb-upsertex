export function removeLastChar(value: string, char: string) {
  let l = value.length;
  while (l && value[l - 1] === char) {
    l--;
  }
  if (l) value = value.substr(0, l);
  return value;
}

/**
 * remove last path delimiter from path.
 * @param aPath the path string
 */
export function trimPath(aPath: string) {
  return removeLastChar(aPath, '/');
}

export function throwError(message: string, name?: string|object, status = 404) {
  const error: any = new Error(message);
  if (typeof name === 'string') {
    error['name'] = name;
  } else if (name) {
    Object.assign(error, name);
  }
  if (typeof error.status !== 'number') {
    error.status = status;
  }
  throw error;
}
