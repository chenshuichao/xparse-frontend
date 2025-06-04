import { useEffect, useRef, useState } from 'react';
import { Tooltip } from 'antd';
import { useInViewport, useSize, useThrottleEffect } from 'ahooks';
import classNames from 'classnames';
import { ReactComponent as LeftOutlined } from '@/assets/icon/ic_left.svg';
import styles from './index.less';

const ImageText = ({ text }: { text: string }) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [showBtn, setShowBtn] = useState(false);
  const [expand, setExpand] = useState(false);

  const textRef = useRef<HTMLDivElement>(null);
  const textSize = useSize(textRef);
  const inViewPort = useInViewport(textRef);

  useThrottleEffect(
    () => {
      if (inViewPort) {
        const isOver = isOverHandle();
        setShowBtn(!!isOver);
      }
    },
    [textSize, inViewPort],
    { wait: 300 },
  );

  useEffect(() => {
    if (inViewPort) setLoaded(true);
  }, [inViewPort]);

  useEffect(() => {
    if (loaded) {
      const isOver = isOverHandle();
      if (isOver) {
        setShowBtn(true);
      }
    }
  }, [text, loaded]);

  const isOverHandle = () => {
    return textRef.current && textRef.current.scrollHeight > textRef.current.offsetHeight + 10;
  };

  const onExpandHandle = () => {
    setExpand(true);
  };

  const tipsProps = {
    overlayInnerStyle: { borderRadius: 4, padding: '6px 12px' },
    color: '#2B2E33',
    arrowPointAtCenter: true,
  };

  return (
    <div
      className={classNames('image-text', styles['image-text'], {
        [styles.expand]: expand,
        [styles.show]: showBtn,
      })}
    >
      <div className={styles['text-content']} ref={textRef}>
        {showBtn && !expand && (
          <span className={styles['expand-btn']} onClick={onExpandHandle}>
            <Tooltip title="展开" {...tipsProps}>
              <LeftOutlined />
            </Tooltip>
          </span>
        )}
        <span dangerouslySetInnerHTML={{ __html: text }} />
      </div>
      {expand && (
        <div className={styles['text-desc']}>
          插图识别结果可能存在顺序上的偏差，建议进行审阅和校对
          <span className={styles['collapse-btn']} onClick={() => setExpand(false)}>
            <Tooltip title="收起" {...tipsProps}>
              <LeftOutlined />
            </Tooltip>
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageText;
