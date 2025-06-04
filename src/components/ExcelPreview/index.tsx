/**
 * excel预览组件，基于univer实现
 *
 * api、数据结构、参数类型参考官方文档：
 * https://docs.univer.ai/en-US/guides/sheets/getting-started/workbook-data
 * https://reference.univer.ai/en-US/globals
 */

import React, { useEffect, useRef, useState } from 'react';
import { Result } from 'antd';
import classNames from 'classnames';
import { loadUniverSDK } from '@/utils/univer';
import styles from './index.less';
import {
  convertExcelToUniverData,
  isCellInVisibleRange,
  isRangeEqual,
  rangeToExcelPosition,
} from './utils';
import Loading from '../Loading';
import { isNumber } from '@/utils/objectUtils';

export interface CellRange {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
}

export interface ActiveExcelRange {
  sheetIndex: number;
  cellRange: CellRange | null;
}

interface IExcelPreviewProps {
  className?: string;
  style?: React.CSSProperties;
  file: File;
  loading?: boolean;
  container?: string | HTMLElement;
  activeExcelRange?: ActiveExcelRange;
  resetDeps?: string;
  defaultActiveSheetIndex?: number;
  onSelectionChanged?: (params: any) => void;
  onScroll?: (params: any) => void;
}

export default function ExcelPreview({
  className,
  style,
  file,
  loading: propLoading,
  container: propContainer,
  activeExcelRange,
  resetDeps,
  defaultActiveSheetIndex,
  onSelectionChanged,
  onScroll,
}: IExcelPreviewProps) {
  const univerAPIRef = useRef<any>();
  const workbookRef = useRef<any>();
  const selectionChangeListener = useRef<any>();
  const scrollListener = useRef<any>();
  const lifeCycleChangListener = useRef<any>();
  const defaultActiveSheetIndexRef = useRef<number>();

  if (
    isNumber(defaultActiveSheetIndex) &&
    defaultActiveSheetIndex >= 0 &&
    !isNumber(defaultActiveSheetIndexRef.current)
  ) {
    defaultActiveSheetIndexRef.current = defaultActiveSheetIndex;
  }

  const [_loading, setLoading] = useState(false);
  const loading = propLoading || _loading;
  const [error, setError] = useState<any>(null);
  const defaultContainerId = 'textinExcelPreviewContainer';
  const container = propContainer || defaultContainerId;
  const lastHighlightRangeRef = useRef<any>();
  const lastSelectionRef = useRef<any>();

  const init = async () => {
    try {
      setLoading(true);
      await loadUniverSDK();
      const {
        UniverPresets,
        UniverCore,
        UniverDesign,
        UniverPresetSheetsCore,
        UniverPresetSheetsCoreZhCN,
      } = window;
      const { createUniver } = UniverPresets;
      const { LocaleType, merge } = UniverCore;
      const { defaultTheme } = UniverDesign;
      const { UniverSheetsCorePreset } = UniverPresetSheetsCore;
      const data = await convertExcelToUniverData(file);

      const { univerAPI } = createUniver({
        locale: LocaleType.ZH_CN,
        locales: { [LocaleType.ZH_CN]: merge({}, UniverPresetSheetsCoreZhCN) },
        theme: defaultTheme,
        disableAutoFocus: true,
        presets: [
          UniverSheetsCorePreset({
            container,
            header: false,
            toolbar: false,
            contextMenu: false,
            disableAutoFocus: true,
          }),
        ],
      });

      // 监听rendered
      lifeCycleChangListener.current = univerAPI.addEvent(
        univerAPI.Event.LifeCycleChanged,
        ({ stage }: any) => {
          if (stage === univerAPI.Enum.LifecycleStages.Rendered) {
            setLoading(false);
          }
        },
      );

      // 监听选择焦点变化
      selectionChangeListener.current = univerAPI.addEvent(
        univerAPI.Event.SelectionChanged,
        (params: any) => {
          // 排除第一次自动初始化选择
          const { startRow, startColumn } = params?.selections[0] || {};
          if (!lastSelectionRef.current && startRow === 0 && startColumn === 0) {
            return;
          }
          lastSelectionRef.current = params?.selections[0];
          onSelectionChanged?.(params);
          highlightSelectionRange(params.worksheet);
        },
      );

      // 监听滚动
      scrollListener.current = univerAPI.addEvent(univerAPI.Event.Scroll, (params: any) => {
        // const { worksheet, workbook, scrollX, scrollY } = params;
        onScroll?.(params);
      });

      const workbook = univerAPI.createWorkbook(data);
      // 禁用编辑
      workbook.setEditable(false);
      const permission = univerAPI.getPermission();
      permission.setPermissionDialogVisible(false);

      univerAPIRef.current = univerAPI;
      workbookRef.current = workbook;

      setDefaultActiveSheet();
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const highlightSelectionRange = (worksheet: any) => {
    if (lastHighlightRangeRef.current) {
      lastHighlightRangeRef.current.dispose();
    }
    const fSelection = worksheet.getSelection();
    const activeRange = fSelection.getActiveRange();
    const disposable = activeRange.highlight();
    lastHighlightRangeRef.current = disposable;
  };

  const setDefaultActiveSheet = () => {
    try {
      if (defaultActiveSheetIndexRef.current && workbookRef.current) {
        const sheet = workbookRef.current.getSheets()[defaultActiveSheetIndexRef.current];
        workbookRef.current.setActiveSheet(sheet);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const dispose = () => {
    lifeCycleChangListener.current?.dispose();
    selectionChangeListener.current?.dispose();
    scrollListener.current?.dispose();
    univerAPIRef.current?.dispose();
  };

  useEffect(() => {
    init();
    return () => {
      dispose();
    };
  }, []);

  useEffect(() => {
    if (univerAPIRef.current && activeExcelRange) {
      const fWorkbook = univerAPIRef.current.getActiveWorkbook();
      const activeSheetIndex = activeExcelRange.sheetIndex;
      const currentActivesheet = fWorkbook.getActiveSheet();
      if (currentActivesheet?.getIndex() !== activeSheetIndex) {
        const sheet = fWorkbook.getSheets()[activeSheetIndex];
        fWorkbook.setActiveSheet(sheet);
      }

      const activeCellRange = activeExcelRange.cellRange;
      if (activeCellRange) {
        const fWorksheet = fWorkbook.getActiveSheet();
        const activeRangePosition = rangeToExcelPosition(activeCellRange);
        const fRange = fWorksheet.getRange(activeRangePosition);
        const currentActiveRange = fWorksheet.getSelection()?.getActiveRange();
        if (fRange && !isRangeEqual(fRange?.getRange(), currentActiveRange?.getRange())) {
          fWorksheet.setActiveSelection(fRange);
          // 滚动到对应单元格
          const visibleRange = fWorksheet.getVisibleRange();
          const row = fRange.getRow();
          const column = fRange.getColumn();
          if (!isCellInVisibleRange({ row, column }, visibleRange)) {
            fWorksheet.scrollToCell(Math.max(row - 1, 0), Math.max(column - 1, 0));
          }
        }
      }
    }
  }, [activeExcelRange]);

  useEffect(() => {
    setDefaultActiveSheet();
  }, [defaultActiveSheetIndex]);

  useEffect(() => {
    if (resetDeps) {
      if (workbookRef.current) {
        const sheets = workbookRef.current.getSheets();
        sheets.forEach((sheet: any) => {
          sheet.zoom(1);
        });
      }
    }
  }, [resetDeps]);

  return (
    <>
      <div
        id={defaultContainerId}
        className={classNames(styles.excelPreview, className)}
        style={style}
      />
      {loading && <Loading type="normal" />}
      {error && (
        <Result
          className={styles.error}
          status="error"
          title="预览失败"
          subTitle={error.message || '初始化错误，暂时无法预览'}
        />
      )}
    </>
  );
}
