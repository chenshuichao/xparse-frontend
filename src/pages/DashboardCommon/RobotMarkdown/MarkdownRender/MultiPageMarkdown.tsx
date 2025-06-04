import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import CopyWrapper from '../containers/CopyWrapper';
import { useRefreshMath } from '../MathJaxRender/useMathJaxLoad';
import { formatFormula } from '../MathJaxRender/formatMath';
import useContentClick from '../hooks/useContentClick';
import type { IRectItem } from '../utils';
import { getQuestionsRenderList, removeFormula$ } from '../utils';
import md2html, { encodeMath, mdRender } from './md2html';
import { LazyImageV2 } from './LazyImage';
import styles from './index.less';
import EditableContent from './EditableContent';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import classNames from 'classnames';
import { flatten } from 'lodash';
import type { ResultJsonUpdateParams } from '../store';
import { storeContainer } from '../store';
import { resultScrollerClass, ResultType } from '../containers/RightView/RightView';
import { prefixPath } from '@/utils';
import SplitTable from './components/SplitTable';
import ImageText from './components/ImageText';
import { QuestionCategoryDesc, QuestionTypeDesc } from '../data.d';
import { isEmpty, isNil } from '@/utils/objectUtils';
import { markdownResultScrollContainerId, useSyncScrollV2 } from '../hooks/useSyncScrollV2';

const MultiPageMarkdown = ({
  data,
  onRectClick,
  onContentClick,
  dpi,
  dataType,
  subType,
  markdown,
  markdownMode = 'view',
  onMarkdownChange,
  markdownEditorRef,
  resultScrollerRef,
  onSave,
}: {
  data: IRectItem[][];
  onRectClick?: (e: any) => void;
  onContentClick?: (e: any) => void;
  dpi?: number;
  dataType?: string;
  subType?: string;
  markdown?: string;
  markdownMode?: 'view' | 'edit';
  onMarkdownChange?: (params: ResultJsonUpdateParams) => void;
  onSave?: () => void;
  markdownEditorRef: React.MutableRefObject<Vditor | null>;
  resultScrollerRef?: React.MutableRefObject<HTMLDivElement | null>;
}) => {
  const latestData = useRef(data);
  latestData.current = data;
  const editorRef = useRef<Vditor | null>(null);
  const markdownContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    resultVirtuosoRef,
    viewerVirtuosoRef,
    setPageIndexMap,
    currentFile,
    getViewerItemIndex,
    getResultItemIndex,
  } = storeContainer.useContainer();

  const getEditorContentId = () =>
    editorRef.current?.vditor.element.parentElement?.dataset.editorContentId;

  const editorContentCanMerge = () => {
    const contentId = getEditorContentId();
    const items = flatten(latestData.current);
    let contentItemIndex = items.findIndex((item) => item?.content_id?.toString() === contentId);
    if (contentItemIndex > -1) {
      const contentItem = items[contentItemIndex];
      let prevContentItem = items[contentItemIndex - 1];
      while (prevContentItem?.content === 1) {
        contentItemIndex -= 1;
        if (contentItemIndex < 0) break;
        prevContentItem = items[contentItemIndex];
      }
      const canMerge =
        prevContentItem &&
        [contentItem, prevContentItem].every(
          (item) => !['table', 'image'].includes(item?.type || '') && item.content !== 1,
        );
      if (canMerge) {
        return contentItem;
      }
    }
  };

  const handleMarkdownChange = ({ contentId, value }: { contentId: string; value: string }) => {
    const contentItem = flatten(latestData.current).find(
      (item) => item?.content_id?.toString() === contentId,
    )!;
    // console.log('changed', contentItem, value);
    // debugger
    // const newMarkdown = editorRef.current?.html2md(markdownContainerRef.current?.innerHTML!);
    if (contentItem) {
      onMarkdownChange?.({ value, contentItem });
    }
  };

  useEffect(() => {
    const vditor =
      editorRef.current ||
      new Vditor(`vditor`, {
        cdn: prefixPath + 'vditor@3.10.6',
        mode: 'ir',
        after: () => {
          editorRef.current = vditor;
        },
        input(value) {
          const contentId = getEditorContentId();
          if (contentId) {
            handleMarkdownChange({ contentId, value });
          }
        },
        keydown(event) {
          if (event.key === 'Backspace') {
            const cursorPosition = editorRef.current?.getCursorPosition();
            if (cursorPosition && cursorPosition.left <= 4 && cursorPosition.top <= 14) {
              const contentItemToMerge = editorContentCanMerge();
              if (contentItemToMerge) {
                onMarkdownChange?.({
                  contentItem: { ...contentItemToMerge, custom_edit_continue: true },
                  value: editorRef.current?.getValue() || '',
                });
              }
            }
          }
        },
        blur(value) {
          const contentId = getEditorContentId();
          if (contentId) {
            handleMarkdownChange({ contentId, value });
          }
        },
        toolbar: [],
        toolbarConfig: {
          hide: true,
        },
        cache: {
          enable: false,
        },
      });
    markdownEditorRef.current = vditor;
    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
      markdownEditorRef.current = null;
    };
  }, []);

  // 快捷键保存
  const save = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        console.log('save', dataType, markdownMode);
        if (dataType === ResultType.md && markdownMode === 'edit') {
          editorRef.current?.blur();
          setTimeout(() => {
            onSave?.();
          });
          e.preventDefault();
        }
      }
    },
    [dataType, markdownMode, onSave],
  );
  useEffect(() => {
    document.addEventListener('keydown', save, false);
    return () => {
      document.removeEventListener('keydown', save, false);
    };
  }, [save]);

  const content = useMemo(() => {
    if (!Array.isArray(data)) {
      const contentHtml = markdown && dataType === ResultType.md ? mdRender(markdown) : '';
      return contentHtml ? <div dangerouslySetInnerHTML={{ __html: contentHtml }} /> : null;
    }
    let splitPageData: any;
    const displayData = setPageIndexMap(data);

    return (
      <Virtuoso
        id={markdownResultScrollContainerId}
        ref={resultVirtuosoRef}
        style={{ height: '100%', willChange: 'transform', transform: 'translateZ(0)' }}
        data={displayData}
        increaseViewportBy={500}
        itemsRendered={() => {
          refreshMath();
        }}
        components={{}}
        itemContent={(pageIndex, page) => {
          if (isEmpty(page)) {
            return <div style={{ minHeight: 1 }} />;
          }
          const pageNumber = page[page.length - 1].page_id || pageIndex + 1;
          if (
            Array.isArray(splitPageData) &&
            splitPageData[splitPageData.length - 1] !== pageNumber &&
            splitPageData.includes(pageNumber)
          ) {
            // 跨页表格合并 + 当前页没有正文内容 + 不是最后表格的最后一页；只显示合并后的表格，忽略其他内容
            const hasContent = page.filter(
              (item) =>
                !isNil(item.content_id) &&
                item.content !== 1 &&
                !['catalog', 'other'].includes(item.type || '') &&
                !item._from_split,
            );
            if (!hasContent.length) return <div style={{ minHeight: 1 }} />;
          }
          splitPageData = undefined;
          let questionType: any;
          let list: any[] = page;
          if (dataType === ResultType.question && Array.isArray(page)) {
            list = getQuestionsRenderList(page);
          }
          const lines = Array.isArray(list)
            ? list.map((item) => {
                const lineContent = (line: IRectItem) => {
                  if (line.type === 'catalog' || line._from_split) return null;
                  let text = line.text;
                  let markdownText = line.text;
                  if (dataType === 'formula' && text) {
                    const formula = removeFormula$(text);
                    return (
                      <div key={line.content_id} data-content-id={line.content_id}>
                        <div className="content-container formula-item" data-content={formula}>
                          <CopyWrapper type="content" />
                          <div>{formatFormula(text)}</div>
                        </div>
                      </div>
                    );
                  }
                  if (line.type === 'image') {
                    const imgSrc = line.base64str
                      ? `data:image/jpg;base64,${line.base64str}`
                      : line.image_url;
                    let imageText = '';
                    let chartTable = line.sub_type === 'chart' ? line.text : '';
                    if (chartTable && !/^<[a-z]+/.test(chartTable)) {
                      chartTable = md2html(chartTable);
                    }
                    if (/^<table/.test(chartTable)) {
                      chartTable = chartTable.replace(/\\/g, '');
                    } else {
                      chartTable = '';
                      imageText = md2html(line.text?.trim());
                    }
                    if (!imgSrc) return null;
                    const zoom = dpi ? 96 / dpi : 1;
                    const shouldHide = subType && line.sub_type !== subType;
                    return (
                      <div
                        id={`content_${line.content_id.toString()}`}
                        key={line.content_id}
                        data-content-id={line.content_id}
                        className={classNames(
                          'content-container',
                          'image-wrapper',
                          line.rect_type,
                          {
                            ['has-text']: chartTable || imageText,
                            ['hidden']: shouldHide,
                          },
                        )}
                        style={shouldHide ? { display: 'none' } : {}}
                      >
                        <div className="image-wrapper-border">
                          <CopyWrapper type="image" />
                          <LazyImageV2
                            style={{
                              width: (line.position[2] - line.position[0]) * zoom,
                              height: (line.position[5] - line.position[3]) * zoom,
                            }}
                            getRoot={() =>
                              resultScrollerRef?.current ||
                              document.querySelector(`.${resultScrollerClass}`)
                            }
                            src={imgSrc}
                            cacheOffset="4000px"
                          />
                          {chartTable && (
                            <div
                              className="chart-table"
                              dangerouslySetInnerHTML={{ __html: chartTable }}
                            />
                          )}
                          {imageText && <ImageText text={imageText} />}
                        </div>
                      </div>
                    );
                  }
                  // 标题
                  const isHeaderText =
                    typeof line.outline_level === 'number' && line.outline_level !== -1;
                  let headTag = '';
                  if (isHeaderText) {
                    headTag = `h${line.outline_level! + 1}`;
                    markdownText = `${'#'.repeat(line.outline_level! + 1)} ${text}`;
                    text = `<${headTag}>${text}</${headTag}>`;
                  }
                  // 非html，进行md渲染
                  let isMd = false;
                  if (text && line.content !== 1 && !/^<[a-z]+/.test(text)) {
                    isMd = true;
                  }
                  const isTable = line.type === 'table';
                  if (isTable && !isMd) {
                    text = encodeMath(text);
                  }
                  text = isMd ? md2html(text, { keepRawHtml: true }) : mdRender(text);
                  // 表格
                  if (isTable) {
                    const page_ids = [...new Set(line.split_section_page_ids || [])];
                    if (page_ids.length > 1) {
                      splitPageData = page_ids;
                    }
                    return (
                      <EditableContent
                        key={line.content_id}
                        editorRef={editorRef}
                        contentId={String(line.content_id)}
                        editable={dataType === ResultType.md && markdownMode === 'edit'}
                        value={markdownText}
                        htmlText={text}
                        onChange={handleMarkdownChange}
                        isTable={true}
                      >
                        <div
                          key={line.content_id}
                          data-content-id={line.content_id}
                          className={classNames('table-wrapper', { ['md-table']: isMd })}
                        >
                          <SplitTable text={text} data={line} />
                        </div>
                      </EditableContent>
                    );
                  }
                  if (splitPageData && line.content === 1) {
                    return null;
                  }
                  return (
                    <EditableContent
                      key={line.content_id}
                      editorRef={editorRef}
                      contentId={String(line.content_id)}
                      editable={dataType === ResultType.md && markdownMode === 'edit'}
                      value={markdownText}
                      onChange={handleMarkdownChange}
                    >
                      <div
                        key={line.content_id}
                        data-content-id={line.content_id}
                        data-custom-edit-continue-content-ids={line.custom_edit_continue_content_ids?.join(
                          ',',
                        )}
                        dangerouslySetInnerHTML={{ __html: text || '' }}
                        className={classNames({ ['no-content']: line.content === 1 })}
                      />
                    </EditableContent>
                  );
                };
                if (dataType === ResultType.question) {
                  const isNewType = item.question_type !== questionType;
                  questionType = item.question_type;
                  return (
                    <div
                      className={styles['question-item']}
                      key={`${pageNumber}_${item.question_index}`}
                      data-content-id={item.border?.content_id}
                      data-active="0"
                    >
                      {isNewType && (
                        <div className={styles['question-type']}>
                          {QuestionTypeDesc[item.question_type] || item.question_type}
                        </div>
                      )}
                      {item.data.map((line: IRectItem) => (
                        <div
                          className={classNames(styles['line-container'], {
                            [styles['question-stem']]: line.type === 'question_stem',
                          })}
                          key={line.content_id}
                        >
                          <div className={styles['line-label']}>
                            {QuestionCategoryDesc[line.question_category] || line.question_category}
                          </div>
                          {['question_stem', 'question_content'].includes(line.type as string) && (
                            <div>{lineContent(line)}</div>
                          )}
                        </div>
                      ))}
                      {!!item.images.length && (
                        <div className={classNames(styles['line-container'])}>
                          <div className={styles['line-label']}>
                            {item.images[0].question_category}
                          </div>
                          {item.images.map((item: any) => (
                            <span
                              className={styles['question-image']}
                              key={item.content_id}
                              data-content-id={item.content_id}
                            >
                              {item.text}
                            </span>
                          ))}
                        </div>
                      )}
                      {!!item.tables.length && (
                        <div className={classNames(styles['line-container'])}>
                          <div className={styles['line-label']}>
                            {item.tables[0].question_category}
                          </div>
                          {item.tables.map((item: any) => (
                            <span
                              className={styles['question-image']}
                              key={item.content_id}
                              data-content-id={item.content_id}
                            >
                              {item.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return lineContent(item);
              })
            : [];
          return (
            <>
              <div data-page-split-line-number={pageNumber - 1} />
              <div
                key={pageNumber}
                data-page-number={pageNumber}
                className={classNames({ 'hidden-page': splitPageData })}
                style={{ minHeight: 1 }}
              >
                {lines}
              </div>
              <div
                data-page-split-line-number={
                  splitPageData ? splitPageData[splitPageData.length - 1] : pageNumber
                }
              />
            </>
          );
        }}
      />
    );
  }, [data, markdownMode, dataType, markdown]);

  useContentClick({ onRectClick, onContentClick, data, viewerVirtuosoRef, getViewerItemIndex });

  useSyncScrollV2({
    data,
    dataType,
    refreshRigister: !currentFile?.hiddenRects,
    getViewerItemIndex,
    getResultItemIndex,
  });

  const { refreshHandle: refreshMath } = useRefreshMath(content);

  return (
    <div
      className={classNames('markdown-body', styles['markdown-body'], {
        [styles.markdownBodyEditMode]: markdownMode === 'edit',
      })}
      style={{ height: '100%' }}
    >
      <div id="markdownContent" ref={markdownContainerRef} style={{ height: '100%' }}>
        {content}
      </div>
      <div id="vditor" className={classNames(styles.editor)} />
    </div>
  );
};

export default MultiPageMarkdown;
