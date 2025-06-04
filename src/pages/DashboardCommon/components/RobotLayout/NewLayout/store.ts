import { useSelector } from 'dva';
import { createContainer } from 'unstated-next';
import type { ConnectState } from '@/models/connect';

const RecognitionLayoutStore = createContainer(() => {
  const { robotInfo } = useSelector((state: ConnectState) => ({
    robotInfo: state.Robot.info,
  }));
  const { service = '' } = robotInfo;

  return { service };
});

export default RecognitionLayoutStore;
