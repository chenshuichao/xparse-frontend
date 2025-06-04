import type { MutableRefObject } from 'react';
import { isBrowser } from './env';
import { isFunction } from './objectUtils';

export function getChildWidth(wrapper: Element | string) {
  let totalWith: number = 0;
  if (!(wrapper instanceof Element)) {
    const container = document.querySelector(wrapper);
    // eslint-disable-next-line no-param-reassign
    if (container) wrapper = container;
  }
  if (!wrapper) return 0;
  const children = (wrapper as Element).children;
  if (!children) return 0;
  Array.from(children).forEach((child) => {
    const marginLeft = parseInt(getComputedStyle(child).marginLeft);
    const marginRight = parseInt(getComputedStyle(child).marginRight);
    const clientWidth = child.getBoundingClientRect().width;
    const calcWidth = marginLeft + marginRight + clientWidth;
    totalWith += calcWidth;
  });

  return totalWith;
}
export const getActualOffsetTop = (
  target: HTMLElement,
  parentDom: HTMLElement = document.documentElement,
) => {
  const top = target.getBoundingClientRect().top;
  const parentOffsetTop = parentDom.getBoundingClientRect().top;
  return top + parentDom.scrollTop - parentOffsetTop;
};
export const getChildOffsetTop = (dom: HTMLElement, scrollDom: HTMLElement) => {
  const children = scrollDom.children;
  return Array.from(children).map((child) => getActualOffsetTop(child as HTMLElement, dom));
};

// 将容器dom滚动到指定的子节点
export const scrollToChild = (
  dom: HTMLElement | undefined,
  index: number,
  { getChildren }: { getChildren?: (container: HTMLElement) => HTMLCollection } = {},
) => {
  if (!dom) {
    return;
  }
  const children = getChildren ? getChildren(dom) : dom.children;
  if (index < 0 || index >= children.length) {
    return;
  }
  const targetElement = children[index];

  targetElement.scrollIntoView({ behavior: 'instant', block: 'start' });
};

// 获取当前节点下哪个子节点处于可视区域
export function getVisibleChildIndex(
  container: HTMLElement | undefined,
  { getChildren }: { getChildren?: (container: HTMLElement) => HTMLCollection } = {},
) {
  if (!container) {
    return -1;
  }
  // 获取容器滚动的距离
  const containerScrollTop = container.scrollTop;

  // 获取容器中的所有子元素
  const children = getChildren ? getChildren(container) : container.children;

  // 获取容器的可见高度
  const containerHeight = container.clientHeight;

  // 遍历所有子元素，判断是否有一半已经进入可视区域
  for (let i = 0; i < children.length; i += 1) {
    const child: any = children[i];
    const childTop = child.offsetTop; // 子节点顶部相对于容器的偏移量
    const childHeight = child.offsetHeight; // 子节点的高度

    // 子节点的底部位置
    const childBottom = childTop + childHeight;

    // 计算子节点进入可视区域的部分
    const visibleTop = Math.max(childTop, containerScrollTop);
    const visibleBottom = Math.min(childBottom, containerScrollTop + containerHeight);
    const visibleHeight = visibleBottom - visibleTop;

    // 如果可见部分大于等于子节点高度的一半，认为这个子节点在可视区域内
    if (visibleHeight >= childHeight / 2) {
      return i;
    }
  }

  // 如果没有找到合适的子节点，返回 -1
  return -1;
}

export function isElementInContainerViewport(
  el: HTMLElement,
  container: HTMLElement,
  offset: number = 0,
): boolean {
  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // 计算垂直方向的重叠区域高度
  const overlapTop = Math.max(elRect.top, containerRect.top);
  const overlapBottom = Math.min(elRect.bottom, containerRect.bottom);
  const overlapHeight = overlapBottom - overlapTop;
  // 如果重叠高度 ≥ offset，返回 true
  return overlapHeight > offset;
}

export function isElementInContainerViewportV2(
  el: HTMLElement,
  container: HTMLElement,
  offset: number = 0,
): boolean {
  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // 计算垂直方向的重叠区域高度
  const overlapTop = Math.max(elRect.top, containerRect.top);
  const overlapBottom = Math.min(elRect.bottom, containerRect.bottom);
  const overlapHeight = overlapBottom - overlapTop;

  // 计算水平方向的重叠区域宽度
  const overlapLeft = Math.max(elRect.left, containerRect.left);
  const overlapRight = Math.min(elRect.right, containerRect.right);
  const overlapWidth = overlapRight - overlapLeft;

  // 如果垂直和水平方向的重叠都 ≥ offset，返回 true
  return overlapHeight > offset && overlapWidth > offset;
}

export function isElementInMiddleZone(el: HTMLElement, container: HTMLElement): boolean {
  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // 计算容器中间区域边界（上下各 50px）
  const middleZoneTop = containerRect.top + containerRect.height / 2 - 50;
  const middleZoneBottom = containerRect.top + containerRect.height / 2 + 50;

  // 判断元素与中间区域是否有重叠
  return (
    elRect.bottom > middleZoneTop && // 元素底部在中间区域上方
    elRect.top < middleZoneBottom // 元素顶部在中间区域下方
  );
}

export function scrollIntoViewIfNeeded(
  el?: HTMLElement,
  container?: HTMLElement,
  scrollArgs?: boolean | ScrollIntoViewOptions,
  offset = 0,
) {
  if (!el || !container) {
    return;
  }
  if (isElementInContainerViewport(el, container, offset || 0)) {
    return;
  }
  el.scrollIntoView(scrollArgs);
}

export function scrollIntoViewIfNeededV2(
  el?: HTMLElement,
  container?: HTMLElement,
  scrollArgs?: boolean | ScrollIntoViewOptions,
  offset = 0,
) {
  if (!el || !container) {
    return;
  }
  if (isElementInContainerViewportV2(el, container, offset || 0)) {
    return;
  }
  el.scrollIntoView(scrollArgs);
}

export function scrollToElementWithOffset(
  container: HTMLElement,
  element: HTMLElement,
  topOffset: number,
  smooth: boolean = false,
) {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  const currentScrollTop = container.scrollTop;

  const elementTopRelativeToContainer = elementRect.top - containerRect.top;

  const desiredScrollTop = currentScrollTop + elementTopRelativeToContainer - topOffset;

  if (smooth) {
    container.scrollTo({
      top: desiredScrollTop,
      behavior: 'smooth',
    });
    return;
  }
  container.scrollTop = desiredScrollTop;
}

export function checkScrollPosition(
  container: HTMLElement,
  offset: number | { top?: number; bottom?: number } = 0,
) {
  const scrollTop = container.scrollTop;
  const clientHeight = container.clientHeight;
  const scrollHeight = container.scrollHeight;

  const offsetConfig = {
    top: (typeof offset === 'number' ? offset : offset.top) || 0,
    bottom: (typeof offset === 'number' ? offset : offset.bottom) || 0,
  };

  const isAtTop = scrollTop <= Math.max(0, offsetConfig.top);

  const isAtBottom =
    scrollTop + clientHeight >=
    Math.max(scrollHeight - Math.abs(offsetConfig.bottom), clientHeight);

  return { isAtTop, isAtBottom };
}

export function findSurroundingElements(elems: HTMLElement[], targetElement: HTMLElement) {
  // 计算所有元素的视口顶部坐标
  const elementsWithTop = elems.map((elem) => ({
    element: elem,
    top: elem.getBoundingClientRect().top,
  }));

  // 计算目标元素的视口顶部坐标
  const targetTop = targetElement.getBoundingClientRect().top;

  // 按顶部坐标排序
  elementsWithTop.sort((a, b) => a.top - b.top);

  // 查找第一个大于等于目标top的位置
  let insertionIndex = 0;
  while (
    insertionIndex < elementsWithTop.length &&
    elementsWithTop[insertionIndex].top < targetTop
  ) {
    insertionIndex++;
  }

  // 获取前后元素
  const lowerElement = insertionIndex > 0 ? elementsWithTop[insertionIndex - 1].element : null;

  const upperElement =
    insertionIndex < elementsWithTop.length ? elementsWithTop[insertionIndex].element : null;

  return [lowerElement, upperElement];
}

type TargetValue<T> = T | undefined | null;

type TargetType = HTMLElement | Element | Window | Document;

export type BasicTarget<T extends TargetType = Element> =
  | (() => TargetValue<T>)
  | TargetValue<T>
  | MutableRefObject<TargetValue<T>>;

export function getTargetElement<T extends TargetType>(target: BasicTarget<T>, defaultElement?: T) {
  if (!isBrowser) {
    return undefined;
  }

  if (!target) {
    return defaultElement;
  }

  let targetElement: TargetValue<T>;

  if (isFunction(target)) {
    targetElement = target();
  } else if ('current' in target) {
    targetElement = target.current;
  } else {
    targetElement = target;
  }

  return targetElement;
}
