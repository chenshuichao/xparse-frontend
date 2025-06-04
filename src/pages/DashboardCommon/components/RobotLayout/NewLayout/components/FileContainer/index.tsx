import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { Button, Checkbox, Spin } from 'antd';
import { useVirtualList } from '@/utils/hooks';
import { useSelector } from 'dva';
import type { ConnectState } from '@/models/connect';
import Upload from '@/pages/DashboardCommon/components/RobotLeftView/container/Upload';
import { RecognizeButton } from '@/pages/DashboardCommon/components/RobotLeftView/components';
import {
  fileContainer,
  listContainer,
} from '@/pages/DashboardCommon/components/RobotLeftView/store';
import useUploadFormat from '@/pages/DashboardCommon/components/RobotLeftView/store/useUploadFormat';
import type { IFileItem } from '@/pages/DashboardCommon/components/RobotLeftView/Index';
import { getFileNameAndType, getStaticImgURL } from '@/utils';
import { Empty } from '@/components';
import nonPayImg from '@/assets/images/pic_non_file@2x.png';
import addIcon from '@/assets/layout/add@2x.png';
import FileItem from './FileItem';
import FileHeader from './FileHeader';
import styles from './index.less';

const FileContainer = ({
  className,
  maxUploadNum,
  ...rest
}: {
  className?: string;
  maxUploadNum?: number;
  currentFile: any;
}) => {
  const [sampleList, setSampleList] = useState<IFileItem[]>([]);

  const { collapsed } = useUploadFormat.useContainer();
  const { list } = listContainer.useContainer();
  const {
    curFileActiveId,
    rowSelected,
    isSelectAll,
    selectFiles,
    handleMultipleClick,
    handleCheckChange,
    handleCheckFileClick,
    handleFileSelectChange,
    indeterminate,
  } = fileContainer.useContainer();

  const { Robot } = useSelector((store: ConnectState) => ({
    Robot: store.Robot,
  }));
  const robotInfo = Robot.info;

  const loading = useMemo(() => {
    return false;
    // return !list.length;
  }, [list]);

  const allList = useMemo(() => {
    if (loading) {
      return [];
    }
    return [...list, ...sampleList];
  }, [list, sampleList, loading]);

  const {
    list: viewList,
    containerProps,
    wrapperProps,
    scrollTo,
  } = useVirtualList(allList, {
    itemHeight: 44,
    overscan: 5,
  });

  useEffect(() => {
    if (curFileActiveId) {
      const index = allList.findIndex((item) => item.id === curFileActiveId);
      const activeItem = document.querySelector<HTMLDivElement>(
        `.${styles['file-list-container']} [data-file-item="${curFileActiveId}"]`,
      );
      if (activeItem && activeItem.parentElement) {
        if (
          activeItem.offsetTop < activeItem.parentElement.scrollTop ||
          activeItem.offsetTop >
            activeItem.parentElement.scrollTop + activeItem.parentElement.offsetHeight
        ) {
          scrollTo(index);
        }
      } else {
        scrollTo(index);
      }
    }
  }, [curFileActiveId]);

  return (
    <div
      className={classNames(className, styles['file-container'], {
        [styles['collapsed-list']]: collapsed,
      })}
    >
      {collapsed ? (
        <div className={styles['collapsed-file-header']}>文件</div>
      ) : (
        <FileHeader allList={allList} />
      )}

      <div className={styles['upload-wrapper']}>
        <Upload maxUploadNum={maxUploadNum}>
          <Button type="text">
            <img src={addIcon} alt="" />
            <span className={styles['upload-text']}>上传文件</span>
          </Button>
        </Upload>
      </div>

      <div className={styles['file-list-container']} {...containerProps}>
        <Spin spinning={false}>
          <div className={styles['list-body']} {...wrapperProps}>
            {viewList.map(({ data: item, index }) => {
              return (
                <FileItem key={`${item.id}_${index}`} data={item} disabledCheck={item.isExample} />
              );
            })}
            {!viewList.length && robotInfo.id && (
              <div className={styles['empty-placeholder']}>
                <Empty
                  containerHeight={300}
                  src={nonPayImg}
                  title="暂未上传过任何文件"
                  desc="点击上传文件试试吧"
                />
              </div>
            )}
          </div>
        </Spin>
      </div>

      <div className={styles['file-list-operate']}>
        {rowSelected && (
          <div className={styles['select-count']}>
            <Checkbox
              checked={isSelectAll}
              onChange={(e) => {
                handleCheckChange(e.target.checked);
                handleFileSelectChange(e.target.checked ? list : []);
              }}
              indeterminate={indeterminate}
            >
              <span>本页全选</span>
            </Checkbox>
            <div className={styles.text}>
              已选中
              <span style={{ color: '#1A66FF', paddingLeft: 4 }}>{selectFiles.length}</span>
              <span style={{ color: '#757A85' }}>/{list.length}</span>
            </div>
          </div>
        )}
        <div className={styles['operate-btn-wrapper']}>
          <Button type="link" onClick={handleMultipleClick} className={styles.toggleBtn}>
            {rowSelected ? '退出' : '多选'}
          </Button>
          <RecognizeButton {...rest} />
        </div>
      </div>
    </div>
  );
};

export default FileContainer;
