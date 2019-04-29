# changelog

## 0.6.2

* `scrollHistory` fallback ([#25](https://github.com/Rich-Harris/roadtrip/issues/25))

## 0.6.1

* Don't strip leading character from pathname if not `/` ([#16](https://github.com/Rich-Harris/roadtrip/issues/16))

## 0.6.0

* Watch SVG links ([#12](https://github.com/Rich-Harris/roadtrip/pull/12))

## 0.5.1

* Don't add stack entry for invisible redirects

## 0.5.0

* Add invisible redirects

## 0.4.1

* Allow roadtrip to be imported into a Node app (doesn't do anything, but doesn't cause chaos)

## 0.4.0

* Handle navigation to the same route with a different hash
* Use `update` handlers where applicable

## 0.3.4

* Don't try to handle external/hashchange driven popstate events

## 0.3.3

* Pass `scrollX` as well as `scrollY`

## 0.3.2

* Capture scroll information on each navigation

## 0.3.1

* Ensure `route` and `previousRoute` are differentiated

## 0.3.0

* Add `fallback` option to `roadtrip.start`

## 0.2.0

* Create separate UMD and ES6 builds

## 0.1.7

* Fix boneheaded path matching bug
* Prevent non-matching routes being handled

## 0.1.6

* Fix bug with `<a>` elements with no `href`

## 0.1.5

* Fix bug whereby `history.back()`/`history.forward()` would cause the stack to be corrupted
* Internal refactor

## 0.1.4

* Fix transitioning from one route to same route with different params

## 0.1.3

* `route.isInitial` is only true for the first route ([#7](https://github.com/Rich-Harris/roadtrip/issues/7))

## 0.1.2

* Promises returned from `roadtrip.goto()` resolve correctly

## 0.1.1

* Query string parameters are decoded with `decodeURIComponent` ([#4](https://github.com/Rich-Harris/roadtrip/issues/4))

## 0.1.0

* First release
