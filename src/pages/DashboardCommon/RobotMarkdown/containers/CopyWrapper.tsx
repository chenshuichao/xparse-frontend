import { message } from 'antd';
import { ReactComponent as CopyIcon } from '@/assets/icon/copy.svg';
import { copy } from '@/utils';

const CopyWrapper = ({ type }: { type?: 'content' | 'image' }) => {
  const onCopyHandle = (e: any) => {
    try {
      let wrapper = e.currentTarget.parentElement as HTMLDivElement;
      let loopNum = 0;
      while (wrapper && !wrapper.className?.includes('content-container') && loopNum <= 3) {
        wrapper = wrapper.parentElement as HTMLDivElement;
        loopNum += 1;
      }
      if (!wrapper || !wrapper.className?.includes('content-container'))
        throw new Error('no wrapper');

      if (type === 'content') {
        const text = wrapper.dataset.content || '';
        copy(text);
        message.success('复制成功');
        return;
      } else if (type === 'image') {
        const img = wrapper.querySelector('img')?.cloneNode();
        wrapper = wrapper.cloneNode() as HTMLDivElement;
        if (img) wrapper.appendChild(img);
      }

      const node = wrapper.cloneNode(true) as HTMLDivElement;

      const customTextarea = node.querySelectorAll('.custom-textarea');
      if (customTextarea.length) {
        customTextarea.forEach((item) => item.removeAttribute('contenteditable'));
      }

      node.style.position = 'fixed';
      node.style.top = `200px`;
      node.style.left = '110%';

      document.body.appendChild(node);
      const selection = window.getSelection();
      if (!selection) throw new Error('no selection');
      selection.removeAllRanges();
      const range = document.createRange();
      if (!range) throw new Error('no range');
      range.selectNodeContents(node);
      selection.addRange(range);
      document.execCommand('copy');

      message.success('复制成功');

      setTimeout(function () {
        document.body.removeChild(node);
      }, 100);
    } catch (error) {
      console.log('error', error);
      message.error('复制失败');
    }
  };

  return <CopyIcon className="copy-handle" onClick={onCopyHandle} />;
};

export default CopyWrapper;
