import memoizeOne from 'memoize-one';
import _get from 'lodash/get';
import _set from 'lodash/set';
import _unset from 'lodash/unset';
import _keyBy from 'lodash/keyBy';
import _pick from 'lodash/pick';
import _pickBy from 'lodash/pickBy';
import _union from 'lodash/union';
import _unionBy from 'lodash/unionBy';
import _uniq from 'lodash/uniq';
import _uniqBy from 'lodash/uniqBy';
import _uniqWith from 'lodash/uniqWith';
import _sum from 'lodash/sum';
import _sumBy from 'lodash/sumBy';
import _merge from 'lodash/merge';
import _mergeWith from 'lodash/mergeWith';
import _omit from 'lodash/omit';
import _omitBy from 'lodash/omitBy';
import _sortBy from 'lodash/sortBy';
import _groupBy from 'lodash/groupBy';
import _cloneDeep from 'lodash/cloneDeep';
import _last from 'lodash/last';
import _findLast from 'lodash/findLast';
import _findLastIndex from 'lodash/findLastIndex';
import _isEqual from 'lodash/isEqual';
import _isEmpty from 'lodash/isEmpty';
import _flatten from 'lodash/flatten';

import _isUndefined from 'lodash/isUndefined';
import _isNull from 'lodash/isNull';
import _isNil from 'lodash/isNil';
import _isObject from 'lodash/isObject';
import _isPlainObject from 'lodash/isPlainObject';
import _isObjectLike from 'lodash/isObjectLike';
import _isString from 'lodash/isString';
import _isNumber from 'lodash/isNumber';
import _isInteger from 'lodash/isInteger';
import _isBoolean from 'lodash/isBoolean';
import _isFunction from 'lodash/isFunction';
import _isArray from 'lodash/isArray';

export const get = _get;
export const set = _set;
export const unset = _unset;
export const keyBy = _keyBy;
export const pick = _pick;
export const pickBy = _pickBy;
export const unionBy = _unionBy;
export const union = _union;
export const uniq = _uniq;
export const uniqBy = _uniqBy;
export const uniqWith = _uniqWith;
export const sum = _sum;
export const sumBy = _sumBy;
export const merge = _merge;
export const mergeWith = _mergeWith;
export const omit = _omit;
export const omitBy = _omitBy;
export const sortBy = _sortBy;
export const groupBy = _groupBy;
export const cloneDeep = _cloneDeep;
export const last = _last;
export const findLast = _findLast;
export const findLastIndex = _findLastIndex;
export const isEqual = _isEqual;
export const isEmpty = (value: any): boolean =>
  typeof value !== 'number' && typeof value !== 'boolean' && _isEmpty(value);
export const flatten = _flatten;
export const isUndefined = _isUndefined;
export const isNull = _isNull;
export const isNil = _isNil;
export const isObject = _isObject;
export const isPlainObject = _isPlainObject;
export const isObjectLike = _isObjectLike;
export const isString = _isString;
export const isNumber = _isNumber;
export const isInteger = _isInteger;
export const isBoolean = _isBoolean;
export const isFunction = _isFunction;
export const isArray = _isArray;

export const isEmptyObject = (value: any): boolean => isObject(value) && isEmpty(value);
export const isNonEmptyObject = (value: any): boolean => isObject(value) && !isEmpty(value);
export const isEmptyString = (value: any): boolean => value === '';
export const isNonEmptyString = (value: any): boolean => isString(value) && !isEmptyString(value);

export const toArray = <T>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);

export function ensureArray<T>(obj: any, path?: string): T[] {
  const value = path ? get(obj, path) : obj;
  return Array.isArray(value) ? value : [];
}

export function ensureNumber(obj: any, path?: string): number {
  const value = path ? get(obj, path) : obj;
  if (isString(value)) {
    return parseFloat(value) || 0;
  }
  return isNumber(value) ? value : 0;
}

export function ensureObject<T>(obj: any, path?: string): T {
  const value = path ? get(obj, path) : obj;
  return value && typeof value === 'object' ? value : ({} as T);
}

export function ensureString(obj: any, path?: string): string {
  const value = path ? get(obj, path) : obj;
  return typeof value === 'string' ? value : '';
}

export function numberToString(obj: any, path?: string): string {
  const value = path ? get(obj, path) : obj;
  return typeof value === 'string' ? value : typeof value === 'number' ? `${value}` : '';
}

export const dropObjectFields = (condition: any) => {
  let predicate: (arg: { key: string; value: any }) => boolean;
  if (typeof condition === 'function') {
    predicate = condition;
  } else {
    let dropFieldsDict: Record<string, boolean>;
    if (typeof condition === 'object' && !Array.isArray(condition)) {
      dropFieldsDict = condition;
    } else {
      const fields = Array.isArray(condition) ? condition : [condition];
      dropFieldsDict = fields.reduce((dict: Record<string, boolean>, key: string) => {
        dict[key] = true;
        return dict;
      }, {});
    }
    predicate = ({ key }) => !!dropFieldsDict[key];
  }

  return (obj: Record<string, any>) =>
    Object.entries(obj).reduce((newObj: Record<string, any>, [key, value]) => {
      if (!predicate({ key, value })) {
        newObj[key] = value;
      }
      return newObj;
    }, {});
};

export const dropEmptyArrayFields = dropObjectFields(
  ({ value }: { value: any }) => Array.isArray(value) && value.length === 0,
);
export const dropEmptyObjectFields = dropObjectFields(({ value }: { value: any }) =>
  isEqual(value, {}),
);
export const dropEmptyFields = dropObjectFields(({ value }: { value: any }) => isEmpty(value));

export const setFieldsValue = (obj: Record<string, any>, values: Record<string, any>) => {
  Object.entries(values).forEach(([key, value]) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj[key] = value;
    }
  });
};

export const shadowCompare = (a: Record<string, any>, b: Record<string, any>): boolean => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => a[key] === b[key]);
};

export const lowerObjKey = (obj: Record<string, any>): Record<string, any> => {
  for (const key in obj) {
    if (key.match(/.*[A-Z]+.*/)) {
      obj[key.toLowerCase()] = obj[key];
      delete obj[key];
    }
  }
  return obj;
};

export const getPathSegments = (path: string): string[] =>
  ((path || '').match(/[$\w]+|\[[\d]+\]/g) || []).map((segment) =>
    segment.startsWith('[') ? segment.slice(1, -1) : segment,
  );

export const getParentPath = (path: string): string => {
  const pathStr = path || '';
  let end = pathStr.length;
  while (--end) {
    if (pathStr[end] === '.' || pathStr[end] === '[') {
      break;
    }
  }
  return pathStr.slice(0, end);
};

export const getPathString = (pathSegments: string[]): string =>
  pathSegments.filter(Boolean).join('.');

export const iterateObjectLeaves = (
  obj: any,
  callback: (value: any, path: string[], root: any) => void,
  checkLeaf?: (value: any) => boolean,
) => {
  const getStopInfo = (value: any) => {
    const iterable = isObject(value);
    const hasCustomChecker = typeof checkLeaf === 'function';
    const isLeaf = hasCustomChecker && checkLeaf(value);
    const shouldStop = isLeaf || !iterable;
    return shouldStop ? { skip: hasCustomChecker && !isLeaf } : null;
  };

  const path: string[] = [];

  function iterate(o: any, key?: string) {
    if (key !== undefined) {
      path.push(key);
    }

    const stopInfo = getStopInfo(o);
    if (!stopInfo) {
      for (const k in o) {
        if (Object.prototype.hasOwnProperty.call(o, k)) {
          iterate(o[k], k);
        }
      }
    } else if (!stopInfo.skip) {
      callback(o, path, obj);
    }
    path.pop();
  }

  iterate(obj);
};

export const isEmptyFormField = (value: any): boolean => {
  return typeof value === 'string' ? !value || !value.trim() : isEmpty(value);
};

export const ensureIdString = (value: any): string | null => {
  if (isString(value)) {
    return value;
  }
  if (isPlainObject(value)) {
    return value.id;
  }
  return null;
};

export const ensureIdArray = (value: any): string[] =>
  ensureArray(value).map(ensureIdString).filter(Boolean) as string[];

export const ensureNotEmptyList = <T>(
  value: T[],
  { defaultItem = {} as T }: { defaultItem?: T } = {},
): T[] => (isEmpty(ensureArray(value)) ? [defaultItem] : value);

export const ensureNotEmptyObjList = (value: any[]): any[] =>
  isEmpty(ensureArray(value)) ? [{}] : value;

export const getRefId = (ref: any): any => get(ref, 'id') || ref;

export const mergeObject = (object: any, source: any): any =>
  mergeWith(object, source, (objectValue, targetValue) =>
    isArray(objectValue) ? targetValue : undefined,
  );

export const shallowEqual = (curr: any, prev: any): boolean => {
  if (typeof curr !== 'object' || typeof prev !== 'object' || !curr || !prev) {
    return Object.is(curr, prev);
  }

  const currKeys = Object.keys(curr);
  const prevKeys = Object.keys(prev);
  if (currKeys.length !== prevKeys.length) {
    return false;
  }

  return currKeys.every((key) => Object.is(curr[key], prev[key]));
};

export const shallowMemo = memoizeOne(
  (object: any) => object,
  (currArgs: any[], prevArgs: any[]) => {
    const [curr] = currArgs || [];
    const [prev] = prevArgs || [];
    return shallowEqual(curr, prev);
  },
);

export const dropWhen = <T>(
  value: T[],
  predicate: (item: T, index: number, data: T[]) => boolean,
): T[] => {
  return (ensureArray(value) as T[]).filter((item, index, data) => !predicate(item, index, data));
};

// 优化的去重函数 - 保持原始顺序，新项目添加在末尾
export function fastUniqBy<T>(
  oldItems: T[] | undefined,
  newItems: T[] | undefined,
  keyFn: (item: T) => string,
): T[] {
  const oldArray = ensureArray<T>(oldItems);
  const newArray = ensureArray<T>(newItems);

  // 使用 Set 记录已存在的键
  const keySet = new Set<string>();
  const result: T[] = [];

  // 先处理旧数据，保持原始顺序
  for (let i = 0; i < oldArray.length; i++) {
    const item = oldArray[i];
    const key = keyFn(item);
    if (!keySet.has(key)) {
      keySet.add(key);
      result.push(item);
    }
  }

  // 再处理新数据，添加在末尾
  for (let i = 0; i < newArray.length; i++) {
    const item = newArray[i];
    const key = keyFn(item);
    if (!keySet.has(key)) {
      keySet.add(key);
      result.push(item);
    }
  }

  return result;
}

// 优化的 uniqWith 函数 - 保持原始顺序
export function fastUniqWith<T>(
  oldItems: T[] | undefined,
  newItems: T[] | undefined,
  keyFn: (item: T) => string,
): T[] {
  const oldArray = ensureArray<T>(oldItems);
  const newArray = ensureArray<T>(newItems);

  // 使用 Set 记录已存在的键
  const keySet = new Set<string>();
  const result: T[] = [];

  // 先处理旧数据
  for (let i = 0; i < oldArray.length; i++) {
    const item = oldArray[i];
    const key = keyFn(item);
    if (!keySet.has(key)) {
      keySet.add(key);
      result.push(item);
    }
  }

  // 再处理新数据
  for (let i = 0; i < newArray.length; i++) {
    const item = newArray[i];
    const key = keyFn(item);
    if (!keySet.has(key)) {
      keySet.add(key);
      result.push(item);
    }
  }

  return result;
}
