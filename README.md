# roadtrip

Roadtrip is a client-side web app routing library that understands it's about the journey, not just the destination. It is (currently) missing basic functionality and probably won't be much use to you. It doesn't even have tests yet! But if you, like me, need a tiny view-agnostic routing library that handles asynchronous route transitions sensibly, read on.

```bash
npm install roadtrip
```


## Getting there is half the fun

With a typical routing library, you register a series of route handlers that are called whenever the user navigates to a new route. But the handler isn't given any information about where the user navigated *from*. This forces you to jump through some ridiculous hoops.

Suppose you're building a contacts app. When you navigate from the default list view to a specific contact, you want the old screen to slide out to the *left* while the new screen slides in from the *right*. When you start editing one of the contact's details, the same thing happens - the old screen slides out to the left, while the editing screen slides in from the right.

What happens when we're done editing, or hit the back button? It makes no sense for the contact screen to slide in from the right again, when a moment ago it slid out to the left. So our `/:contact` route handler needs to know where we've come from, so it can select the right transition. But most routing libraries treat each route as an isolated moment in time, making that unnecessarily difficult.

By extension, there's no support given for another common use case, in which you need to teardown the current route in an asynchronous fashion before creating the new one. And navigating from `/foo` to `/foo` isn't treated as a noop like it should be.

Maybe I've fundamentally misunderstood the problem. If someone can point me to a decent router that solves these issues, let me know so that I can stop working on this one.


## Using roadtrip

Don't get too attached to this API, it will almost certainly change.


### Basic usage

```js
import roadtrip from 'roadtrip';

roadtrip
  // the home screen of our contacts app
  .add( '/', {
    enter: function ( route, previousRoute ) {
      route.view = displayAllContacts({
      	// if this is the first route we visit (i.e. it's the
      	// page the user lands on), `route.isInitial === true`
      	slideInFrom: route.isInitial ? null : 'left'
      });
    },

    leave: function ( route, nextRoute ) {
      route.view.teardown({
      	slideOutTo: 'left'
      });
    }
  })

  // individual contact screen
  .add( '/:id', {
    enter: function ( route, previousRoute ) {
      route.view = displayContact({
      	// the `route` object has `params` and `query` properties
      	id: route.params.id,

      	// if the previous route was the home screen, slide in
      	// from the right, otherwise slide in from the left
      	slideInFrom: route.isInitial ? null :
      	  previousRoute.matches( '/' ) : 'right' : 'left';
      });
    },

    leave: function ( route, nextRoute ) {
      route.view.teardown({
      	slideOutTo: nextRoute.matches( '/' ) : 'right' : 'left'
      });
    }
  })

  // the editing screen
  .add( '/:id/edit', {
    enter: function ( route, previousRoute ) {
      route.view = displayContact({
      	slideInFrom: route.isInitial ? null : 'right';
      });
    },

    leave: function ( route, nextRoute ) {
      route.view.teardown({
      	slideOutTo: 'right'
      });
    }
  })

  // Calling roadtrip.start() navigates to the initial route
  .start();
```

### Asynchronous route transitions

If you need to do some asynchronous work on leaving or entering a route, return a promise from the handler:

```js
function wait ( ms ) {
  return new Promise( function ( fulfil ) {
    setTimeout( fulfil, ms );
  });
}

roadtrip
  .add( '/foo', {
    enter: function ( route ) {
      // if the user clicks a link for `/bar` in the meantime
      // roadtrip will navigate to `/bar` as soon as the promise
      // resolves, unless, in the remaining milliseconds, they
      // decide to navigate to `/baz` instead
      return wait( 1000 );
    },

    leave: function ( route ) {
      // the URL in the address bar changes to that of the new
      // route immediately, but the new route's `enter` handler
      // is not called until this promise resolves
      return wait( 1000 );
    }
  })

  .add( '/bar', ... )
  .add( '/baz', ... )
  .start();
```

If, on navigating to `/bar`, you want to kick off some work (e.g. loading the data you're going to need) immediately, regardless of any asynchronous `leave` handler, you can do that with `beforeenter`.

```js
roadtrip
  .add( 'foo', ... )

  .add( '/bar', {
    beforeenter: function ( route ) {
      route.data = fetch( '/data.json' )
        .then( function ( response ) { return response.json(); });
    },

    enter: function ( route ) {
      // route.data is a promise, because we set it in
      // `beforeenter`
      return route.data.then( renderView );
    }

    // note: the `leave handler is optional!
  })

  .add( '/baz', ... )
  .start();
```

If `beforeenter` returns a promise, the `enter` handler will only be called once both it and the promise returned from the previous route's `leave` handler (if any) have resolved.

## Navigating programmatically

You can navigate to a new route programmatically:

```js
roadtrip.goto( newUrl );
```

This will use `history.pushState()` - if you need to use `history.replaceState()` instead (e.g. you're redirecting), pass in an option:

```js
roadtrip.goto( newUrl, { replaceState: true });
```


## Bring your own polyfill

This library assumes your browser supports the HTML5 history API, and Promises. You can polyfill the history API with [devote/HTML5-History-API](https://github.com/devote/HTML5-History-API) (I haven't tried this, would welcome feedback from anyone who has), and you can provide a [Promises/A+ compliant](https://promisesaplus.com/) `Promise` object with `roadtrip.Promise === Promise` (otherwise it will use `window.Promise`).



## License

MIT.
