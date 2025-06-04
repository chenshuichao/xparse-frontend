import { useEffect, useMemo, useState } from 'react';
import { Tooltip, Tree } from 'antd';
import classNames from 'classnames';
import { useEventListener } from 'ahooks';
import ExpandIcon from '@/assets/icon/menu/expandIcon.svg';
import MenuFolder from '@/assets/icon/dashbord/menu-fold.svg';
import { ReactComponent as MenuIcon } from '@/assets/layout/menu.svg';
import { genTableContentTreeList, scrollIntoActiveCatalog } from './utils';
import styles from './index.less';
import { storeContainer } from '../../store';

export const getCatalogData = (catalog: any) => {
  // 注意【性能敏感】：使用Object.assign而不是扩展运算符提升性能，请勿修改
  if (Array.isArray(catalog?.toc)) {
    return catalog.toc
      .filter((item: any) => !['image_title', 'table_title'].includes(item.sub_type))
      .map((item: any) =>
        Object.assign(item, {
          level: item.hierarchy,
          content: item.title,
          pageNum: item.page_id - 1,
        }),
      );
  }
  return catalog?.generate;
};

const Catalog = ({
  data,
  currentFile,
  layout,
  loading,
}: {
  data: any;
  currentFile?: Record<string, any>;
  layout?: string;
  loading?: boolean;
}) => {
  const [catalogCollapsed, setCatalogCollapsed] = useState(true);
  const { viewerVirtuosoRef } = storeContainer.useContainer();

  const treeData = useMemo(() => {
    return genTableContentTreeList(data);
  }, [data]);

  useEffect(() => {
    if (currentFile?.id) {
      setCatalogCollapsed(true);
    }
  }, [currentFile?.id]);

  useEventListener('click', () => {
    if (layout === 'new') {
      setCatalogCollapsed(true);
    }
  });

  const onSelect = (keys: any[], { node }: any) => {
    const index = node.key;
    const item = data[index];
    if (!item) return;
    const pageNumber = item.pageNum + 1; // 从0开始
    scrollIntoActiveCatalog(pageNumber, `catalog${index}`, {
      onScrollToPage: (pageNumber) => {
        viewerVirtuosoRef?.current?.scrollToIndex({
          index: pageNumber - 1,
          align: 'start',
        });
      },
    });
    setCatalogCollapsed(true);
  };

  return data?.length ? (
    <div
      className={classNames(styles.catalog, 'catalogViewContainer', {
        [styles['catalog-collapsed']]: catalogCollapsed,
        [styles['new-layout']]: layout === 'new',
      })}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div className={styles.catalogTitle} onClick={() => setCatalogCollapsed((pre) => !pre)}>
        {layout === 'new' ? (
          <Tooltip
            placement="right"
            title={`${catalogCollapsed ? '展开' : '收起'}目录`}
            overlayInnerStyle={{ borderRadius: 4, padding: '6px 12px' }}
            color="#2B2E33"
          >
            <MenuIcon />
          </Tooltip>
        ) : (
          <>
            <span>{`${catalogCollapsed ? '展开' : '收起'}目录`}</span>
            <img
              src={catalogCollapsed ? ExpandIcon : MenuFolder}
              title={catalogCollapsed ? '展开' : '收起'}
              width={18}
              alt=""
            />
          </>
        )}
      </div>
      <div className={styles.catalogContent}>
        <Tree treeData={treeData} defaultExpandAll onSelect={onSelect} />
      </div>
    </div>
  ) : null;
};

export default Catalog;
