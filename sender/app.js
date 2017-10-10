const noble = require('noble');
const fs = require('fs');
const async = require('async');

const SERVICE_ID = "c5e27eaca880474b9999d4552254c624";
const CHARACTER_ID = "99999A44-4D6F-1226-9C60-0050E4C00067";


noble.on('stateChange', (state) => {

    console.log(`Bluetooth state: ${state}`);

    if (state !== "poweredOn") {
        return
    }

    noble.startScanning([], false, (error) => {
        if (error != null) {
            console.log(error.message)
        }
    });

    noble.on('discover', (peripheral) => {
        console.log(`found peripheral - id: ${peripheral.id}, name: ${peripheral.advertisement.localName}`);

        if (peripheral.id === SERVICE_ID) {

            peripheral.connect((error) => {
                if (error != null) {
                    console.log(error.message)
                } else {
                    console.log(`connected to: ${peripheral.id} `);
                    console.log('Stopped scanning for devices');
                    noble.stopScanning();

                    peripheral.discoverAllServicesAndCharacteristics((error, services, characteristics) => {

                        var regex = new RegExp("-", 'g');

                        let characteristic = characteristics.find(characteristic => {
                            let compareCharacterId = CHARACTER_ID.toLowerCase().replace(regex, "");
                            return characteristic.uuid === compareCharacterId
                        });

                        if (!characteristic) {
                            console.log('Specified characteristic not found');
                        } else {
                            console.log('Specified characteristic found, started sending data.');
                            sendImage(characteristic)
                        }
                    });
                }
            })
        }

    });

});

function sendImage(characteristic) {
    fs.readFile('../file.txt', 'utf8', (err, data) => {
        if (err) throw err;

        let array = data.split('\n');

        let queue = async.queue(function(task, callback) {
            console.log(`sending buffer: ${task.buffer.toString()}`);

            characteristic.write(task.buffer, false, (error) => {
                if(error == null) {
                    if(task.location === array.length) {
                        characteristic.write(Buffer.from('DONE'), false, () => {});
                        console.log('File has successfully been send');
                    }
                    callback();
                } else {
                    console.log('Last done packet failed');
                    callback(error);
                }
            })
        }, 1);


        let dataLength = array.length;
        let lengt_block = 20;
        let loc = 0;

        while (loc < dataLength) {
            let rmdr = dataLength - loc;

            if (rmdr <= lengt_block) {
                lengt_block = rmdr
            }

            let buffer = new Buffer(lengt_block);

            for(let i = 0; lengt_block > i; i++)  {
                buffer.writeUInt8(array[loc + i], i);
            }

            loc += lengt_block;

            queue.push({
                buffer : buffer,
                location : loc
            });


        }
    })
}