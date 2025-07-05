module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          browsers: ["> 1%", "last 2 versions", "not dead", "not ie 11"],
        },
        useBuiltIns: "usage",
        corejs: 3,
        modules: false,
      },
    ],
  ],
  plugins: [
    "@babel/plugin-transform-class-properties",
    "@babel/plugin-transform-private-methods",
    "@babel/plugin-syntax-dynamic-import",
  ],
  env: {
    test: {
      presets: [
        [
          "@babel/preset-env",
          {
            targets: {
              node: "current",
            },
            modules: "commonjs",
          },
        ],
      ],
    },
  },
}
