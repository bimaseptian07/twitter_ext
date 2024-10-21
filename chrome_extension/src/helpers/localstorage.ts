import { createEffect } from 'solid-js';
import { createStore, Store, SetStoreFunction } from 'solid-js/store';

export function createLocalStore<T extends object>(
  initState: T
): [Store<T>, SetStoreFunction<T>] {
  const [state, setState] = createStore(initState);

  if (localStorage.mystore) {
    try {
      setState(JSON.parse(localStorage.mystore));
    } catch (error) {
      setState(initState);
    }
  }

  createEffect(() => {
    localStorage.mystore = JSON.stringify(state);
  });

  return [state, setState];
}