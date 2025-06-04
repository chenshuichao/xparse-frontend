import { visit } from 'unist-util-visit';

export const formatFormula = (val: any) => {
  if (!val) return '';
  // HTML特殊字符添加空格，避免渲染错误
  return val
    .replace(/<[\s]*/g, '< ')
    .replace(/[\s]*>/g, ' >')
    .replace(/[\s]*&[\s]*/g, ' & ');
};

const formatMath = (): any => {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      if (node.properties.className?.includes('math')) {
        node.children[0].value = '$' + node.children[0].value + '$';
      }
    });
  };
};

export default formatMath;
