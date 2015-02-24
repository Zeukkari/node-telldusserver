# node-telldusserver
A home control server for Telldus devices (e.g. TellStick and TellStick Duo).

This is a home control server built around TellStick Duo and a couple of Nexa switches and a dimmer.
It's primary purpose is to provide a simple web interface to various light switches around the house
and enable easy integration to a variety of client interfaces, such as voice control or hand gesture 
control. 


Features
--------

- A REST HTTP API to Telldus devices. Currently supports switches and dimmers.
- A web client with live sync.
- OAuth2 support.
- A custom remote for the Unified Remote app ( http://www.unifiedremote.com ).