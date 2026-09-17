// A small, opinionated grid system so dashboard pages stop hand-rolling
// `grid grid-cols-*` strings. Everything sits on a 12-column track;
// GridItem spans tell it how wide to sit at each breakpoint.
//
//   <Grid>
//     <GridItem span={4}><Card>...</Card></GridItem>
//     <GridItem span={8}><Card>...</Card></GridItem>
//   </Grid>

const GAPS = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

export function Grid({ gap = 'md', className = '', children }) {
  return (
    <div className={`grid grid-cols-12 ${GAPS[gap] || GAPS.md} ${className}`}>{children}</div>
  );
}

// Tailwind needs full class names present in source for the JIT scanner to
// pick them up, so spans are mapped rather than interpolated.
const COL_SPAN = {
  1: 'col-span-12 sm:col-span-6 lg:col-span-1',
  2: 'col-span-12 sm:col-span-6 lg:col-span-2',
  3: 'col-span-12 sm:col-span-6 lg:col-span-3',
  4: 'col-span-12 sm:col-span-6 lg:col-span-4',
  5: 'col-span-12 sm:col-span-6 lg:col-span-5',
  6: 'col-span-12 sm:col-span-6 lg:col-span-6',
  7: 'col-span-12 lg:col-span-7',
  8: 'col-span-12 lg:col-span-8',
  9: 'col-span-12 lg:col-span-9',
  10: 'col-span-12 lg:col-span-10',
  12: 'col-span-12',
};

export function GridItem({ span = 12, className = '', children }) {
  return <div className={`${COL_SPAN[span] || COL_SPAN[12]} ${className}`}>{children}</div>;
}

export default Grid;
