/**
 * @file hmi.js
 * @author Oliver Merkel <Merkel(dot)Oliver(at)web(dot)de>
 * @date 2016 February 26
 *
 * @section LICENSE
 *
 * Copyright 2016, Oliver Merkel <Merkel(dot)Oliver(at)web(dot)de>
 * All rights reserved.
 *
 * Released under the MIT license.
 *
 * @section DESCRIPTION
 *
 * @brief Class Hmi.
 * 
 * Class representing the view or Hmi of Alquerque.
 * This Alquerque board game is used for demonstration of the
 * Monte Carlo Tree Search (MCTS) with UCB (Upper Confidence Bounds)
 * applied to trees (UCT in short) for the computer player AI.
 *
 */

function Hmi() {}

Hmi.FILEBOARD = 'img/board.jpg';
Hmi.FILEBOARDNOTATION = 'img/algebraic_notation.jpg';
Hmi.FILEDARK = 'img/dark_normal.png';
Hmi.FILELIGHT = 'img/light_normal.png';

Hmi.prototype.resize = function () {
  var offsetHeight = 64,
    availableWidth = window.innerWidth - 32,
    availableHeight = window.innerHeight - offsetHeight;
  var size = Math.min(availableWidth, availableHeight);
  this.paper.setSize( size, size );

  $('#game-page').css({
    'background-size': 'auto ' + (size/6) + 'px',
  });
  var size = size / 10;
  var minSize = 38;
  size = size < minSize ? minSize : size;
  $('#customMenu').css({
    'width': size+'px', 'height': size+'px',
    'background-size': size+'px ' + size+'px',
  });
  $('#customBackRules').css({
    'width': size+'px', 'height': size+'px',
    'background-size': size+'px ' + size+'px',
  });
  $('#customBackOptions').css({
    'width': size+'px', 'height': size+'px',
    'background-size': size+'px ' + size+'px',
  });
  $('#customBackAbout').css({
    'width': size+'px', 'height': size+'px',
    'background-size': size+'px ' + size+'px',
  });
};

Hmi.prototype.initBoard = function () {
  this.paper = Raphael( 'board', 400, 400);
  this.paper.setViewBox( 0, 0, 6, 6, false );
  this.boardAlgebraicNotation = this.paper.image( Hmi.FILEBOARDNOTATION, 0, 0, 6, 6);
  this.boardWithoutNotation = this.paper.image( Hmi.FILEBOARD, 0, 0, 6, 6);
  this.field = [];
  for(var x=0; x<5; ++x) {
    this.field[x] = [];
    for(var y=0; y<5; ++y) {
      var i = 2>y ? Hmi.FILELIGHT : 2<y ? Hmi.FILEDARK :
        2<x ? Hmi.FILELIGHT : 2>x ? Hmi.FILEDARK : null;
      var p = { x: x, y: y };
      this.field[x][y] = i ?
        this.setPieceAt( i, p ) : this.clearFieldAt( p );
    }
  };
  this.action = null;
};

Hmi.prototype.clearFieldAt = function ( p ) {
  if( this.field[p.x][p.y] ) this.field[p.x][p.y].remove();
  var result = this.paper.rect( p.x + 0.5, 4.5 - p.y, 1, 1 );
  result.attr({ 'stroke': 'none', fill: 'red', opacity: '0.0' });
  return result;
};

Hmi.prototype.setPieceAt = function ( type, p ) {
  if( this.field[p.x][p.y] ) this.field[p.x][p.y].remove();
  return this.paper.image( type, p.x + 0.5, 4.5 - p.y, 1, 1 );
};

Hmi.prototype.restoreInitialBoard = function () {
  for(var x=0; x<5; ++x) {
    for(var y=0; y<5; ++y) {
      var i = 2>y ? Hmi.FILELIGHT : 2<y ? Hmi.FILEDARK :
        2<x ? Hmi.FILELIGHT : 2>x ? Hmi.FILEDARK : null;
      var p = { x: x, y: y };
      this.field[x][y] = i ?
        this.setPieceAt( i, p ) : this.clearFieldAt( p );
    }
  };
};

Hmi.prototype.update = function(board, actionInfo) {
  this.resize();
  var showAlgebraicNotation = $('#showalgebraicnotation').is(':checked');
  if (showAlgebraicNotation) {
    this.boardAlgebraicNotation.show();
    this.boardWithoutNotation.toBack();
  } else {
    this.boardAlgebraicNotation.hide();
    this.boardAlgebraicNotation.toBack();
  }
  this.board = board;
  if(actionInfo) {
    var f = actionInfo.action.from;
    var t = actionInfo.action.to;
    console.log("Animate " + actionInfo.action.type + ' ' +
      String.fromCharCode(97+f.x) + ( f.y + 1) +
      String.fromCharCode(97+t.x) + ( t.y + 1));
    var tmp = this.field[t.x][t.y];
    this.field[t.x][t.y] = this.field[f.x][f.y];
    this.field[f.x][f.y] = tmp;
    this.animationActionInfo = actionInfo;
    
    this.field[t.x][t.y].toFront();
    this.field[t.x][t.y].animate({ x: t.x + 0.5 - 0.15, y: 4.5 - t.y - 0.15,
      width: 1 + 0.3,  height: 1 + 0.3 }, 600, this.animateStep1.bind(this)
    );
    // this.renderStatus(board, actionInfo);
    
  } else {
    if( board.nextishuman ) {
      this.prepareHumanMove();
    } else if ( 0 < board.actions.length ) {
      this.requestAiAction();
    }
  }
};

Hmi.prototype.animateStep1 = function() {
  var a = this.animationActionInfo.action.to;
  this.field[a.x][a.y].animate({ x: a.x + 0.5, y: 4.5 - a.y,
    width: 1,  height: 1 }, 300, this.animateStep2.bind(this)
  );
};

Hmi.prototype.animateStep2 = function() {
  var action = this.animationActionInfo.action;
  if( 'jump' == action.type ) {
    this.field[action.over.x][action.over.y].remove();
    this.field[action.over.x][action.over.y] =
      this.clearFieldAt( action.over );
  }
  this.field[action.from.x][action.from.y].attr({
    x: action.from.x + 0.5, y: 4.5 - action.from.y});
  if( this.board.nextishuman ) {
    this.prepareHumanMove();
  } else if ( 0 < this.board.actions.length ) {
    this.requestAiAction();
  }
};

Hmi.prototype.prepareHumanMove = function () {
  var showAvailableMove = $('#showavailablemove').is(':checked');
  var actions = this.board.actions;
  for(var i=0; i<actions.length; ++i) {
    var field = this.field[actions[i].from.x][actions[i].from.y];
    if(showAvailableMove) {
      console.log(actions[i].from.x + '' + actions[i].from.y);
      
    };
    field.click( this.clickSelect.bind(this) );
  }
};

Hmi.prototype.requestAiAction = function () {
  /* @TODO: disable 'new game' */
  var playerWhite = $('#playerwhiteai').is(':checked') ? 'AI' : 'Human';
  var playerBlack = $('#playerblackai').is(':checked') ? 'AI' : 'Human';
  var invertLast = $('#invertLast').is(':checked');
  this.engine.postMessage({ class: 'request', request: 'actionbyai',
    playerwhite: playerWhite, playerblack: playerBlack,
    invertlast: invertLast });
};

Hmi.prototype.clickSelect = function ( ev ) {
  this.deactivateSelectAction();
  this.action = { from: { x: Math.floor(Number(ev.target.attributes.x.value)),
    y: 4 - Math.floor(Number(ev.target.attributes.y.value)) },
    to: { x: -1, y: -1 } };
  this.activateSelectAction();
};

Hmi.prototype.unbindAllEvents = function ( elem ) {
  /*
   * elem.unclick( this.clickTarget.bind(this) ) not working
   */
  if (elem.events) {
    var n = elem.events.length;
    for(var j=0; j<n; ++j) {
      elem.events[j].unbind();
    }
    delete elem.events;
    console.log('- unbound ' + n + ' event(s) -');
  }
};

Hmi.prototype.isEqual= function ( src, tgt ) {
  return src.x == tgt.x && src.y == tgt.y;
};

Hmi.prototype.deactivateSelectAction = function () {
  if( this.action ) {
    var actions = this.board.actions;
    for(var i=0; i<actions.length; ++i) {
      var a = actions[i];
      if( this.isEqual( this.action.from, a.from ) ) {
        var target = this.field[a.to.x][a.to.y];
        this.unbindAllEvents( target );
      }
    }
  }
};

Hmi.prototype.activateSelectAction = function () {
  var showAvailableMove = $('#showavailablemove').is(':checked');
  console.log('Selected ' + String.fromCharCode( this.action.from.x + 97 ) +
    (this.action.from.y + 1));
  var actions = this.board.actions;
  for(var i=0; i<actions.length; ++i) {
    var a = actions[i];
    if( this.isEqual( this.action.from, a.from ) ) {
      if(showAvailableMove) {
        console.log( 'Possible ' + a.type + ' from ' +
          String.fromCharCode( a.from.x + 97 ) + (a.from.y + 1) +
          ' to ' + String.fromCharCode( a.to.x + 97 ) + (a.to.y + 1));
      };
      var target = this.field[a.to.x][a.to.y];
      target.click( this.clickTarget.bind(this) );
    }
  }
};

Hmi.prototype.clickTarget = function ( ev ) {
  this.action.to = { x: Math.floor(Number(ev.target.attributes.x.value)),
    y: 4 - Math.floor(Number(ev.target.attributes.y.value)) };
  var actions = this.board.actions;
  for(var i=0; i<actions.length; ++i) {
    var a = actions[i];
    if( this.isEqual( this.action.from, a.from ) && this.isEqual( this.action.to, a.to ) ) {
      this.action.type = a.type;
      if( 'jump' == a.type ) {
        this.action.over = { x: a.over.x, y: a.over.y };
      }
    }
  }
  console.log( 'Chosen ' + this.action.type + ' from ' +
    String.fromCharCode( this.action.from.x + 97 ) + ( this.action.from.y + 1) +
    ' to ' + String.fromCharCode( this.action.to.x + 97 ) + ( this.action.to.y + 1));
  for(var x=0; x<5; ++x) {
    for(var y=0; y<5; ++y) {
      var field = this.field[x][y];
      this.unbindAllEvents( field );
    }
  }
  var playerWhite = $('#playerwhiteai').is(':checked') ? 'AI' : 'Human';
  var playerBlack = $('#playerblackai').is(':checked') ? 'AI' : 'Human';
  var invertLast = $('#invertLast').is(':checked');

  this.engine.postMessage({ class: 'request', request: 'perform',
    action: this.action,
    playerwhite: playerWhite, playerblack: playerBlack,
    invertlast: invertLast });
};

Hmi.prototype.engineInit = function() {
  var playerWhite = $('#playerwhiteai').is(':checked') ? 'AI' : 'Human';
  var playerBlack = $('#playerblackai').is(':checked') ? 'AI' : 'Human';
  var invertLast = $('#invertLast').is(':checked');

  this.engine = new Worker('js/controller.js');
  this.engine.addEventListener('message', this.engineEventListener.bind(this), false);
  this.engine.postMessage({ class: 'request', request: 'start',
    playerwhite: playerWhite, playerblack: playerBlack,
    invertlast: invertLast });
};

Hmi.prototype.init = function () {
  this.initBoard();
  var $window = $(window);
  $window.resize( this.resize.bind( this ) );
  $window.resize();
  this.engineInit();
  $('#new').on( 'click', this.restart.bind(this) );
};

Hmi.prototype.deactivateClicks = function() {
  console.log('@TODO: deactivateClicks');
};

Hmi.prototype.restart = function() {
  this.deactivateClicks();
  var playerWhite = $('#playerwhiteai').is(':checked') ? 'AI' : 'Human';
  var playerBlack = $('#playerblackai').is(':checked') ? 'AI' : 'Human';
  var invertLast = $('#invertLast').is(':checked');

  this.engine.postMessage({ class: 'request', request: 'restart',
    playerwhite: playerWhite, playerblack: playerBlack,
    invertlast: invertLast });
};

Hmi.prototype.engineEventListener = function( eventReceived ) {
  var data = eventReceived.data;
  switch (data.eventClass) {
    case 'response':
      this.processEngineResponse( eventReceived );
      break;
    case 'request':
      this.processEngineRequest( eventReceived );
      break;
    default:
      console.log('Engine used unknown event class');
  }
};

Hmi.prototype.processEngineResponse = function( eventReceived ) {
  var data = eventReceived.data;
  switch (data.state) {
    case 'message':
      console.log('Engine reported message: ' + data.message);
      break;
    default:
      console.log('Engine reported unknown state');
  }
};

Hmi.prototype.processEngineRequest = function( eventReceived ) {
  var data = eventReceived.data;
  switch (data.request) {
    case 'redraw':
      console.log('Engine request: ' + data.request);
      this.update(data.board, data.actioninfo);
      break;
    case 'restore':
      console.log('Engine request: ' + data.request);
      this.restoreInitialBoard();
      break;
    default:
      console.log('Engine used unknown request');
  }
};

$(document).ready( function () { (new Hmi()).init(); });
