var Service, Characteristic;
var request = require('sync-request');

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-thermostat-ex", "Thermostat", HttpThermostat);
    // homebridge.registerAccessory("homebridge-thermostat", "homebridge-thermostat", HttpThermostat);
};

function HttpThermostat(log, config) {
    this.log = log;

    this.thermostatService = null;
    this.power = false;
    this.currentHeatingCoolingState = 0;
    this.mintemp = this.f2c(60);
    this.maxtemp = this.f2c(100);
    this.targetTemperature = 0;
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
	    this.log("[getHumidity] => Invoke");

        var res = null;
        try {
            res = request(this.http_method, this.url + "api/status", {});
        } catch (err) {
            this.log(err.message);
        }

        if (res == null || res.statusCode > 400) {
            this.log('[getHumidity] => HTTP function failed');
            callback();
        } else {

            let info = JSON.parse(res.body);

            this.thermostatService.setCharacteristic(Characteristic.CurrentRelativeHumidity, info.humidity);
	        this.currentRelativeHumidity = info.humidity;

            this.log("[getHumidity] => result  = " + this.currentRelativeHumidity);
	        callback(null, this.currentRelativeHumidity);
        }
    },
    getTemperature: function (callback) {
	    this.log("[getTemperature] => Invoke");

	var res = null;

	try {
    	    res = request("GET", this.url + "api/status", {});
	} catch (err) {
	    this.log(err.message);
        }

        if (res == null || res.statusCode > 400) {
            this.log('[getTemperature] => HTTP function failed');
            callback();
        } else {

            let  info = JSON.parse(res.body);
            this.temperature = info.temperature;

            if (this.targetTemperature === 0)
                this.targetTemperature = this.temperature;

            this.log("[getTemperature] => result = " + this.temperature);
            callback(null, this.temperature);
	    }
    },
    getTargetTemperature: function(callback) {
	    this.log("[getTargetTemperature] => Invoke");
        this.log("[getTargetTemperature] result = [" + this.targetTemperature + "c] (" + this.c2f(this.targetTemperature) + "f]");
  	    callback(null, this.targetTemperature);
    },
    setTargetTemperature: function(value, callback) {

        this.log("[setTargetTemperature] Invoke (" + this.formatTemp(value) + ")");

        this.targetTemperature = value;
        let targetTemperatureF = parseInt(this.c2f(value));
        this.log("[setTargetTemperature] => " + targetTemperatureF + "f");

        let payload = { json: { "temperature" : targetTemperatureF, "power": this.power ? 1 : 0 } };
        this.log(payload);

        let res = request("POST", this.url + "api/state", payload);

        if (res.statusCode > 400) {
            this.log('[setTargetTemperature] => HTTP call function failed');
            callback(error);
        } else {
            this.targetTemperature = value;
            this.log("[setTargetTemperature] => result = " + this.targetTemperature);
            callback(null, value);
        }
    },
    getCurrentHeatingCoolingState : function(callback) { 

	this.log("[getCurrentHeatingCoolingState] => Invoke");

	var res = null;

	try {
            res = request("GET", this.url + "api/status", {});
	} catch (err) {
	    this.log(err.message);
        }

        if (res == null || res.statusCode > 400) {
            this.log('[getCurrentHeatingCoolingState] => HTTP function failed');
            callback();
        } else {
            let info = JSON.parse(res.body);

            this.thermostatService.setCharacteristic(Characteristic.CurrentTemperature, info.temperature);

            this.log("[getCurrentHeatingCoolingState] => result = " + this.currentHeatingCoolingState);
            callback(null, this.currentHeatingCoolingState);
        }
    },
    getTargetHeatingCoolingState: function(callback) {
        this.log("[getTargetHeatingCoolingState] => Invoke");
        this.log("[getTargetHeatingCoolingState] result = " + this.targetHeatingCoolingState);
        callback(null, this.targetHeatingCoolingState);
    },
    setTargetHeatingCoolingState: function(value, callback) {

	this.log("[setTargetHeatingCoolingState] =>  (" + value + ")");

  	this.power = (value === 2 || value === 3);

	this.log("[setTargetHeatingCoolingState] => Power = " + this.power);

        let targetTemperatureF = this.c2f(this.targetTemperature);
        let payload = { json: { "temperature" : targetTemperatureF, "power": this.power ? 1 : 0 } };
        this.log(payload);

	var res = null;
	try {
            res = request("POST", this.url + "api/state", payload);
	} catch (err) {
	    this.log(err.message);
        }

        if (res == null || res.statusCode > 400) {
              this.log('[setTargetHeatingCoolingState] => HTTP call function failed');
              callback();
        } else {
              this.targetHeatingCoolingState = value;
              this.thermostatService.setCharacteristic(Characteristic.TargetTemperature, this.targetTemperature);
              this.thermostatService.setCharacteristic(Characteristic.CurrentRelativeHumidity, this.currentRelativeHumidity);
              this.thermostatService.setCharacteristic(Characteristic.CurrentTemperature, this.temperature);
              this.log("[setTargetHeatingCoolingState] => result = " + this.targetHeatingCoolingState);
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
    formatTemp: function(tempc) {
        return tempc + "c (" + this.c2f(tempc) + "f)"
    },
    getServices: function () {

        this.log("[getServices] => Invoke");

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
                .on('set', this.setTargetTemperature.bind(this))
                .setProps({
                    value: this.targetTemperature
                });

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

        return [this.thermostatService, informationService];
    }
};
