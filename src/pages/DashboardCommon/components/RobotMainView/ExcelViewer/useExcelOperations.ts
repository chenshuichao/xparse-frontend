import { useEffect, useRef, useState } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';
import type { ActiveExcelRange, CellRange } from '@/components/ExcelPreview';
import { resultScrollerClass } from '@/pages/DashboardCommon/RobotMarkdown/containers/RightView/RightView';
import { scrollIntoViewIfNeededV2 } from '@/utils/dom';

export const useExcelOperations = ({
  currentFile,
  resultVirtuosoRef,
}: {
  currentFile: any;
  resultVirtuosoRef?: React.RefObject<VirtuosoHandle>;
}) => {
  const [activeExcelRange, setActiveExcelRange] = useState<ActiveExcelRange>({
    sheetIndex: 0,
    cellRange: null,
  });

  const getResultContainer = () => document.querySelector<HTMLElement>(`.${resultScrollerClass}`);

  const handleExcelSelectionChange = (params: any) => {
    const { worksheet, selections } = params;
    const sheetIndex = worksheet.getIndex();
    const newActiveRange = {
      sheetIndex,
      cellRange: selections[0],
    };
    setActiveExcelRange(newActiveRange);

    // 选中解析结果并滚动搭到对应位置
    setResultSelection(newActiveRange);
  };

  const findTargetPageTimerRef = useRef<any>();

  const setResultSelection = (range: ActiveExcelRange) => {
    const { sheetIndex, cellRange } = range;
    const resultContainer = getResultContainer();
    if (resultContainer) {
      const findTargetPage = () =>
        resultContainer.querySelector(`[data-page-number="${sheetIndex + 1}"]`);
      let targetPage = findTargetPage();
      if (!targetPage) {
        resultVirtuosoRef?.current?.scrollToIndex({
          index: sheetIndex,
          align: 'center',
        });
        let count = 0;
        if (findTargetPageTimerRef.current) {
          clearInterval(findTargetPageTimerRef.current);
        }
        findTargetPageTimerRef.current = setInterval(() => {
          if (targetPage || count > 30) {
            clearInterval(findTargetPageTimerRef.current);
            findTargetPageTimerRef.current = null;
            count = 0;
            setResultActiveAndScrollIntoView();
          } else {
            targetPage = findTargetPage();
          }
        }, 100);
      } else {
        setResultActiveAndScrollIntoView();
      }
      function setResultActiveAndScrollIntoView() {
        if (!targetPage) {
          return;
        }
        const pageContents = targetPage.querySelectorAll<HTMLElement>(`[data-content-id]`);
        const targetContent = Array.from(pageContents).find(
          (el) => el.querySelector('table') !== null,
        );
        if (!targetContent) return;
        clearResultActiveClass(resultContainer!);
        targetContent.classList.add('active');
        const targetTable = targetContent.querySelector<HTMLTableElement>('table');
        const targetCells = findCellsInTable(targetTable!, cellRange!);
        targetCells.forEach((cell) => cell.classList.add('active'));
        scrollIntoViewIfNeededV2(targetCells[0], resultContainer!, {
          block: 'center',
        });
      }
    }
  };

  const clearResultActiveClass = (resultContainer?: HTMLElement) => {
    const container = resultContainer || getResultContainer();
    const activeEles = container?.querySelectorAll('.active');
    activeEles?.forEach((el) => {
      el.classList.remove('active');
    });
  };

  const handleExcelScroll = (params: any) => {};

  // 监听解析结果点击，选中对应的sheet和单元格
  const addResultClickListener = () => {
    const resultContainer = getResultContainer();

    resultContainer?.addEventListener('click', handleResultClick);
  };

  const removeResultClickListener = () => {
    const resultContainer = getResultContainer();
    resultContainer?.removeEventListener('click', handleResultClick);
  };

  const handleResultClick = (e: any) => {
    const target = e.target;
    // 判断点击的是表格
    if (['TD', 'TH'].includes(target.tagName)) {
      // 获取页码
      const resultContainer = getResultContainer();
      const targetPage = findClosestElementWithPageNumber(target, resultContainer!);
      if (!targetPage) return;
      const pageNumber = targetPage.dataset.pageNumber;
      const sheetIndex = parseInt(pageNumber || '0') - 1;
      // 获取单元格范围
      const cellRange = getCellPositionInTable(target);
      setActiveExcelRange({
        sheetIndex,
        cellRange,
      });
    }
  };

  useEffect(() => {
    if (!currentFile?.rects) {
      return () => {};
    }
    setTimeout(() => {
      addResultClickListener();
    });
    return () => {
      removeResultClickListener();
    };
  }, [currentFile?.rects]);

  return {
    activeExcelRange,
    setActiveExcelRange,
    handleExcelSelectionChange,
    handleExcelScroll,
  };
};

/**
 * 从表格中查找指定范围的单元格
 * @param table HTML表格元素
 * @param cellRange 单元格范围（索引从0开始）
 * @returns 找到的单元格元素数组
 */
function findCellsInTable(table: HTMLTableElement, cellRange: CellRange): HTMLTableCellElement[] {
  // 验证输入参数
  if (!table || !cellRange) {
    throw new Error('Table or cellRange is undefined');
  }

  const { startRow, startColumn, endRow, endColumn } = cellRange;

  // 确保范围是有效的
  if (startRow < 0 || startColumn < 0 || endRow < startRow || endColumn < startColumn) {
    throw new Error('Invalid cell range');
  }

  // 获取所有行（考虑thead、tbody、tfoot）
  const rows: HTMLTableRowElement[] = [];

  // 处理thead
  if (table.tHead) {
    Array.from(table.tHead.rows).forEach((row) => rows.push(row));
  }

  // 处理tbody（可能有多个）
  Array.from(table.tBodies).forEach((tbody) => {
    Array.from(tbody.rows).forEach((row) => rows.push(row));
  });

  // 处理tfoot
  if (table.tFoot) {
    Array.from(table.tFoot.rows).forEach((row) => rows.push(row));
  }

  // 如果没有使用结构元素，直接获取rows
  if (rows.length === 0) {
    Array.from(table.rows).forEach((row) => rows.push(row));
  }

  // 检查范围是否超出表格大小
  if (endRow >= rows.length) {
    console.warn(`End row ${endRow} exceeds table size ${rows.length}`);
  }

  // 创建一个表格单元格映射来处理合并单元格
  const cellMap: (HTMLTableCellElement | null)[][] = [];

  // 初始化映射
  for (let r = 0; r <= Math.min(endRow, rows.length - 1); r++) {
    cellMap[r] = [];
  }

  // 填充映射，考虑rowspan和colspan
  for (let r = 0; r < rows.length; r++) {
    let colIndex = 0;

    const cells = Array.from(rows[r].cells);
    for (const cell of cells) {
      // 找到此单元格在映射中的下一个空位置
      while (cellMap[r] && cellMap[r][colIndex]) {
        colIndex++;
      }

      const rowSpan = cell.rowSpan || 1;
      const colSpan = cell.colSpan || 1;

      // 填充此单元格占用的所有位置
      for (let rs = 0; rs < rowSpan; rs++) {
        if (r + rs >= cellMap.length) break;

        for (let cs = 0; cs < colSpan; cs++) {
          if (!cellMap[r + rs]) cellMap[r + rs] = [];
          cellMap[r + rs][colIndex + cs] = cell;
        }
      }

      colIndex += colSpan;
    }
  }

  // 收集指定范围内的所有单元格
  const cellsSet = new Set<HTMLTableCellElement>(); // 使用Set避免重复

  for (let r = startRow; r <= Math.min(endRow, cellMap.length - 1); r++) {
    if (!cellMap[r]) continue;

    for (let c = startColumn; c <= endColumn; c++) {
      if (cellMap[r][c]) {
        cellsSet.add(cellMap[r][c]!);
      }
    }
  }

  return Array.from(cellsSet);
}

/**
 * 获取表格单元格在表格中的位置
 * @param cell 表格单元格元素(td或th)
 * @returns 单元格在表格中的范围信息，如果不是有效单元格则返回null
 */
function getCellPositionInTable(cell: HTMLTableCellElement): CellRange | null {
  // 检查元素是否为表格单元格
  if (!(cell instanceof HTMLTableCellElement)) {
    console.error('Element is not a table cell');
    return null;
  }

  // 找到所属的表格
  const table = cell.closest('table');
  if (!table) {
    console.error('Cell is not within a table');
    return null;
  }

  // 获取所有行
  const rows: HTMLTableRowElement[] = [];

  // 处理thead
  if (table.tHead) {
    Array.from(table.tHead.rows).forEach((row) => rows.push(row));
  }

  // 处理tbody（可能有多个）
  Array.from(table.tBodies).forEach((tbody) => {
    Array.from(tbody.rows).forEach((row) => rows.push(row));
  });

  // 处理tfoot
  if (table.tFoot) {
    Array.from(table.tFoot.rows).forEach((row) => rows.push(row));
  }

  // 如果没有使用结构元素，直接获取rows
  if (rows.length === 0) {
    Array.from(table.rows).forEach((row) => rows.push(row));
  }

  // 创建表格映射，处理合并单元格
  const cellMap: (HTMLTableCellElement | null)[][] = [];
  const positionMap = new Map<HTMLTableCellElement, CellRange>();

  // 初始化表格映射
  for (let r = 0; r < rows.length; r++) {
    cellMap[r] = [];
  }

  // 填充映射
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    let colIndex = 0;

    const rowCells = Array.from(rows[rowIndex].cells);
    for (const currentCell of rowCells) {
      // 找到下一个未被占用的位置
      while (cellMap[rowIndex][colIndex]) {
        colIndex++;
      }

      const rowSpan = currentCell.rowSpan || 1;
      const colSpan = currentCell.colSpan || 1;

      // 记录单元格的位置范围
      const range: CellRange = {
        startRow: rowIndex,
        startColumn: colIndex,
        endRow: rowIndex + rowSpan - 1,
        endColumn: colIndex + colSpan - 1,
      };

      // 保存单元格的位置信息
      positionMap.set(currentCell, range);

      // 填充单元格占用的所有位置
      for (let rs = 0; rs < rowSpan; rs++) {
        if (rowIndex + rs >= cellMap.length) break;

        for (let cs = 0; cs < colSpan; cs++) {
          cellMap[rowIndex + rs][colIndex + cs] = currentCell;
        }
      }

      colIndex += colSpan;
    }
  }

  // 从映射中获取点击单元格的位置
  if (positionMap.has(cell)) {
    return positionMap.get(cell)!;
  }

  return null;
}

/**
 * 查找最近的具有data-page-number属性的祖先元素
 * @param element 起始DOM元素
 * @returns 找到的元素或null
 */
function findClosestElementWithPageNumber(
  element: HTMLElement,
  container: HTMLElement,
): HTMLElement | null {
  let currentElement: HTMLElement | null = element;

  // 向上遍历DOM树
  while (currentElement && currentElement !== container) {
    // 检查当前元素是否有data-page-number属性
    if (currentElement.hasAttribute('data-page-number')) {
      return currentElement;
    }

    // 移动到父元素
    currentElement = currentElement.parentElement;
  }

  // 如果没有找到，返回null
  return null;
}
