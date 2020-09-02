const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  watch: false,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000,
  },
  entry: "./src/js/main.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, "index.html"), to: "dist" },
        { from: path.resolve(__dirname, "/styles"), to: "dist" },
      ],
    }),
  ],
};
