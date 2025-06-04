import { useRef, useLayoutEffect, useEffect } from 'react';
// import { useThrottleFn } from 'ahooks';
import { useInViewport } from 'ahooks';
import { isNumber, throttle, uniqWith } from 'lodash';
import { ensureNumber, isEmpty } from '@/utils/objectUtils';
import type { IRectItem } from '../utils';
import { checkScrollPosition, scrollToElementWithOffset } from '@/utils/dom';
import { ResultType } from '../containers/RightView/RightView';
import { storeContainer } from '../store';

export const markdownResultScrollContainerId = 'markdownResultScrollContainer';
export const markdownViewScrollContainerId = 'viewerContainer';

export const useSyncScrollV2 = ({
  data,
  dataType,
  refreshRigister,
  getViewerItemIndex,
  getResultItemIndex,
}: {
  data: IRectItem[][];
  dataType?: string;
  refreshRigister?: boolean;
  getViewerItemIndex?: (pageNumber: number) => number;
  getResultItemIndex?: (pageNumber: number) => number;
}) => {
  const leftContainer = useRef<HTMLElement | null>(null);
  const rightContainer = useRef<HTMLElement | null>(null);
  const syncingRightToLeftRef = useRef(false);
  const syncingLeftToRightRef = useRef(false);
  const isMouseInRightRef = useRef(false);

  const { viewerVirtuosoRef, resultVirtuosoRef, getLatestResultType } =
    storeContainer.useContainer();

  const syncScroll = (
    sourceContainer: HTMLElement,
    targetContainer: HTMLElement,
    offset: number = 280,
    isRight?: boolean,
  ) => {
    const resultType = getLatestResultType() || dataType;
    const isMarkdownContent = !resultType || resultType === ResultType.md;
    if (!isMarkdownContent) {
      return;
    }

    const middleLineContainer = isRight ? sourceContainer : targetContainer;
    const sourcePageLines = getActivePageSplitLines(sourceContainer, middleLineContainer);
    if (!sourcePageLines[0] || !sourcePageLines[1]) {
      return;
    }
    const sourcePageLine1Info = sourcePageLines[0];
    const sourcePageLine1Number = sourcePageLine1Info.line.dataset.pageSplitLineNumber;
    const sourcePageLine2Info = sourcePageLines[1];
    const sourcePageLine2Number = sourcePageLine2Info.line.dataset.pageSplitLineNumber;
    const targetVirtuosoRef = isRight ? viewerVirtuosoRef : resultVirtuosoRef;
    const getItemIndex = isRight ? getViewerItemIndex : getResultItemIndex;

    const getTargetLines = () => {
      const targetPageLines = getPageSplitLines(targetContainer);
      const targetPageLine1 = targetPageLines.find(
        (item) => item.dataset.pageSplitLineNumber === sourcePageLine1Number,
      );
      const targetPageLine2 = targetPageLines.find(
        (item) => item.dataset.pageSplitLineNumber === sourcePageLine2Number,
      );
      return { targetPageLine1, targetPageLine2 };
    };
    const { targetPageLine1, targetPageLine2 } = getTargetLines();
    if (!targetPageLine1 || !targetPageLine2) {
      if (targetVirtuosoRef?.current && sourcePageLine1Number) {
        const targetIndex = getItemIndex?.(ensureNumber(sourcePageLine1Number));
        targetVirtuosoRef.current.scrollToIndex({
          index: isNumber(targetIndex) ? targetIndex : ensureNumber(sourcePageLine1Number),
          align: 'center',
        });
        setTimeout(() => {
          scrollToTarget(getTargetLines());
        });
      }
      return;
    } else {
      scrollToTarget({ targetPageLine1, targetPageLine2 });
    }
    function scrollToTarget({
      targetPageLine1,
      targetPageLine2,
    }: {
      targetPageLine1?: HTMLElement;
      targetPageLine2?: HTMLElement;
    }) {
      if (!targetPageLine1 || !targetPageLine2) {
        return;
      }
      const sourcePageLine1Rect = sourcePageLine1Info.rect;
      const sourcePageLine2Rect = sourcePageLine2Info.rect;
      const targetPageLine1Rect = targetPageLine1.getBoundingClientRect();
      const targetPageLine2Rect = targetPageLine2.getBoundingClientRect();
      const middleLineRect = getMiddleLineRect(isRight ? targetContainer : sourceContainer);
      const targetPageLine1FinalTop =
        middleLineRect.top -
        ((middleLineRect.top - sourcePageLine1Rect.top) *
          (targetPageLine2Rect.top - targetPageLine1Rect.top)) /
          (sourcePageLine2Rect.top - sourcePageLine1Rect.top);
      scrollToElementWithOffset(targetContainer, targetPageLine1, targetPageLine1FinalTop);

      // 处理顶部和底部边界情况
      if (isMarkdownContent) {
        const { isAtTop, isAtBottom } = checkScrollPosition(sourceContainer, 8);
        if (!(isAtTop || isAtBottom)) {
          return;
        }

        if (isAtTop) {
          // 如果另一测对应的页面顶部还未到达，则滚动到顶部
          if (targetVirtuosoRef?.current) {
            targetVirtuosoRef?.current?.scrollToIndex({
              index: 0,
              align: 'start',
              behavior: 'smooth',
            });
          } else {
            // 第一个data-page-number的元素
            const topPage = sourceContainer.querySelector<HTMLElement>('[data-page-number]');
            const topPageNumber = topPage?.dataset.pageNumber;
            const finalTargetPage = targetContainer.querySelector(
              `[data-page-number="${topPageNumber}"]`,
            );
            finalTargetPage?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else if (isAtBottom) {
          setTimeout(() => {
            if (targetVirtuosoRef?.current) {
              targetVirtuosoRef?.current?.scrollToIndex({
                index: 10000,
                align: 'end',
                behavior: 'smooth',
              });
            } else {
              // 最后一个data-page-number的元素
              const bottomPage = getLastDataPageNumberElement(sourceContainer);
              const bottomPageNumber = bottomPage?.dataset.pageNumber;
              const finalTargetPage = targetContainer.querySelector(
                `[data-page-number="${bottomPageNumber}"]`,
              );
              finalTargetPage?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
          });
        }
      }
    }
  };

  const onLeftScroll = (e: any, { force = false }: { force?: boolean } = {}) => {
    if (!force && (syncingLeftToRightRef.current || isMouseInRightRef.current)) return;
    if (!leftContainer.current || !rightContainer.current) return;

    syncingLeftToRightRef.current = true;
    requestAnimationFrame(() => {
      syncScroll(leftContainer.current!, rightContainer.current!);
      syncingLeftToRightRef.current = false;
    });
  };

  const onRightScroll = (e: any, { force = false }: { force?: boolean } = {}) => {
    if (!force && (syncingRightToLeftRef.current || !isMouseInRightRef.current)) return;
    if (!leftContainer.current || !rightContainer.current) return;

    syncingRightToLeftRef.current = true;

    requestAnimationFrame(() => {
      syncScroll(rightContainer.current!, leftContainer.current!, 0, true);
      syncingRightToLeftRef.current = false;
    });
  };

  const isViewScrollerInViewport =
    useInViewport(
      () => document.querySelector(`#${markdownViewScrollContainerId}`) as HTMLElement,
    ) && !isEmpty(data);
  const isResultScrollerInViewport =
    useInViewport(
      () => document.querySelector(`#${markdownResultScrollContainerId}`) as HTMLElement,
    ) && !isEmpty(data);

  useLayoutEffect(() => {
    if (isViewScrollerInViewport && isResultScrollerInViewport && refreshRigister) {
      leftContainer.current = document.querySelector(
        `#${markdownViewScrollContainerId}`,
      ) as HTMLElement;

      leftContainer.current?.addEventListener('scroll', onLeftScroll, { passive: true });

      rightContainer.current = document.querySelector(
        `#${markdownResultScrollContainerId}`,
      ) as HTMLElement;
      rightContainer.current?.addEventListener('scroll', onRightScroll, { passive: true });
    }
    return () => {
      leftContainer.current?.removeEventListener('scroll', onLeftScroll);
      rightContainer.current?.removeEventListener('scroll', onRightScroll);
    };
  }, [isViewScrollerInViewport, isResultScrollerInViewport, refreshRigister]);

  // useLayoutEffect(() => {
  //   if (!data || !refreshRigister) {
  //     return;
  //   }
  //   setTimeout(() => {
  //     leftContainer.current = document.querySelector(
  //       `#${markdownViewScrollContainerId}`,
  //     ) as HTMLElement;
  //     leftContainer.current?.addEventListener('scroll', onLeftScroll);

  //     rightContainer.current = document.querySelector(
  //       `#${markdownResultScrollContainerId}`,
  //     ) as HTMLElement;
  //     rightContainer.current?.addEventListener('scroll', onRightScroll);
  //     console.log('add');
  //   });

  //   // eslint-disable-next-line consistent-return
  //   return () => {
  //     leftContainer.current?.removeEventListener('scroll', onLeftScroll);
  //     rightContainer.current?.removeEventListener('scroll', onRightScroll);
  //     console.log('remove');
  //   };
  // }, [data, refreshRigister]);

  useLayoutEffect(() => {
    const mainViewContainer = document.querySelector('#robotMainViewContainer') as HTMLElement;
    const removeMainViewTracker = trackMouseInContainer(mainViewContainer, false);
    const rightViewContainer = document.querySelector('#robotRightViewContainer') as HTMLElement;
    const removeRightViewTracker = trackMouseInContainer(
      rightViewContainer || rightContainer.current,
      true,
    );
    return () => {
      removeMainViewTracker();
      removeRightViewTracker();
    };
  }, []);

  function trackMouseInContainer(container: HTMLElement, isRight?: boolean) {
    const onMouseEnter = (e: any) => {
      if (e.target === container) {
        isMouseInRightRef.current = !!isRight;
      }
    };
    const onMouseLeave = (e: any) => {
      if (e.target === container) {
        isMouseInRightRef.current = !isRight;
      }
    };

    const omMouseMove = throttle(
      () => {
        isMouseInRightRef.current = !!isRight;
      },
      200,
      { leading: true, trailing: true },
    );

    container?.addEventListener('mouseenter', onMouseEnter);
    container?.addEventListener('mouseleave', onMouseLeave);
    container?.addEventListener('mousemove', omMouseMove);
    container?.addEventListener('mousewheel', omMouseMove);
    container?.addEventListener('touchmove', omMouseMove, { passive: true });

    return () => {
      container?.removeEventListener('mouseenter', onMouseEnter);
      container?.removeEventListener('mouseleave', onMouseLeave);
      container?.removeEventListener('mousemove', omMouseMove);
      container?.removeEventListener('mousewheel', omMouseMove);
      container?.removeEventListener('touchmove', omMouseMove);
    };
  }

  // useEffect(() => {
  //   if (!leftContainer.current || !rightContainer.current) {
  //     return;
  //   }
  //   if (dataType === ResultType.md) {
  //     onLeftScroll(null, { force: true });
  //   } else {
  //     rightContainer.current.scrollTop = 0;
  //     const firstContent = rightContainer.current.querySelector<HTMLElement>('[data-content-id]');
  //     firstContent?.click();
  //   }
  // }, [dataType]);

  return {};
};

function getLastDataPageNumberElement(container: HTMLElement): HTMLElement | null {
  let node = container.lastElementChild as HTMLElement;
  while (node) {
    if (node.hasAttribute('data-page-number')) return node;
    const found = getLastDataPageNumberElement(node);
    if (found) return found;
    node = node.previousElementSibling as HTMLElement;
  }
  return null;
}

function getPageSplitLines(container: HTMLElement): HTMLElement[] {
  const lines = Array.from(
    container.querySelectorAll<HTMLElement>('[data-page-split-line-number]'),
  );
  const resultLines: HTMLElement[] = [];
  for (const line of lines) {
    // 如果已经有一个table-split-line且同页码的，则不插入
    if (
      resultLines.some(
        (item) => item.dataset.splitTableLineNumber === line.dataset.pageSplitLineNumber,
      )
    ) {
      continue;
    }
    resultLines.push(line);
  }
  return uniqWith(
    resultLines.reverse(),
    (prev, next) => prev.dataset.pageSplitLineNumber === next.dataset.pageSplitLineNumber,
  ).sort(
    (current, next) =>
      ensureNumber(current.dataset.pageSplitLineNumber) -
      ensureNumber(next.dataset.pageSplitLineNumber),
  );
}

function getMiddleLineRect(container: HTMLElement) {
  const containerRect = container.getBoundingClientRect();
  return {
    top: containerRect.top + containerRect.height / 2,
  };
}

function getActivePageSplitLines(
  container: HTMLElement,
  middleLineContainer: HTMLElement,
): { line: HTMLElement; rect: DOMRect }[] {
  const splitLines = getPageSplitLines(container);
  const middleLineRect = getMiddleLineRect(middleLineContainer);
  const lineRects = splitLines.map((line) => ({
    line,
    rect: line.getBoundingClientRect(),
  }));
  for (let index = 0; index < lineRects.length; index++) {
    const lineInfo = lineRects[index];
    const lineRect = lineInfo.rect;
    const nextLineInfo = lineRects[index + 1];
    if (!nextLineInfo) {
      //TODO:NOW: 当成上一页是有问题的，直接return不滚动？
      return [lineRects[index - 1], lineInfo];
    }
    const nextLineRect = nextLineInfo.rect;
    if (lineRect.top <= middleLineRect.top && middleLineRect.top < nextLineRect.top) {
      return [lineInfo, nextLineInfo];
    }
  }
  return [];
}
