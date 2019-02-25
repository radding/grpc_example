const client = require("./clientMethods");
const stdin = process.stdin;

stdin.setRawMode( true );

stdin.resume();

stdin.setEncoding( 'utf8' );
const data = [  ];

const search = client.StartSearch();

stdin.on( 'data', function( key ){
  if ( key === '\u0003' ) {
    search.end();
    process.exit();
  }
  if (key.charCodeAt(0) === 127) {
    data.pop();
  } else {
    data.push(key);
  }
  search({"author": data.join("")})
});

