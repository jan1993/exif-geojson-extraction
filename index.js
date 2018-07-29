const fs = require('fs');
const exif = require('fast-exif');
const dms2dec = require('dms2dec');

// const basePath = 'J:/01_Foto/02_Reisen/2018/02_NYC/Jan';
const basePath = './data';

const images = fs.readdirSync(basePath);

async function readExifData() {
    var geojson = {
        "type": "FeatureCollection",
        "features": []
    }

    for (let idx = 0; idx < images.length; idx++) {
        const filename = images[idx];
        if(filename.indexOf('.NEF') == -1){
            continue;
        }
        try {
            console.log(filename);
            let exif = await readExif(basePath, filename);
            geojson
                .features
                .push(exif.geojson);
        } catch (e) {
            console.error(e);
        }
    }
    return geojson;
}


async function writeGeojson() {
    const geojson = await readExifData();
    fs.writeFileSync("./output/images.json", JSON.stringify(geojson));
}

function readExif(basePath, filename) {
    return new Promise((resolve, reject) => {
        exif
            .read(basePath + "/" + filename, true)
            .then((exif) => {
                if (!exif) 
                    reject("Exif data could not be read");
                if (!exif.gps) 
                    reject("Exif data does not contain gps data");
                if (!exif.gps.GPSLatitude || !exif.gps.GPSLongitude) 
                    reject("Exif gps data does not contain Lat / Lng");
                
                let dmsGPS = exif.gps;
                let decGPS = dms2dec(dmsGPS.GPSLatitude, dmsGPS.GPSLatitudeRef, dmsGPS.GPSLongitude, dmsGPS.GPSLongitudeRef);
                let geojson = {
                    type: "Feature",
                    properties: {
                        fíle: filename,
                        lat: decGPS[0],
                        lng: decGPS[1]
                        // exif: exif.exif, image: exif.image
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: decGPS.reverse()
                    }

                };
                exif.decGPS = decGPS;
                exif.geojson = geojson;
                resolve(exif);
            })
            .catch((err) => {
                reject(err);
            });
    })
}

writeGeojson();