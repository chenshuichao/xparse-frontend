import { useEffect, useMemo, useRef, useState } from 'react';
import type { IFileItem } from '../data';
import { ensureArray } from '@/utils/objectUtils';
import { ResultType } from '../containers/RightView/RightView';

export const useImageTips = (currentFile: Record<string, any> | IFileItem) => {
  const fileId = currentFile?.id;
  const imageTipsCacheKey = 'hasShowMarkdownSubImagesTip';
  const [imageTipVisible, _setImageTipVisible] = useState(false);
  const setImageTipVisible = (value: boolean) => {
    if (value) {
      if (localStorage.getItem(imageTipsCacheKey) === '1') {
        return;
      }
      _setImageTipVisible(true);
      localStorage.setItem(imageTipsCacheKey, '1');
      setTimeout(() => {
        _setImageTipVisible(false);
      }, 2000);
    } else {
      _setImageTipVisible(false);
    }
  };

  const hasClickImageDotMapRef = useRef<Record<string | number, boolean>>({});
  const [showImageDot, _setShowImageDot] = useState(false);
  const setShowImageDot = (value: boolean) => {
    if (hasClickImageDotMapRef.current[fileId] && value) {
      return;
    }
    _setShowImageDot(value);
  };

  const hasSubImages = useMemo(() => {
    return ensureArray(currentFile?.result?.detail).some(
      (item: any) =>
        item.type === ResultType.image &&
        [ResultType.stamp, ResultType.qrcode].includes(item.sub_type),
    );
  }, [currentFile?.result?.detail]);

  useEffect(() => {
    if (hasSubImages) {
      setImageTipVisible(true);
      setShowImageDot(true);
    }

    return () => {
      setImageTipVisible(false);
      setShowImageDot(false);
    };
  }, [hasSubImages]);

  useEffect(() => {
    // 重新识别
    setShowImageDot(false);
    if (currentFile?.t && currentFile?.id) {
      hasClickImageDotMapRef.current[currentFile.id] = false;
    }
  }, [currentFile?.id, currentFile?.t]);

  return {
    imageTipVisible,
    setImageTipVisible,
    showImageDot,
    setShowImageDot,
    hasSubImages,
  };
};
