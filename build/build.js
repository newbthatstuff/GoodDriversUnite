//const fs = require('fs');
import fs from 'fs';
//const path = require('path');
import path from 'path';

function removeWebBlocks(content) {
  const newContent = content.split(new RegExp('<!-- web-start -->', 'g')).map((part, index) => {
    if (index === 0) return part;
    if (part.indexOf('<!-- web-end -->') >= 0) {
      return part.split('<!-- web-end -->')[1];
    }
    return '';
  }).join('\n');

  return newContent
    .replace(/<!-- [a-z-]* -->\n/g, '\n')
    .replace(/([ ]{2,}\n)/g, '\n')
    .replace(/([\n]{2,})/g, '\n');
}

fs.rm('./cordova/www', { recursive: true, force: true }, (removeErr) => {
  if (removeErr) throw removeErr;
  fs.mkdirSync(path.resolve('cordova', 'www'), { recursive: true });
  
  fs.cp('./www', './cordova/www', { recursive: true }, (copyErr) => {
    if (copyErr) throw copyErr;
    
    const indexPath = path.resolve('cordova', 'www', 'index.html');
    const index = fs.readFileSync(indexPath, "utf8");
    
    let newIndex = index.replace(
      "<!-- CORDOVA_PLACEHOLDER_DONT_REMOVE -->",
      '<script src="cordova.js"></script>'
    );
    newIndex = removeWebBlocks(newIndex);
    fs.writeFileSync(indexPath, newIndex);
    
  });
});