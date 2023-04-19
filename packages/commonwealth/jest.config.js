module.exports = {
  // rootDir: "../../.",
  moduleDirectories: [
    "node_modules",
    "<rootDir>/client/scripts",
    "<rootDir>/shared",
    "../chain-events"
  ],
  preset: 'ts-jest',
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/test/__mocks__/fileMock.js',
    '\\.(scss|css|less)$': '<rootDir>/test/__mocks__/styleMock.js',
  },
  transform: {
    "\\.[jt]sx?$": "babel-jest",
    "^.+\\.[ts]x?$":[ "ts-jest", {tsconfig: './tsconfig.frontend.json', useESM: true} ],
  },
  // transformIgnorePatterns: ['node_modules/(?!@rxjs/)'],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"]
};