import { useState } from 'react';
import { Input, Popover } from 'antd';
import { useDebounceFn, useVirtualList } from 'ahooks';
import classNames from 'classnames';
import { ReactComponent as SearchIcon } from '@/assets/layout/search.svg';
import type { IFileItem } from '@/pages/DashboardCommon/components/RobotLeftView/Index';
import FileItem from './FileItem';
import styles from './index.less';
import { fastSearch } from '@/utils/search';
import { ensureArray } from '@/utils/objectUtils';

const SearchPanel = ({ onClose, allList }: { onClose?: () => void; allList: IFileItem[] }) => {
  const [matchList, setMatchList] = useState<IFileItem[] | 'empty'>([]);

  const onChange = useDebounceFn(
    async (value) => {
      if (value) {
        const data = fastSearch(value, allList, {
          ignoreCase: true,
          keySelector: (item) => item.name,
        });
        setMatchList(data.length ? data : 'empty');
      } else {
        setMatchList([]);
      }
    },
    { wait: 100, leading: true },
  );

  const { containerProps, wrapperProps, list } = useVirtualList<IFileItem>(ensureArray(matchList), {
    overscan: 10,
    itemHeight: 44,
  });

  const onRowClick = (row: IFileItem) => {
    onClose?.();
  };

  return (
    <div className={styles['search-panel']}>
      <Input
        placeholder="搜索文件..."
        onChange={(e) => onChange.run(e.target.value?.trim())}
        allowClear
        autoFocus
      />

      {Array.isArray(matchList) && (
        <div className={styles['search-panel-scroll']} {...containerProps}>
          <div {...wrapperProps}>
            {list.map((item) => {
              return <FileItem key={item.data.id} data={item.data} readonly onClick={onRowClick} />;
            })}
          </div>
        </div>
      )}

      {matchList === 'empty' && (
        <div className={styles['search-panel-scroll']}>
          <div className={styles['empty-result']}>无结果</div>
        </div>
      )}
    </div>
  );
};

const FileHeader = ({ allList }: { allList: IFileItem[] }) => {
  const [visible, setVisible] = useState(false);

  const fileSaveFlag = false;

  return (
    <Popover
      trigger="click"
      visible={visible}
      placement="bottomLeft"
      content={<SearchPanel allList={allList} onClose={() => setVisible(false)} />}
      arrowContent={null}
      onVisibleChange={(val) => {
        if (!val) {
          setVisible(val);
        }
      }}
      overlayClassName={styles['search-popover']}
      destroyTooltipOnHide
    >
      <div className={classNames(styles.titleWrap, 'robot_tour_step_2')} data-tour-padding="0">
        <span className={styles.label}>
          <span style={{ paddingRight: 4 }}>{fileSaveFlag ? '文件' : '临时文件'}</span>
        </span>
        <span className={styles.btn}>
          <span
            className={classNames(styles['search-btn'], { [styles['active-btn']]: visible })}
            onClick={() => setVisible((pre) => !pre)}
          >
            <SearchIcon />
          </span>
        </span>
      </div>
    </Popover>
  );
};

export default FileHeader;
