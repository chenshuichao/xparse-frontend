import { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { createContainer } from 'unstated-next';
import type { IFileItem } from '../data.d';
import { listContainer } from './useList';
import { requestWidthCache } from '@/utils';
import { useDispatch, useSelector } from 'umi';
import type { ConnectState } from '@/models/connect';
import { getFileNameAndType } from '@/utils';
import { getUrlFromExifRotateImg } from '@/utils/removeImgExif';

interface IProps {
  onFileClick?: (item: Partial<IFileItem>) => void;
  getChooseList?: (list: IFileItem[]) => void;
  currentFile?: Partial<IFileItem>;
  reserveExif?: boolean;
}

function useFile(initialState: IProps = {}) {
  const { onFileClick, currentFile, getChooseList, reserveExif } = initialState;
  const dispatch = useDispatch();
  const { loading, resultLoading } = useSelector((state: ConnectState) => state.Common);
  // 目前点击文件
  const [curFileActiveId, setCurFileActiveId] = useState<number | string>(-Infinity);
  // 选中的文件id列表
  const [selectFiles, setSelectFiles] = useState<IFileItem[]>([]);
  const [indeterminate, setIndeterminate] = useState(false);
  // 全选控制
  const [isSelectAll, setIsSelectAll] = useState(false);
  // 是否多选
  const [rowSelected, setRowSelected] = useState(false);

  // const jsonResultLoaded = useRef(true)
  // 加载更多时保持已选中状态
  const [keepLoadingSelected, setKeepLoadingSelectAll] = useState(false);

  const curFileRef = useRef<Record<string, any>>({});
  const recoiningFile = useRef<IFileItem | null>(null);
  const fileBeforeUpload = useRef();

  const { list, setList } = listContainer.useContainer();

  useEffect(() => {
    if (currentFile && currentFile.status && ['complete', 'wait'].includes(currentFile.status)) {
      recoiningFile.current = null;
    }
    curFileRef.current = currentFile || curFileRef.current;
  }, [currentFile]);

  useEffect(() => {
    if (currentFile && currentFile.status && ['complete', 'wait'].includes(currentFile.status)) {
      dispatch({
        type: 'Common/setResultLoading',
        payload: {
          resultLoading: false,
        },
      });
    }
  }, [currentFile?.status]);

  useEffect(() => {
    if (isSelectAll) {
      handleFileSelectChange(list);
    } else {
      handleFileSelectChange([]);
    }
  }, [isSelectAll]);

  useEffect(() => {
    setIndeterminate(!!selectFiles.length && list.length !== selectFiles.length);
  }, [list, selectFiles]);

  const handleCheckFileClick = async (file: IFileItem, afterUpload?: boolean) => {
    if (file.status === 'recognize' || file.status === 'queue')
      return message.warn('正在识别中，请稍后再试');
    // 当处于上传队列中,用户当前已经点击文件则取消自动点击
    if (
      afterUpload &&
      curFileRef.current.id &&
      curFileRef.current.id !== fileBeforeUpload.current
    ) {
      console.log('handleCheckFileClick-处于上传队列中');
      return null;
    }
    // 点击同一张文件时取消请求
    if (file.id === curFileRef.current.id) {
      console.log('handleCheckFileClick-点击同一个');
      return null;
    }

    if (loading) {
      // setCurFileActiveId(+recoiningFile.current.id);
      message.destroy();
      return message.warn('请等待当前文件加载完成');
    }
    if (resultLoading) {
      message.destroy();
      return message.warn('请等待当前文件识别完成');
    }
    curFileRef.current.id = file.id;
    dispatch({
      type: 'Common/setLoading',
      payload: {
        loading: true,
      },
    });
    dispatch({
      type: 'Common/setResultLoading',
      payload: {
        resultLoading: true,
      },
    });
    setCurFileActiveId(file.id as string);
    if (onFileClick) {
      try {
        const { type } = getFileNameAndType(file?.name || '');
        try {
          if (type && ['jpg', 'jpeg', 'png'].includes(type) && !reserveExif) {
            let imgBlob = await requestWidthCache(file.url, { responseType: 'blob', prefix: '' });
            imgBlob = await getUrlFromExifRotateImg(imgBlob);
            file.url = URL.createObjectURL(imgBlob);
          }
        } catch (error) {
          console.log('getUrlFromExifRotateImg', error);
        }
        onFileClick({ ...file });
        console.log('onFileClick', { ...file });
        // eslint-disable-next-line no-empty
      } catch (error) {
        console.log('error', error);
        dispatch({
          type: 'Common/setResultLoading',
          payload: {
            resultLoading: false,
          },
        });
      } finally {
        dispatch({
          type: 'Common/setLoading',
          payload: {
            loading: false,
          },
        });
      }
    }
    recoiningFile.current = file;
  };

  const handleFileSelectChange = (rows: IFileItem[]) => {
    setSelectFiles(rows);
    if (!rows.length) {
      handleCheckChange(false);
    } else if (rows.length === list.length) {
      handleCheckChange(true);
    }
    if (getChooseList) {
      getChooseList(rows);
    }
  };

  const handleMultipleClick = () => {
    setRowSelected((rowSelected) => !rowSelected);
    if (rowSelected) {
      setIsSelectAll(false);
      handleFileSelectChange([]);
      setIndeterminate(false);
    }
  };
  const handleCheckChange = (checked: boolean) => {
    setIsSelectAll(checked);
    setKeepLoadingSelectAll(false);
  };

  const deleteFiles = async (ids: any[]) => {
    setList((pre) => pre.filter((item) => !ids.includes(item.id)));
    handleFileSelectChange([]);
    setIndeterminate(false);
    setIsSelectAll(false);
    message.success('删除成功');
    if (ids.includes(curFileActiveId) && onFileClick) {
      onFileClick({ name: '', url: '' });
    }
  };

  return {
    curFileActiveId,
    curFileRef,
    recoiningFile,
    selectFiles,
    rowSelected,
    isSelectAll,
    setIsSelectAll,
    keepLoadingSelected,
    handleCheckFileClick,
    handleFileSelectChange,
    handleMultipleClick,
    handleCheckChange,
    indeterminate,
    setIndeterminate,
    fileBeforeUpload,
    deleteFiles,
  };
}

export const fileContainer = createContainer<ReturnType<typeof useFile>, IProps>(useFile);
