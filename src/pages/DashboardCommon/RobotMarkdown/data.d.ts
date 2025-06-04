import type { IFile } from '@/pages/DashboardCommon/components/RobotLeftView/data';

export interface IFileItem extends IFile {
  cloudOcr?: boolean; // 是否云识别
  cloudStatus?: 0 | 1 | 2 | 3; // 0:未识别 1:识别中 2:识别成功 3:识别失败
  time?: string;
  id: number;
  result?: any;
  utime?: string;
  [key: string]: any;
}

export interface IImgResult {
  image_angle?: string;
  item_list?: IItemList[];
  rotated_image_height?: string;
  rotated_image_width?: any;
  table_list?: [];
  type?: string;
  type_description?: boolean;
  details?: any;
  [key: string]: any;
}

export interface IItemList {
  uid: string;
  key: string;
  value: string;
  position?: number[];
  description: string;
  active: boolean;
  confidence?: number;
  type: 'img' | 'text' | string;
  number?: string;
  points?: number[];
  image?: string;
  [key: string]: any;
}
export interface DetailsItem {
  value: string;
  position: number[];
  image?: string;
  description?: string;
}
export type DetailsItemValue = DetailsItem | DetailsItem[];
export type DetailList = {
  key: string;
  lines: DetailsItemValue;
};
export enum KeyTypeEnum {
  ITEM_LIST = 'item_list',
  DETAILS = 'details',
}

export interface IRectListItem {
  uid: string;
  points: number[];
  value?: string;
  [index: string]: any;
}

export const QuestionTypeDesc: Record<string, any> = {
  0: '选择题',
  1: '填空题',
  2: '阅读理解（阅读+问答选择）',
  3: '完型填空（阅读+选择）',
  4: '阅读填空（阅读+填空）',
  5: '问答题',
  6: '选择题，多选多',
  7: '填空、选择题混合',
  8: '应用题',
  9: '判断题',
  10: '作图题',
  11: '材料题',
  12: '计算题',
  13: '连线题',
  14: '作文题',
  15: '解答题',
  16: '其他',
  17: '图',
  18: '表格',
};

export const QuestionCategoryDesc: Record<string, any> = {
  0: '题干',
  1: '选项',
  2: '解析',
  3: '答案',
  stem: '题干',
  option: '选项',
  analysis: '解析',
  answer: '答案',
  other: '其他',
};
