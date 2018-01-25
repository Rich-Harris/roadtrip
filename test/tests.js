/*global require, describe, it, __dirname */
const path = require( 'path' );
const fs = require( 'fs' );
const jsdom = require( 'jsdom' );
const assert = require( 'assert' );

require( 'console-group' ).install();

const roadtripSrc = fs.readFileSync( path.resolve( __dirname, '../dist/roadtrip.umd.js' ), 'utf-8' );
const simulantSrc = fs.readFileSync( require.resolve( 'simulant' ), 'utf-8' );

describe( 'roadtrip', () => {
	function createTestEnvironment ( initial ) {
		return new Promise( ( fulfil, reject ) => {
			jsdom.env({
				html: '',
				url: 'http://roadtrip.com' + ( initial || '' ),
				src: [ roadtripSrc, simulantSrc ],
				done ( err, window ) {
					if ( err ) {
						reject( err );
					} else {
						window.Promise = window.roadtrip.Promise = Promise;
						window.console = console;
						fulfil( window );
					}
				}
			});
		});
	}

	describe( 'sanity checks', () => {
		it( 'roadtrip exists', () => {
			return createTestEnvironment().then( window => {
				assert.ok( window.roadtrip );
				window.close();
			});
		});

		it( 'roadtrip has add, start and goto methods', () => {
			return createTestEnvironment().then( window => {
				const roadtrip = window.roadtrip;

				assert.ok( typeof roadtrip.add === 'function' );
				assert.ok( typeof roadtrip.goto === 'function' );
				assert.ok( typeof roadtrip.start === 'function' );
				window.close();
			});
		});
	});

	describe( 'roadtrip.start()', () => {
		it( 'navigates to the current route', done => {
			createTestEnvironment().then( window => {
				const roadtrip = window.roadtrip;

				roadtrip
					.add( '/', {
						enter () {
							assert.ok( true );
							done();
						}
					})
					.start();

				window.close();
			});
		});

		it( 'returns a promise that resolves once the route transition completes', () => {
			return createTestEnvironment().then( window => {
				const roadtrip = window.roadtrip;

				let enteredRoot;

				roadtrip
					.add( '/', {
						enter: () => {
							enteredRoot = true;
						}
					});

				return roadtrip.start().then( () => {
					assert.ok( enteredRoot );
					window.close();
				});
			});
		});

		it( 'falls back to a specified route', () => {
			return createTestEnvironment().then( window => {
				const roadtrip = window.roadtrip;

				let enteredFoo;

				roadtrip
					.add( '/foo', {
						enter: () => {
							enteredFoo = true;
						}
					});

				return roadtrip.start({ fallback: '/foo' }).then( () => {
					assert.ok( enteredFoo );
					window.close();
				});
			});
		});
	});

	describe( 'roadtrip.goto()', () => {
		it( 'leaves the current route and enters a new one', () => {
			return createTestEnvironment().then( window => {
				const roadtrip = window.roadtrip;

				let leftRoot;
				let enteredFoo;

				roadtrip
					.add( '/', {
						leave () {
							leftRoot = true;
						}
					})
					.add( '/foo', {
						enter () {
							enteredFoo = true;
						}
					})
					.start();

				return roadtrip.goto( '/foo' ).then( () => {
					assert.ok( leftRoot || enteredFoo );
					window.close();
				});
			});
		});

		it( 'returns a promise that resolves once the route transition completes', () => {
			return createTestEnvironment().then( window => {
				const roadtrip = window.roadtrip;

				let enteredFoo;

				roadtrip
					.add( '/', {})
					.add( '/foo', {
						enter () {
							enteredFoo = true;
						}
					})
					.start();

				return roadtrip.goto( '/foo' ).then( () => {
					assert.ok( enteredFoo );
					window.close();
				});
			});
		});

		it( 'treats navigating to the same route as a noop', () => {
			return createTestEnvironment().then( window => {
				const roadtrip = window.roadtrip;

				let leftFoo;

				window.location.href += 'foo';

				roadtrip
					.add( '/foo', {
						leave () {
							leftFoo = true;
						}
					})
					.start();

				return roadtrip.goto( '/foo' ).then( () => {
					assert.ok( !leftFoo );
					window.close();
				});
			});
		});

		it( 'does not treat navigating to the same route with different params as a noop', () => {
			return createTestEnvironment( '/foo' ).then( window => {
				const roadtrip = window.roadtrip;

				const left = {};

				roadtrip
					.add( '/:id', {
						leave ( route ) {
							left[ route.params.id ] = true;
						}
					})
					.start();

				return roadtrip.goto( '/bar' ).then( () => {
					assert.ok( left.foo );
					window.close();
				});
			});
		});

		it( 'does not treat navigating to the same route with different query params as a noop', () => {
			return createTestEnvironment( '/foo?a=1' ).then( window => {
				const roadtrip = window.roadtrip;

				const entered = [];
				const left = [];

				roadtrip
					.add( '/foo', {
						enter ( route ) {
							entered.push( route.query.a );
						},
						leave ( route ) {
							left.push( route.query.a );
						}
					})
					.start()
					.then( () => {
						assert.deepEqual( entered, [ '1' ] );
						assert.deepEqual( left, [] );

						return roadtrip.goto( '/foo?a=2' );
					})
					.then( () => {
						assert.deepEqual( entered, [ '1', '2' ] );
						assert.deepEqual( left, [ '1' ] );
						window.close();
					});
			});
		});

		it( 'differentiates between previous route and current route', () => {
			return createTestEnvironment( '/foo' ).then( window => {
				const roadtrip = window.roadtrip;

				roadtrip
					.add( '/:id', {
						enter ( route, previousRoute ) {
							assert.ok( route !== previousRoute );
						}
					})
					.start();

				return roadtrip.goto( '/bar' ).then( () => {
					window.close();
				});
			});
		});

		it( 'includes the hash', () => {
			return createTestEnvironment( '/foo#bar' ).then( window => {
				const roadtrip = window.roadtrip;

				const hashes = [];

				roadtrip
					.add( '/foo', {
						enter ( route ) {
							hashes.push( route.hash );
						}
					})
					.start();

				return roadtrip.goto( '/foo#baz' )
					.then( () => {
						assert.deepEqual( hashes, [
							'bar',
							'baz'
						]);

						window.close();
					});
			});
		});

		it( 'updates a route rather than leaving and entering, if applicable', () => {
			return createTestEnvironment( '/foo' ).then( window => {
				const roadtrip = window.roadtrip;

				const ids = [];

				roadtrip
					.add( '/:id', {
						enter ( route ) {
							ids.push( route.params.id );
						},

						update ( route ) {
							this.enter( route );
						}
					})
					.start();

				return roadtrip.goto( '/bar' ).then( () => {
					assert.deepEqual( ids, [
						'foo',
						'bar'
					]);

					window.close();
				});
			});
		});

		it( 'updates the route without updating the URL with invisible: true', () => {
			return createTestEnvironment( '/foo' ).then( window => {
				const roadtrip = window.roadtrip;

				let enteredBar;

				roadtrip
					.add( '/foo', {
						enter () {
							roadtrip.goto( '/bar', { invisible: true });
						}
					})
					.add( '/bar', {
						enter () {
							enteredBar = true;
						}
					});

				return roadtrip.start().then( () => {
					assert.ok( enteredBar );
					assert.equal( window.location.href, 'http://roadtrip.com/foo' );
					window.close();
				});
			});
		});
	});

	describe( 'route.isInitial', () => {
		it( 'is true for the first (and only the first) route navigated to', () => {
			return createTestEnvironment().then( window => {
				const roadtrip = window.roadtrip;

				let rootWasInitial;
				let fooWasInitial;

				roadtrip
					.add( '/', {
						enter ( route ) {
							rootWasInitial = route.isInitial;
						}
					})
					.add( '/foo', {
						enter ( route ) {
							fooWasInitial = route.isInitial;
						}
					})
					.start();

				return roadtrip.goto( '/foo' ).then( () => {
					assert.ok( rootWasInitial );
					assert.ok( !fooWasInitial );
					window.close();
				});
			});
		});
	});

	describe( 'history', () => {
		it( 'can control roadtrip without the history stack being corrupted', () => {
			return createTestEnvironment().then( window => {
				const roadtrip = window.roadtrip;
				const routes = [];

				roadtrip
					.add( '/', {
						enter: () => {
							routes.push( 'root' );
						}
					})
					.add( '/foo', {
						enter: () => {
							routes.push( 'foo' );
						}
					})
					.add( '/:id', {
						enter ( route ) {
							routes.push( route.params.id );
						}
					})
					.start();

				function goto ( href ) {
					return () => {
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
					.then( () => {
						assert.deepEqual( routes, [ 'root', 'foo', 'bar', 'baz', 'bar', 'foo', 'root', 'foo', 'bar', 'baz' ] );
						window.close();
					});
			});
		});
	});

	describe( 'svg', () => {
		it.skip( 'watches svg links', () => { // skip because JSDOM is funny with SVG, apparently
			return createTestEnvironment().then( window => {
				const roadtrip = window.roadtrip;
				const routes = [];

				window.document.body.innerHTML = `
					<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>
						<a xlink:href='/foo'>click me</a>
					</svg>
				`;

				return roadtrip
					.add( '/foo', {
						enter: () => {
							routes.push( 'foo' );
						}
					})
					.start()
					.then( () => {
						const a = window.document.querySelector( 'a' );
						window.simulant.fire( a, 'click', { which: 1 });
						assert.deepEqual( routes, [ 'foo' ]);

						window.close();
					});
			});
		});
	});
});

function wait ( ms ) {
	return new Promise( fulfil => setTimeout( fulfil, ms || 50 ) );
}
