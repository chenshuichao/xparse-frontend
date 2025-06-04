import type { FC } from 'react';
import {
  listContainer,
  fileContainer,
  formatListContainer,
} from '@/pages/DashboardCommon/components/RobotLeftView/store';
import type { IProps as BasicProps } from '@/pages/DashboardCommon/components/RobotLeftView/container/Index';
import type { IFileItem } from '@/pages/DashboardCommon/components/RobotLeftView/data.d';
import ExhaustedModalContainer from '@/pages/DashboardCommon/components/ExhaustedModal/store';
import ExhaustedModal from '@/pages/DashboardCommon/components/ExhaustedModal';
import Container from './Container';

export interface IProps extends BasicProps {
  addFileList?: File[];
  cloudOcrKeyFromRightView?: string;
  onFileClick: (item: Partial<IFileItem>) => void;
  getChooseList?: (list: IFileItem[]) => void;
  maxUploadNum?: number;
  reserveExif?: boolean;
  shouldUsePageLoad?: boolean;
}

const RobotLeftView: FC<IProps> = (props) => {
  return (
    <ExhaustedModalContainer.Provider>
      <listContainer.Provider>
        <fileContainer.Provider initialState={props}>
          <formatListContainer.Provider initialState={props}>
            <Container {...props} />
            <ExhaustedModal />
          </formatListContainer.Provider>
        </fileContainer.Provider>
      </listContainer.Provider>
    </ExhaustedModalContainer.Provider>
  );
};

export default RobotLeftView;
