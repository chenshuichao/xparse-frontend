import { useDispatch, useSelector } from 'dva';
import type { ConnectState } from '@/models/connect';
import { LayoutHeader, layoutType } from '@/layouts/RobotTableLayout';
import Loading from '@/pages/Loading';
import NewLayout from './index';
import OldLayout from '../Index';
import NewRobotLeftView from './components/LeftView';
import OldLeftView from '../../RobotLeftView/Index';
import { useEffect } from 'react';

const type = layoutType;

export const LeftViewABTest = (props: any) => {
  if (type === 'new') {
    return <NewRobotLeftView {...props} />;
  }

  return <OldLeftView {...props} />;
};

const RobotLayoutABTest = (props: any) => {
  const { headerView } = props;
  const { robotInfo } = useSelector((state: ConnectState) => ({
    robotInfo: state.Robot.info,
  }));
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({
      type: 'Robot/getRobotInfo',
      payload: { service: robotInfo.service },
    });
  }, []);

  if (!robotInfo.id) {
    return <Loading />;
  }

  if (type === 'new') {
    return <NewLayout {...props} />;
  }

  return (
    <>
      <LayoutHeader />
      <div style={{ height: 'calc(100vh - 50px)' }}>
        {headerView}
        <OldLayout {...props} />
      </div>
    </>
  );
};

export default RobotLayoutABTest;
