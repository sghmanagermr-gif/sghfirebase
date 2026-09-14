const https = require('https');

function fetchDoc(collection) {
    return new Promise((resolve, reject) => {
        const url = `https://firestore.googleapis.com/v1/projects/sgh-merida/databases/(default)/documents/${collection}?pageSize=1`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', err => reject(err));
    });
}

async function run() {
    try {
        const personal = await fetchDoc('cargos_personal');
        const planteles = await fetchDoc('planteles');
        
        console.log("=== CARGOS PERSONAL ===");
        if (personal.documents && personal.documents.length > 0) {
            console.log(JSON.stringify(personal.documents[0].fields, null, 2));
        } else {
            console.log("No documents found in cargos_personal");
        }

        console.log("\n=== PLANTELES ===");
        if (planteles.documents && planteles.documents.length > 0) {
            console.log(JSON.stringify(planteles.documents[0].fields, null, 2));
        } else {
            console.log("No documents found in planteles");
        }
    } catch(e) {
        console.error(e);
    }
}

run();
