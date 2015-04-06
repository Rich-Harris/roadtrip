# changelog

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
