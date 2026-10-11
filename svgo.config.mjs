// Preserve geometry and numeric precision; remove redundant SVG markup only.
export default {
  multipass: true,
  plugins: [{
    name: 'preset-default',
    params: {
      overrides: {
        cleanupIds: false,
        cleanupNumericValues: false,
        convertPathData: false,
        convertTransform: false,
        mergePaths: false,
        convertShapeToPath: false,
        convertEllipseToCircle: false,
      },
    },
  }],
};
