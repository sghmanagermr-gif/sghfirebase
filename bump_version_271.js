const fs = require('fs');

function bumpVersion(filePath, targetRegex, replacement) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (targetRegex.test(content)) {
            content = content.replace(targetRegex, replacement);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Bumped version in ' + filePath);
        } else {
            console.log('Regex no match in ' + filePath);
        }
    } else {
         console.log('File not found: ' + filePath);
    }
}

// 1. package.json
bumpVersion(
    'C:\\Proyectos\\sgh-2.0\\frontend\\package.json',
    /"version": "2.7.0"/g,
    '"version": "2.7.1"'
);

// 2. index.html
bumpVersion(
    'C:\\Proyectos\\sgh-2.0\\frontend\\index.html',
    /v2\.7\.0/g,
    'v2.7.1'
);

