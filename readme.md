# Homebridge Thermomemter Plugin 

Example config.json:

    {
      "accessories": [
          {
             "accessory": "homebridge-thermostat.Thermostat",
             "name": "Kuhl-LivingRoom",
             "url": "http://192.168.1.46/" 
          }
      ]
    }

This plugin acts as a proxy between HomeKit and a device that temperature using a simple http messaging protocol. This plugin was designed originally control a Friedrich Kuhl AC using a ESP8266 with a DHT11 for temperate and humidity and a IP transmitter for controlling AC functions. 
 
# installation 

1. Copy the project files into `/usr/local/lib/node_modules/homebridge-thermostat`

2. Run `npm install` from `/usr/local/lib/node_modules/homebridge-thermostat`

