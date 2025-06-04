import { useEffect, useState } from 'react';
import { message } from 'antd';
import type { VirtuosoHandle } from 'react-virtuoso';
import { blobToFile, requestWidthCache } from '@/utils';
import { isNumber } from '@/utils/objectUtils';
import ExcelPreview from '@/components/ExcelPreview';
import { useExcelOperations } from './useExcelOperations';
import styles from './index.less';

export default function ExcelViewer({
  currentFile,
  resultVirtuosoRef,
}: {
  currentFile?: any;
  resultVirtuosoRef?: React.RefObject<VirtuosoHandle>;
}) {
  const [file, setFile] = useState<File>();
  const [loading, setLoading] = useState(false);
  const { img_uri, name, img_name } = currentFile || {};

  const { activeExcelRange, handleExcelSelectionChange, handleExcelScroll } = useExcelOperations({
    currentFile,
    resultVirtuosoRef,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const blob = await requestWidthCache(img_uri, { responseType: 'blob', prefix: '' });
      const file = blobToFile(blob, name || img_name);
      setFile(file);
    } catch (error) {
      console.error(error);
      message.error('文件加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (img_uri) {
      loadData();
    }
  }, [img_uri]);

  return file ? (
    <ExcelPreview
      className={styles.excelPreviewer}
      file={file}
      loading={loading}
      activeExcelRange={activeExcelRange}
      resetDeps={currentFile?.t}
      defaultActiveSheetIndex={
        isNumber(currentFile?.startPageNum) ? currentFile.startPageNum - 1 : undefined
      }
      onSelectionChanged={handleExcelSelectionChange}
      onScroll={handleExcelScroll}
    />
  ) : null;
}
