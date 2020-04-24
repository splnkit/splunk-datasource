# T-Mobile  - "Grafana Connector" (FDSE-429)

This is a custom datasource plugin to connect Splunk to Grafana.
## Description of the request
__What?__ 
Building a Splunk plugin for Grafana - Grafana has a well-documented system for writing plugins that connect to different data stores. We’d like to provide a plugin so that customers can leverage the metrics data that they have in Splunk until the Splunk Metrics usability experience improves enough to meet customer expectations.  There are a ton of existing examples of plugins for other backends (one comprehensive example being InfluxDB: https://github.com/grafana/grafana/tree/master/public/app/plugins/datasource/influxdb). An FDSE could take an existing plugin and modify it to talk to Splunk’s rest API and run mstats queries. Grafana plugins are written in TypeScript, which is just Javascript with some additional features.

__When?__ 
Estimated week and a half of work. Roughly a week of development to have a working plugin, and an additional couple of days for cleanup and feature completeness. Sooner the better, but would be ideal if we could have it done by the end of August.

## Solution
This is a custom plugin developed to connect Splunk and Grafana. It uses __Splunk's REST API__ to fetch data.

#### Installation Steps
1. You can clone the repository to your plugins folder: `/var/lib/grafana/plugins` or `data/plugins` (relative to grafana git repo if you’re running development version from source dir).
2. If you are not cloning the repository, copy the folder to the locations mentioned above (depends on the user's grafana location).
3. Navigate to the folder using your terminal and run the following commands:
    ```
    $ npm install
    $ npm run build
    $ brew services restart grafana
    ```
    The third command can change according to the user's Grafana installation. If you used homebrew to install grafana, the third command would work for you.
4. Once Grafana restarts, you can see the Splunk JSON plugin under `Others` when you try to add a new datasource (Click the gear icon on the left > Datasource > Scroll to the bottom)
    ![Splunk Plugin installed](plugin_installed.png). 

#### Configuring the Plugin
1. Go to the configuration page (Click the gear icon on the left > Datasource > Scroll to the bottom)
2. Click on the green button which says `Select`.
3. Fill up the details as needed. 
    - Make sure to select `Server(Default)` for _Access_ and check _Basic Auth_ and _Skip TLS Verify_.
4. Checking _Basic Auth_ would pop up 2 new input fields to enter your Splunk Instance details.
5. Clicking on `Save & Test` would check the connection with the Splunk server.

Example Configuration for a localhost Splunk server running on `localhost:8096`:
![Splunk Plugin Configuration](plugin_configuration.png)

#### Using the Pugin
1. Create a dashboard panel by clicking to the __+__ symbol on the left > `Dashboard`.
2. Click on Choose Visualization and choose table.
3. Click on the Metrics symbol on the left (just above the highlighted option for Visualization) ![Metrics Symbol](metrics_symbol.png)
4. Choose Splunk JSON configuration from the dropdown and write the query inside the SPL Query box. After you press enter, data will be fetched from the Splunk server (if the data is huge, please keep patience or press the refresh button on the top right).
5. Open to your creativity now!

Example Metrics Panel that can added to a dashboard:
![Panel Example](panel_example.png)

#### Troubleshooting
For troubleshooting, please see the errors being posted on the console.

