'use strict';

var request = require('request');

var edgeIn = [];
var nodes = [];
var edges = [];
var ether =  1000000000000000000;
var maxOut = 10;
var accounts = [];
var accountData = [];
var exchanges = ['0x57b174839cbd0a503b9dfcb655e4f4b1b47b3296', '0x70faa28a6b8d6829a4b1e649d26ec9a2a39ba413', '0x96fc4553a00c117c5b0bed950dd625d1c16dc894'];
var exchangeData = [];
var walkers = 0;
var lastRenew = 0;

function getTransaction(address, callback){
  var options = {
    port: 80,
    uri: 'http://api.etherscan.io/api?module=account&action=txlist&address=' + address + '&startblock=0&endblock=99999999&sort=asc',
    method: 'GET',
    json:true
  };

  request(options, function(error, response, body){
    if(error) console.log(error);
    else {
      walkers--;
      callback(body);
    }
  });
}


function walkOne(address, callback){
  walkers++;
  getTransaction(address, function(result){
    var newQueue = [];
    var transactions = result['result'];
    var out = 0;
    for(var j=0; j < transactions.length; j++){
      if(transactions[j].from === address){
        if(transactions[j].value > ether){
          out++;
          if(out > maxOut) break;
        }
      }
    }
    if(out > maxOut){
      exchanges.push(transactions[j].from);
      if(edgeIn.indexOf(address) < 0){
        edges.push({data: {id: address, weight: 0, label: "exchange", source: transactions[j].from, target: transactions[j].from}});
        edgeIn.push(address);
      }
      exchangeData.push({data: {address: transactions[j].from, value: transactions[j].value/ether}});
      callback(newQueue);
    } else {
      for(j=0; j < transactions.length; j++){
        if(transactions[j].from === address){
          if (newQueue.indexOf(transactions[j].to) < 0) {
            if(transactions[j].value > ether){
              if(exchanges.indexOf(transactions[j].to) < 0){
                newQueue.push(transactions[j].to);
              }else{
                if(edgeIn.indexOf(transactions[j].hash) < 0){
                  edges.push({data: {id: transactions[j].hash, weight: transactions[j].value/ether, label: 'exchange: '  + transactions[j].value/ether, source: transactions[j].from, target: transactions[j].to}});
                  edgeIn.push(transactions[j].hash);
                }
              }
              if(accounts.indexOf(transactions[j].to) < 0){
                nodes.push({data: { id: transactions[j].to, name: transactions[j].to}});
                accounts.push(transactions[j].to);
                accountData.push({data: {address: transactions[j].to, value: transactions[j].value/ether}});
              }
            }
          }

          if(transactions[j].value > ether){
            if(exchanges.indexOf(transactions[j].to) >= 0){
              if(edgeIn.indexOf(transactions[j].hash) < 0){
                edges.push({data: {id: transactions[j].hash, weight: transactions[j].value/ether, label: 'exchange: '  + transactions[j].value/ether, source: transactions[j].from, target: transactions[j].to}});
                edgeIn.push(transactions[j].hash);
              }
              exchangeData.push({data: {address: transactions[j].to, value: transactions[j].value/ether}});
            }else{
              if(edgeIn.indexOf(transactions[j].hash) < 0){
                edges.push({data: {id: transactions[j].hash, weight: transactions[j].value/ether, label: transactions[j].value/ether, source: transactions[j].from, target: transactions[j].to}});
                edgeIn.push(transactions[j].hash);
              }
            }
          }
        }
      }
      callback(newQueue);
    }
  });
}


function walkQueue(queue, depth, callback){
  for(var i = 0; i < queue.length; i++){
    walkOne(queue[i], function (newQueue) {
      callback(newQueue, depth, callback);
    });
  }
  
}

function walkAll(address, depth, _callback){
  nodes.push({data: { id: address, name: address}});
  walkOne(address, function(queue){
    depth--;
    if(depth > 0){
      walkQueue(queue, depth, function(newQueue, depth, callback){
        depth--;
        if(depth > 0 && newQueue.length > 0){
          walkQueue(newQueue, depth, callback);
        }
        _callback();
      });
    }
    _callback();
  });

}

exports.track = function(req, res) {
  walkers = 0;
  nodes = [];
  edges = [];
  accounts = [];
  accountData = [];
  exchangeData = [];
  var address = req.params.address.toLowerCase();
  var depth = req.params.depth;
  walkAll(address, depth, function() {
    if(walkers <= 0){
      console.log(accounts);
      var data = {elements: {nodes: nodes, edges: edges}, accounts: accountData, exchanges: exchangeData};
      res.json(data);
    }
  });
};

