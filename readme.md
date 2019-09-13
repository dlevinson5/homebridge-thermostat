# Homebridge Thermomemter Plugin 

Example config.json:

    {
      "accessories": [
          {
             "accessory": "homebridge-thermostat",
             "name": "ESP8266-DHT11",
             "url": "http://10.0.0.1/" 
          }
      ]
    }

This plugin acts as a proxy between HomeKit and a device that temperature using a simple http messaging protocol. This plugin was designed originally control a Friedrich Kuhl AC using a ESP8266 with a DHT11 for temperate and humidity and a IP transmitter for controlling AC functions. 
 
