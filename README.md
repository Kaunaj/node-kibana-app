# Kibana logs integration app

The app workflow is as follows:

-   First, on hitting an API, if there are any logs, they are pushed to a log file as configured. Bunyan has been used as the logging module.
-   The logstash service reads from the app log file and keeps pushing new logs to Elasticsearch.
-   We're able to view the logs on Kibana dashboard.

The provided setup is for MacOS, but should follow similar steps for Linux and Windows.

## Installation

Requires [Node.js](https://nodejs.org/)

Here are the links I used for installing the dependencies:

-   [ElasticSearch from archive](https://www.elastic.co/guide/en/elasticsearch/reference/current/targz.html)
-   [Kibana from archive](https://www.elastic.co/guide/en/kibana/current/install.html)
-   [Logstash from available binaries](https://www.elastic.co/downloads/logstash)

Run the following commands to clone the repo and install its dependencies.

```sh
git clone git@github.com:Kaunaj/node-kibana-app.git
cd node-kibana-app
npm i
```

## Setup

Copy contents of `.env-example` file to `.env` and change values as needed.

### .env for development

```
APP_NAME=node-kibana-app
PORT=9000
IP=127.0.0.1
LOGS_DIR_BASE_PATH=/absolute/path/to/your/app/logs/directory
```

-   `APP_NAME`: A suitable name for your app
-   `PORT`: Port on which the server should listen
-   `IP`: IP Address for starting the server
-   `LOGS_DIR_BASE_PATH`: The base path to the directory where you want the logs to be saved

### Elasticsearch security options

For running locally, turn off the "secure" options in the Elasticsearch config file.

```sh
cd /path/to/installed/elasticsearch/directory
cd config
nano elasticsearch.yml
```

After opening the config file, scroll down to the Security section and change all `enabled` values to `false` as shown below.

```sh
...
#----------------------- BEGIN SECURITY AUTO CONFIGURATION -----------------------
#
# The following settings, TLS certificates, and keys have been automatically
# generated to configure Elasticsearch security features on 04-03-2023 14:00:48
#
# --------------------------------------------------------------------------------

# Enable security features
xpack.security.enabled: false

xpack.security.enrollment.enabled: false

# Enable encryption for HTTP API client connections, such as Kibana, Logstash, and Agents
xpack.security.http.ssl:
  enabled: false
  keystore.path: certs/http.p12

# Enable encryption and mutual authentication between cluster nodes
xpack.security.transport.ssl:
  enabled: false
  verification_mode: certificate
  keystore.path: certs/transport.p12
  truststore.path: certs/transport.p12
...
```

## Deployment

Once the above changes are done, save and close the file, then run Elasticsearch.

```sh
cd /path/to/installed/elasticsearch/directory
./bin/elasticsearch
```

Similarly, run Kibana and go to the link provided in the console on successful startup.

```sh
cd /path/to/installed/kibana/directory
./bin/kibana
```

Follow the steps for configuration of Kibana and Elasticsearch provided in the docs.

Do the same thing for starting Logstash. Remember to change the logstash config file path depending on where you cloned the repository.

```sh
cd /path/to/installed/logstash/directory
./bin/logstash -f /path/to/node-kibana-app/logstash.conf
```

Finally, go to the app directory and start the app.

```sh
cd /path/to/node-kibana-app
node server.js
```

Now, on hitting the APIs in the app via Postman, you should be able to view the logs being pushed to the Kibana dashboard. By default, the logs are pushed to the data stream `logs-generic-default` for which you will need to add a data view on the dashboard.

The image below shows some sample logs in the dashboard.
![Kibana Dashboard View](https://user-images.githubusercontent.com/27547933/222968991-3b7c6c08-80e0-4023-9aea-d00c2206b281.png)
