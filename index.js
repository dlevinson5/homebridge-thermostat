var Service, Characteristic;
var request = require('sync-request');

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-thermostat", "homebridge-thermostat", HttpThermostat);
};

function HttpThermostat(log, config) {
    this.log = log;

    // url info
    this.thermostatService = null;
    this.power = false;
    this.currentHeatingCoolingState = 0;
    this.mintemp = this.f2c(60);
    this.maxtemp = this.f2c(100);
    this.targetTemperature = this.f2c(100);
    this.temperature = 0;
    this.url = config["url"];
    this.http_method = config["http_method"] || "GET";
    this.name = config["name"];
    this.manufacturer = config["manufacturer"] || "Fieldston Software";
    this.model = config["model"] || "DS18B20";
    this.serial = config["serial"] || "None";
    this.targetHeatingCoolingState = 0;
}

HttpThermostat.prototype = {

    getHumidity: function (callback) {
	    this.log("getHumidity");

        var res = request(this.http_method, this.url + "api/status", {});

        if (res.statusCode > 400) {
            this.log('HTTP function failed');
            callback();
        } else {
            this.log('HTTP function succeeded!');
            let info = JSON.parse(res.body);

            this.thermostatService.setCharacteristic(Characteristic.CurrentRelativeHumidity, info.humidity);

	        this.currentRelativeHumidity = info.humidity;

	        callback(null, this.currentRelativeHumidity);
        }
    },
    getTemperature: function (callback) {
	    this.log("getTemperature");

    	var res = request("GET", this.url + "api/status", {});

        if (res.statusCode > 400) {
            this.log('HTTP function failed');
            callback(error);
        } else {
            this.log('HTTP function succeeded!');
            let  info = JSON.parse(res.body);

            this.thermostatService.setCharacteristic(Characteristic.CurrentTemperature, info.temperature);

            this.temperature = info.temperature;

            callback(null, this.temperature);
	    }
    },
    getTargetTemperature: function(callback) {
	    this.log("getTargetTemperature = " + this.targetTemperature);
  	    callback(null, this.targetTemperature);
    },
    setTargetTemperature: function(value, callback) {

        this.log("setTargetTemperature");
        this.log(value);

        this.targetTemperature = value;
        var targetTemperatureF = this.c2f(value);
        this.log("target temp = " + targetTemperatureF);

        var payload = { json: { "temperature" : targetTemperatureF, "power": this.power ? 1 : 0 } };
        this.log(payload);

        var res = request("POST", this.url + "api/state", payload);

        if (res.statusCode > 400) {
            this.log('HTTP call function failed');
            callback(error);
        } else {
            this.log('HTTP call function succeeded!');

            this.targetTemperature = value;
            callback(null, value);
        }
    },
    getCurrentHeatingCoolingState : function(callback) { 

	    this.log("getCurrentHeatingCoolingState");

        var res = request("GET", this.url + "api/status", {});

        if (res.statusCode > 400) {
            this.log('HTTP function failed');
            callback();
        } else {
            this.log('HTTP function succeeded!');
            var info = JSON.parse(res.body);

            // this.log(res.body);
            // this.log(info);
            this.currentHeatingCoolingState = (info.power === 1 ? 2 : 0);

            // this.thermostatService.setCharacteristic(Characteristic.CurrentHeatingCoolingState, this.currentHeatingCoolingState);

            this.log(this.currentHeatingCoolingState);

            callback(null, this.currentHeatingCoolingState);
        }
    },
    getTargetHeatingCoolingState: function(callback) {
        this.log("getTargetHeatingCoolingState");
        this.log(this.currentHeatingCoolingState);
        callback(null, this.currentHeatingCoolingState);
    },
    setTargetHeatingCoolingState: function(value, callback) {

	    this.log("setTargetHeatingCoolingState");
	    this.log(value);

  	    this.power = (value === 2 || value === 3);

	    this.log("power " + this.power);
        this.log("temperature " + this.targetTemperature + " " + this.c2f(this.targetTemperature));

        var targetTemperatureF = this.c2f(value);
        var payload = { json: { "temperature" : targetTemperatureF, "power": this.power ? 1 : 0 } };
        this.log(payload);

        var res = request("POST", this.url + "api/state", payload);

        if (res.statusCode > 400) {
             this.log('HTTP call function failed');
             callback();
        } else {
             this.log('HTTP call function succeeded!');

             // var info = JSON.parse(res.body);
             // this.thermostatService.setCharacteristic(Characteristic.CurrentHeatingCoolingState, value);
             if (this.power) {
                 this.thermostatService.setCharacteristic(Characteristic.TargetTemperature, this.targetTemperature);
             }
          
	         // this.log(res.body);
             this.log(value);
             this.targetHeatingCoolingState = value;
             callback();
        }
    },
    identify: function (callback) {
        this.log("Identify requested!");
        callback(); // success
    },
    f2c: function(tempf) {
        return Math.round((tempf / (9/5)) - 32);
    },
    c2f: function(tempc) {
        return Math.round((tempc * (9/5)) + 32);
    },
    getServices: function () {

        this.log("getServices");

        var informationService = new Service.AccessoryInformation();

        informationService
                .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
                .setCharacteristic(Characteristic.Model, this.model)
                .setCharacteristic(Characteristic.SerialNumber, this.serial);

        this.thermostatService = new Service.Thermostat(this.name);

        this.thermostatService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .on('get', this.getTemperature.bind(this));

        this.thermostatService
                .getCharacteristic(Characteristic.CurrentRelativeHumidity)
                .on('get', this.getHumidity.bind(this));

        this.thermostatService.getCharacteristic(Characteristic.TargetTemperature)
                .on('get', this.getTargetTemperature.bind(this))
                .on('set', this.setTargetTemperature.bind(this));

        this.thermostatService.getCharacteristic(Characteristic.TargetTemperature)
              .setProps({
                  format: Characteristic.Formats.FLOAT,
                  unit: Characteristic.Units.FAHRENHEIT,
                  minValue: this.f2c(60),
                  maxValue: this.f2c(130),
                  minStep: 0.1
              });

        this.thermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
                .on('get', this.getCurrentHeatingCoolingState.bind(this));

        this.thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
                .on('get', this.getTargetHeatingCoolingState.bind(this))
                .on('set', this.setTargetHeatingCoolingState.bind(this));

        this.log("getServices set ");

        return [this.thermostatService, informationService];
    }
};
