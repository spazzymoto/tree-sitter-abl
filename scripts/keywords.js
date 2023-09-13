const fs = require('fs');

let template = fs.readFileSync('queries/highlights.template', { encoding: 'utf8', flag: 'r' });
const keywords = fs.readFileSync('keyword.txt', { encoding: 'utf8', flag: 'r' });

fs.unlinkSync('keyword.txt');

template = template.replace('<-KEYWORDS->', keywords);

fs.writeFileSync('queries/highlights.scm', template);
