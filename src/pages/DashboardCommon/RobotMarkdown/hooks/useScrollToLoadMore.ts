import { useRef, useLayoutEffect } from 'react';
import { useThrottleFn } from 'ahooks';
import { checkScrollPosition } from '@/utils/dom';
import type { IRectItem } from '../utils';
import { resultClass } from '../../components/RobotMainView/PDFViewer/utils';
import { markdownViewScrollContainerId } from './useSyncScrollV2';

export const useScrollToLoadMore = ({
  data,
  loadMore,
  run,
}: {
  data: IRectItem[][];
  loadMore?: () => void;
  run?: boolean;
}) => {
  const leftContainer = useRef<HTMLElement | null>(null);
  const rightContainer = useRef<HTMLElement | null>(null);

  const loadMoreIfNeeded = (container: HTMLElement, offset: number = 1000) => {
    const { isAtBottom } = checkScrollPosition(container, offset);
    if (isAtBottom) {
      loadMore?.();
    }
  };

  const { run: onLeftScroll } = useThrottleFn(
    (e: any) => {
      if (leftContainer.current) {
        loadMoreIfNeeded(leftContainer.current);
      }
    },
    { wait: 200, trailing: true, leading: true },
  );

  const { run: onRightScroll } = useThrottleFn(
    (e: any) => {
      if (rightContainer.current) {
        loadMoreIfNeeded(rightContainer.current);
      }
    },
    { wait: 200, trailing: true, leading: true },
  );

  useLayoutEffect(() => {
    if (!run || !data) {
      return;
    }
    setTimeout(() => {
      leftContainer.current = document.querySelector(
        `#${markdownViewScrollContainerId}`,
      ) as HTMLElement;
      leftContainer.current?.addEventListener('scroll', onLeftScroll);

      rightContainer.current = document.querySelector(`.${resultClass}`) as HTMLElement;
      rightContainer.current?.addEventListener('scroll', onRightScroll);
    });

    // eslint-disable-next-line consistent-return
    return () => {
      leftContainer.current?.removeEventListener('scroll', onLeftScroll);
      rightContainer.current?.removeEventListener('scroll', onRightScroll);
    };
  }, [data, run]);

  return {};
};
