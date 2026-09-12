class CounterState {
  final int count;
  const CounterState({this.count = 0});

  CounterState increment() => CounterState(count: count + 1);
  CounterState decrement() => CounterState(count: count > 0 ? count - 1 : 0);
  CounterState reset() => const CounterState(count: 0);
}
