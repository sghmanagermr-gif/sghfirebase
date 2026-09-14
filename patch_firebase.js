const fs = require('fs');

const firebaseJson = `{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}`;

const firebaserc = `{
  "projects": {
    "default": "sgh-merida"
  }
}`;

fs.writeFileSync('C:\\Proyectos\\sgh-2.0\\frontend\\firebase.json', firebaseJson, 'utf8');
fs.writeFileSync('C:\\Proyectos\\sgh-2.0\\frontend\\.firebaserc', firebaserc, 'utf8');
console.log('Archivos de configuracion de Firebase creados.');
