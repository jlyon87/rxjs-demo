// pipe-ables
const { multicast, takeUntil, switchMap, scan, debounceTime, throttleTime, first, last, map, of, tap, filter, finalize, pipe, publish } = rxjs.operators;

const print = (val) => {
  let el = document.createElement('p');
  el.innerText = val;
  document.querySelector('.container').appendChild(el);
}

// From Scratch
const observable = rxjs.Observable.create(observer => {
  observer.next('hello');
  observer.next('world');
});

observable.subscribe(val => print(val));

// Observe a Mouse Event
const domClicks = rxjs.fromEvent(document, 'click');
domClicks.subscribe(click => console.log(click));

// From Promise
const promise = new Promise(resolve => {
  setTimeout(() => {
    resolve('resolved!')
  }, 1000);
});
const observablePromise = rxjs.from(promise);
observablePromise.subscribe(val => print(val));

// From Timer (aka setTimeout)
const timer = rxjs.timer(1000).pipe(finalize(() => print('timer done!')));
timer.subscribe(() => print('ding!'));

// From Interval, (aka setInterval)
const interval = rxjs.interval(1000);
interval.subscribe(() => print(new Date().getSeconds()));

// God Awful, but pointed.
const anything = rxjs.of('anything', ['you', 'want'], 1, false, {name: 'huh'});
anything.subscribe(val => print(val));

// Cold (Schroedinger's) Observable - data is created within, it only pushes values when subscribed.
const cold = rxjs.Observable.create(observer => {
  observer.next(Math.random());
});

cold.subscribe(a => print(`Cold Subscriber A: ${a}`));
cold.subscribe(b => print(`Cold Subscriber B: ${b}`));

// Hot Observable
const hot = publish()(cold.pipe(
  tap(val => print(`cold to hot ${val}`))
));
hot.subscribe(a => print(`Hot Subscriber A: ${a}`));
hot.subscribe(b => print(`Hot Subscriber B: ${b}`));
hot.connect();

// Shitty unsubscribe
const toUnsub = rxjs.interval(500).pipe(finalize(() => print('toUnsub Done')));
const toUnsubSub = toUnsub.subscribe(x => print(x));
setTimeout(() => {
  toUnsubSub.unsubscribe();
}, 3000)

// Map
rxjs.of(10, 100, 1000).pipe(
  map(x => Math.log(x))
).subscribe(x => print(x));

// Tap
rxjs.of('Simon', 'Garfunkel')
  .pipe(
    tap(val => print(val)),
    map(val => val.toUpperCase()),
    tap(val => print(val))
  ).subscribe(val => print(val));

const numberList = [-3, -2, -1, 0, 1, 2, 3]
// Filter, only those matching the filter get through
rxjs.of(...numberList).pipe(
  filter(x => x > 0)
).subscribe(x => print(x))

// Take first only.
rxjs.of(...numberList).pipe(
  first()
).subscribe(x => print(`First: ${x}`))

// Take last only
rxjs.of(...numberList).pipe(
  last()
).subscribe(x => print(`Last: ${x}`))

// Throttle - Take first, then wait 1000 before taking another
rxjs.fromEvent(document, 'mousemove').pipe(
  throttleTime(1000)
).subscribe(over => print(`Throttled mouseover: ${over}`));

// Debounce - Take last, then wait 1000 before taking another
rxjs.fromEvent(document, 'mousemove').pipe(
  debounceTime(1000)
).subscribe(over => print(`Debounced mouseover: ${over}`));

// Scan (AKA .reduce)
rxjs.fromEvent(document, 'click').pipe(
  map(() => parseInt(Math.random() * 10)),
  tap(x => print(`Clicked score: ${x}`)),
  scan((highscore, score) => highscore + score)
).subscribe(highscore => print(`Highscore is: ${highscore}`));

// switchMap, Good when you need to get one value before you subscribe to (get) the next one.
rxjs.fromEvent(document, 'click').pipe(
  switchMap(click => {
    return rxjs.timer(1000)
  })
).subscribe(i => print(`Click to Timer ${i}`));

// takeUntil, keep a subscription live until something happens
// See also, takeWhile. Continue taking values until condition is true.
const breaker = rxjs.timer(1000);
const continuous = rxjs.interval(5000)
  .pipe(
    takeUntil(breaker),
    finalize(() => print('combo breaker!'))
  ).subscribe(i => print(i));

// .zip() - combine multiple observables using zip and map
// See also, forkJoin
const yin$ = rxjs.of('peanut butter', 'wine', 'rainbows');
const yang$ = rxjs.of('jelly', 'cheese', 'unicorns')
const combo = rxjs.zip(yin$, yang$).pipe(
  map((yin, yang) => ({yin, yang}))
).subscribe(pair => print(`${pair.yin}, ${pair.yang}`));

// subject - it's an event emitter, a publisher.
const broadcaster = new rxjs.Subject();
const listenerA = broadcaster.subscribe({next: val => print(`Listener A: ${val}`)});
const listenerB = broadcaster.subscribe({next: val => print(`Listener B: ${val}`)});
setTimeout(() => {
  broadcaster.next('Broadcast.');
}, 1000);

// multicast - limit operations from being duplicated across subscribers.
const tappable = rxjs.fromEvent(document, 'click')
  .pipe(
    // Log this once, regardless the number of subscribers.
    tap(() => print('Observable'))
  );
const broadcastTappable = tappable.pipe(multicast(() => new rxjs.Subject()))

const tappableSubA = broadcastTappable.subscribe(x => print(`tappableSubA: ${x.timeStamp}`));
const tappableSubB = broadcastTappable.subscribe(x => print(`tappableSubB: ${x.timeStamp}`));
broadcastTappable.connect();