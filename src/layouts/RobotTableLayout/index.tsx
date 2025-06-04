import Header from '@/components/GlobalHeader/DesktopHeader/Index';
import type { ReactNode } from 'react';
import LogoCompose from '../components/LogoCompose';
import type { Dispatch } from 'umi';
import styles from './index.less';

export const layoutType = 'new';

export const LayoutHeader = () => (
  <div>
    <Header
      logo={
        <LogoCompose
          onClick={() => {
            // history.push('/dashboard/overview');
          }}
        />
      }
      className={styles['robot-header-layout']}
    />
  </div>
);

const RobotTableLayout = ({ children, dispatch }: { children: ReactNode; dispatch: Dispatch }) => {
  const newLayout = layoutType === 'new';
  return (
    <div>
      {!newLayout && <LayoutHeader />}
      <main
        id="page_container"
        style={{
          minWidth: 1200,
          height: newLayout ? '100vh' : 'calc(100vh - 50px)',
          overflow: 'auto',
        }}
      >
        {children}
      </main>
    </div>
  );
};
export default RobotTableLayout;
