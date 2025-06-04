import { useEffect, useRef, useState } from 'react';
import { Col, Row } from 'antd';
import classNames from 'classnames';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useDispatch, useSelector } from 'dva';
import Loading from '@/pages/Loading';
import type { ConnectState } from '@/models/connect';
import type { IRobotInfo } from '@/services/robot';
import useUploadFormat from '../../RobotLeftView/store/useUploadFormat';
import useMathJaxLoad from '../../../RobotMarkdown/MathJaxRender/useMathJaxLoad';
import RecognitionLayoutStore from './store';
import styles from '../Index.less';
import newStyles from './index.less';

export const LEFT_WIDTH = 240;
const COLLAPSED_LEFT_WIDTH = 80;

interface IProps {
  leftView: React.ReactNode;
  leftWidth?: number;
  showCollapsed?: boolean;
  autoCollapsed?: any;
  catalogView?: React.ReactNode;
  mainView: React.ReactNode;
  rightView?: React.ReactNode;
  resizable?: boolean;
}
const RecognitionLayout: React.FC<IProps> = ({
  leftView,
  leftWidth = LEFT_WIDTH,
  catalogView,
  mainView,
  rightView,
  showCollapsed,
  autoCollapsed,
  resizable = true,
}) => {
  const { collapsed, setCollapsed } = useUploadFormat.useContainer();
  const [isDragging, setIsDragging] = useState(false);

  const autoCollapsedOnceFlag = useRef(false); // 只自动收起一次

  const { Robot } = useSelector((state: ConnectState) => ({
    Robot: state.Robot,
  }));
  const { uploadEnd } = Robot;
  const curRobot = Robot.info as IRobotInfo;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({
      type: 'Robot/getRobotInfo',
      payload: { service: Robot.info.service },
    });
  }, []);

  // 初始化公式渲染插件
  useMathJaxLoad({
    show:
      [16].includes(curRobot.interaction as number) ||
      ['professional-document-parse', 'pdf_to_markdown'].includes(curRobot.service as string),
  });

  useEffect(() => {
    if (showCollapsed && autoCollapsed && !collapsed && !autoCollapsedOnceFlag.current) {
      setCollapsed(true);
      autoCollapsedOnceFlag.current = true;
    }
  }, [autoCollapsed]);

  useEffect(() => {
    if (showCollapsed && uploadEnd && !autoCollapsedOnceFlag.current) {
      setCollapsed(true);
      autoCollapsedOnceFlag.current = true;
    }
  }, [uploadEnd]);

  const width = collapsed ? COLLAPSED_LEFT_WIDTH : leftWidth;

  if (!curRobot.id) {
    return <Loading />;
  }

  return (
    <Row
      className={classNames(styles.container, styles['new-container'], newStyles['new-layout'])}
      style={{ height: '100vh' }}
    >
      <Col
        className={classNames(styles.leftBar, 'leftViewContainer', {
          [styles.slideCollapsed]: collapsed,
        })}
        style={{ flexBasis: width, width: width }}
      >
        <div className={styles.leftBarAnimate}>
          <div className={styles.leftBarContent} style={{ width: width }}>
            {leftView}
          </div>
        </div>
      </Col>

      {!resizable && (
        <>
          <Col
            className={classNames(styles.mainContent, 'mainViewContainer', {
              [styles.mainViewCollapsed]: collapsed,
            })}
            style={{ zIndex: 1 }}
          >
            {mainView}
          </Col>
          {rightView && (
            <Col className={styles.rightBar} data-tut="robot-rightContent">
              {rightView}
            </Col>
          )}
        </>
      )}

      {resizable &&
        (rightView ? (
          <>
            <PanelGroup direction="horizontal" style={{ zIndex: 1 }}>
              <Panel minSize={30} maxSize={60}>
                <Col
                  className={classNames(styles.mainContent, 'mainViewContainer', {
                    [styles.mainViewCollapsed]: collapsed,
                  })}
                >
                  {catalogView}
                  {mainView}
                </Col>
              </Panel>
              <PanelResizeHandle
                title="调整边栏宽度"
                className={classNames(styles.resizeHandle, {
                  [styles.resizeHandleActive]: isDragging,
                })}
                onDragging={(isDragging: boolean) => {
                  setIsDragging(isDragging);
                }}
              />
              <Panel minSize={30} maxSize={70}>
                <Col className={styles.rightBar} data-tut="robot-rightContent">
                  {rightView}
                </Col>
              </Panel>
            </PanelGroup>
          </>
        ) : (
          <Col
            className={classNames(styles.mainContent, 'mainViewContainer', {
              [styles.mainViewCollapsed]: collapsed,
            })}
            style={{ zIndex: 1 }}
          >
            {mainView}
          </Col>
        ))}
    </Row>
  );
};

const RecognitionLayoutContainer = (props: any) => {
  const { Robot } = useSelector((state: ConnectState) => ({
    Robot: state.Robot,
  }));
  return (
    <RecognitionLayoutStore.Provider>
      <useUploadFormat.Provider initialState={{ curRobot: Robot.info }}>
        <RecognitionLayout {...props} />
      </useUploadFormat.Provider>
    </RecognitionLayoutStore.Provider>
  );
};

export default RecognitionLayoutContainer;
