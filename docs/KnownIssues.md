* ***Important***: DO NOT USE CORS IN THE BACKEND! It will mess up the ddClientRequests. 

* Not all of the backend endpoints are being used currently as they were not built out on the frontend
* The Configuration Tab currently only reads and writes to the database, need both update and delete
* The purpose of the Configuration Tab is to configure Prometheus endpoints that the app can scrape. This needs to be set up on the backend. When an endpoint is added to the configuration database, a .yml file needs to be generated for the new endpoint (see the imageConfigs/prometheus/prometheus.yml on how this file looks). The prometheus container then must be reloaded pointing to the new configuration file. This should allow prometheus to scrape from this new config file. 