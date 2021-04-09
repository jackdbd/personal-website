const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const replacePlaceholdersInFile = (filepath, m) => {
  console.log('replacePlaceholdersInFile', filepath);
  try {
    let data = fs.readFileSync(filepath, 'utf8');
    m.forEach((replaceValue, searchValue) => {
      console.log('searchValue => replaceValue:', searchValue, replaceValue);
      data = data.replace(searchValue, replaceValue);
    });
    return data;
  } catch (err) {
    console.error(err);
  }
};

const generateNonces = () => {
  console.log('generateNonces with UUID v4');
  const replaceMap = new Map();
  replaceMap.set(/NONCE_INLINE_CSS/g, uuidv4());
  replaceMap.set(/NONCE_INLINE_JS/g, uuidv4());
  replaceMap.set(/#.*/g, ''); // remove comments in netlify.template.toml
  return replaceMap;
};

const MESSAGE = 'THIS FILE WAS AUTOGENERATED BY prebuild.js - DO NOT MODIFY!\n';

const writeNetlifyToml = (nonces) => {
  const output = 'netlify.toml';
  const string = replacePlaceholdersInFile('netlify.template.toml', nonces);
  try {
    fs.writeFileSync(output, `# ${MESSAGE} ${string}`);
    console.log(`${output} written to disk`);
  } catch (err) {
    console.error(err);
  }
};

const writeEleventyDataEnv = (nonces) => {
  const output = 'src/_data/env.js';
  const string = replacePlaceholdersInFile('src/_data/env.template.js', nonces);
  try {
    fs.writeFileSync(output, `// ${MESSAGE} ${string}`);
    console.log(`${output} written to disk`);
  } catch (err) {
    console.error(err);
  }
};

const m = generateNonces();
writeNetlifyToml(m);
writeEleventyDataEnv(m);
