const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const replacePlaceholdersInFile = (filepath, m) => {
  console.log(`Replacing placeholders in ${filepath} with nonces`);
  try {
    let data = fs.readFileSync(filepath, 'utf8');
    console.log('filepath', filepath);
    Object.entries(m).forEach(([placeholder, nonce]) => {
      console.log(`${placeholder}: ${nonce}`);
      data = data.replace(placeholder, nonce);
    });
    return data;
  } catch (err) {
    console.error(err);
  }
};

const generateNonces = () => {
  console.log('generateNonces with UUID v4');
  return {
    NONCE_INLINE_CSS: uuidv4(),
    NONCE_INLINE_JS: uuidv4()
  };
};

const MESSAGE = 'THIS FILE WAS AUTOGENERATED - DO NOT MODIFY!\n';

const writeNetlifyToml = (nonces) => {
  const NETLIFY_TOML_PATH = 'netlify.toml';
  const m = {
    'script-src': nonces.NONCE_INLINE_JS,
    'style-src': nonces.NONCE_INLINE_CSS
  };
  console.log(`INjecting nonces for CSP directives in ${NETLIFY_TOML_PATH}`);
  try {
    let data = fs.readFileSync(NETLIFY_TOML_PATH, 'utf8');
    Object.entries(m).forEach(([csp_directive, nonce]) => {
      const regex = new RegExp(`${csp_directive} 'self' 'nonce-.*'.*;`);
      const matches = regex.exec(data);
      const directiveOld = matches[0];
      const directive = directiveOld.replace(/'nonce-.*'/, `'nonce-${nonce}'`);
      console.log(directive);
      data = data.replace(directiveOld, directive);
      fs.writeFileSync(NETLIFY_TOML_PATH, data);
    });
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
