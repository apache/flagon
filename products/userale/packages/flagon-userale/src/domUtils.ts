/*!
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const DEFAULT_IGNORE_SELECTOR =
  '[data-userale-ignore]:not([data-userale-ignore="false"]), .userale-ignore';

export const DEFAULT_REDACT_SELECTOR =
  '[data-userale-redact]:not([data-userale-redact="false"]), [data-userale-mask]:not([data-userale-mask="false"]), .userale-redact, .userale-mask';

/**
 * Walks the prototype chain starting ABOVE `obj`'s own properties so DOM
 * clobbering (e.g. `<form><input name="closest|id|parentNode|attributes">`)
 * cannot intercept Node/Element/Event getters or methods. Also works cleanly
 * across realms (e.g. `new JSDOM()`) and in SSR environments.
 */
function getProtoDescriptor(
  obj: object,
  prop: string,
): PropertyDescriptor | undefined {
  let proto: object | null = Object.getPrototypeOf(obj);
  while (proto && proto !== Object.prototype) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc) {
      return desc;
    }
    proto = Object.getPrototypeOf(proto);
  }
  return undefined;
}

function callProtoGetter<T>(obj: unknown, prop: string): T | undefined {
  if (!obj || typeof obj !== "object") {
    return undefined;
  }
  const desc = getProtoDescriptor(obj, prop);
  if (typeof desc?.get === "function") {
    try {
      return desc.get.call(obj) as T;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function callProtoMethod<T>(
  obj: unknown,
  prop: string,
  ...args: unknown[]
): T | undefined {
  if (!obj || typeof obj !== "object") {
    return undefined;
  }
  const desc = getProtoDescriptor(obj, prop);
  if (typeof desc?.value === "function") {
    return (desc.value as (...a: unknown[]) => T).apply(obj, args);
  }
  return undefined;
}

export function isNodeObject(val: unknown): val is Node {
  const nodeType = callProtoGetter<number>(val, "nodeType");
  return typeof nodeType === "number";
}

export function isElementNode(val: unknown): val is Element {
  return callProtoGetter<number>(val, "nodeType") === 1;
}

export function isDocumentNode(val: unknown): val is Document {
  return callProtoGetter<number>(val, "nodeType") === 9;
}

export function safeGetParentNode(node: Node): Node | null {
  return callProtoGetter<Node | null>(node, "parentNode") ?? null;
}

export function safeGetShadowHost(node: Node): Element | null {
  if (callProtoGetter<number>(node, "nodeType") !== 11) {
    return null;
  }
  const host = callProtoGetter<Element | null>(node, "host");
  return isElementNode(host) ? host : null;
}

export function getParentAcrossShadow(node: Node): Node | null {
  const parent = safeGetParentNode(node);
  if (parent) {
    return parent;
  }
  return safeGetShadowHost(node);
}

function matchesStrict(el: Element, selector: string): boolean {
  if (!selector) {
    return false;
  }
  const desc = getProtoDescriptor(el, "matches");
  if (typeof desc?.value !== "function") {
    return false;
  }
  return Boolean((desc.value as (s: string) => boolean).call(el, selector));
}

export function safeMatches(el: Element, selector: string): boolean {
  try {
    return matchesStrict(el, selector);
  } catch {
    return false;
  }
}

export function safeGetAttribute(el: Element, name: string): string | null {
  try {
    const val = callProtoMethod<string | null>(el, "getAttribute", name);
    return val === undefined ? null : val;
  } catch {
    return null;
  }
}

export function safeGetAttributes(el: Element): NamedNodeMap | null {
  return callProtoGetter<NamedNodeMap | null>(el, "attributes") ?? null;
}

export function safeGetStyle(el: Element): CSSStyleDeclaration | null {
  return callProtoGetter<CSSStyleDeclaration | null>(el, "style") ?? null;
}

export function safeGetId(el: Element): string {
  return safeGetAttribute(el, "id") ?? "";
}

export function safeGetClassName(el: Element): string {
  // Using the `class` content attribute works uniformly for HTML and SVGElement (SVGAnimatedString).
  return safeGetAttribute(el, "class") ?? "";
}

export function safeGetLocalName(el: Element): string {
  const local = callProtoGetter<string>(el, "localName");
  if (typeof local === "string" && local.length > 0) {
    return local;
  }
  const nodeName = callProtoGetter<string>(el, "nodeName");
  return typeof nodeName === "string" ? nodeName : "";
}

export function safeComposedPath(e: Event): EventTarget[] {
  if (!e || typeof e !== "object") {
    return [];
  }
  try {
    const path = callProtoMethod<EventTarget[]>(e, "composedPath");
    return Array.isArray(path) ? path : [];
  } catch {
    return [];
  }
}

export function getEventOriginElement(e: Event): Element | null {
  const composed = safeComposedPath(e);
  const rawOrigin: unknown =
    composed.length > 0 ? composed[0] : (e as { target?: unknown }).target;
  if (isElementNode(rawOrigin)) {
    return rawOrigin;
  }
  if (isNodeObject(rawOrigin)) {
    let cur: Node | null = getParentAcrossShadow(rawOrigin);
    while (cur) {
      if (isElementNode(cur)) {
        return cur;
      }
      cur = getParentAcrossShadow(cur);
    }
  }
  return null;
}

export function closestComposed(
  start: Node | null,
  selector: string,
): Element | null {
  if (!start || !selector) {
    return null;
  }
  let cur: Node | null = start;
  while (cur) {
    if (isElementNode(cur) && safeMatches(cur, selector)) {
      return cur;
    }
    cur = getParentAcrossShadow(cur);
  }
  return null;
}

function isEventLike(val: unknown): val is Event {
  if (!val || typeof val !== "object") {
    return false;
  }
  return (
    typeof callProtoGetter<string>(val, "type") === "string" &&
    (getProtoDescriptor(val, "target") !== undefined || "target" in val)
  );
}

/**
 * Checks whether a DOM node or Event originates inside an ignored subtree,
 * crossing open ShadowRoot boundaries and resisting `<form>` property clobbering.
 * Fails closed (`true`) if `ignoreSelector` throws during matching.
 */
export function isNodeIgnored(
  node: unknown,
  ignoreSelector: string = DEFAULT_IGNORE_SELECTOR,
): boolean {
  if (!node || typeof node !== "object") {
    return false;
  }
  try {
    if (isEventLike(node)) {
      const path = safeComposedPath(node);
      for (const item of path) {
        if (isElementNode(item) && matchesStrict(item, ignoreSelector)) {
          return true;
        }
      }
      let cur: Node | null = getEventOriginElement(node);
      while (cur) {
        if (isElementNode(cur) && matchesStrict(cur, ignoreSelector)) {
          return true;
        }
        cur = getParentAcrossShadow(cur);
      }
      return false;
    }

    if (isNodeObject(node)) {
      let cur: Node | null = node;
      while (cur) {
        if (isElementNode(cur) && matchesStrict(cur, ignoreSelector)) {
          return true;
        }
        cur = getParentAcrossShadow(cur);
      }
    }
    return false;
  } catch {
    return true;
  }
}

export function isElementRedacted(
  target: EventTarget | null,
  redactSelector: string = DEFAULT_REDACT_SELECTOR,
): boolean {
  if (!isNodeObject(target)) {
    return false;
  }
  return Boolean(closestComposed(target, redactSelector));
}
