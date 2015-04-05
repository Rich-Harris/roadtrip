var path = require( 'path' );
var fs = require( 'fs' );
var jsdom = require( 'jsdom' );
var assert = require( 'assert' );

describe( 'roadtrip', function () {
	var roadtripSrc, simulantSrc;

	function createDom ( html ) {
		return new Promise( function ( fulfil, reject ) {
			jsdom.env({
				html: html || '',
				resourceLoader: function ( resource, callback ) {
					console.log( 'resource', resource );
				},
				src: [ roadtripSrc, simulantSrc ],
				done: function ( err, window ) {
					if ( err ) {
						reject( err );
					} else {
						window.location.href = 'http://roadtrip.com';
						window.Promise = window.roadtrip.Promise = Promise;
						window.console = console;
						fulfil( window );
					}
				}
			})
		});
	}

	before( function () {
		return require( '../gobblefile' ).build({
			dest: path.resolve( __dirname, '../.tmp' ),
			env: 'production',
			force: true
		}).then( function () {
			roadtripSrc = fs.readFileSync( path.resolve( __dirname, '../.tmp/roadtrip.js' ), 'utf-8' );
		});
	});

	simulantSrc = fs.readFileSync( path.resolve( __dirname, '../node_modules/simulant/simulant.js' ), 'utf-8' );


	describe( 'sanity checks', function () {
		it( 'roadtrip exists', function () {
			return createDom().then( function ( window ) {
				assert.ok( window.roadtrip );
				window.close();
			});
		});

		it( 'roadtrip has add, start and goto methods', function () {
			return createDom().then( function ( window ) {
				var roadtrip = window.roadtrip;

				assert.ok( typeof roadtrip.add === 'function' );
				assert.ok( typeof roadtrip.goto === 'function' );
				assert.ok( typeof roadtrip.start === 'function' );
				window.close();
			});
		});
	});

	describe( 'roadtrip.start()', function () {
		it( 'navigates to the current route', function ( done ) {
			return createDom().then( function ( window ) {
				var roadtrip = window.roadtrip;

				roadtrip
					.add( '/', {
						enter: function ( route ) {
							assert.ok( true );
							done();
						}
					})
					.start();

				window.close();
			});
		});

		it( 'returns a promise that resolves once the route transition completes', function () {
			return createDom().then( function ( window ) {
				var roadtrip = window.roadtrip;

				var enteredRoot;

				roadtrip
					.add( '/', {
						enter: function () {
							enteredRoot = true;
						}
					});

				return roadtrip.start().then( function () {
					assert.ok( enteredRoot );
					window.close();
				});
			});
		});

	});

	describe( 'roadtrip.goto()', function () {
		it( 'leaves the current route and enters a new one', function () {
			return createDom().then( function ( window ) {
				var roadtrip = window.roadtrip;

				var leftRoot, enteredFoo;

				roadtrip
					.add( '/', {
						leave: function ( route ) {
							leftRoot = true;
						}
					})
					.add( '/foo', {
						enter: function ( route ) {
							enteredFoo = true;
						}
					})
					.start();

				return roadtrip.goto( '/foo' ).then( function () {
					assert.ok( leftRoot || enteredFoo );
					window.close();
				});
			});
		});

		it( 'returns a promise that resolves once the route transition completes', function () {
			return createDom().then( function ( window ) {
				var roadtrip = window.roadtrip;

				var enteredFoo;

				roadtrip
					.add( '/', {})
					.add( '/foo', {
						enter: function ( route ) {
							enteredFoo = true;
						}
					})
					.start();

				return roadtrip.goto( '/foo' ).then( function () {
					assert.ok( enteredFoo );
					window.close();
				});
			});
		});

		it( 'treats navigating to the same route as a noop', function () {
			return createDom().then( function ( window ) {
				var roadtrip = window.roadtrip;

				var leftFoo;

				window.location.href += 'foo';

				roadtrip
					.add( '/foo', {
						leave: function ( route ) {
							leftFoo = true;
						}
					})
					.start();

				return roadtrip.goto( '/foo' ).then( function () {
					assert.ok( !leftFoo );
					window.close();
				});
			});
		});

		it( 'does not treat navigating to the same route with different params as a noop', function () {
			return createDom().then( function ( window ) {
				var roadtrip = window.roadtrip;

				var left = {};

				window.location.href += 'foo';

				console.log( 'window.location.href', window.location.href );

				roadtrip
					.add( '/:id', {
						leave: function ( route ) {
							left[ route.params.id ] = true;
						}
					})
					.start();

				return roadtrip.goto( '/bar' ).then( function () {
					assert.ok( left.foo );
					window.close();
				});
			});
		});
	});

	describe( 'route.isInitial', function () {
		it( 'is true for the first (and only the first) route navigated to', function () {
			return createDom().then( function ( window ) {
				var roadtrip = window.roadtrip;

				var rootWasInitial, fooWasInitial;

				roadtrip
					.add( '/', {
						enter: function ( route ) {
							rootWasInitial = route.isInitial;
						}
					})
					.add( '/foo', {
						enter: function ( route ) {
							fooWasInitial = route.isInitial;
						}
					})
					.start();

				return roadtrip.goto( '/foo' ).then( function () {
					assert.ok( rootWasInitial );
					assert.ok( !fooWasInitial );
					window.close();
				});
			});
		});
	});

	describe( 'history', function () {
		it( 'can control roadtrip without the history stack being corrupted', function () {
			return createDom().then( function ( window ) {
				var roadtrip = window.roadtrip;
				var routes = [];

				roadtrip
					.add( '/', {
						enter: function () {
							routes.push( 'root' );
						}
					})
					.add( '/foo', {
						enter: function () {
							routes.push( 'foo' );
						}
					})
					.add( '/:id', {
						enter: function ( route ) {
							routes.push( route.params.id );
						}
					})
					.start();

				function goto ( href ) {
					return function () {
						return roadtrip.goto( href );
					};
				}

				function back () {
					window.history.back();
					return wait();
				}

				function forward () {
					window.history.forward();
					return wait();
				}

				return roadtrip.goto( '/foo' )
					.then( goto( '/bar' ) )
					.then( goto( '/baz' ) )
					.then( back )    // bar
					.then( back )    // foo
					.then( back )    // root
					.then( forward ) // foo
					.then( forward ) // bar
					.then( forward ) // baz
					.then( function () {
						assert.deepEqual( routes, [ 'root', 'foo', 'bar', 'baz', 'bar', 'foo', 'root', 'foo', 'bar', 'baz' ] );
						window.close();
					});
			});
		});
	});
});

function wait ( ms ) {
	return new Promise( function ( fulfil ) {
		setTimeout( fulfil, ms || 0 );
	});
}