import type { ImgHTMLAttributes } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useInViewport } from 'ahooks';

const LazyImage = ({ src, ...rest }: ImgHTMLAttributes<HTMLImageElement>) => {
  const ref = useRef(null);
  const [url, setUrl] = useState<string>();
  const inViewport = useInViewport(ref);

  useEffect(() => {
    if (inViewport) {
      setUrl(src);
    }
  }, [inViewport]);

  return <img {...rest} ref={ref} src={url} />;
};

export default LazyImage;

interface LazyImageV2Props extends ImgHTMLAttributes<HTMLImageElement> {
  root?: Element | Document | null | undefined;
  getRoot?: () => Element | Document | null | undefined;
  src: string;
  cacheOffset?: string;
}

export const LazyImageV2 = ({ root, getRoot, src, cacheOffset, ...rest }: LazyImageV2Props) => {
  const ref = useRef<HTMLImageElement>(null);
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loaded) {
            setUrl(src);
            setLoaded(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: getRoot?.() || root,
        rootMargin: cacheOffset,
        threshold: 0,
      },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [src, loaded, cacheOffset]);

  return <img {...rest} ref={ref} src={url} />;
};
