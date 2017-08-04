// get exported json from cytoscape desktop via ajax

var address = "0xb3764761e297d6f121e79c32a65829cd1ddb4d32";

$(function(){

  function getTransaction(address, callback){
    var transactions = $.ajax({
      url: 'http://api.etherscan.io/api?module=account&action=txlist&address=' + address + '&startblock=0&endblock=99999999&sort=asc', // transactions
      type: 'GET',
      dataType: 'json',
      success: callback
    });
  }

  var transactions = getTransaction(address);

  var ether =  1000000000000000000;
  var depth =  3;

  var nodes = [{data: { id: address, name: address}}];
  var edges = [];


  function walkerOne(address, callback){
    getTransaction(address, function(result){
      var queueAddresses = [];
      transactions = result['result'];
      for(j=0; j < transactions.length; j++){
        if(transactions[j].from === address){
          if (queueAddresses.indexOf(transactions[j].to) >= 0) {
          }else{
            if(transactions[j].value > ether){
              queueAddresses.push(transactions[j].to);
              nodes.push({data: { id: transactions[j].to, name: transactions[j].to}})
            }
          }
          if(transactions[j].value > ether){
            edges.push({data: {id: transactions[j].hash, weight: transactions[j].value/ether, source: transactions[j].from, target: transactions[j].to}});
            console.log(transactions[j]);
          }
        }
      }
      callback(queueAddresses);
    });
  }


  function walkerQueue(queue, depth, callback){
    for(i = 0; i < queue.length; i++){
      walkerOne(queue[i], function(newQueue){
          callback(newQueue, depth, callback);
      });
    }
  }

  function walkerAll(address, depth, initCy){
    walkerOne(address, function(queue){
      depth--;
      if(depth > 0){
        walkerQueue(queue, depth, function(newQueue, depth, callback){
          depth--;
          if(depth > 0 && newQueue.length > 0){
            walkerQueue(newQueue, depth, callback);
          }
          if(depth == 0){
            initCy();
          }
        });
      }
    });

  }

  walkerAll(address, depth, initCy);

  // when both graph export json and style loaded, init cy

  function initCy(){
    var cy = cytoscape({
      container: document.querySelector('#cy'),

      boxSelectionEnabled: false,
      autounselectify: true,

      style: cytoscape.stylesheet()
          .selector('node')
          .css({
            'content': 'data(name)',
            'text-valign': 'center',
            'color': 'white',
            'text-outline-width': 2,
            'background-color': '#999',
            'text-outline-color': '#999'
          })
          .selector('edge')
          .css({
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#ccc',
            'line-color': '#ccc',
            'width': 1
          })
          .selector(':selected')
          .css({
            'background-color': 'black',
            'line-color': 'black',
            'target-arrow-color': 'black',
            'source-arrow-color': 'black'
          })
          .selector('.faded')
          .css({
            'opacity': 0.25,
            'text-opacity': 0
          }),

      elements: {
        nodes: nodes,
        edges: edges
      },

      layout: {
        name: 'grid',
        padding: 10
      }
    });

    cy.on('tap', 'node', function(e){
      var node = e.cyTarget;
      var neighborhood = node.neighborhood().add(node);

      cy.elements().addClass('faded');
      neighborhood.removeClass('faded');
    });

    cy.on('tap', function(e){
      if( e.cyTarget === cy ){
        cy.elements().removeClass('faded');
      }
    });





    //var cy = window.cy = cytoscape({
    //  container: document.getElementById('cy'),
    //  layout: { name: 'preset' },
    //  style: styleJson,
    //  elements: elements,
    //  motionBlur: true,
    //  selectionType: 'single',
    //  boxSelectionEnabled: false
    //});

    //mendData();
    //bindRouters();
  }

});



