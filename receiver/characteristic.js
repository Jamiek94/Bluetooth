var util = require('util');

var fs = require('fs')

var bleno = require('bleno');

var BlenoCharacteristic = bleno.Characteristic;

var EchoCharacteristic = function() {
    EchoCharacteristic.super_.call(this, {
        uuid: 'ec0e',
        properties: ['read', 'write', 'notify'],
        value: null
    });

    this.buffer = [];
    this._value = new Buffer(0);
};

util.inherits(EchoCharacteristic, BlenoCharacteristic);

EchoCharacteristic.prototype.onReadRequest = function(offset, callback) {
    console.log('EchoCharacteristic - onReadRequest: value = ' + this._value);

    callback(this.RESULT_SUCCESS, this._value);
};

EchoCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
    this._value = data;

    console.log(this._value);

    if(this._value.toString() !== "DONE") {
        for(let index = 0; data.length > index; index ++) {
            let readValue = data.readUInt8(index);
            this.buffer.push(readValue);
        }
    }
    else {
        console.log('received done sending request');

        fs.writeFile('../file.txt', this.buffer.join("\n"), (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    }

    callback(this.RESULT_SUCCESS);
};


EchoCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
    console.log('EchoCharacteristic - onSubscribe');

    this._updateValueCallback = updateValueCallback;
};

EchoCharacteristic.prototype.onUnsubscribe = function() {
    console.log('EchoCharacteristic - onUnsubscribe');

    this._updateValueCallback = null;
    this.buffer = [];
    this._value = new Buffer(0);
};

module.exports = EchoCharacteristic;