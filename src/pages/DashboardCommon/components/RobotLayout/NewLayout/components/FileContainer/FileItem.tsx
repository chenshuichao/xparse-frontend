import { useMemo, useRef, useState } from 'react';
import { useSelector } from 'dva';
import { Checkbox, Dropdown, Menu, Modal, Popover } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { useSize } from 'ahooks';
import classNames from 'classnames';
import type { ConnectState } from '@/models/connect';
import { fileContainer } from '@/pages/DashboardCommon/components/RobotLeftView/store';
import type { IFileItem } from '@/pages/DashboardCommon/components/RobotLeftView/Index';
import { FileStatus } from '@/components/FileStatus/Index';
import imageIcon from '@/assets/layout/image@2x.png';
import pdfIcon from '@/assets/layout/pdf@2x.png';
import wordIcon from '@/assets/layout/word@2x.png';
import excelIcon from '@/assets/layout/excel@2x.png';
import codeIcon from '@/assets/layout/code@2x.png';
import { ReactComponent as DeleteIcon } from '@/assets/layout/delete.svg';
import styles from './index.less';

const FileItem = ({
  data,
  width,
  readonly,
  disabledCheck,
  onClick,
}: {
  data: IFileItem;
  width?: number;
  readonly?: boolean;
  disabledCheck?: boolean;
  onClick?: (row: IFileItem) => void;
}) => {
  const [visible, setVisible] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);
  const textSize = useSize(textRef);

  const showTips = useMemo(() => {
    if (!textRef.current || !textSize?.width) return true;
    return textRef.current.scrollWidth > textSize.width;
  }, [textSize]);

  const {
    curFileActiveId,
    rowSelected,
    selectFiles,
    handleFileSelectChange,
    handleCheckFileClick,
    deleteFiles,
  } = fileContainer.useContainer();

  const { robotInfo } = useSelector((store: ConnectState) => ({
    robotInfo: store.Robot.info,
  }));

  const fileIcon = useMemo(() => {
    if (/\.pdf$/i.test(data.name)) {
      return pdfIcon;
    } else if (/\.xls[x]?$/i.test(data.name)) {
      return excelIcon;
    } else if (/\.doc[x]?$/i.test(data.name)) {
      return wordIcon;
    } else if (/\.[m]?htm[l]?$/i.test(data.name)) {
      return codeIcon;
    }
    return imageIcon;
  }, [data]);

  const checked = useMemo(() => {
    return selectFiles.some((row) => row.id === data.id);
  }, [selectFiles, data.id]);

  const onToggle = () => {
    const newList = [...selectFiles];
    if (checked) {
      const index = newList.findIndex((item) => item.id === data.id);
      if (index > -1) {
        newList.splice(index, 1);
      }
    } else {
      newList.push(data);
    }
    handleFileSelectChange(newList);
  };

  const handleFileDelete = async () => {
    await deleteFiles([data.id]);
  };

  const onMenuClick = (e: any) => {
    if (e.key === 'delete') {
      Modal.confirm({
        title: '删除',
        content: '确认要删除选中的文件吗？删除后将无法恢复！',
        onOk: handleFileDelete,
        okButtonProps: { danger: true },
        centered: true,
        autoFocusButton: null,
      });
    }
  };

  const onClickRow = () => {
    handleCheckFileClick(data);
    onClick?.(data);
  };

  const onMouseEnter = () => {
    if (showTips) setVisible(true);
  };

  const onVisibleChange = (val: boolean) => {
    if (!val) {
      setVisible(val);
    }
  };

  return (
    <Popover
      visible={visible}
      content={data.name}
      placement="right"
      overlayClassName={styles['file-name-popover']}
      onVisibleChange={onVisibleChange}
    >
      <div
        className={classNames(styles['file-item'], {
          [styles['active-item']]: curFileActiveId === data.id,
        })}
        data-file-item={data.id}
        style={{ width }}
      >
        {!readonly && rowSelected && (
          <Checkbox disabled={disabledCheck} checked={checked} onChange={onToggle} />
        )}

        <div onMouseEnter={onMouseEnter} className={styles['item-content']} onClick={onClickRow}>
          <img src={fileIcon} width={26} height={30} />
          <FileStatus status={data.status} className={styles.fileStatus} />
          <span
            className={classNames(styles['file-name'], { [styles['ellipsis-text']]: showTips })}
            ref={textRef}
          >
            <span>{data.name}</span>
          </span>
        </div>

        {!readonly && typeof data.id === 'number' && (
          <Dropdown
            overlay={
              <Menu onClick={onMenuClick} style={{ borderRadius: 4 }}>
                <Menu.Item key="delete">
                  <span className={styles['delete-menu']}>
                    <DeleteIcon />
                    <span className={styles['delete-menu-text']}>删除文件</span>
                  </span>
                </Menu.Item>
              </Menu>
            }
            arrow={false}
          >
            <div className={styles['more-btn']}>
              <MoreOutlined />
            </div>
          </Dropdown>
        )}
      </div>
    </Popover>
  );
};

export default FileItem;
