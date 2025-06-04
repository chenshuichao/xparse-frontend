import React, { useMemo } from 'react';
import classNames from 'classnames';
import type { IRectListItem } from './data';

interface IParams {
  next_section: IRectListItem['next_section'];
  position: number[];
  viewBox: { width: number; height: number; viewRate: number };
  viewAngle?: number;
  cells?: any;
}

const SIZE = 4;
const PAGE_GUTTER = 12;
const TRIANGLE = 8;

export interface ISectionLine {
  point: { r: number; cx: number; cy: number };
  line: string;
  arrow: string;
}

export const formatLine = ({
  next_section,
  position,
  viewBox,
  viewAngle,
}: IParams): ISectionLine | undefined => {
  if (!next_section) return undefined;
  const scale = viewBox?.viewRate || 1;
  const gutter = SIZE * scale;
  const pageGutter = PAGE_GUTTER * scale;
  const triangle = TRIANGLE * scale;
  if (next_section.next_page) {
    if (viewBox && !viewAngle) {
      const { height } = viewBox;
      const points = [
        { x: position[4], y: position[5] },
        {
          x: next_section.position[0],
          y: height + next_section.position[1] + pageGutter - triangle,
        },
      ];
      return {
        point: { r: gutter, cx: points[0].x, cy: points[0].y },
        line: `${points[0].x},${points[0].y} ${points[1].x},${points[1].y - gutter} ${
          points[1].x
        },${points[1].y}`,
        arrow: `M ${points[1].x - gutter},${points[1].y} L ${points[1].x + gutter},${
          points[1].y
        } L ${points[1].x},${points[1].y + triangle} Z`,
      };
    }
  } else {
    const points = [
      { x: position[4], y: position[5] },
      { x: next_section.position[0] - triangle, y: next_section.position[1] },
    ];
    return {
      point: { r: gutter, cx: points[0].x, cy: points[0].y },
      line: `${points[0].x},${points[0].y} ${points[1].x - gutter},${points[1].y} ${points[1].x},${
        points[1].y
      }`,
      arrow: `M ${points[1].x},${points[1].y - gutter} L ${points[1].x},${points[1].y + gutter} L ${
        points[1].x + triangle
      },${points[1].y} Z`,
    };
  }
  return undefined;
};

export const SectionLine = (props: IRectListItem) => {
  const { points, next_section, viewBox, viewAngle } = props;
  const linePoints = useMemo(
    () => formatLine({ next_section, position: points, viewBox, viewAngle }),
    [points, next_section, viewBox, viewAngle],
  );

  if (!next_section || !linePoints) return null;

  return (
    <g className="section-line">
      <circle r={linePoints.point.r} cx={linePoints.point.cx} cy={linePoints.point.cy} />
      <polyline points={linePoints.line} />
      <path d={linePoints.arrow} />
    </g>
  );
};

export const formatTableLine = ({
  next_section,
  cells,
  position,
  viewBox,
  viewAngle,
}: IParams): ISectionLine[] => {
  if (!next_section) return [];
  const scale = viewBox?.viewRate || 1;
  const gutter = SIZE * scale;
  const pageGutter = PAGE_GUTTER * scale;
  const triangle = TRIANGLE * scale;
  const maxOffset = 0 * scale;
  let startPoint1 = { x: position[6], y: position[7] };
  let startPoint2 = { x: position[4], y: position[5] };
  const cellList = cells?.cells;
  if (cellList) {
    // 取单元格的坐标范围替换表格的坐标范围
    const lastCell = cellList[cellList.length - 1];
    let lastRowStartCell; // 最后一行第一列
    let lastRowEndCell; // 最后一行最后一列
    for (const cellItem of [...cellList].reverse()) {
      if (
        !lastRowEndCell &&
        cellItem.col + cellItem.col_span === cells.cols &&
        cellItem.row + cellItem.row_span === lastCell.row + lastCell.row_span
      ) {
        lastRowEndCell = cellItem.position;
      }
      if (
        !lastRowStartCell &&
        cellItem.col === 0 &&
        cellItem.row + cellItem.row_span === lastCell.row + lastCell.row_span
      ) {
        lastRowStartCell = cellItem.position;
      }
      if (lastRowStartCell && lastRowEndCell) break;
    }
    if (lastRowStartCell && lastRowEndCell) {
      startPoint1 = { x: lastRowStartCell[6], y: lastRowStartCell[7] };
      startPoint2 = { x: lastRowEndCell[4], y: lastRowEndCell[5] };
    }
  }
  let lines: { x: number; y: number }[][] = [];
  if (next_section.next_page) {
    if (viewBox && !viewAngle) {
      const { height } = viewBox;
      lines = [
        [
          startPoint1,
          {
            x:
              Math.abs(startPoint1.x - next_section.position[0]) < maxOffset
                ? startPoint1.x
                : next_section.position[0],
            y: height + next_section.position[1] + pageGutter - triangle,
          },
        ],
        [
          startPoint2,
          {
            x:
              Math.abs(startPoint2.x - next_section.position[2]) < maxOffset
                ? startPoint2.x
                : next_section.position[2],
            y: height + next_section.position[3] + pageGutter - triangle,
          },
        ],
      ];
    }
  } else {
    lines = [
      [
        startPoint1,
        {
          x:
            Math.abs(startPoint1.x - next_section.position[0]) < maxOffset
              ? startPoint1.x
              : next_section.position[0],
          y: next_section.position[1] - triangle,
        },
      ],
      [
        startPoint2,
        {
          x:
            Math.abs(startPoint2.x - next_section.position[2]) < maxOffset
              ? startPoint2.x
              : next_section.position[2],
          y: next_section.position[3] - triangle,
        },
      ],
    ];
  }
  return lines.map((points) => ({
    point: { r: gutter, cx: points[0].x, cy: points[0].y },
    line: `${points[0].x},${points[0].y} ${points[1].x},${points[1].y}`,
    arrow: `M ${points[1].x - gutter},${points[1].y} L ${points[1].x + gutter},${points[1].y} L ${
      points[1].x
    },${points[1].y + triangle} Z`,
  }));
};

export const SectionTableLine = (props: IRectListItem) => {
  const { points, next_section, viewBox, viewAngle, type, cells } = props;
  const lines = useMemo(
    () => formatTableLine({ next_section, cells, position: points, viewBox, viewAngle }),
    [points, next_section, viewBox, viewAngle],
  );

  if (!next_section || !lines.length) return null;

  return (
    <g className={classNames('section-line', { 'section-table': type === 'table' })}>
      {lines.map((item, i) => (
        <React.Fragment key={`${item.line}_${i}`}>
          <circle r={item.point.r} cx={item.point.cx} cy={item.point.cy} />
          <polyline points={item.line} />
          <path d={item.arrow} />
        </React.Fragment>
      ))}
    </g>
  );
};
