//
// Copyright (c) 2016 Oliver Merkel
// All rights reserved.
//
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
//

function AlquerqueBoard() {
  this.NONE = 2;
  this.WHITE = 0;
  this.BLACK = 1;

  this.PIECEWHITE = { piece: this.WHITE, previous: null };
  this.PIECEBLACK = { piece: this.BLACK, previous: null };
  this.PIECENONE = { piece: this.NONE };

  this.EAST = { x:  1, y: 0};
  this.SOUTHEAST = { x:  1, y: -1};
  this.SOUTH = { x: 0, y: -1};
  this.SOUTHWEST = { x: -1, y: -1};
  this.WEST = { x: -1, y: 0};
  this.NORTHWEST = { x: -1, y:  1};
  this.NORTH = { x: 0, y:  1};
  this.NORTHEAST = { x:  1, y:  1};
  this.MAINDIRECTIONS = [ this.EAST, this.SOUTH, this.WEST, this.NORTH ];
  this.ALLDIRECTIONS = [ this.EAST, this.SOUTHEAST, this.SOUTH,
    this.SOUTHWEST, this.WEST, this.NORTHWEST, this.NORTH,
    this.NORTHEAST ];
  this.W_N_E = [ this.WEST, this.NORTH, this.EAST ];
  this.W_NW_N_NE_E = [ this.WEST, this.NORTHWEST, this.NORTH,
    this.NORTHEAST, this.EAST ];
  this.E_S_W = [ this.EAST, this.SOUTH, this.WEST ];
  this.E_SE_S_SW_W = [ this.EAST, this.SOUTHEAST, this.SOUTH,
    this.SOUTHWEST, this.WEST ];
  this.E_W = [ this.EAST, this.WEST ];
  this.DIRECTION = { move: [], jump: [] };
  this.DIRECTION.move[this.WHITE] = [ [
   [ this.NORTH, this.NORTHEAST, this.EAST ], [ this.NORTH, this.EAST ],
   [ this.NORTH, this.NORTHEAST, this.EAST ], [ this.NORTH, this.EAST ],
   [ ] ], [
   this.W_N_E, this.W_NW_N_NE_E, this.W_N_E, this.W_NW_N_NE_E, [ ] ], [
   this.W_NW_N_NE_E, this.W_N_E, this.W_NW_N_NE_E, this.W_N_E, [ ] ], [
   this.W_N_E, this.W_NW_N_NE_E, this.W_N_E, this.W_NW_N_NE_E, [ ] ], [
   [ this.WEST, this.NORTHWEST, this.NORTH ], [ this.WEST, this.NORTH ],
   [ this.WEST, this.NORTHWEST, this.NORTH ], [ this.WEST, this.NORTH ],
   [ ]
  ] ];
  this.DIRECTION.move[this.BLACK] = [ [
   [ ],
   [ this.EAST, this.SOUTH ], [ this.EAST, this.SOUTHEAST, this.SOUTH ],
   [ this.EAST, this.SOUTH ], [ this.EAST, this.SOUTHEAST, this.SOUTH ] ], [
   [ ], this.E_SE_S_SW_W, this.E_S_W, this.E_SE_S_SW_W, this.E_S_W ], [
   [ ], this.E_S_W, this.E_SE_S_SW_W, this.E_S_W, this.E_SE_S_SW_W ], [
   [ ], this.E_SE_S_SW_W, this.E_S_W, this.E_SE_S_SW_W, this.E_S_W ], [
   [ ],
   [ this.SOUTH, this.WEST ], [ this.SOUTH, this.SOUTHWEST, this.WEST ],
   [ this.SOUTH, this.WEST ], [ this.SOUTH, this.SOUTHWEST, this.WEST ]
  ] ];
  this.DIRECTION.jump[this.WHITE] = [ [
   [ this.NORTH, this.NORTHEAST, this.EAST ], [ this.NORTH, this.EAST ],
   [ this.NORTH, this.NORTHEAST, this.EAST, this.SOUTHEAST, this.SOUTH ],
   [ this.SOUTH, this.EAST ], [ this.EAST, this.SOUTHEAST, this.SOUTH ] ], [
   [ this.NORTH, this.EAST ], [ this.NORTH, this.NORTHEAST, this.EAST ],
   [ this.NORTH, this.EAST, this.SOUTH ],
   [ this.EAST, this.SOUTHEAST, this.SOUTH ], [ this.EAST, this.SOUTH ] ], [
   this.W_NW_N_NE_E, this.W_N_E, this.ALLDIRECTIONS, this.E_S_W, this.E_SE_S_SW_W ], [
   [ this.WEST, this.NORTH ], [ this.WEST, this.NORTHWEST, this.NORTH ],
   [ this.SOUTH, this.WEST, this.NORTH ],
   [ this.SOUTH, this.SOUTHWEST, this.WEST ], [ this.SOUTH, this.WEST ] ], [
   [ this.WEST, this.NORTHWEST, this.NORTH ], [ this.WEST, this.NORTH ],
   [ this.SOUTH, this.SOUTHWEST, this.WEST, this.NORTHWEST, this.NORTH ],
   [ this.SOUTH, this.WEST ], [ this.SOUTH, this.SOUTHWEST, this.WEST ]
  ] ];
  this.DIRECTION.jump[this.BLACK] = this.DIRECTION.jump[this.WHITE];
  this.jump = 'jump';
  this.move = 'move';
  this.none = 'none';
  this.rules = {
    invertLast : false
  };
}

AlquerqueBoard.prototype.setup = function () {
  this.field = [
    [
      this.PIECEWHITE, this.PIECEWHITE, this.PIECEBLACK,
      this.PIECEBLACK, this.PIECEBLACK
    ],
    [
      this.PIECEWHITE, this.PIECEWHITE, this.PIECEBLACK,
      this.PIECEBLACK, this.PIECEBLACK
    ],
    [
      this.PIECEWHITE, this.PIECEWHITE, this.PIECENONE,
      this.PIECEBLACK, this.PIECEBLACK
    ],
    [
      this.PIECEWHITE, this.PIECEWHITE, this.PIECEWHITE,
      this.PIECEBLACK, this.PIECEBLACK
    ],
    [
      this.PIECEWHITE, this.PIECEWHITE, this.PIECEWHITE,
      this.PIECEBLACK, this.PIECEBLACK
    ]
  ];
  this.active = this.WHITE;
  this.previousAction = { type: this.none };
};

AlquerqueBoard.prototype.copy = function () {
  var result = new AlquerqueBoard();
  result.active = this.active;
  result.field = [];
  for(var i=0; i<5; ++i) {
    var column = [];
    for(var j=0; j<5; ++j) {
      column[column.length] = this.field[i][j];
    }
    result.field[result.field.length] = column;
  }
  if (this.move == this.previousAction.type) {
    result.previousAction = { type: this.move, by: this.previousAction.by,
      from: { x: this.previousAction.from.x, y: this.previousAction.from.y },
      direction: this.previousAction.direction,
      to: { x: this.previousAction.to.x, y: this.previousAction.to.y }
    };
  } else if (this.jump == this.previousAction.type) {
    result.previousAction = { type: this.jump, by: this.previousAction.by,
      from: { x: this.previousAction.from.x, y: this.previousAction.from.y },
      direction: this.previousAction.direction,
      to: { x: this.previousAction.to.x, y: this.previousAction.to.y },
      over: { x: this.previousAction.over.x, y: this.previousAction.over.y }
    };
  }
  return result;
};

AlquerqueBoard.prototype.getMoves = function () {
  var actions = [];
  for(var y=0; y<5; ++y) {
    for(var x=0; x<5; ++x) {
      if ( this.active == this.field[x][y].piece ) {
        for(var i=0; i<this.DIRECTION.move[this.active][x][y].length; ++i) {
          var direction = this.DIRECTION.move[this.active][x][y][i];
          if ( this.NONE == this.field[x+direction.x][y+direction.y].piece ) {
            if( this.rules.invertlast || !this.field[x][y].previous ||
              ( x+direction.x != this.field[x][y].previous.x ||
                y+direction.y != this.field[x][y].previous.y )
            ) {
              actions[actions.length] = {
                type: this.move, by: this.active,
                from: { x: x, y: y }, direction: direction,
                to: { x: x + direction.x, y: y + direction.y }
              }
            }
          }
        }
      }
    }
  }
  return actions;
};

AlquerqueBoard.prototype.getJumpsFor = function ( field ) {
  var actions = [];
  if ( this.active == this.field[field.x][field.y].piece ) {
    var opponent = this.active ^ 1;
    for(var i=0; i<this.DIRECTION.jump[this.active][field.x][field.y].length; ++i) {
      var direction = this.DIRECTION.jump[this.active][field.x][field.y][i];
      if ( opponent == this.field[field.x+direction.x][field.y+direction.y].piece &&
        this.NONE == this.field[field.x+2*direction.x][field.y+2*direction.y].piece) {
        actions[actions.length] = { type: this.jump, by: this.active,
          from: field, direction: direction,
          to: { x: field.x + 2 * direction.x, y: field.y + 2 * direction.y },
          over: { x: field.x + direction.x, y: field.y + direction.y },
        };
      }
    }
  }
  return actions;
};

AlquerqueBoard.prototype.getJumps = function () {
  var actions = [];
  if( this.previousAction && this.previousAction.by == this.active ) {
    actions = this.getJumpsFor( this.previousAction.to );
  } else {
    for(var y=0; y<5; ++y) {
      for(var x=0; x<5; ++x) {
        var a = this.getJumpsFor( { x: x, y: y } );
        if( a ) {
          for(var i=0; i<a.length; ++i) {
            actions[actions.length] = a[i];
          }
        }
      }
    }
  }
  return actions;
};

AlquerqueBoard.prototype.noJumpsFor = function ( field ) {
  var result = true;
  var opponent = this.active ^ 1;
  var d = this.DIRECTION.jump[this.active][field.x][field.y];
  for(var i=0; i<d.length && result; ++i) {
    var direction = d[i];
    result = opponent != this.field[field.x+direction.x][field.y+direction.y].piece ||
      this.NONE != this.field[field.x+2*direction.x][field.y+2*direction.y].piece;
  }
  return result;
};

AlquerqueBoard.prototype.getActions = function () {
  var actions = this.getJumps();
  if (0 == actions.length) actions = this.getMoves();
  return actions;
};

AlquerqueBoard.prototype.doAction = function ( action ) {
  if ( this.move == action.type ) {
    this.field[action.to.x][action.to.y] = { piece: this.active, previous: action.from };
    this.field[action.from.x][action.from.y] = this.PIECENONE;
    this.switchPlayer();
    this.previousAction = {
      type: this.move, by: action.by,
      from: { x: action.from.x, y: action.from.y }, direction: action.direction,
      to: { x: action.to.x, y: action.to.y }
    };
  } else if ( this.jump == action.type ) {
    this.field[action.to.x][action.to.y] = { piece: this.active, previous: null };
    this.field[action.from.x][action.from.y] = this.PIECENONE;
    this.field[action.over.x][action.over.y] = this.PIECENONE;
    if ( this.noJumpsFor( action.to ) ) {
      this.switchPlayer();
    }
    this.previousAction = { type: this.jump, by: action.by,
      from: { x: action.from.x, y: action.from.y }, direction: action.direction,
      to: { x: action.to.x, y: action.to.y },
      over: { x: action.over.x, y: action.over.y }
    };
  }
};

AlquerqueBoard.prototype.switchPlayer = function () {
  this.active ^= 1;
};

AlquerqueBoard.prototype.getResult = function () {
  return this.WHITE == this.active ? [ 1, 0 ] : [ 0, 1 ];
};

AlquerqueBoard.prototype.repr = function () {
  var repr = '';
  for(var y=4; y>=0; --y) {
    repr += (y+1);
    for(var x=0; x<5; ++x) {
      var piece = this.field[x][y].piece;
      repr += this.WHITE == piece ? 'w' :
        this.BLACK == piece ? 'b' : '+';
      if ( x<4 ) {
        repr += '-';
      }
    }
    repr += ['\n a b c d e\n', '\n |/|\\|/|\\|\n',
    '\n |\\|/|\\|/|\n', '\n |/|\\|/|\\|\n', '\n |\\|/|\\|/|\n'][y];
  }
  return repr;
};

AlquerqueBoard.prototype.getState = function () {
  var field = [];
  for(var x=0; x<5; ++x) {
    var column = [];
    for(var y=0; y<5; ++y) {
      column[column.length] = this.field[x][y];
    }
    field[field.length] = column;
  }
  var actions = this.getActions();
  console.log( this.repr() );
  console.log( 0 == actions ? "Game over. " +
    ( this.active == this.WHITE ? 'Black' : 'White' ) + ' wins.' :
    ( this.active == this.WHITE ? 'White' : 'Black' ) + ' to play.' );
  return { square: field, turn: this.active,
    actions: actions, previous: this.previousAction /*,
    count: this.getStatistics() */ };
};
