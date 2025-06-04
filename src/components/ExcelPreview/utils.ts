import LuckyExcel from '@zwight/luckyexcel';
import { generateUUID, isXLSX } from '@/utils';
import { loadXLSX } from '@/utils/xlsx';
import type { CellRange } from './index';

export async function convertExcelToUniverData(file: File): Promise<any> {
  if (isXLSX(file.name)) {
    try {
      return await convertByLuckyExcel(file);
    } catch (error) {
      console.error(error);
      return convertByHand(file);
    }
  } else {
    return convertByHand(file);
  }
}

const convertByLuckyExcel = (file: File) => {
  return new Promise((resolve, reject) => {
    LuckyExcel.transformExcelToUniver(
      file,
      async (exportJson: any) => {
        resolve(exportJson);
      },
      (error: any) => {
        console.log(error);
        reject(error);
      },
    );
  });
};

const convertByHand = async (file: File) => {
  const XLSX = await loadXLSX();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, cellStyles: true });

  const univerWorkbook: any = {
    id: `wb_${generateUUID()}`,
    name: workbook.Props?.Title || file.name.replace(/\.[^/.]+$/, ''),
    appVersion: '1.0.0',
    locale: 'zh-CN',
    sheetOrder: [],
    sheets: {},
    styles: {},
  };

  const styleCache = new Map<string, string>();
  let styleIndex = 0;

  const convertStyle = (xlsxStyle: any): string => {
    const styleKey = JSON.stringify({
      font: xlsxStyle.font,
      fill: xlsxStyle.fill,
      border: xlsxStyle.border,
      alignment: xlsxStyle.alignment,
    });

    if (styleCache.has(styleKey)) return styleCache.get(styleKey)!;

    const styleId = `s${styleIndex++}`;
    const univerStyle: any = {};

    // Font conversion
    if (xlsxStyle.font) {
      univerStyle.font = {
        name: xlsxStyle.font.name || 'Arial',
        size: xlsxStyle.font.sz ? Number(xlsxStyle.font.sz) : 12,
        color: xlsxStyle.font.color?.rgb || '#000000',
        bold: !!xlsxStyle.font.bold,
        italic: !!xlsxStyle.font.italic,
        underline: xlsxStyle.font.underline ? 'single' : 'none',
      };
    }

    // Fill conversion
    if (xlsxStyle.fill) {
      univerStyle.fill = {
        type: 'pattern',
        color: xlsxStyle.fill.fgColor?.rgb || '#FFFFFF',
        pattern: xlsxStyle.fill.patternType || 'none',
      };
    }

    // Border conversion
    if (xlsxStyle.border) {
      univerStyle.border = {
        t: convertBorder(xlsxStyle.border.top),
        b: convertBorder(xlsxStyle.border.bottom),
        l: convertBorder(xlsxStyle.border.left),
        r: convertBorder(xlsxStyle.border.right),
      };
    }

    // Alignment conversion
    if (xlsxStyle.alignment) {
      univerStyle.alignment = {
        horizontal: xlsxStyle.alignment.horizontal || 'left',
        vertical: xlsxStyle.alignment.vertical || 'bottom',
        wrapText: !!xlsxStyle.alignment.wrapText,
        textRotation: xlsxStyle.alignment.textRotation
          ? Number(xlsxStyle.alignment.textRotation)
          : 0,
      };
    }

    univerWorkbook.styles[styleId] = univerStyle;
    styleCache.set(styleKey, styleId);
    return styleId;
  };

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName] as any;
    const sheetId = `sheet_${generateUUID()}`;
    const cellData: any = {};

    // Get sheet dimensions
    const range = sheet['!ref']
      ? XLSX.utils.decode_range(sheet['!ref'])
      : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };

    // Process all cells in range
    for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
      cellData[rowNum] = {};

      for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
        const xlsxCell = sheet[cellAddress] as any;

        if (!xlsxCell) continue;

        // Value processing
        const value = xlsxCell.v;
        // Build cell data
        const cell: any = {
          v: value,
          s: xlsxCell.s ? convertStyle(xlsxCell.s) : undefined,
        };

        // Add formula
        if (xlsxCell.f) {
          cell.f = {
            formula: xlsxCell.f,
            si: generateUUID(),
            result: xlsxCell.v,
            type: xlsxCell.t === 'n' ? 'number' : 'string',
          };
        }

        // Add number format
        // if (xlsxCell.z) {
        //   cell.p = {
        //     format: xlsxCell.z,
        //     meta: {
        //       source: 'excel',
        //       originalFormat: xlsxCell.z,
        //     },
        //   };
        // }

        cellData[rowNum][colNum] = cell;
      }
    }

    // Create worksheet
    const worksheet: any = {
      id: sheetId,
      name: sheetName,
      cellData,
      rowCount: Math.max(range.e.r + 1, 50),
      columnCount: Math.max(range.e.c + 1, 20),
      status: 1,
      zoomRatio: 1,
      scrollLeft: 0,
      scrollTop: 0,
      selections: [],
      rightToLeft: false,
      // Handle merged cells
      mergeData: (sheet['!merges'] || []).map((merge: any) => ({
        startRow: merge.s.r,
        endRow: merge.e.r,
        startColumn: merge.s.c,
        endColumn: merge.e.c,
      })),
    };

    univerWorkbook.sheets[sheetId] = worksheet;
    univerWorkbook.sheetOrder.push(sheetId);
  });

  return univerWorkbook;
};

const convertBorder = (border?: any): any => {
  if (!border?.style) return undefined;

  return {
    style: ((
      {
        thin: 'solid',
        medium: 'solid',
        thick: 'solid',
        dotted: 'dotted',
        dashed: 'dashed',
      } as any
    )[border.style] || border.style) as any,
    color: border.color?.rgb || '#000000',
    width:
      (
        {
          thin: 1,
          medium: 2,
          thick: 3,
        } as any
      )[border.style] || 1,
  };
};

export const isRangeEqual = (range1?: CellRange, range2?: CellRange) => {
  if (!range1 || !range2) {
    return false;
  }
  const fields: (keyof CellRange)[] = ['startRow', 'startColumn', 'endRow', 'endColumn'];
  return fields.every((field) => {
    return (range1[field] || 0) === (range2[field] || 0);
  });
};

/**
 * 将列索引转换为Excel列标识(A, B, C, ..., Z, AA, AB, ...)
 * @param columnIndex 基于0的列索引
 * @returns 列标识字符串
 */
function columnIndexToLetter(columnIndex: number): string {
  let columnLetter = '';

  // Excel列命名规则处理
  while (columnIndex >= 0) {
    // 计算当前位的字母
    const remainder = columnIndex % 26;
    columnLetter = String.fromCharCode(65 + remainder) + columnLetter;

    // 准备下一位的计算
    columnIndex = Math.floor(columnIndex / 26) - 1;
  }

  return columnLetter;
}

/**
 * 将单元格范围对象转换为Excel格式的位置字符串
 * @param range 单元格范围对象
 * @returns Excel格式的位置字符串(例如 "A1:B3")
 */
export function rangeToExcelPosition(range: CellRange): string {
  // 验证输入
  if (
    !range ||
    typeof range.startRow !== 'number' ||
    typeof range.startColumn !== 'number' ||
    typeof range.endRow !== 'number' ||
    typeof range.endColumn !== 'number'
  ) {
    throw new Error('无效的单元格范围');
  }

  // 转换起始单元格位置
  const startCol = columnIndexToLetter(range.startColumn);
  const startRow = range.startRow + 1; // Excel行从1开始
  const startPosition = `${startCol}${startRow}`;

  // 转换结束单元格位置
  const endCol = columnIndexToLetter(range.endColumn);
  const endRow = range.endRow + 1; // Excel行从1开始
  const endPosition = `${endCol}${endRow}`;

  // 判断是单个单元格还是范围
  if (startPosition === endPosition) {
    return startPosition;
  } else {
    return `${startPosition}:${endPosition}`;
  }
}

export function isCellInVisibleRange(
  cell: { row: number; column: number },
  visibleRange: CellRange,
) {
  if (!cell || !visibleRange) {
    return false;
  }
  const { row, column } = cell;
  const { startRow, startColumn, endRow, endColumn } = visibleRange;
  return startRow <= row && row <= endRow && startColumn <= column && column <= endColumn;
}
