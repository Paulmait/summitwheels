declare module 'poly-decomp' {
  const decomp: {
    decomp: (polygon: number[][]) => number[][][];
    quickDecomp: (polygon: number[][]) => number[][][];
    isSimple: (polygon: number[][]) => boolean;
    removeCollinearPoints: (polygon: number[][], precision?: number) => void;
    makeCCW: (polygon: number[][]) => void;
  };
  export default decomp;
}
