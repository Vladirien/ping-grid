# ping-grid

## Description
Node.js app that allows you to visualize a machine's network stability through a colorful grid.
![alt tag](https://raw.githubusercontent.com/Vladirien/ping-grid/master/screencap.png)

## How to use
 * Make sure you have node.js installed (working with v6.1.2)
 * Extract the archive in a folder somewhere 
 * Go in that folder and run :
 ```
 npm install
 ```
 * If it all went well you can start the app with :
 ```
 node main.js
 ```
 * Once it's done you can view the grid through http://localhost:3342
 * You can edit values in **serverConfig.json** and **static/src/displayConfig.js** as you see fit for your needs

## TODO
* Edit display config from the web view
* Display average/median ping curves 
* Display more data on box hover (count) 
* Allow user to go back in time in the grid 
* Dockerfile 
