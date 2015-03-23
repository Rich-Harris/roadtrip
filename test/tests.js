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

				window.location.href += '/foo';

				roadtrip
					.add( '/foo', {
						enter: function ( route ) {

						},
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
	});
});
