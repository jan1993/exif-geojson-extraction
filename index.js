const fs = require('fs');
const exif = require('fast-exif');
const dms2dec = require('dms2dec');

const basePath = './data';

const images = fs.readdirSync(basePath);

async function readExifData() {
    var geojson = {
        "type": "FeatureCollection",
        "features": []
    }

    for (let idx = 0; idx < images.length; idx++) {
        const filename = images[idx];

        try {
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
            .read(basePath + "/" + filename)
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